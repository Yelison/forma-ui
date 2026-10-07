#!/usr/bin/env bash
# Shared helpers for the Herdr task scripts (docs/development/herdr.md). Source it; do not run it.
# Adapted from Resolve at c3f02f8; project values live in project.env.
set -euo pipefail

# Project settings (project.env); environment variables override them. HERDR_PROJECT_ENV points at another file.
HERDR_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)
HERDR_PROJECT_ENV=${HERDR_PROJECT_ENV:-$HERDR_DIR/project.env}
[ -f "$HERDR_PROJECT_ENV" ] || { printf 'error: project settings not found: %s\n' "$HERDR_PROJECT_ENV" >&2; exit 1; }
# shellcheck source=project.env
. "$HERDR_PROJECT_ENV"
SLOT_MIN=$HERDR_SLOT_MIN
SLOT_MAX=$HERDR_SLOT_MAX
[[ $SLOT_MIN =~ ^[0-9]+$ && $SLOT_MAX =~ ^[0-9]+$ ]] && [ "$SLOT_MIN" -le "$SLOT_MAX" ] \
  || { printf 'error: HERDR_SLOT_MIN and HERDR_SLOT_MAX must be numbers with MIN <= MAX\n' >&2; exit 1; }

log() { printf '%s\n' "$*" >&2; }
die() { printf 'error: %s\n' "$*" >&2; exit 1; }
# need_arg OPTION ARGC: an option that takes a value must have one (a bare shift 2 would exit silently).
need_arg() { [ "$2" -ge 2 ] || die "$1 needs a value"; }
need() { command -v "$1" >/dev/null 2>&1 || die "'$1' is required but it is not in PATH"; }

require_herdr() {
  need herdr
  need jq
  need git
  [ "${HERDR_ENV:-}" = "1" ] || die "run this from a Herdr pane (HERDR_ENV is not 1)"
  case $HERDR_TASKS_ROOT in /*) ;; *) die "HERDR_TASKS_ROOT must be an absolute path: $HERDR_TASKS_ROOT" ;; esac
}

# Main checkout of the repository that contains DIR, even when DIR is inside a linked worktree.
repo_root_from() {
  local dir=$1 common
  common=$(git -C "$dir" rev-parse --git-common-dir 2>/dev/null) || die "'$dir' is not inside a git repository"
  common=$(cd "$dir" && cd "$common" && pwd -P)
  dirname "$common"
}

task_dir() { printf '%s/tasks/%s\n' "$HERDR_TASKS_ROOT" "$1"; }
task_json() { printf '%s/task.json\n' "$(task_dir "$1")"; }

# Loads task.json into TASK_* variables.
load_task() {
  local file
  file=$(task_json "$1")
  [ -f "$file" ] || die "unknown task '$1' (no $file)"
  TASK_ID=$1
  TASK_BRANCH=$(jq -r '.branch' "$file")
  TASK_WORKTREE=$(jq -r '.worktree' "$file")
  TASK_REPO=$(jq -r '.repo' "$file")
  TASK_BASE_SHA=$(jq -r '.base_sha' "$file")
  TASK_WORKSPACE=$(jq -r '.workspace_id' "$file")
  TASK_PANE=$(jq -r '.pane_id' "$file")
  TASK_SLOT=$(jq -r '.slot' "$file")
  TASK_COMPOSE_PROJECT=$(jq -r '.compose_project // empty' "$file")
  TASK_LOG_DIR=$(jq -r '.log_dir' "$file")
  TASK_AGENT=$(jq -r '.agent // empty' "$file")
  TASK_REMOVED_AT=$(jq -r '.removed_at // empty' "$file")
}

# update_task ID 'jq filter' [jq args...]: rewrites task.json atomically.
update_task() {
  local id=$1 filter=$2 file tmp
  shift 2
  file=$(task_json "$id")
  tmp=$(mktemp "$file.XXXXXX")
  if jq "$@" "$filter" "$file" >"$tmp"; then
    mv "$tmp" "$file"
  else
    rm -f "$tmp"
    return 1
  fi
}

# Ids of the tasks whose worktree has not been removed.
active_task_ids() {
  local f
  for f in "$HERDR_TASKS_ROOT"/tasks/*/task.json; do
    [ -f "$f" ] || continue
    jq -r 'select(.removed_at == null) | .id' "$f"
  done
}

# awk reads all of ss output (no early exit), so pipefail cannot turn a SIGPIPE into a false "free".
port_in_use() { ss -ltnH 2>/dev/null | awk -v p="$1" '$4 ~ ("[:.]" p "$") { found = 1 } END { exit !found }'; }

# port_specs: the configured ports (HERDR_PORTS), one "NAME BASE MARKER" line each. Stops the script unless every entry
# is NAME:BASE:MARKER, NAMEs and MARKERs are unique, no MARKER is one fill-brief.sh fills itself, every port of the slot
# range is at most 65535 and no two ports can ever be the same number (their ranges base+MIN..base+MAX do not overlap).
port_specs() {
  local -a specs los his
  local spec name base marker rest lo hi i seen_names=" " seen_markers=" "
  read -r -d '' -a specs <<<"$HERDR_PORTS" || true # every line, split into words, no wildcard expansion
  for spec in ${specs[@]+"${specs[@]}"}; do
    IFS=: read -r name base marker rest <<<"$spec"
    [[ $name =~ ^[A-Z][A-Z0-9_]*$ && $base =~ ^[1-9][0-9]{0,4}$ && $marker =~ ^[A-Z][A-Z0-9_]*$ && -z $rest ]] \
      || die "HERDR_PORTS entry '$spec' is not NAME:BASE:MARKER (upper-case NAME and MARKER, BASE a number of up to five digits without leading zeros)"
    case " WT BASE BASEFULL SL LANE LANE_NAME DELIVERY " in
      *" $marker "*) die "HERDR_PORTS marker $marker is reserved (fill-brief.sh fills it with its own value)" ;;
    esac
    case $seen_names in *" $name "*) die "HERDR_PORTS names $name twice" ;; esac
    case $seen_markers in *" $marker "*) die "HERDR_PORTS uses the marker $marker twice" ;; esac
    lo=$((base + SLOT_MIN)) hi=$((base + SLOT_MAX))
    [ "$hi" -le 65535 ] || die "HERDR_PORTS entry '$spec' reaches port $hi with slot $SLOT_MAX, above 65535"
    for i in "${!los[@]}"; do
      if [ "$lo" -le "${his[$i]}" ] && [ "${los[$i]}" -le "$hi" ]; then
        die "HERDR_PORTS entry '$spec' ($lo-$hi) overlaps the range of another port (${los[$i]}-${his[$i]}): two slots would share a port"
      fi
    done
    los+=("$lo") his+=("$hi") seen_names+="$name " seen_markers+="$marker "
    printf '%s %s %s\n' "$name" "$base" "$marker"
  done
}

# slot_ports N: the ports of a slot, one KEY=VALUE per line.
slot_ports() {
  local slot=$1 name base _
  while read -r name base _; do
    printf '%s=%s\n' "$name" $((base + slot))
  done < <(port_specs)
}

# Is Docker Compose on for this project? (HERDR_COMPOSE=1)
compose_enabled() { [ "${HERDR_COMPOSE:-0}" = 1 ]; }

# Checks ship.sh waits for, one name per line (HERDR_REQUIRED_CHECKS, comma-separated; names may contain spaces).
required_checks() {
  local item
  [ -n "${HERDR_REQUIRED_CHECKS//[[:space:],]/}" ] || return 0
  while IFS= read -r item; do
    item=${item#"${item%%[![:space:]]*}"}
    item=${item%"${item##*[![:space:]]}"}
    [ -z "$item" ] || printf '%s\n' "$item"
  done < <(tr ',' '\n' <<<"$HERDR_REQUIRED_CHECKS")
}

# A malformed HERDR_PORTS stops every script here, before anything is created.
port_specs >/dev/null

# Live agent (JSON) hosted by a pane, or nothing.
agent_in_pane() { herdr agent list | jq -c --arg p "$1" '.result.agents[]? | select(.pane_id == $p)'; }
# Live agent (JSON) with that name, or nothing.
agent_named() { herdr agent list | jq -c --arg n "$1" '.result.agents[]? | select((.name // "") == $n)'; }
agent_state() { herdr agent get "$1" | jq -r '.result.agent.agent_status // .result.agent_status // "unknown"'; }
utc_now() { date -u +%Y-%m-%dT%H:%M:%SZ; }

# check_load IGNORE: stops (unless IGNORE is 1) while the 1-minute load average is above HERDR_MAX_LOAD, which defaults
# to 1.5 x the number of cores: the machine is shared by several agents and a new session on a saturated one only
# makes every test flaky.
check_load() {
  local ignore=${1:-0} max load cores limit_note
  [ "$ignore" = 1 ] && return 0
  # nproc --all: plain nproc follows OMP_NUM_THREADS and would shrink the limit for no reason.
  cores=$(nproc --all 2>/dev/null || echo 1)
  max=${HERDR_MAX_LOAD:-$(awk -v c="$cores" 'BEGIN { printf "%.2f", 1.5 * c }')}
  [[ $max =~ ^[0-9]+([.][0-9]+)?$ ]] || die "HERDR_MAX_LOAD must be a number, got '$max'"
  if ! read -r load _ </proc/loadavg 2>/dev/null; then
    log "note: /proc/loadavg is not readable; the load check was skipped"
    return 0
  fi
  if awk -v l="$load" -v m="$max" 'BEGIN { exit !(l > m) }'; then
    if [ -n "${HERDR_MAX_LOAD:-}" ]; then
      limit_note="HERDR_MAX_LOAD"
    else
      limit_note="default 1.5 x $cores cores"
    fi
    die "the 1-minute load average is $load, above the limit $max ($limit_note): wait for the other agents' tests to finish, or pass --ignore-load to start anyway"
  fi
}

# Reasoning effort per task (docs/development/herdr.md, "Reasoning effort per task").
# Levels a settings file accepts; `max` only exists as a launch flag or environment variable, so tasks do not use it.
EFFORT_LEVELS="low medium high xhigh"
# Models whose per-model entry is written, so the level holds whichever of them the session picks.
EFFORT_MODELS="claude-sonnet-5-5 claude-opus-5-5 claude-fable-5-1"

valid_effort() { case " $EFFORT_LEVELS " in *" $1 "*) return 0 ;; *) return 1 ;; esac; }
effort_rank() { local i=0 l; for l in $EFFORT_LEVELS; do [ "$l" = "$1" ] && { echo "$i"; return; }; i=$((i + 1)); done; echo -1; }

# Keeps .claude/settings.local.json out of every worktree through the shared .git/info/exclude.
ensure_effort_excluded() {
  local repo=$1 exclude
  exclude=$(git -C "$repo" rev-parse --path-format=absolute --git-common-dir)/info/exclude
  mkdir -p "$(dirname "$exclude")"
  grep -Fqx '/.claude/settings.local.json' "$exclude" 2>/dev/null || {
    printf '%s\n' '# scripts/herdr: per-task reasoning effort' '/.claude/settings.local.json' >>"$exclude"
  }
}

# write_effort_settings WORKTREE LEVEL MAX: merges the effort keys into WORKTREE/.claude/settings.local.json.
write_effort_settings() {
  local worktree=$1 level=$2 max=$3 file tmp models
  file="$worktree/.claude/settings.local.json"
  mkdir -p "$worktree/.claude"
  git -C "$worktree" check-ignore -q .claude/settings.local.json \
    || die "$file would not be ignored by git; run ensure_effort_excluded first"
  [ -f "$file" ] || printf '{}\n' >"$file"
  models=$(printf '%s\n' $EFFORT_MODELS | jq -R . | jq -s .)
  tmp=$(mktemp "$file.XXXXXX")
  if jq --arg level "$level" --arg max "$max" --argjson models "$models" '
      .modelSettings = ((.modelSettings // {}) as $m
        | reduce $models[] as $k ($m; .[$k] = ((.[$k] // {}) + { effortLevel: $level, maxEffortLevel: $max })))
    ' "$file" >"$tmp"; then
    mv "$tmp" "$file"
  else
    rm -f "$tmp"
    die "could not update $file"
  fi
}

# write_model_settings WORKTREE MODEL ADVISOR: sets `model` and `advisorModel` in the worktree's local settings.
# An empty value removes the key, so the session falls back to the owner's own default; ADVISOR=none turns the
# advisor off for that worktree through the settings `env` key (CLAUDE_CODE_DISABLE_ADVISOR_TOOL=1).
write_model_settings() {
  local worktree=$1 model=$2 advisor=$3 file tmp
  file="$worktree/.claude/settings.local.json"
  mkdir -p "$worktree/.claude"
  [ -f "$file" ] || printf '{}\n' >"$file"
  tmp=$(mktemp "$file.XXXXXX")
  if jq --arg model "$model" --arg advisor "$advisor" '
      (if $model == "" then del(.model) else .model = $model end)
      | (if $advisor == "" then del(.advisorModel)
         elif $advisor == "none" then (del(.advisorModel) | .env = ((.env // {}) + { CLAUDE_CODE_DISABLE_ADVISOR_TOOL: "1" }))
         else .advisorModel = $advisor end)
      | (if $advisor != "none" and .env then .env |= del(.CLAUDE_CODE_DISABLE_ADVISOR_TOOL) else . end)
      | (if .env == {} then del(.env) else . end)
    ' "$file" >"$tmp"; then
    mv "$tmp" "$file"
  else
    rm -f "$tmp"
    die "could not update $file"
  fi
}

# model_display ID: how the session header names a model ID (claude-opus-5-5 -> "Opus 5.5"), or the ID itself when it
# has no such shape.
model_display() {
  local out
  out=$(sed -E 's/^claude-//; s/-([0-9]+)-([0-9]+)(-[0-9]+)?$/ \1.\2/' <<<"$1")
  [ "$out" = "$1" ] && { printf '%s\n' "$1"; return; }
  printf '%s%s\n' "$(tr '[:lower:]' '[:upper:]' <<<"${out:0:1}")" "${out:1}"
}

# session_fields: reads a screen on stdin and prints "MODEL|LEVEL" (either may be empty). A fresh session draws a header
# ("Sonnet 5.5 with medium effort"); a resumed one (`--continue`) draws none, so the model comes from the status bar
# at the bottom ("Sonnet 5.5  ⎇ branch") and the level from the spinner's "thinking with high effort", when there is one.
# Only the last SESSION_TAIL_LINES lines count and every pattern is anchored to its own line: a resumed session redraws
# the conversation, which may quote these very phrases, and the pane may still hold the header of the session before a
# restart (set-effort.sh).
SESSION_TAIL_LINES=12
session_fields() {
  local screen model level
  screen=$(grep -v '^[[:space:]]*$' | tail -n "$SESSION_TAIL_LINES")
  model=$(grep -E '^[[:space:]│╭╰]*[A-Z][A-Za-z]* [0-9]+(\.[0-9]+)? with [a-z]+ effort[[:space:]│╮╯]*$' <<<"$screen" | tail -n 1 || true)
  if [ -n "$model" ]; then
    level=$(sed -E 's/.* with ([a-z]+) effort[[:space:]│╮╯]*$/\1/' <<<"$model")
    model=$(sed -E 's/^[[:space:]│╭╰]*//; s/ with [a-z]+ effort[[:space:]│╮╯]*$//' <<<"$model")
  else
    model=$(grep '⎇' <<<"$screen" | sed -E 's/[[:space:]]*⎇.*//; s/^[[:space:]]+//' \
      | grep -E '^[A-Z][A-Za-z]* [0-9]+(\.[0-9]+)?$' | tail -n 1 || true)
    # The spinner: a glyph that opens the line, or the "· " inside its parentheses. Lowercase, like Claude Code draws it.
    level=$(grep -E '(^[[:space:]]*[^[:alnum:][:space:]]+|·) thinking with [a-z]+ effort' <<<"$screen" \
      | sed -E 's/.*thinking with ([a-z]+) effort.*/\1/' | tail -n 1 || true)
  fi
  printf '%s|%s\n' "$model" "$level"
}

# agent_session WANT: "MODEL|LEVEL" of the agent's session, polled for a few seconds because nothing is drawn right after
# `herdr agent start`; it stops as soon as WANT (model or level) is known. Never fails: callers run under
# `set -euo pipefail` and an empty read must not end the script before the brief is sent.
agent_session() {
  local fields attempt
  for attempt in $(seq 1 "${HERDR_HEADER_ATTEMPTS:-20}"); do
    fields=$(herdr agent read "$1" --source recent-unwrapped --lines 400 2>/dev/null | session_fields || true)
    case $2 in
      model) [ "${fields%%|*}" != "" ] && break ;;
      level) [ "${fields#*|}" != "" ] && break ;;
    esac
    [ "$attempt" -lt "${HERDR_HEADER_ATTEMPTS:-20}" ] && sleep 0.5
  done
  printf '%s\n' "${fields:-|}"
}

# Model the agent's session reports, or nothing.
agent_model() { agent_session "$1" model | cut -d'|' -f1; }

# "<model> with <level> effort" as the session reports it, or nothing when the level is unknown. A level seen without
# a model is reported for "an unknown model".
agent_effort() {
  local fields model level
  fields=$(agent_session "$1" level)
  model=${fields%%|*}; level=${fields#*|}
  [ -z "$level" ] || printf '%s with %s effort\n' "${model:-Unknown model}" "$level"
}

# render_template FILE OPEN CLOSE [KEY=VALUE...]: prints FILE with every OPEN KEY CLOSE replaced by its value
# (e.g. `render_template brief.md '{{' '}}' SHA=abc`). Pure bash on purpose: sed breaks on `&`, `/` or `#` inside a
# value, and the replacement is quoted so bash 5.2 does not expand `&` either. Fails if a marker is left unfilled.
render_template() {
  local file=$1 open=$2 close=$3 out kv key value
  shift 3
  [ -f "$file" ] || die "template not found: $file"
  shopt -u patsub_replacement 2>/dev/null || true
  out=$(cat "$file"; printf x)
  out=${out%x}
  for kv in "$@"; do
    key=${kv%%=*}
    value=${kv#*=}
    out=${out//"$open$key$close"/"$value"}
  done
  if [[ $out =~ "$open"[A-Z][A-Z0-9_]*"$close" ]]; then
    die "unfilled marker ${BASH_REMATCH[0]} in $file"
  fi
  printf '%s' "$out"
}
