#!/usr/bin/env bash
# new-review.sh: the first review, its brief (A1: the commands carry the review's slot) and its rounds.
. "$(dirname "${BASH_SOURCE[0]}")/lib.sh"
mk_env; SA=$(pick_slot) || exit 2; SB=$(pick_slot "$SA") || exit 2
mk_impl "$SA" 'PLAYWRIGHT_PORT=__PW__ npx playwright test --workers=3
curl http://localhost:__VITE__/x && curl http://localhost:__VITE__/y
STORYBOOK_PORT=__SB__ npx storybook dev -p __SB__
vite --port __VITE__ && vitest --maxWorkers=3'
R=$T/root/worktrees/review-impl-a; RB=$T/root/tasks/review-impl-a
printf -- '- Check the `&` handling in /a/b#c\n' >"$T/points.md"

echo "== marker-shaped points are refused before anything is created (B2)"
printf 'see {{PLACEHOLDER}}\n' >"$T/badpoints.md"
out=$("$HERDR/new-review.sh" --task impl-a --slot "$SB" --points "$T/badpoints.md" 2>&1); rc=$?
check "bad points: refused" test $rc -ne 0
check "bad points: names the points file" says x "badpoints.md"
check "bad points: nothing created" bash -c "! test -e '$RB' && ! test -e '$R'"

printf 'see {{X1}}\n' >"$T/digitpoints.md"
out=$("$HERDR/new-review.sh" --task impl-a --slot "$SB" --points "$T/digitpoints.md" 2>&1); rc=$?
check "marker-shaped points with a digit: refused" test $rc -ne 0; check "marker-shaped points with a digit: names it" says x '{{X1}}'
check "marker-shaped points with a digit: nothing created" bash -c "! test -e '$RB' && ! test -e '$R'"

echo "== first review (A1, B4)"
out=$("$HERDR/new-review.sh" --task impl-a --slot "$SB" --points "$T/points.md" 2>&1); rc=$?
check "first: rc 0" test $rc -eq 0
check "first: uses the requested slot" test "$(jq -r .slot "$RB/task.json")" = "$SB"
cmds=$(awk '/^Commands to run/{f=1} f&&/^```sh/{b=1;next} b&&/^```/{exit} b{print}' "$RB/brief.md")
check "A1: review ports in the commands" grep -q "PLAYWRIGHT_PORT=$((4280 + SB)) npx playwright test" <<<"$cmds"
check "A1: dev server port, both occurrences" test "$(grep -o "localhost:$((5280 + SB))" <<<"$cmds" | wc -l)" -eq 2
check "A1: storybook and vite ports" grep -q "STORYBOOK_PORT=$((6080 + SB)) npx storybook dev -p $((6080 + SB))" <<<"$cmds" && grep -q "vite --port $((5280 + SB))" <<<"$cmds"
check "A1: the header names the review's slot and ports" grep -q "^# Your slot ($SB): DEV_SERVER_PORT=$((5280 + SB)) PLAYWRIGHT_PORT=$((4280 + SB)) STORYBOOK_PORT=$((6080 + SB))" <<<"$cmds"
check "A1: none of the implementer's ports" bash -c "! grep -Eq '\\b($((4280 + SA))|$((5280 + SA))|$((6080 + SA)))\\b' <<<'$cmds'"
check "A1: no Compose line when Compose is off" bash -c "! grep -qi 'compose' <<<'$cmds'"
check "A1: the brief has no unfilled marker" bash -c "! grep -q '{{' '$RB/brief.md'"
check "first: extra points" grep -q 'handling in /a/b#c' "$RB/brief.md"
check "first: reviewed commit is the task's tip" test "$(jq -r .review.sha "$RB/task.json")" = "$(git -C "$W" rev-parse HEAD)"
check "model: task.json records the reviewer model" test "$(jq -r .model "$RB/task.json")" = claude-opus-5-5
check "model: settings.local.json fixes it" test "$(jq -r .model "$R/.claude/settings.local.json")" = claude-opus-5-5
check "first: no advisor" test "$(jq -r '.env.CLAUDE_CODE_DISABLE_ADVISOR_TOOL' "$R/.claude/settings.local.json")" = 1
out=$("$HERDR/new-review.sh" --task impl-a 2>&1); check "again without --round: refused" test $? -ne 0
out=$("$HERDR/new-review.sh" --task impl-a --round 2 2>&1); check "round without new commits: refused" test $? -ne 0

echo "== round 2: fast-forward"
git -C "$W" commit -q --allow-empty -m "fix: two"; echo fixes >"$T/root/tasks/impl-a/fixes-1.md"
out=$("$HERDR/new-review.sh" --task impl-a --round 2 --points "$T/points.md" 2>&1); rc=$?
check "ff: rc 0" test $rc -eq 0
check "ff: review moved" test "$(git -C "$R" rev-parse HEAD)" = "$(git -C "$W" rev-parse HEAD)"
check "ff: same branch" test "$(git -C "$R" branch --show-current)" = "review/impl-a-$(git -C "$W" rev-parse --short=7 HEAD~1)"
check "ff: brief mentions the fixes file" grep -q 'fixes-1.md' "$RB/brief-ronda-2.md"
check "ff: sent to the reviewer" grep -q 'brief-ronda-2.md' "$T/state/prompts.log"
check "round 2 commands also use the review's slot" bash -c "! grep -q 'PLAYWRIGHT_PORT=$((4280 + SA))' '$RB/brief-ronda-2.md'"
check "round 2: the review's own port is there" grep -q "PLAYWRIGHT_PORT=$((4280 + SB))" "$RB/brief-ronda-2.md"
echo "== B1: the round must be greater than the current one"
git -C "$W" commit -q --allow-empty -m "fix: three"
out=$("$HERDR/new-review.sh" --task impl-a --round 2 2>&1); check "round 2 again: refused" test $? -ne 0
before=$(md5sum <"$RB/brief-ronda-2.md"); check "round 2 again: brief untouched" test "$(md5sum <"$RB/brief-ronda-2.md")" = "$before"
check "round 2 again: review.round kept" test "$(jq -r .review.round "$RB/task.json")" = 2
echo "== round 3: history rewritten"
base=$(jq -r .base_sha "$T/root/tasks/impl-a/task.json"); git -C "$W" reset -q --hard "$base"; git -C "$W" commit -q --allow-empty -m "feat: rewritten"
out=$("$HERDR/new-review.sh" --task impl-a --round 3 2>&1); rc=$?
check "rewrite: rc 0" test $rc -eq 0
check "rewrite: new branch at the new commit" test "$(git -C "$R" branch --show-current)" = "review/impl-a-$(git -C "$W" rev-parse --short=7 HEAD)"
check "rewrite: HEAD is the task's tip" test "$(git -C "$R" rev-parse HEAD)" = "$(git -C "$W" rev-parse HEAD)"
check "rewrite: task.json follows the branch" test "$(jq -r .branch "$RB/task.json")" = "$(git -C "$R" branch --show-current)"
check "rewrite: range-diff hint" grep -q 'range-diff' "$RB/brief-ronda-3.md"
echo "== refusals"
git -C "$W" commit -q --allow-empty -m "fix: four"
jq '.agent_status="working"' "$T/state/agents/rev-impl-a" >"$T/x" && mv "$T/x" "$T/state/agents/rev-impl-a"
out=$("$HERDR/new-review.sh" --task impl-a --round 4 2>&1); check "busy reviewer: refused" test $? -ne 0
jq '.agent_status="idle"' "$T/state/agents/rev-impl-a" >"$T/x" && mv "$T/x" "$T/state/agents/rev-impl-a"
touch "$R/stray"; out=$("$HERDR/new-review.sh" --task impl-a --round 4 2>&1); check "dirty review worktree: refused" test $? -ne 0; rm -f "$R/stray"
rm -f "$T/state/agents/rev-impl-a"; out=$("$HERDR/new-review.sh" --task impl-a --round 4 2>&1)
check "no live reviewer: started again with --continue" grep -q 'start rev-impl-a .*-- --continue' "$T/state/calls.log"
echo "== the reviewed commit is the branch ref, not whatever the worktree shows (T3)"
# The branch gets a new commit while the task worktree sits detached on the previous one: HEAD of the worktree is
# the commit already reviewed, the branch ref is the new one.
git -C "$W" commit -q --allow-empty -m "fix: five"; tip=$(git -C "$W" rev-parse HEAD)
git -C "$W" checkout -q --detach HEAD~1
out=$("$HERDR/new-review.sh" --task impl-a --round 5 2>&1); rc=$?
check "detached worktree: rc 0" test $rc -eq 0
check "detached worktree: reviews the branch tip" test "$(git -C "$R" rev-parse HEAD)" = "$tip"
check "detached worktree: the tip is what refs/heads says" test "$tip" = "$(git -C "$T/repo" rev-parse refs/heads/feat/impl-a)"
check "detached worktree: review.sha recorded" test "$(jq -r .review.sha "$RB/task.json")" = "$tip"
echo "== Compose on: the commands carry the review's project, not the implementer's"
mk_env; export HERDR_COMPOSE=1; SA=$(pick_slot) || exit 2; SB=$(pick_slot "$SA") || exit 2
mk_impl "$SA" 'docker compose -p forma-ui-impl-a up -d && vite --port __VITE__'
RB=$T/root/tasks/review-impl-a
export HERDR_REVIEW_MODEL=model-override-x
out=$("$HERDR/new-review.sh" --task impl-a --slot "$SB" 2>&1); rc=$?
check "compose: review created" test $rc -eq 0
check "model: HERDR_REVIEW_MODEL overrides the default" test "$(jq -r .model "$RB/task.json")" = model-override-x
cmds=$(awk '/^Commands to run/{f=1} f&&/^```sh/{b=1;next} b&&/^```/{exit} b{print}' "$RB/brief.md")
check "compose: the header names the project" grep -q '^# Docker Compose: always with -p forma-ui-review-impl-a' <<<"$cmds"
check "compose: the command uses the review's project" grep -q 'compose -p forma-ui-review-impl-a up' <<<"$cmds"
check "compose: not the implementer's project" bash -c "! grep -q 'compose -p forma-ui-impl-a ' <<<'$cmds'"
finish
