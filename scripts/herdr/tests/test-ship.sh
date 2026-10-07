#!/usr/bin/env bash
# ship.sh against a fake gh and a local bare remote. Usage: test-ship.sh [scenario...]
. "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

# Slots are chosen again for every scenario: other agents on the machine start and stop servers meanwhile.
# mk [CHECKS [COMPOSE]]: CHECKS is HERDR_REQUIRED_CHECKS (default: build; "" is none), COMPOSE is HERDR_COMPOSE (default 0).
mk() {
  mk_env; private_ports; export HERDR_REQUIRED_CHECKS=${1-build} HERDR_COMPOSE=${2-0}
  SA=$(pick_slot) || exit 2; SB=$(pick_slot "$SA") || exit 2; mk_impl "$SA"
  "$HERDR/new-review.sh" --task impl-a --slot "$SB" >/dev/null 2>"$T/err" || { echo "mk: new-review.sh failed: $(cat "$T/err")" >&2; exit 2; }
  echo pass >"$T/state/gh/checks"
}
ship() { "$HERDR/ship.sh" --task impl-a --title "feat: demo" --body "$T/body.md" "$@" 2>&1; }
gh_calls() { cat "$T/state/gh/calls.log" 2>/dev/null || true; }
remote_has() { git --git-dir "$T/remote.git" rev-parse -q --verify "refs/heads/$1" >/dev/null; }
retired() { [ "$(jq -r .removed_at "$T/root/tasks/$1/task.json")" != null ]; }
# After a first ship the fake merged the branch: put main back at the base and move it on, so the branch needs a rebase.
advance_main() {
  local base; base=$(git -C "$W" rev-parse HEAD~1); rm -f "$T/state/gh/auto"
  git --git-dir "$T/remote.git" update-ref refs/heads/main "$base"; git -C "$T/repo" reset -q --hard "$base"
  rm -rf "$T/other"; git clone -q "$T/remote.git" "$T/other"
  git -C "$T/other" -c user.name=o -c user.email=o@x commit -q --allow-empty -m "main moved"; git -C "$T/other" push -q origin main
}
rebase_branch() { git -C "$W" fetch -q origin main; git -C "$W" reset -q --hard origin/main; git -C "$W" commit -q --allow-empty -m "$1"; }
# A shim in front of git that runs a command right before any `git push` (a race after ship.sh read the remote).
push_shim() { mkdir -p "$T/shim"; real=$(command -v git)
  printf '#!/bin/bash\nfor a in "$@"; do if [ "$a" = push ]; then %s; break; fi; done\nexec "%s" "$@"\n' "$1" "$real" >"$T/shim/git"; chmod +x "$T/shim/git"; }

s_dirty() { mk; touch "$W/x"; out=$(ship); check "dirty: refused" test $? -ne 0; check "dirty: message" says x 'uncommitted'; check "dirty: nothing pushed" bash -c "! git --git-dir '$T/remote.git' rev-parse -q --verify refs/heads/feat/impl-a"; }
s_noorigin() { mk; git clone -q "$T/remote.git" "$T/other"; git -C "$T/other" -c user.name=o -c user.email=o@x commit -q --allow-empty -m "main moved"; git -C "$T/other" push -q origin main
  out=$(ship); check "stale base: refused" test $? -ne 0; check "stale base: says rebase" says x 'does not contain origin/main'; check "stale base: nothing pushed" bash -c "! git --git-dir '$T/remote.git' rev-parse -q --verify refs/heads/feat/impl-a"; check "stale base: no gh" test -z "$(gh_calls)"; }
s_happy() { mk; echo pending:2 >"$T/state/gh/checks"
  out=$(ship); rc=$?
  check "happy: rc 0" test $rc -eq 0; check "happy: pushed" remote_has feat/impl-a
  check "happy: the default assignee comes from project.env, set after the PR exists" grep -q -- 'pr edit 41 --add-assignee Yelison' <<<"$(gh_calls)"
  check "happy: pr create carries no --assignee" bash -c "! grep -- 'pr create' '$T/state/gh/calls.log' | grep -q -- '--assignee'"
  head=$(git --git-dir "$T/remote.git" rev-parse refs/heads/feat/impl-a)
  check "happy: merge scheduled with --auto --rebase and the pushed head" grep -q "pr merge 41 --auto --rebase --match-head-commit $head" <<<"$(gh_calls)"
  check "happy: origin/main contains the pushed head" git --git-dir "$T/remote.git" merge-base --is-ancestor "$head" refs/heads/main
  check "happy: the state of the PR is read before the first /exit" test "$(grep -n 'pr view 41 --json state' "$T/state/events.log" | head -1 | cut -d: -f1)" -lt "$(grep -n '^exit ' "$T/state/events.log" | head -1 | cut -d: -f1)"
  check "happy: merge after the check polls" test "$(grep -n 'pr merge' "$T/state/gh/calls.log" | cut -d: -f1)" -gt "$(grep -n 'pr checks' "$T/state/gh/calls.log" | tail -1 | cut -d: -f1)"
  want=$head
  check "happy: prints the pushed commit as merged" grep -qx "merged $want" <<<"$out"
  check "happy: main checkout fast-forwarded" test "$(git -C "$T/repo" rev-parse HEAD)" = "$want"
  check "happy: task retired" retired impl-a; check "happy: review retired" retired review-impl-a
  check "happy: worktrees gone" bash -c "! test -e '$W' && ! test -e '$T/root/worktrees/review-impl-a'"
  check "happy: reviewer sent /exit" grep -q '/exit' "$T/state/prompts.log"
  check "happy: Compose is off, so docker is never called" test ! -e "$T/state/docker.log"; }
# Compose on: ship retires both tasks with `down --volumes`.
s_compose() { mk build 1; out=$(ship); rc=$?
  check "compose: rc 0" test $rc -eq 0
  check "compose: volumes removed for each task" test "$(grep -c 'down --volumes' "$T/state/docker.log")" -eq 2; }
# The assignee is an environment override too: an empty value means no assignee.
s_assignee() { mk; out=$(HERDR_PR_ASSIGNEE= ship --no-cleanup); check "no assignee: rc 0" test $? -eq 0
  check "no assignee: the PR was created" grep -q 'pr create' <<<"$(gh_calls)"
  check "no assignee: no --assignee" bash -c "! grep -q -- 'assignee' '$T/state/gh/calls.log'"
  # An assignee that cannot be set does not stop the merge: the PR exists.
  mk; touch "$T/state/gh/edit-fails"; out=$(ship --no-cleanup); check "assignee fails: rc 0" test $? -eq 0
  check "assignee fails: warns" says x 'could not assign #41 to Yelison'; check "assignee fails: still merged" grep -q 'pr merge 41' "$T/state/gh/calls.log"; }
# No required checks (Forma UI has no CI yet): merge at once, rebase, pinned to the head, never --auto, no check polling.
s_nochecks() { mk ""; out=$(ship); rc=$?
  head=$(git --git-dir "$T/remote.git" rev-parse refs/heads/feat/impl-a)
  check "no checks: rc 0" test $rc -eq 0
  check "no checks: merged with --rebase --match-head-commit and the pushed head" grep -qx "gh pr merge 41 --rebase --match-head-commit $head" <<<"$(gh_calls)"
  check "no checks: never --auto" bash -c "! grep -q -- '--auto' '$T/state/gh/calls.log'"
  check "no checks: checks are never polled (one read of their names for the warning)" test "$(grep -c 'pr checks' "$T/state/gh/calls.log")" -eq 1
  check "no checks: warns that the PR has checks, naming them" says x 'has checks (Other, build)'
  check "no checks: the warning does not change the merge" grep -q 'pr merge 41 --rebase' "$T/state/gh/calls.log"
  check "no checks: the head is still awaited before merging" test "$(grep -n 'headRefOid' "$T/state/gh/calls.log" | head -1 | cut -d: -f1)" -lt "$(grep -n 'pr merge' "$T/state/gh/calls.log" | head -1 | cut -d: -f1)"
  check "no checks: origin/main contains the pushed head" git --git-dir "$T/remote.git" merge-base --is-ancestor "$head" refs/heads/main
  check "no checks: task and review retired" bash -c "[ \"\$(jq -r .removed_at '$T/root/tasks/impl-a/task.json')\" != null ] && [ \"\$(jq -r .removed_at '$T/root/tasks/review-impl-a/task.json')\" != null ]"
  check "no checks: says so" says x 'No required checks configured'
  # No checks at all: no warning.
  mk ""; echo none >"$T/state/gh/checks"; out=$(ship --no-cleanup); check "no checks and no CI: merged" test $? -eq 0
  check "no checks and no CI: no warning" bash -c "! grep -q 'warning' <<<'$out'"
  # Checks that exist but are not required do not stop it.
  mk ""; echo fail >"$T/state/gh/checks"; out=$(ship --no-cleanup); check "no checks: a failing check that is not required does not stop it" test $? -eq 0; }
# Two required checks (the second has a space in its name): it waits for both; the merge is scheduled only after the
# last one passed.
s_two() { mk "unit tests, e2e"; echo 'list:unit tests=pass,e2e=pending@4' >"$T/state/gh/checks"; rm -f "$T/state/gh/polls"; out=$(ship); rc=$?
  check "two checks: rc 0" test $rc -eq 0
  check "two checks: waited while the second was pending" says x 'Waiting for required checks: e2e (pending)'
  check "two checks: merge scheduled with --auto" grep -q 'pr merge 41 --auto --rebase --match-head-commit' <<<"$(gh_calls)"
  check "two checks: the merge came after the last pending read" test "$(cat "$T/state/gh/merge-polls")" -ge 5
  check "two checks: both are named when they pass" says x 'Required checks passed: unit tests e2e'
  # A required check that never shows up is waited for until the timeout, with no merge.
  mk "unit tests, e2e"; echo 'list:unit tests=pass' >"$T/state/gh/checks"; out=$(HERDR_SHIP_TIMEOUT_SECONDS=1 ship)
  check "two checks: one absent: gives up" test $? -ne 0; check "two checks: one absent: names it" says x 'e2e (absent)'
  check "two checks: one absent: no merge" bash -c "! grep -q 'pr merge' '$T/state/gh/calls.log'"; }
# One red check stops the merge even though the other passed.
s_twored() { mk "unit tests, e2e"
  for spec in 'list:unit tests=pass,e2e=fail' 'list:unit tests=fail,e2e=pass' 'list:unit tests=fail,e2e=pending@9'; do
    rm -f "$T/state/gh/calls.log" "$T/state/gh/polls"; echo "$spec" >"$T/state/gh/checks"; out=$(ship)
    check "red [$spec]: refused" test $? -ne 0; check "red [$spec]: names the red check" says x "required check '"
    check "red [$spec]: no merge scheduled" bash -c "! grep -q 'pr merge' '$T/state/gh/calls.log'"
  done
  check "red: the task is kept" test "$(jq -r .removed_at "$T/root/tasks/impl-a/task.json")" = null; }
s_reuse() { mk; echo '{"number":41,"head":"feat/impl-a","state":"OPEN"}' >"$T/state/gh/pr.json"
  out=$(ship --no-cleanup); check "reuse: rc 0" test $? -eq 0; check "reuse: no pr create" bash -c "! grep -q 'pr create' '$T/state/gh/calls.log'"; check "reuse: says so" says x 'Reusing pull request #41'
  check "no-cleanup: not retired" bash -c "[ \"\$(jq -r .removed_at '$T/root/tasks/impl-a/task.json')\" = null ]"; check "no-cleanup: worktree kept" test -d "$W"; }
s_red() { mk; echo fail >"$T/state/gh/checks"; out=$(ship)
  check "red: refused" test $? -ne 0; check "red: says which check" says x "required check 'build' is"; check "red: no merge scheduled" bash -c "! grep -q 'pr merge' '$T/state/gh/calls.log'"; check "red: task kept" test "$(jq -r .removed_at "$T/root/tasks/impl-a/task.json")" = null; }
s_absent() { mk; echo absent >"$T/state/gh/checks"; out=$(HERDR_SHIP_TIMEOUT_SECONDS=1 ship)
  check "absent check: times out" test $? -ne 0; check "absent check: no merge" bash -c "! grep -q 'pr merge' '$T/state/gh/calls.log'"; }
s_multi() { mk; echo multi >"$T/state/gh/checks"; out=$(ship --no-cleanup)
  check "latest run counts: an old failure does not stop a newer pass" test $? -eq 0; check "latest run: merge scheduled" grep -q 'pr merge' "$T/state/gh/calls.log"; }
# B6: a rerun that is still in the queue counts as the newest run, whatever its start time looks like.
s_queued() { mk; local mode
  for mode in queued queued-null; do
    rm -f "$T/state/gh/calls.log"; echo "$mode" >"$T/state/gh/checks"; out=$(HERDR_SHIP_TIMEOUT_SECONDS=1 ship --no-cleanup)
    check "$mode: waits, then gives up" test $? -ne 0; check "$mode: says it did not finish" says x 'did not finish'; check "$mode: no merge scheduled" bash -c "! grep -q 'pr merge' '$T/state/gh/calls.log'"
  done
  echo requeue:2 >"$T/state/gh/checks"; rm -f "$T/state/gh/polls"; out=$(ship --no-cleanup)
  check "requeue: waits for the rerun and then merges" test $? -eq 0; check "requeue: merge scheduled after waiting" grep -q 'pr merge' "$T/state/gh/calls.log"; }
# T1: cleanup only after a confirmed merge. A PR that never merges, or is closed, retires nothing and touches no agent.
not_merged() { # mode timeout message
  mk; echo "$1" >"$T/state/gh/merge"; before=$(git -C "$T/repo" rev-parse HEAD)
  out=$(HERDR_SHIP_TIMEOUT_SECONDS=$2 ship); check "$1: refused" test $? -ne 0; check "$1: says why" says x "$3"
  check "$1: no /exit sent" bash -c "! grep -q '^exit ' '$T/state/events.log' 2>/dev/null"
  check "$1: the tasks are not retired" bash -c "[ \"\$(jq -r .removed_at '$T/root/tasks/impl-a/task.json')\" = null ] && [ \"\$(jq -r .removed_at '$T/root/tasks/review-impl-a/task.json')\" = null ]"
  check "$1: worktrees kept" bash -c "test -d '$W' && test -d '$T/root/worktrees/review-impl-a'"
  check "$1: no volumes removed" bash -c "! grep -q 'down' '$T/state/docker.log' 2>/dev/null"
  check "$1: nothing printed as merged" bash -c "! grep -q '^merged ' <<<'$out'"
  check "$1: the main checkout did not move" test "$(git -C "$T/repo" rev-parse HEAD)" = "$before"; }
s_closed() { not_merged closed 5 'closed without merging'; }
s_open() { not_merged never 1 'was not merged in'; }
# A dirty review worktree makes remove-task.sh refuse after the merge: reported, merged sha printed, nothing removed.
s_dirtyreview() { mk; touch "$T/root/worktrees/review-impl-a/stray"; out=$(ship); rc=$?
  check "dirty review: stops" test $rc -ne 0; check "dirty review: the merge is reported first" says x 'merged '; check "dirty review: says what to run" says x 'was not retired'
  check "dirty review: refused as uncommitted" says x 'uncommitted'
  check "dirty review: review kept" test -d "$T/root/worktrees/review-impl-a"; check "dirty review: no volumes removed" bash -c "! grep -q 'down' '$T/state/docker.log' 2>/dev/null"
  check "dirty review: the task is not retired either" bash -c "[ \"\$(jq -r .removed_at '$T/root/tasks/impl-a/task.json')\" = null ]"; }
s_stale() { mk; echo 2 >"$T/state/gh/stale"; out=$(ship --no-cleanup); rc=$?
  check "stale head: rc 0" test $rc -eq 0; check "stale head: waited" says x 'Waiting for #41 to show'
  check "stale head: no checks read before the head matched" test "$(grep -n 'headRefOid' "$T/state/gh/calls.log" | tail -1 | cut -d: -f1)" -lt "$(grep -n 'pr checks' "$T/state/gh/calls.log" | head -1 | cut -d: -f1)"
  echo 100 >"$T/state/gh/stale"; out=$(HERDR_SHIP_TIMEOUT_SECONDS=1 ship --no-cleanup); check "head never shown: refused" test $? -ne 0; }
s_lease() { mk; ship --no-cleanup >/dev/null; old=$(git --git-dir "$T/remote.git" rev-parse refs/heads/feat/impl-a)
  advance_main; rebase_branch "feat: one rebased"
  out=$(ship --no-cleanup); check "lease: rebased push ok" test $? -eq 0; check "lease: remote has the new tip" test "$(git --git-dir "$T/remote.git" rev-parse refs/heads/feat/impl-a)" = "$(git -C "$W" rev-parse HEAD)"; check "lease: said so" says x 'with a lease'; check "lease: the old tip was replaced" test "$old" != "$(git -C "$W" rev-parse HEAD)"; }
# M1: someone else pushed on top of the published tip; fetching it later must not make it overwritable.
s_foreign() { mk; ship --no-cleanup >/dev/null
  git clone -q "$T/remote.git" "$T/other2"; git -C "$T/other2" checkout -q feat/impl-a; git -C "$T/other2" -c user.name=o -c user.email=o@x commit -q --allow-empty -m "someone else"; git -C "$T/other2" push -q origin feat/impl-a
  other=$(git -C "$T/other2" rev-parse HEAD); advance_main; rebase_branch "feat: rebased"
  out=$(ship --no-cleanup); check "foreign tip: refused" test $? -ne 0; check "foreign tip: says it is not overwritten" says x 'ship.sh does not overwrite it'
  git -C "$W" fetch -q origin feat/impl-a
  out=$(ship --no-cleanup); check "foreign tip after a fetch: still refused" test $? -ne 0; check "foreign tip: remote untouched" test "$(git --git-dir "$T/remote.git" rev-parse refs/heads/feat/impl-a)" = "$other"
  check "foreign tip: the message does not offer a way to force" test -z "$(grep -i 'force' <<<"$out")"; }
s_ahead() { mk; ship --no-cleanup >/dev/null
  git -C "$W" commit -q --allow-empty -m "feat: two"; git -C "$W" push -q origin feat/impl-a; git -C "$W" reset -q --hard HEAD~1
  out=$(ship --no-cleanup); check "remote ahead: refused" test $? -ne 0; check "remote ahead: message" says x 'is ahead of the local branch'; }
s_race() { mk; ship --no-cleanup >/dev/null; advance_main; rebase_branch "feat: rebased"
  other=$(git -C "$W" commit-tree -p "$(git -C "$W" rev-parse HEAD~1)" -m raced "$(git -C "$W" rev-parse 'HEAD^{tree}')")
  git -C "$W" push -q origin "$other:refs/heads/race-tmp"
  real=$(command -v git)
  push_shim "\"$real\" --git-dir \"$T/remote.git\" update-ref refs/heads/feat/impl-a $other"
  out=$(PATH="$T/shim:$PATH" ship --no-cleanup); check "race: rejected" test $? -ne 0; check "race: message" says x 'nothing was forced'; check "race: remote kept the raced commit" test "$(git --git-dir "$T/remote.git" rev-parse refs/heads/feat/impl-a)" = "$other"; }
# GitHub's rebase merge rewrites the SHAs: `git branch -d` no longer sees the branches as merged, `git cherry` does.
s_rewritten() { mk; touch "$T/state/gh/rewrite"
  # review/impl-a-1111111 holds the same patch as the task (merged); review/impl-a-2222222 holds a commit that is nowhere else.
  git -C "$T/repo" branch review/impl-a-1111111 feat/impl-a
  git -C "$T/repo" branch review/impl-a-2222222 feat/impl-a
  git -C "$T/repo" worktree add -q "$T/own" review/impl-a-2222222; echo notes >"$T/own/only-here.txt"; git -C "$T/own" add only-here.txt; git -C "$T/own" commit -q -m "review: only here"
  git -C "$T/repo" worktree remove "$T/own"
  tip=$(git -C "$W" rev-parse HEAD); review_branch=$(jq -r .branch "$T/root/tasks/review-impl-a/task.json")
  out=$(ship); rc=$?
  check "rewritten: rc 0" test $rc -eq 0
  check "rewritten: main has other SHAs than the branch" test "$(git -C "$T/repo" rev-parse HEAD)" != "$tip"
  check "rewritten: the task's branch is deleted" bash -c "! git -C '$T/repo' rev-parse -q --verify refs/heads/feat/impl-a"
  check "rewritten: the review's branch is deleted" bash -c "! git -C '$T/repo' rev-parse -q --verify refs/heads/$review_branch"
  check "rewritten: an older review branch with the same patch is deleted" bash -c "! git -C '$T/repo' rev-parse -q --verify refs/heads/review/impl-a-1111111"
  check "rewritten: a review branch with its own commit is kept" git -C "$T/repo" rev-parse -q --verify refs/heads/review/impl-a-2222222
  check "rewritten: says why the branch is kept" says x 'review/impl-a-2222222 kept'; }
# An agent without a name cannot be sent /exit: the command it prints to retry keeps the branches' deletion.
s_noname() { mk; jq 'del(.name)' "$T/state/agents/rev-impl-a" >"$T/x" && mv "$T/x" "$T/state/agents/rev-impl-a"
  out=$(ship); check "nameless agent: stops" test $? -ne 0
  check "nameless agent: the retry command deletes the branch too" says x 'remove-task.sh --id review-impl-a --volumes --delete-branch'; }
# pick_slot must look at the ports the scenario uses (private_ports), not at the defaults.
s_slots() { mk_env; private_ports; local first second port; first=$(pick_slot) || exit 2; port=$(port_of "$first" DEV_SERVER_PORT)
  check "slots: the ports checked are the private ones" test "$port" -ge 20000; mkdir -p "$T/srv"
  (cd "$T/srv" && exec python3 -m http.server "$port" --bind 127.0.0.1 >/dev/null 2>&1) & local pid=$!
  for _ in $(seq 1 25); do ss -ltnH | grep -q ":$port " && break; sleep 0.2; done
  second=$(pick_slot); kill "$pid"; wait "$pid" 2>/dev/null
  check "slots: a listener on a private port makes pick_slot skip that slot" test -n "$second" -a "$second" != "$first"; }
# A reviewer that is still working is not sent /exit.
s_working() { mk; jq '.agent_status="working"' "$T/state/agents/rev-impl-a" >"$T/x" && mv "$T/x" "$T/state/agents/rev-impl-a"
  out=$(ship); check "working agent: stops" test $? -ne 0; check "working agent: says so" says x 'is working, so it was not sent /exit'; check "working agent: no /exit sent" bash -c "! grep -q '/exit' '$T/state/prompts.log' 2>/dev/null"
  check "working agent: the merge is reported" says x "merged "; check "working agent: reviewer still live" test -e "$T/state/agents/rev-impl-a"; }

scen=("$@"); [ ${#scen[@]} -gt 0 ] || scen=(dirty noorigin happy compose assignee nochecks two twored reuse red absent multi queued closed open dirtyreview stale lease foreign ahead race working rewritten noname slots)
for s in "${scen[@]}"; do echo "== $s"; "s_$s"; done
finish
