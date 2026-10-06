#!/usr/bin/env bash
# new-task.sh and the project settings: ports, .env.herdr, task.json, label, install step and slot range.
. "$(dirname "${BASH_SOURCE[0]}")/lib.sh"
mk_env; SA=$(pick_slot) || exit 2; SB=$(pick_slot "$SA") || exit 2
new() { local id=$1; shift; "$HERDR/new-task.sh" --id "$id" --branch "feat/$id" --effort medium --effort-reason r "$@" 2>&1; }
# label_of BRANCH: the workspace label the fake herdr was given for that branch.
label_of() { jq -rs --arg b "$1" '.[] | select(.branch == $b) | .label' "$T"/state/ws/*; }

echo "== ports come from the configuration, one slot per task"
# CLAUDE.md is versioned in Forma UI: the worktree has it from the checkout and new-task.sh says nothing about it.
echo "# project rules" >"$T/repo/CLAUDE.md"; git -C "$T/repo" add CLAUDE.md; git -C "$T/repo" commit -qm "docs: CLAUDE.md"
out=$(new task-a --slot "$SA"); check "task a: created" test $? -eq 0; OUT_A=$out
out=$(new task-b --slot "$SB"); check "task b: created" test $? -eq 0
check "task a: DEV_SERVER_PORT is 5280 + slot" grep -qx "DEV_SERVER_PORT=$((5280 + SA))" "$T/root/worktrees/task-a/.env.herdr"
check "task a: PLAYWRIGHT_PORT is 4280 + slot" grep -qx "PLAYWRIGHT_PORT=$((4280 + SA))" "$T/root/worktrees/task-a/.env.herdr"
check "task a: STORYBOOK_PORT is 6080 + slot" grep -qx "STORYBOOK_PORT=$((6080 + SA))" "$T/root/worktrees/task-a/.env.herdr"
check "task b: its own ports" grep -qx "DEV_SERVER_PORT=$((5280 + SB))" "$T/root/worktrees/task-b/.env.herdr" && grep -qx "STORYBOOK_PORT=$((6080 + SB))" "$T/root/worktrees/task-b/.env.herdr"
check "slots differ" test "$SA" != "$SB"
check "task.json: ports of the configured names" test "$(jq -c .ports "$T/root/tasks/task-a/task.json")" = "{\"dev_server\":$((5280 + SA)),\"playwright\":$((4280 + SA)),\"storybook\":$((6080 + SA))}"
check "task a and b share no port" test -z "$(jq -r '.ports[]' "$T/root/tasks/task-a/task.json" "$T/root/tasks/task-b/task.json" | sort | uniq -d)"
echo "== .env.herdr: configured ports and HERDR_TASK_* only"
check "env: the task variables" grep -qx 'HERDR_TASK_ID=task-a' "$T/root/worktrees/task-a/.env.herdr" && grep -qx "HERDR_TASK_SLOT=$SA" "$T/root/worktrees/task-a/.env.herdr"
check "env: only HERDR_TASK_* and the three ports" test "$(grep -vE '^(#|HERDR_TASK_|DEV_SERVER_PORT=|PLAYWRIGHT_PORT=|STORYBOOK_PORT=)' "$T/root/worktrees/task-a/.env.herdr" | wc -l)" -eq 0
check "env: no Compose, database or API variables" bash -c "! grep -qE 'COMPOSE_PROJECT_NAME|DATABASE_URL|API_PROXY_TARGET|^SERVER_PORT=' '$T/root/worktrees/task-a/.env.herdr'"
check "env: not tracked by git" bash -c "git -C '$T/root/worktrees/task-a' check-ignore -q .env.herdr"
check "task.json: no Compose project" test -z "$(jq -r '.compose_project // empty' "$T/root/tasks/task-a/task.json")"
check "label: the project id" test "$(label_of feat/task-a)" = "forma-ui · task-a"
check "CLAUDE.md: new-task.sh does not mention it" bash -c "! grep -qi 'CLAUDE.md' <<<'$OUT_A'"
check "CLAUDE.md: the worktree has the versioned file, unchanged" cmp -s "$T/repo/CLAUDE.md" "$T/root/worktrees/task-a/CLAUDE.md"
check "CLAUDE.md: it is tracked in the worktree" git -C "$T/root/worktrees/task-a" ls-files --error-unmatch CLAUDE.md >/dev/null
out=$("$HERDR/new-task.sh" --id task-x --branch feat/task-x --slot 3 --no-claude-md 2>&1); check "--no-claude-md no longer exists" test $? -ne 0

echo "== Compose on: only COMPOSE_PROJECT_NAME is added"
export HERDR_COMPOSE=1; SC=$(pick_slot "$SA" "$SB") || exit 2
out=$(new task-c --slot "$SC"); check "compose: created" test $? -eq 0
check "compose: COMPOSE_PROJECT_NAME is prefixed with the project id" grep -qx 'COMPOSE_PROJECT_NAME=forma-ui-task-c' "$T/root/worktrees/task-c/.env.herdr"
check "compose: still no database or API variables" bash -c "! grep -qE 'DATABASE_URL|API_PROXY_TARGET' '$T/root/worktrees/task-c/.env.herdr'"
check "compose: task.json has the project" test "$(jq -r .compose_project "$T/root/tasks/task-c/task.json")" = forma-ui-task-c
unset HERDR_COMPOSE

echo "== environment overrides the project file"
SD=$(pick_slot "$SA" "$SB" "$SC") || exit 2
out=$(HERDR_PORTS='DEV_SERVER_PORT:7100:VITE' HERDR_PROJECT_ID=acme new "task-d" --slot "$SD"); check "override: created" test $? -eq 0
check "override: the only port is the configured one" test "$(grep -c '_PORT=' "$T/root/worktrees/task-d/.env.herdr")" -eq 1 && grep -qx "DEV_SERVER_PORT=$((7100 + SD))" "$T/root/worktrees/task-d/.env.herdr"
check "override: the label follows HERDR_PROJECT_ID" test "$(label_of feat/task-d)" = "acme · task-d"
out=$(HERDR_PORTS='nonsense' "$HERDR/new-task.sh" --id task-e --branch feat/task-e 2>&1); check "a malformed port list is refused" test $? -ne 0; check "malformed: says NAME:BASE:MARKER" says x 'NAME:BASE:MARKER'
check "malformed: nothing created" test ! -e "$T/root/tasks/task-e"

echo "== HERDR_PORTS is validated by content, one case per rule"
# Its own environment: a rule that stops refusing would create a task, and that must not take a slot from the later sections.
mk_env
mkdir -p "$T/globdir"; : >"$T/globdir/DEV_SERVER_PORT:5000:VITE"
BADN=0
bad_ports() { # name list message; every case has its own task id, so a rule that stops refusing cannot hide the others
  local id; BADN=$((BADN + 1)); id=bad-ports-$BADN
  out=$(cd "$T/globdir" && HERDR_PORTS=$2 "$HERDR/new-task.sh" --id "$id" --branch "feat/$id" 2>&1); rc=$?
  check "ports: $1: refused" test $rc -ne 0; check "ports: $1: says why" says x "$3"
  check "ports: $1: nothing created" test ! -e "$T/root/tasks/$id"
}
bad_ports "duplicate name" 'A_PORT:5000:A A_PORT:6000:B' 'names A_PORT twice'
bad_ports "duplicate marker" 'A_PORT:5000:A B_PORT:6000:A' 'the marker A twice'
bad_ports "reserved marker" 'A_PORT:5000:WT' 'marker WT is reserved'
bad_ports "port above 65535" 'A_PORT:65530:A' 'above 65535'
bad_ports "overlapping ranges" 'A_PORT:5000:A B_PORT:5001:B' 'overlaps'
bad_ports "leading zeros in the base" 'A_PORT:05000:A' 'without leading zeros'
bad_ports "wildcards are not expanded" '*' "entry '*'"
ml=$(HERDR_PORTS=$'A_PORT:5000:A\nB_PORT:5010:B' bash -c '. "$1/common.sh"; port_specs' _ "$HERDR" 2>&1)
check "ports: a list on two lines is read whole" test "$ml" = "$(printf 'A_PORT 5000 A\nB_PORT 5010 B')"
out=$(HERDR_PORTS='A_PORT:5000:A B_PORT:5010:B' bash -c '. "$1/common.sh"; port_specs' _ "$HERDR" 2>&1); check "ports: ranges that touch no other are accepted" test "$out" = "$(printf 'A_PORT 5000 A\nB_PORT 5010 B')"

mk_env; SA=$(pick_slot) || exit 2; SB=$(pick_slot "$SA") || exit 2; SC=$(pick_slot "$SA" "$SB") || exit 2; SD=$(pick_slot "$SA" "$SB" "$SC") || exit 2
echo "== a busy configured port refuses the slot"
SE=$(pick_slot "$SA" "$SB" "$SC" "$SD") || exit 2; BUSY=$(port_of "$SE" STORYBOOK_PORT); mkdir -p "$T/srv"
(cd "$T/srv" && exec python3 -m http.server "$BUSY" --bind 127.0.0.1 >/dev/null 2>&1) & PID=$!
for _ in $(seq 1 25); do ss -ltnH | grep -q ":$BUSY " && break; sleep 0.2; done
out=$(new task-f --slot "$SE"); check "busy: refused" test $? -ne 0; check "busy: names the port and its variable" says x "port $BUSY (STORYBOOK_PORT)"
check "busy: nothing created" test ! -e "$T/root/tasks/task-f"
kill "$PID"; wait "$PID" 2>/dev/null

echo "== slot range"
out=$(HERDR_SLOT_MAX=2 new task-g --slot 3); check "slot 3 with a range of 1-2: refused" test $? -ne 0; check "range: says the range" says x 'between 1 and 2'
SF=$(pick_slot "$SA" "$SB" "$SC" "$SD") || exit 2
out=$(HERDR_SLOT_MIN=$SF HERDR_SLOT_MAX=$SF new task-h); check "a one-slot range: created" test $? -eq 0
check "a one-slot range: the first free slot is the only one" test "$(jq -r .slot "$T/root/tasks/task-h/task.json")" = "$SF"
out=$(HERDR_SLOT_MIN=$SF HERDR_SLOT_MAX=$SF new task-i); check "a one-slot range, taken: refused" test $? -ne 0; check "range taken: says all slots are in use" says x "all port slots ($SF-$SF) are in use"

echo "== start-agent compares the session header with the model of the task"
mk_env; SA=$(pick_slot) || exit 2; SB=$(pick_slot "$SA") || exit 2
out=$(new model-a --slot "$SA" --model claude-opus-5-5); out=$("$HERDR/start-agent.sh" --id model-a --name ma 2>&1)
check "model match: recorded" test "$(jq -r '.model_verified.header // empty' "$T/root/tasks/model-a/task.json")" = "Opus 5.5"
check "model match: no warning" bash -c "! grep -q 'was not verified' <<<'$out'"
out=$(new model-b --slot "$SB" --model claude-opus-5-5); out=$(FAKE_AGENT_MODEL="Sonnet 5.5" "$HERDR/start-agent.sh" --id model-b --name mb 2>&1)
check "model mismatch: warns, naming the asked model" says x 'asks for claude-opus-5-5'
check "model mismatch: warns, naming the shown model" says x "says 'Sonnet 5.5'"
check "model mismatch: not recorded as verified" test -z "$(jq -r '.model_verified // empty' "$T/root/tasks/model-b/task.json")"
check "model mismatch: the agent still started" test -e "$T/state/agents/mb"
check "model_display: IDs map to header names" test "$(. "$HERDR/common.sh"; model_display claude-sonnet-5-5; model_display claude-haiku-4-5-20251001)" = "$(printf 'Sonnet 5.5\nHaiku 4.5')"

echo "== install step: HERDR_INSTALL_CMD in HERDR_INSTALL_DIR, skipped without a package.json"
mk_env; SA=$(pick_slot) || exit 2; SB=$(pick_slot "$SA") || exit 2; SC=$(pick_slot "$SA" "$SB") || exit 2
out=$(new inst-a --install --slot "$SA"); rc=$?
check "no manifest: created" test $rc -eq 0; check "no manifest: says it skipped the install" says x 'no package.json'
check "no manifest: nothing was run" test ! -e "$T/root/logs/inst-a/install.log"
check "no manifest: the task record exists" test -f "$T/root/tasks/inst-a/task.json"
echo '{}' >"$T/repo/package.json"; mkdir -p "$T/repo/web"; echo '{}' >"$T/repo/web/package.json"
git -C "$T/repo" add -A; git -C "$T/repo" commit -qm "chore: manifests"
out=$(new inst-b --install --slot "$SB"); rc=$?
check "root manifest: created" test $rc -eq 0
check "root manifest: npm ci ran at the worktree root" grep -qx "fake npm ci in $T/root/worktrees/inst-b" "$T/root/logs/inst-b/install.log"
out=$(HERDR_INSTALL_DIR=web HERDR_INSTALL_CMD='npm install --ignore-scripts' new inst-c --install --slot "$SC"); rc=$?
check "configured dir and command: created" test $rc -eq 0
check "configured dir and command: ran there" grep -qx "fake npm install --ignore-scripts in $T/root/worktrees/inst-c/web" "$T/root/logs/inst-c/install.log"
SD=$(pick_slot "$SA" "$SB" "$SC") || exit 2
out=$(FAKE_NPM_FAIL=1 new inst-d --install --slot "$SD"); rc=$?
check "failing install: reported" test $rc -ne 0; check "failing install: names the log" says x 'install.log'
out=$(new inst-e --slot "$SD"); check "without --install nothing is installed" test ! -e "$T/root/logs/inst-e/install.log"
finish
