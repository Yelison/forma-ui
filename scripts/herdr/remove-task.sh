#!/usr/bin/env bash
# Retires a finished task: stops its Docker Compose project (only when HERDR_COMPOSE=1), removes the worktree through
# Herdr and keeps the branch. It refuses while the checkout has uncommitted changes or a live agent, and never forces
# anything. Adapted from Resolve at c3f02f8.
set -euo pipefail
SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)
# shellcheck source=common.sh
. "$SCRIPT_DIR/common.sh"

usage() {
  cat <<'USAGE'
Usage: scripts/herdr/remove-task.sh --id ID [--delete-branch [--squashed-head SHA]] [--volumes] [--force-leftovers]

  --id ID            Task to retire
  --delete-branch    Also delete the branch when everything on it is already in main (`git cherry main BRANCH`
                     shows no `+` commit, so a rebase merge counts, and merging it would change nothing), together
                     with a review's older review/<id>-<sha7> branches. A branch is kept, with a note, when it has a
                     `+` commit or merge commits of its own, when `git cherry` fails, when merging it would change
                     main or when it is checked out elsewhere
  --squashed-head SHA
                     With --delete-branch: GitHub squash-merged exactly SHA, so a task branch that still points at
                     SHA is deleted although `git cherry` cannot see it as merged (a squash is one new patch). Any
                     other tip, a commit past SHA included, follows the rule above. ship.sh passes it once it has
                     confirmed the merge
  --volumes          Also remove the task's Docker volumes; does nothing unless Compose is on (HERDR_COMPOSE=1)
  --force-leftovers  Go on although processes still listen on the slot's ports or containers of the task's Compose
                     project exist (the script lists them, and never kills anything itself)
USAGE
}

ID= DELETE_BRANCH=0 SQUASHED_HEAD= VOLUMES=0 FORCE_LEFTOVERS=0
while [ $# -gt 0 ]; do
  case $1 in
    --id) need_arg "$1" $#; ID=${2:-}; shift 2 ;;
    --delete-branch) DELETE_BRANCH=1; shift ;;
    --squashed-head) need_arg "$1" $#; SQUASHED_HEAD=${2:-}; shift 2 ;;
    --volumes) VOLUMES=1; shift ;;
    --force-leftovers) FORCE_LEFTOVERS=1; shift ;;
    -h | --help) usage; exit 0 ;;
    *) usage >&2; die "unknown argument: $1" ;;
  esac
done

# Processes listening on PORT, one "port<TAB>pid<TAB>command<TAB>cwd" line each. ss only shows the pid of the user's own
# processes (a docker-proxy, for one, has none): those show as "?" instead of being taken for a free port.
port_listeners() {
  local port=$1 line pids pid cmd cwd
  while IFS= read -r line; do
    pids=$(grep -oE 'pid=[0-9]+' <<<"$line" | cut -d= -f2 | sort -u || true)
    if [ -z "$pids" ]; then
      printf '%s\t?\t(pid not visible to this user)\t?\n' "$port"
      continue
    fi
    for pid in $pids; do
      cmd=$(ps -o args= -p "$pid" 2>/dev/null || true)
      cwd=$(readlink "/proc/$pid/cwd" 2>/dev/null || echo '?')
      printf '%s\t%s\t%s\t%s\n' "$port" "$pid" "${cmd:-?}" "$cwd"
    done
  done < <(ss -ltnpH 2>/dev/null | awk -v p="$port" '$4 ~ ("[:.]" p "$") { print }')
}

# Leftovers of the task: listeners on its slot's ports and containers (any state) of its Compose project.
find_leftovers() {
  local key port
  while IFS='=' read -r key port; do
    port_listeners "$port"
  done < <(slot_ports "$TASK_SLOT") | sort -u | awk -F'\t' '{ printf "  port %s: pid %s, %s (cwd %s)\n", $1, $2, $3, $4 }'
}
find_containers() {
  local found
  compose_enabled && [ -n "$TASK_COMPOSE_PROJECT" ] || return 0
  command -v docker >/dev/null 2>&1 || return 0
  # A docker that cannot answer is not "no containers": say so, so the task is not retired blind.
  if ! found=$(docker ps -a --filter "label=com.docker.compose.project=$TASK_COMPOSE_PROJECT" --format '{{.ID}} {{.Names}} ({{.Status}})' 2>/dev/null); then
    printf '  could not list the containers of %s (docker ps failed; is the Docker daemon running?)\n' "$TASK_COMPOSE_PROJECT"
    return 0
  fi
  [ -z "$found" ] || awk '{ print "  container " $0 }' <<<"$found"
}

# Is everything on BRANCH already in main? `git cherry` compares patches, so it still says yes after GitHub's rebase
# merge rewrote the SHAs (where `git branch -d` says no): a branch without a "+" line has nothing left to lose. It
# does not compare merge commits, so a branch with merges of its own is kept too, and so is one `git cherry` cannot
# judge or whose merge into main would change anything: nothing is deleted on a doubt. Returns 1, with the reason
# logged, when the branch is kept.
delete_if_in_main() {
  local branch=$1 cherry merges
  git -C "$TASK_REPO" show-ref --verify --quiet "refs/heads/$branch" || return 0
  if ! cherry=$(git -C "$TASK_REPO" cherry main "$branch"); then
    log "warning: git cherry could not compare $branch with main; the branch is kept"
    return 1
  fi
  if grep -q '^+' <<<"$cherry"; then
    log "Branch $branch kept: it has commits that are not in main."
    return 1
  fi
  merges=$(git -C "$TASK_REPO" rev-list --merges --count "main..$branch") || merges=unknown
  if [ "$merges" != 0 ]; then
    log "Branch $branch kept: it has merge commits of its own, which git cherry does not compare."
    return 1
  fi
  # The patch ids of `git cherry` ignore whitespace, so a branch whose change differs from main's only in indentation
  # would pass: it must also merge into main without changing anything (a conflict changes it too, and keeps the branch).
  merged_tree=$(git -C "$TASK_REPO" merge-tree --write-tree main "$branch" 2>/dev/null | head -n 1) || merged_tree=
  if [ -z "$merged_tree" ] || [ "$merged_tree" != "$(git -C "$TASK_REPO" rev-parse 'main^{tree}')" ]; then
    log "Branch $branch kept: merging it into main would change main, so its content is not all there."
    return 1
  fi
  # The worktree is already gone: a branch that cannot be deleted (checked out elsewhere) is a warning, not a stop.
  if ! git -C "$TASK_REPO" branch -q -D "$branch"; then
    log "warning: could not delete $branch (is it checked out in another worktree?); the branch is kept"
    return 1
  fi
  log "Branch $branch deleted: its content is in main."
}

# A branch that still points exactly at the head GitHub squash-merged has nothing that is not in main, whatever `git cherry`
# says about a series that became one patch. The tip is read here, right before the deletion, not taken from an earlier
# read: a commit made after the merge makes it differ, and then the branch is judged by delete_if_in_main.
delete_if_squashed() {
  local branch=$1
  [ -n "$SQUASHED_HEAD" ] && [ "$(git -C "$TASK_REPO" rev-parse --verify --quiet "refs/heads/$branch" || true)" = "$SQUASHED_HEAD" ] || return 1
  if ! git -C "$TASK_REPO" branch -q -D "$branch"; then
    log "warning: could not delete $branch (is it checked out in another worktree?); the branch is kept"
    return 1
  fi
  log "Branch $branch deleted: it is exactly the head GitHub squash-merged ($SQUASHED_HEAD)."
}

# What a kept task branch leaves behind, said only when it is kept. How many commits it holds beyond main is
# "unknown" when git cannot tell (no main), never 0.
note_kept_branch() {
  local branch=$1 ahead unpushed
  ahead=$(git -C "$TASK_REPO" rev-list --count "main..$branch" 2>/dev/null) || ahead=unknown
  if git -C "$TASK_REPO" rev-parse --verify --quiet "$branch@{upstream}" >/dev/null; then
    unpushed=$(git -C "$TASK_REPO" rev-list --count "$branch@{upstream}..$branch")
    [ "$unpushed" = 0 ] || log "note: $unpushed commit(s) of $branch are not pushed yet; the branch is kept"
  else
    log "note: $branch has no upstream; its $ahead commit(s) beyond main stay in the local branch"
  fi
}

require_herdr
need ss
[ -n "$ID" ] || { usage >&2; die "--id is required"; }
[ -z "$SQUASHED_HEAD" ] || [ "$DELETE_BRANCH" = 1 ] || die "--squashed-head only makes sense with --delete-branch"
load_task "$ID"
if [ -n "$SQUASHED_HEAD" ]; then
  [[ $SQUASHED_HEAD =~ ^[0-9a-f]{40}$ ]] || die "--squashed-head must be a full commit SHA: $SQUASHED_HEAD"
  git -C "$TASK_REPO" cat-file -e "$SQUASHED_HEAD^{commit}" 2>/dev/null || die "--squashed-head $SQUASHED_HEAD is not a commit of this repository (nothing was removed)"
fi
[ -z "$TASK_REMOVED_AT" ] || die "task '$ID' was already removed on $TASK_REMOVED_AT"

if [ -d "$TASK_WORKTREE" ]; then
  dirty=$(git -C "$TASK_WORKTREE" status --porcelain)
  if [ -n "$dirty" ]; then
    printf '%s\n' "$dirty" >&2
    die "the worktree has uncommitted changes; commit or stash them first (nothing was removed)"
  fi
  occupant=$(agent_in_pane "$TASK_PANE" || true)
  [ -z "$occupant" ] || die "an agent is still running in pane $TASK_PANE; let it finish and exit it first (nothing was removed)"
fi

leftovers=$(find_leftovers; find_containers)
if [ -n "$leftovers" ]; then
  printf 'Still running for task %s:\n%s\n' "$ID" "$leftovers" >&2
  if [ "$FORCE_LEFTOVERS" = 1 ]; then
    log "Going on (--force-leftovers); nothing listed above is killed here, only the Compose project is stopped below."
  else
    if compose_enabled && [ -n "$TASK_COMPOSE_PROJECT" ]; then
      down_cmd="docker compose -p $TASK_COMPOSE_PROJECT down"
      [ "$VOLUMES" = 0 ] || down_cmd="$down_cmd --volumes"
      die "the task left processes or containers behind (nothing was removed). Stop them yourself ($down_cmd for the containers, the owner for the processes) or rerun with --force-leftovers"
    fi
    die "the task left processes behind (nothing was removed). Stop them yourself or rerun with --force-leftovers"
  fi
fi

# Without --volumes, only a project Compose still lists is stopped. With it, the volumes are removed even when no
# container is left (compose ls derives the projects from containers, so it would not list a project that only has
# volumes), through the project's own compose file.
# Nothing here runs, and docker is never called, when Compose is off.
project_listed=0
use_compose=0
if compose_enabled && [ -n "$TASK_COMPOSE_PROJECT" ]; then
  use_compose=1
  if command -v docker >/dev/null 2>&1 \
    && docker compose ls -a --format json 2>/dev/null | jq -e --arg n "$TASK_COMPOSE_PROJECT" '.[] | select(.Name == $n)' >/dev/null; then
    project_listed=1
  fi
fi
if [ "$use_compose" = 1 ] && { [ "$VOLUMES" = 1 ] || [ "$project_listed" = 1 ]; }; then
  command -v docker >/dev/null 2>&1 || die "docker is required to remove the volumes of $TASK_COMPOSE_PROJECT (nothing was removed)"
  compose_file="$TASK_WORKTREE/$HERDR_COMPOSE_FILE"
  [ -f "$compose_file" ] || compose_file="$TASK_REPO/$HERDR_COMPOSE_FILE"
  log "Stopping Docker Compose project $TASK_COMPOSE_PROJECT…"
  if [ "$VOLUMES" = 1 ]; then
    docker compose -p "$TASK_COMPOSE_PROJECT" -f "$compose_file" down --volumes \
      || die "could not remove the volumes of $TASK_COMPOSE_PROJECT (nothing else was removed)"
  else
    docker compose -p "$TASK_COMPOSE_PROJECT" -f "$compose_file" down \
      || die "could not stop $TASK_COMPOSE_PROJECT (nothing else was removed)"
  fi
fi

if herdr workspace get "$TASK_WORKSPACE" >/dev/null 2>&1; then
  log "Removing the worktree through Herdr (workspace $TASK_WORKSPACE)…"
  herdr worktree remove --workspace "$TASK_WORKSPACE" >/dev/null || die "herdr worktree remove failed (nothing was forced)"
elif [ -d "$TASK_WORKTREE" ]; then
  log "Workspace $TASK_WORKSPACE is gone; removing the worktree with git…"
  git -C "$TASK_REPO" worktree remove "$TASK_WORKTREE" || die "git worktree remove failed (nothing was forced)"
fi
if git -C "$TASK_REPO" worktree list --porcelain | grep -Fqx "worktree $TASK_WORKTREE"; then
  die "the worktree is still registered: $TASK_WORKTREE (if its folder is gone, run git worktree prune in $TASK_REPO)"
fi

if [ "$DELETE_BRANCH" = 1 ]; then
  delete_if_squashed "$TASK_BRANCH" || delete_if_in_main "$TASK_BRANCH" || note_kept_branch "$TASK_BRANCH"
  # A review moves to a new branch (review/<id>-<sha7>, as new-review.sh names it) when the task is rebased: the older
  # ones go with it. Exactly that shape: review/<id>-x-<sha7> belongs to the task <id>-x.
  review_of=$(jq -r '.review.of // empty' "$(task_json "$ID")")
  if [ -n "$review_of" ]; then
    while IFS= read -r old_branch; do
      [ "$old_branch" != "$TASK_BRANCH" ] && [[ ${old_branch#"review/$review_of-"} =~ ^[0-9a-f]{7}$ ]] || continue
      delete_if_in_main "$old_branch" || true
    done < <(git -C "$TASK_REPO" for-each-ref --format='%(refname:short)' "refs/heads/review/$review_of-*")
  fi
else
  note_kept_branch "$TASK_BRANCH"
  log "Branch $TASK_BRANCH kept."
fi
update_task "$ID" '.removed_at = $at' --arg at "$(utc_now)"
log "Task $ID retired. Logs stay in $TASK_LOG_DIR."
