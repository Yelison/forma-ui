#!/usr/bin/env bash
# remove-task.sh: leftovers (processes on the slot's ports, containers) and --volumes, with Compose on; and with it off.
. "$(dirname "${BASH_SOURCE[0]}")/lib.sh"
mk_env; export HERDR_COMPOSE=1; SA=$(pick_slot) || exit 2; PORT=$(port_of "$SA" DEV_SERVER_PORT)
new() { "$HERDR/new-task.sh" --id "$1" --branch "feat/$1" --slot "$SA" --effort medium --effort-reason r >/dev/null 2>&1; }
removed() { [ "$(jq -r .removed_at "$T/root/tasks/$1/task.json")" != null ]; }

echo "== clean task"
new left-a; out=$("$HERDR/remove-task.sh" --id left-a 2>&1); check "clean: rc 0" test $? -eq 0; check "clean: retired" removed left-a

echo "== T2: a dirty worktree is refused before any docker compose down"
new left-w; echo "# local edit" >>"$T/root/worktrees/left-w/.gitignore"; rm -f "$T/state/docker.log"; echo forma-ui-left-w >"$T/state/compose-projects"
out=$("$HERDR/remove-task.sh" --id left-w --volumes 2>&1); rc=$?
check "dirty: refused" test $rc -ne 0; check "dirty: says uncommitted" says x 'uncommitted'
check "dirty: no docker down" bash -c "! grep -q 'down' '$T/state/docker.log' 2>/dev/null"
check "dirty: the worktree stays" test -d "$T/root/worktrees/left-w"; check "dirty: not retired" bash -c "[ \"\$(jq -r .removed_at '$T/root/tasks/left-w/task.json')\" = null ]"
git -C "$T/root/worktrees/left-w" checkout -q -- .gitignore; rm -f "$T/state/compose-projects"
out=$("$HERDR/remove-task.sh" --id left-w --volumes 2>&1); check "dirty fixed: retired" removed left-w

echo "== a process listening on the slot's port"
new left-b; mkdir -p "$T/srv"
(cd "$T/srv" && exec python3 -m http.server "$PORT" --bind 127.0.0.1 >/dev/null 2>&1) & PID=$!
for _ in $(seq 1 25); do ss -ltnH | grep -q ":$PORT " && break; sleep 0.2; done
out=$("$HERDR/remove-task.sh" --id left-b 2>&1); rc=$?
check "listener: refused" test $rc -ne 0; check "listener: shows the pid" says x "pid $PID,"; check "listener: shows the command" says x "http.server $PORT"
check "listener: shows the cwd" says x "cwd $T/srv"; check "listener: nothing removed" test -d "$T/root/worktrees/left-b"; check "listener: the process is still alive" kill -0 "$PID"
kill "$PID"; wait "$PID" 2>/dev/null

echo "== a container of the project"
rm -f "$T/state/docker.log"; echo "abc123 forma-ui-left-b-postgres-1 (Exited (0) 2 minutes ago)" >"$T/state/containers"
out=$("$HERDR/remove-task.sh" --id left-b 2>&1); rc=$?
check "container: refused" test $rc -ne 0; check "container: listed" says x 'container abc123 forma-ui-left-b-postgres-1'
check "container: nothing stopped by the script" bash -c "! grep -q 'down' '$T/state/docker.log'"
check "container: the advice is plain down" says x 'docker compose -p forma-ui-left-b down for'
out=$("$HERDR/remove-task.sh" --id left-b --volumes 2>&1)
check "container with --volumes: the advice says down --volumes" says x 'docker compose -p forma-ui-left-b down --volumes'

echo "== M2: --volumes removes the volumes even when compose lists no project"
: >"$T/state/containers"; rm -f "$T/state/compose-projects" "$T/state/docker.log"
out=$("$HERDR/remove-task.sh" --id left-b --volumes 2>&1); rc=$?
check "volumes: rc 0" test $rc -eq 0; check "volumes: retired" removed left-b
check "volumes: down --volumes ran for the project" grep -q 'compose -p forma-ui-left-b -f .* down --volumes' "$T/state/docker.log"
new left-c; rm -f "$T/state/docker.log"; out=$("$HERDR/remove-task.sh" --id left-c 2>&1)
check "no --volumes and no project: compose is left alone" bash -c "! grep -q 'down' '$T/state/docker.log'"

echo "== --delete-branch: what is in main goes, what is only here stays"
has_branch() { git -C "$T/repo" rev-parse -q --verify "refs/heads/$1" >/dev/null; }
# The same patch as the branch's commit, on main, under another SHA (what GitHub's rebase merge does).
land_rewritten() { GIT_COMMITTER_NAME=GitHub GIT_COMMITTER_EMAIL=noreply@github.com git -C "$T/repo" cherry-pick "$1" >/dev/null; }
# commit_in TASK FILE: one commit that adds FILE in the task's worktree.
commit_in() { echo "$2" >"$T/root/worktrees/$1/$2"; git -C "$T/root/worktrees/$1" add "$2"; git -C "$T/root/worktrees/$1" commit -q -m "feat: $2"; }
new br-a; commit_in br-a a.txt; land_rewritten feat/br-a
out=$("$HERDR/remove-task.sh" --id br-a --delete-branch 2>&1); check "cherry: merged under other SHAs: retired" removed br-a
check "cherry: merged under other SHAs: the branch is deleted" bash -c "! git -C '$T/repo' rev-parse -q --verify refs/heads/feat/br-a"
check "cherry: a deleted branch is not described as staying" bash -c "! grep -qE 'stay in the local branch|not pushed yet|kept' <<<'$out'"
new br-b; commit_in br-b b.txt
out=$("$HERDR/remove-task.sh" --id br-b --delete-branch 2>&1); check "cherry: a commit that is not in main: retired" removed br-b
check "cherry: a commit that is not in main: the branch is kept" has_branch feat/br-b; check "cherry: a commit that is not in main: says so" says x 'feat/br-b kept'
check "cherry: a kept branch says what it leaves behind" says x 'stay in the local branch'
new br-c; commit_in br-c c.txt; land_rewritten feat/br-c
out=$("$HERDR/remove-task.sh" --id br-c 2>&1); check "no --delete-branch: the branch stays even when merged" has_branch feat/br-c
# A review's branches: only review/<id>-<sha7> is its own; review/<id>-x-<sha7> belongs to the task <id>-x.
new review-pc; jq '.review = { of: "pc" }' "$T/root/tasks/review-pc/task.json" >"$T/x" && mv "$T/x" "$T/root/tasks/review-pc/task.json"
git -C "$T/repo" branch review/pc-1234567 main; git -C "$T/repo" branch review/pc-x-1234567 main; git -C "$T/repo" branch review/pc-abcdef0 main
git -C "$T/repo" worktree add -q "$T/inuse" review/pc-abcdef0
out=$("$HERDR/remove-task.sh" --id review-pc --delete-branch 2>&1); rc=$?
check "review sweep: rc 0 although a branch is in use" test $rc -eq 0; check "review sweep: the task is retired" removed review-pc
check "review sweep: its own older branch is deleted" bash -c "! git -C '$T/repo' rev-parse -q --verify refs/heads/review/pc-1234567"
check "review sweep: another task's branch (pc-x) is not touched" has_branch review/pc-x-1234567
check "review sweep: a branch in use is kept, with a warning" says x 'could not delete review/pc-abcdef0'; check "review sweep: the branch in use is still there" has_branch review/pc-abcdef0
git -C "$T/repo" worktree remove "$T/inuse"
# git cherry cannot judge: nothing is deleted on a doubt (main is called trunk for a moment).
new br-d; commit_in br-d d.txt; git -C "$T/repo" branch -m main trunk
out=$("$HERDR/remove-task.sh" --id br-d --delete-branch 2>&1); git -C "$T/repo" branch -m trunk main
check "cherry fails: retired" removed br-d; check "cherry fails: the branch is kept" has_branch feat/br-d; check "cherry fails: says so" says x 'git cherry could not compare feat/br-d with main'
# git cherry skips merge commits: a branch with a merge of its own is kept although every other commit is in main.
new br-e; commit_in br-e e.txt; git -C "$T/root/worktrees/br-e" branch side main; git -C "$T/root/worktrees/br-e" switch -q side; commit_in br-e side.txt
git -C "$T/root/worktrees/br-e" switch -q feat/br-e; git -C "$T/root/worktrees/br-e" merge -q --no-ff side -m "merge side"
land_rewritten "feat/br-e~1"; land_rewritten side
out=$("$HERDR/remove-task.sh" --id br-e --delete-branch 2>&1); check "merge commit: retired" removed br-e
check "merge commit: the branch is kept" has_branch feat/br-e; check "merge commit: says why" says x 'merge commits of its own'
# The patch ids of git cherry ignore whitespace: a change that differs from main's only in indentation is not in main.
new br-f; printf 'a:\n  value: 1\n' >"$T/root/worktrees/br-f/c.yml"; git -C "$T/root/worktrees/br-f" add c.yml; git -C "$T/root/worktrees/br-f" commit -q -m "feat: indented"
printf 'a:\nvalue: 1\n' >"$T/repo/c.yml"; git -C "$T/repo" add c.yml; git -C "$T/repo" -c user.name=GitHub -c user.email=noreply@github.com commit -q -m "feat: flat"
check "whitespace: git cherry alone would call the branch merged" test "$(git -C "$T/repo" cherry main feat/br-f | grep -c '^+')" -eq 0
out=$("$HERDR/remove-task.sh" --id br-f --delete-branch 2>&1); check "whitespace: retired" removed br-f
check "whitespace: the branch is kept" has_branch feat/br-f; check "whitespace: says why" says x 'merging it into main would change main'
check "whitespace: a kept branch is announced once" test "$(grep -c 'feat/br-f kept' <<<"$out")" -eq 1

echo "== forced"
new left-d; echo "abc123 forma-ui-left-d-postgres-1 (Up 2 minutes)" >"$T/state/containers"; echo forma-ui-left-d >"$T/state/compose-projects"; rm -f "$T/state/docker.log"
out=$("$HERDR/remove-task.sh" --id left-d --force-leftovers 2>&1); rc=$?
check "forced: rc 0" test $rc -eq 0; check "forced: the compose project is stopped" grep -q 'compose -p forma-ui-left-d' "$T/state/docker.log"

echo "== docker cannot answer"
new left-e; : >"$T/state/containers"; rm -f "$T/state/compose-projects"
out=$(FAKE_DOCKER_FAIL=1 "$HERDR/remove-task.sh" --id left-e 2>&1); rc=$?
check "docker ps failing: refused" test $rc -ne 0; check "docker ps failing: says so" says x 'could not list the containers'; check "docker ps failing: nothing removed" test -d "$T/root/worktrees/left-e"
out=$(FAKE_DOCKER_FAIL=1 "$HERDR/remove-task.sh" --id left-e --force-leftovers 2>&1); check "docker ps failing: --force-leftovers goes on" test $? -eq 0

echo "== Compose off (the default): docker is never called"
mk_env; SA=$(pick_slot) || exit 2; PORT=$(port_of "$SA" DEV_SERVER_PORT)
check "off: the default is off" test "${HERDR_COMPOSE:-0}" = 0
new off-a; check "off: no compose project recorded" test -z "$(jq -r '.compose_project // empty' "$T/root/tasks/off-a/task.json")"
# A container that would be found, and a project that would be listed, if docker were asked.
echo "abc123 forma-ui-off-a-web-1 (Up 2 minutes)" >"$T/state/containers"; echo forma-ui-off-a >"$T/state/compose-projects"; rm -f "$T/state/docker.log"
out=$("$HERDR/remove-task.sh" --id off-a --volumes 2>&1); rc=$?
check "off: retired with --volumes" test $rc -eq 0; check "off: retired" removed off-a
check "off: no docker call at all" test ! -e "$T/state/docker.log"
check "off: nothing about containers" bash -c "! grep -qi 'container' <<<'$out'"
new off-b; mk=$T/srv-b; mkdir -p "$mk"
(cd "$mk" && exec python3 -m http.server "$PORT" --bind 127.0.0.1 >/dev/null 2>&1) & PID=$!
for _ in $(seq 1 25); do ss -ltnH | grep -q ":$PORT " && break; sleep 0.2; done
out=$("$HERDR/remove-task.sh" --id off-b 2>&1); rc=$?
check "off: a listener still refuses" test $rc -ne 0; check "off: the advice does not mention docker" bash -c "! grep -qi 'docker' <<<'$out'"
check "off: still no docker call" test ! -e "$T/state/docker.log"
kill "$PID"; wait "$PID" 2>/dev/null
out=$("$HERDR/remove-task.sh" --id off-b 2>&1); check "off: retired once the listener is gone" removed off-b
check "off: no docker call after the second run either" test ! -e "$T/state/docker.log"
finish
