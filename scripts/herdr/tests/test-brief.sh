#!/usr/bin/env bash
# fill-brief.sh and the delivery template.
. "$(dirname "${BASH_SOURCE[0]}")/lib.sh"
mk_env; SA=$(pick_slot) || exit 2
"$HERDR/new-task.sh" --id demo-one --branch feat/demo-one --slot "$SA" --effort medium --effort-reason r >/dev/null 2>&1
printf '# Tarea C · demo & "test" #1/2\nWT=__WT__ BASE=__BASE__ FULL=__BASEFULL__ SL=__SL__ %s\nVITE=__VITE__ PW=__PW__ SB=__SB__ __LANE_NAME__ → __DELIVERY__\n' '' >"$T/staged.md"
out=$("$HERDR/fill-brief.sh" demo-one C "$T/staged.md" 2>&1); rc=$?
B=$T/root/tasks/demo-one/brief.md
check "fill-brief: rc 0" test $rc -eq 0
check "fill-brief: slot ports come from the configuration" grep -q "VITE=$(port_of "$SA" DEV_SERVER_PORT) PW=$(port_of "$SA" PLAYWRIGHT_PORT) SB=$(port_of "$SA" STORYBOOK_PORT)" "$B"
check "fill-brief: the ports are the configured bases plus the slot" grep -q "VITE=$((B_DEV + SA)) PW=$((B_PW + SA)) SB=$((B_SB + SA))" "$B"
check "fill-brief: the footer states the task's ports" grep -qF "Playwright \`$((B_PW + SA))\`, Storybook \`$((B_SB + SA))\`" "$B"
check "fill-brief: footer present" grep -q 'Sin push ni PR' "$B"
check "fill-brief: delivery path" grep -q "→ $T/root/tasks/demo-one/delivery.md" "$B"
check "fill-brief: footer matches the repo copy" grep -qF 'ENTREGA C: LISTA' "$B"
printf '# x\n__NOPE__ and __LANE_NAME__\n' >"$T/bad.md"; cp "$B" "$T/before.md"
out=$("$HERDR/fill-brief.sh" demo-one C "$T/bad.md" 2>&1); rc=$?
check "fill-brief: unfilled marker fails" test $rc -ne 0
check "fill-brief: names the marker" says x '__NOPE__'
check "fill-brief: the brief is untouched" cmp -s "$B" "$T/before.md"
out=$("$HERDR/fill-brief.sh" demo-one C "$B" 2>&1); check "fill-brief: refuses its own output as source" test $? -ne 0
# Markers of ports this project does not have (__API__, __PG__, __KC__) are unfilled markers and fail.
for m in __API__ __PG__ __KC__; do
  printf '# x\nport %s\n' "$m" >"$T/old.md"; out=$("$HERDR/fill-brief.sh" demo-one C "$T/old.md" 2>&1); rc=$?
  check "fill-brief: $m is not a marker of this project" test $rc -ne 0; check "fill-brief: $m is named" says x "$m"
done
# A marker with a digit is a marker too: left unfilled it fails.
printf '# x\nport __X1__\n' >"$T/digit.md"; out=$("$HERDR/fill-brief.sh" demo-one C "$T/digit.md" 2>&1); rc=$?
check "fill-brief: an unfilled marker with a digit fails" test $rc -ne 0; check "fill-brief: names __X1__" says x '__X1__'
# The markers follow HERDR_PORTS, not the code: another list, other markers.
printf '# x\nAPI=__API__ VITE=__VITE__\n' >"$T/other.md"
out=$(HERDR_PORTS='SERVER_PORT:8000:API DEV_SERVER_PORT:5000:VITE PLAYWRIGHT_PORT:4000:PW STORYBOOK_PORT:6000:SB' "$HERDR/fill-brief.sh" demo-one C "$T/other.md" 2>&1); rc=$?
check "fill-brief: markers follow HERDR_PORTS" test $rc -eq 0; check "fill-brief: configured base plus slot" grep -q "API=$((8000 + SA)) VITE=$((5000 + SA))" "$B"
# The footer's own markers (__VITE__, __PW__, __SB__) are unfilled when the list drops them: the run fails and the
# brief written above stays.
out=$(HERDR_PORTS='SERVER_PORT:8000:API' "$HERDR/fill-brief.sh" demo-one C "$T/other.md" 2>&1); check "fill-brief: a list without the footer's markers fails" test $? -ne 0
check "fill-brief: the failed run left the last brief alone" grep -q "API=$((8000 + SA)) VITE=$((5000 + SA))" "$B"
# Temporary files stay out of $TMPDIR
# TMPDIR is read-only: a script that wrote there would fail.
mkdir -p "$T/tmpdir"; chmod 555 "$T/tmpdir"; out=$(TMPDIR="$T/tmpdir" "$HERDR/fill-brief.sh" demo-one C "$T/staged.md" 2>&1); check "fill-brief: that run succeeded" test $? -eq 0
check "fill-brief: nothing written to TMPDIR" test -z "$(ls -A "$T/tmpdir")"; chmod 755 "$T/tmpdir"
check "fill-brief: no temporary file left in the task directory" test -z "$(ls -A "$T/root/tasks/demo-one" | grep '^\.brief-')"
# render_template keeps & / # and backslashes in values
printf 'a __X__ b __Y__\n' >"$T/t.md"
rendered=$( . "$HERDR/common.sh"; render_template "$T/t.md" __ __ 'X=/a&b#c/&' 'Y=\1 & x' )
check "render_template: & / # and backslash survive" test "$rendered" = 'a /a&b#c/& b \1 & x'
# delivery template: fixed sections, in order, and the closing line
mapfile -t heads < <(grep '^## ' "$HERDR/delivery.template.md")
want=('## Resumen' '## Commits' '## Pruebas con cifras base y final' '## Los tests nuevos fallan sin su cambio' '## Autocomprobación' '## Desviaciones y decisiones' '## Limitaciones' '## Esfuerzo usado' '## `git status --short`')
check "delivery template: sections and order" test "${heads[*]}" = "${want[*]}"
check "delivery template: closing line" grep -qx 'ENTREGA {carril}: LISTA' "$HERDR/delivery.template.md"
finish
