# Working on several tasks in parallel with Herdr

[Herdr](https://herdr.dev) is a terminal workspace manager that recognises coding agents running in its panes. The
scripts in `scripts/herdr/` use it to run **one coordinator session and a few implementation agents at the same
time**, each agent in its own Git worktree, on its own branch and with its own ports.

Nothing here is required to build or use Forma UI: it only matters when more than one checkout is active on the same
machine. The scripts were adapted from the ones Resolve uses (copied at its commit `c3f02f8`); everything that
belongs to a project lives in [`scripts/herdr/project.env`](../../scripts/herdr/project.env), not in the code.

## Topology

| Role | Git | Herdr |
| --- | --- | --- |
| Coordinator | The main checkout (`main`); it reviews, integrates and never implements tasks itself | The session Claude Code is started from |
| Task A, B, … | A linked worktree on its own branch, created from a known commit | One workspace per task whose root pane opens the worktree; Claude Code runs there as a named agent |
| Review of a task | A worktree pinned to the delivered commit | Its own workspace and agent |

Rules that keep the checkouts independent:

- Every worktree lives **outside** the repository, under `~/forma-ui-herdr/worktrees/` by default.
- Each task gets a **port slot** (below), so two tasks can run the dev server, Playwright and Storybook at the same time.
- One owner per shared file (token source, exports, `package.json` and its lockfile, CI configuration): a task that
  needs to change one says so before doing it.
- Nothing is merged locally into `main`: every branch reaches it through a pull request merged with rebase.

## Prerequisites

- Herdr 0.8 or later with the Claude Code integration installed (`herdr integration status` shows `claude: current`).
- `jq`, `git` and `ss` (iproute2); `gh` for `ship.sh`; Docker only when Compose is turned on.
- Run the scripts **from a Herdr pane** (they check `HERDR_ENV=1`). `fill-brief.sh` does not need one.

## Configuration

`scripts/herdr/project.env` is versioned and sourced by `common.sh`. Every value can be overridden by an environment
variable of the same name, **including with an empty value** (`HERDR_PR_ASSIGNEE= ship.sh …` opens a pull request
without an assignee). `HERDR_PROJECT_ENV` points the scripts at another settings file.

| Variable | Default | Meaning |
| --- | --- | --- |
| `HERDR_PROJECT_ID` | `forma-ui` | Prefix of workspace labels (`forma-ui · <id>`) and of the Compose project |
| `HERDR_TASKS_ROOT` | `$HOME/forma-ui-herdr` | Holds `worktrees/`, `tasks/` and `logs/`; absolute, outside the repository |
| `HERDR_SLOT_MIN`, `HERDR_SLOT_MAX` | `1`, `9` | Range of port slots |
| `HERDR_PORTS` | `DEV_SERVER_PORT:5280:VITE PLAYWRIGHT_PORT:4280:PW STORYBOOK_PORT:6080:SB` | Ports of a slot, as `NAME:BASE:MARKER` entries |
| `HERDR_REQUIRED_CHECKS` | empty | Checks `ship.sh` waits for, comma-separated, exact names |
| `HERDR_PR_ASSIGNEE` | `Yelison` | Assignee of the pull requests `ship.sh` opens |
| `HERDR_REVIEW_MODEL` | `claude-opus-5-5` | Model of the reviewers `new-review.sh` starts |
| `HERDR_INSTALL_DIR`, `HERDR_INSTALL_CMD` | `.`, `npm ci` | What `new-task.sh --install` runs, and where (relative to the worktree) |
| `HERDR_COMPOSE`, `HERDR_COMPOSE_FILE` | `0`, `docker-compose.yml` | Docker Compose per task; off by default |
| `HERDR_MAX_LOAD` | 1.5 × cores | Load-average limit (below) |
| `HERDR_POLL_SECONDS`, `HERDR_SHIP_TIMEOUT_SECONDS` | `20`, `1800` | Polling interval and each wait of `ship.sh` |

A malformed `HERDR_PORTS` stops every script before anything is created. The footer of the briefs
(`scripts/herdr/brief-footer.md`) uses the `__VITE__`, `__PW__` and `__SB__` markers: a project that renames or drops a
port updates the footer in the same change, and `fill-brief.sh` fails until it does.

## Layout on disk

```
~/forma-ui-herdr/                 # HERDR_TASKS_ROOT; nothing in here is versioned
  worktrees/<task-id>/            # the Git worktree of each task
  tasks/<task-id>/task.json       # branch, base commit, Herdr ids, slot, ports, agent, model and effort
  tasks/<task-id>/*.md            # the brief the agent follows and the files it hands back
  logs/<task-id>/                 # command output a task wants to keep (the install log, for one)
```

The worktree also receives a `.env.herdr` (ignored through `.env.*`) with the task's variables and ports.
`scripts/herdr/env.herdr.example` shows the file. The scripts write nowhere else: the tasks root, the repository
(`.git`, for the worktree and the shared exclude file) and the task's worktree.

## Port slots

Slot `n` uses `base + n` for every configured port, so no two active tasks share a port, and a task and its review
get different slots.

| Variable | Port | Used by |
| --- | --- | --- |
| `DEV_SERVER_PORT` | 5280 + n | the documentation site's dev server (Vite) |
| `PLAYWRIGHT_PORT` | 4280 + n | the preview server Playwright starts |
| `STORYBOOK_PORT` | 6080 + n | Storybook |

There is no API, database or identity-provider port. The main checkout keeps its tools' own defaults.

**Next to Resolve.** Forma UI and Resolve may run on the same machine. Resolve's slot `n` uses Vite 5180 + n,
Playwright 4180 + n, API 8080 + n, PostgreSQL 5440 + n and Keycloak 8180 + n. The two ranges never overlap:

| Port | Forma UI slot 1-9 | Resolve slot 1-9 |
| --- | --- | --- |
| dev server | 5281-5289 | 5181-5189 |
| Playwright | 4281-4289 | 4181-4189 |
| Storybook | 6081-6089 | not used |
| API, PostgreSQL, Keycloak | not used | 8081-8089, 5441-5449, 8181-8189 |

Tasks from both projects can use their own slot 1 at once. `new-task.sh` still refuses a slot whose ports are
listening, whoever owns them.

## Machine load limit

`new-task.sh` and `start-agent.sh` (and so `new-review.sh`) refuse to start while the 1-minute load average
(`/proc/loadavg`) is above `HERDR_MAX_LOAD`, by default `1.5 × nproc --all` (`nproc --all`, because plain `nproc`
obeys `OMP_NUM_THREADS`). The message says the load and the limit. A new session on a saturated machine only makes
everybody's tests flaky: wait for the other runs to finish, or pass `--ignore-load` once you have decided that this
one cannot wait. `HERDR_MAX_LOAD` must be a number (it can be fractional). `set-effort.sh --restart` checks the load
*before* it exits the agent; `new-review.sh --round` only checks it when it has to start a reviewer again.

## Task cycle

1. **Create the task.**

   ```sh
   scripts/herdr/new-task.sh --id h1-button-docs --branch feat/button-docs --base main \
     --model claude-sonnet-5-5 --advisor claude-opus-5-5 \
     --effort medium --effort-reason "Prescribed pattern, bounded change, tests defined up front" [--install]
   ```

   It refuses to continue if the branch, the path, the task id or the slot already exist, or if a port of the slot is
   already listening. Otherwise it runs `herdr worktree create` (which opens the workspace), checks that the checkout is
   on the expected branch and commit, writes `.env.herdr` and `tasks/<id>/task.json`, and prints the record.
   `--install` runs `HERDR_INSTALL_CMD` in `HERDR_INSTALL_DIR` once the worktree exists; it is skipped, with a note,
   when that directory has no `package.json` (the repository has none yet). `--slot N` picks the slot, `--label` names
   the workspace (default `forma-ui · <id>`), `--ignore-load` starts despite the load limit.

2. **Write the brief.** A new Claude Code session knows nothing else, so the brief is complete: identifier and goal;
   branch, absolute worktree path and base commit (the agent checks all three before editing); the files it may change
   and the ones it must not touch; dependencies; acceptance criteria and the exact verification commands in a
   `## Comandos` block; and what to report instead of working around it. Write only the task-specific part in a staging
   file, with these markers wherever the task's own values go:

   | Marker | Value |
   | --- | --- |
   | `__WT__` | the task's worktree |
   | `__BASE__`, `__BASEFULL__` | the base commit, 7 and 40 characters |
   | `__SL__` | the slot |
   | `__VITE__`, `__PW__`, `__SB__` | the slot's ports (the `MARKER` of each `HERDR_PORTS` entry) |
   | `__LANE__`, `__LANE_NAME__` | the lane; it ends up in `ENTREGA <lane>: LISTA` |
   | `__DELIVERY__` | the path of the delivery file |

3. **Add the common footer.**

   ```sh
   scripts/herdr/fill-brief.sh h1-button-docs C staging/brief-h1-button-docs.md
   ```

   It appends `scripts/herdr/brief-footer.md` (commits, machine usage, dangerous commands, language rules, the
   self-check of `AGENTS.md`, the delivery format and what to report), fills the markers from `task.json`, writes
   `tasks/<id>/brief.md` and fails, without touching an existing brief, if any `__MARKER__` is left or the result lacks
   the `Sin push ni PR` rule or `ENTREGA <lane>: LISTA`. Text that merely looks like a marker makes it stop: reword it.
   Temporary files stay in the task's directory. The footer and the delivery template are written in Spanish, like the
   briefs; the repository, its code and its commits are in English.

4. **Start the agent.**

   ```sh
   scripts/herdr/start-agent.sh --id h1-button-docs --name h1-button --brief ~/forma-ui-herdr/tasks/h1-button-docs/brief.md
   ```

   It verifies that the pane exists, that no agent runs there and that the name is free, runs
   `herdr agent start <name> --kind claude --pane <pane>`, reads the model and effort from the session header and
   records them in `task.json`. On a checkout Claude Code has never opened, the first thing it shows is the
   **folder-trust dialog**: Herdr reports the agent as `blocked`, the script prints the screen and stops without sending
   the brief. Answer it yourself (`herdr agent send-keys <name> enter`) and send the prompt by hand. Never pass a
   permission-bypass flag.

5. **Wait for the delivery.** The agent writes `tasks/<id>/delivery.md` (template: `scripts/herdr/delivery.template.md`)
   and ends it with `ENTREGA <lane>: LISTA` or `BLOQUEO <lane>: <reason>`. An idle agent is not acceptance evidence:
   read the delivery, the diff and the tests.

6. **Review.** See [Independent review](#independent-review).

7. **Ship.** See [Ship a task](#ship-a-task-with-shipsh). It also retires the task and its review.

## Model and reasoning effort

The coordinator chooses the model and the effort of each agent **before** it hands the agent a task, and checks that
they were applied.

| Role | Model | Advisor |
| --- | --- | --- |
| Implementer | Sonnet 5.5, `--model claude-sonnet-5-5` | Opus 5.5, `--advisor claude-opus-5-5` |
| Reviewer | Opus 5.5, `HERDR_REVIEW_MODEL` | none (`--advisor none`, which `new-review.sh` always passes) |

Without `--model` and `--advisor`, `new-task.sh` leaves the owner's own defaults in place, so pass them for
implementers. `new-review.sh` fixes the reviewer's model with `HERDR_REVIEW_MODEL` (default `claude-opus-5-5`; empty
leaves the owner's default) and always passes `--advisor none`, so `start-agent.sh` records and shows the model of the
session header. Full model IDs are used instead of aliases so an update cannot move them. An advisor must rank at or above
the main model. A review is already a second opinion, and every advisor call re-reads the whole conversation, which is
why reviewers run without one.

**Mechanism.** One file per task: `.claude/settings.local.json` in the worktree, with a `modelSettings` entry for
`claude-sonnet-5-5`, `claude-opus-5-5` and `claude-fable-5-1` carrying `effortLevel` and `maxEffortLevel`, plus `model`
and `advisorModel`. `new-task.sh --effort <level> [--max-effort <level>] --effort-reason "…"` writes it, and the scripts
add `/.claude/settings.local.json` to the shared `.git/info/exclude` so no worktree can commit it. It survives Herdr
restarts and lets an agent be adjusted later.

**Never send `/effort <level>` to an agent.** In an interactive session it saves the level as the owner's default in
`~/.claude/settings.json`, which changes every other session. Do not choose a row in `/advisor` either.

**Verification.** `start-agent.sh` reads the session header (`Sonnet 5.5 with medium effort`) and records it under
`effort.verified`; `status.sh` shows `level/max` and a ✓ once verified. If the header disagrees, the file is not being
read: do not hand over the task until it does. Do not trust what an agent says about its own effort.

| Level | Typical task |
| --- | --- |
| `low` | Mechanical changes, copy, simple adjustments following a proven pattern |
| `medium` (default) | Usual components, documentation, tests with clear requirements |
| `high` | Cross-module changes, contracts, shell tooling that merges or deletes, diagnosing failures |
| `xhigh` | Especially hard problems with real uncertainty |

`max` is not used: settings files cannot hold it. Agents do not change their own level: when an escalation condition
appears they stop at a safe point. Then, with the agent idle:

```sh
scripts/herdr/set-effort.sh --id <id> --level high --reason "flaky race test without a clear cause" --restart
```

It refuses while the agent is `working` or `blocked`, rewrites the file, appends to `effort.history`, exits the agent,
resumes the same conversation with `claude --continue` and verifies the header again.

## Independent review

A review runs in its own Claude Code session, never as a subagent of the coordinator (subagents inherit its effort,
model and advisor).

```sh
scripts/herdr/new-review.sh --task <id> [--effort high|medium] [--points points.md] [--name rev-<id>] [--lane X] [--slot N]
```

It creates `review-<id>` with `new-task.sh --base <HEAD of the task> --advisor none --install` (branch
`review/<id>-<sha7>`), fills `review-brief.template.md`, appends the `--points` file under "Extra points from the
coordinator" and starts the reviewer. The brief takes from the implementer's `brief.md` the title (its first `# `
heading), the plan reference (its `- Id:` line), the lane (the one in `ENTREGA <lane>: LISTA`, unless `--lane`) and the
commands: the first code block under `## Comandos`, after a line that spells out the **review's** slot and ports (and
its Compose project, when Compose is on), because auto mode may refuse to read `.env.herdr`. The block was filled with
the implementer's slot, so every port of it, and the Compose project, are rewritten to the review's, and the script
stops if any of the implementer's values survives: a review must never run against another task's servers. Without
the block it falls back to `git log` and `git diff --stat`.

The reviewed commit is what the task's branch points at, its base is the task's `base_sha`, and the report goes to
`tasks/review-<id>/review.md`. Marker-shaped text (`{{NAME}}`) in the title, the plan reference or the points file is
refused before anything is created. The review id must be a valid task id, so the task id has at most 33 characters.

**Next rounds.** The implementer does not touch the reviewed commit while the review runs; fixes go on new commits.
For the next round run `new-review.sh --task <id> --round N [--points …]`, with N greater than the review's current
round. It refuses while the reviewer is `working` or `blocked`, while the review worktree has changes, or if the task
did not move. It moves the review worktree to the task's new `HEAD` (`git merge --ff-only`, or, if the history was
rewritten, a new branch `review/<id>-<sha7>` and a `git range-diff` hint), writes `brief-ronda-N.md` and sends it to the
reviewer, which is started again with `--continue` if it had exited. When every finding is low, the reviewer also
writes `fixes-proposal.md` for the coordinator to approve or annotate.

## Follow progress

```sh
scripts/herdr/status.sh                       # tasks, workspaces, agent states, commits and dirty files
herdr agent list                              # every live agent with its pane and state
herdr agent read <name> --source recent-unwrapped --lines 120
herdr agent wait <name> --timeout 600000      # returns at the next idle, done or blocked
```

`working` means busy; `blocked` means it waits for an answer; `idle` and `done` mean it is ready for input, which says
nothing about whether the work is correct; `unknown` means Herdr could not classify the screen. If `herdr agent prompt`
times out or reports `agent_prompt_stalled`, the text may still have been delivered: read the agent before sending it
again. A blocked agent is answered in its chat (`herdr agent prompt <name> "…"`) or, for a permission prompt, with
`herdr agent send-keys` after reading what it wants to run. Do not enable bypass modes.

## Ship a task with `ship.sh`

```sh
scripts/herdr/ship.sh --task <id> --title "feat(scope): summary" --body ~/forma-ui-herdr/tasks/<id>/pr-body.md [--no-cleanup]
```

In order, stopping at the first problem and saying what it did and did not do:

1. The task worktree and the main checkout are clean, the main checkout is on `main`, and the branch **contains
   `origin/main`** (after `git fetch origin main`); otherwise it stops before pushing and tells you to rebase.
2. **Push.** A new branch is pushed with `-u`; a branch already on origin at the same commit is left alone; a
   fast-forward is a normal push. If the remote tip diverged because the branch was rebased, it pushes with
   `--force-with-lease=refs/heads/<branch>:<remote sha>`, **only if** that remote commit is in the local branch's
   reflog (it was this branch's own tip). It never pushes without a lease, and it stops when the remote tip was never on
   this branch (someone else's work), is ahead of the local branch, or shares no history with it.
3. **Pull request.** Opens one against `main` (assigned to `HERDR_PR_ASSIGNEE` when it is not empty) or reuses the open
   one for the branch, whose title and description it leaves alone.
4. It waits until the PR shows the pushed commit as its head (`headRefOid`), so the checks of the previous head are never
   counted.
5. **Checks and merge.** Both paths pin the merge to the pushed commit with `--match-head-commit`, and the script never
   merges locally.
   - **With `HERDR_REQUIRED_CHECKS`** it polls `gh pr checks --json` until **every** listed check passes (the most recent
     run of each; a rerun still in the queue counts as the newest, so it waits for it). A check that fails, is cancelled
     or skipped stops it **without merging**, whatever the others say; a check that never shows up makes it give up after
     `HERDR_SHIP_TIMEOUT_SECONDS`. Then it runs `gh pr merge --auto --rebase --match-head-commit <sha>` and waits for the
     merge.
   - **With the list empty** (the repository has no CI yet) it reads no checks and runs
     `gh pr merge --rebase --match-head-commit <sha>` at once, **without `--auto`**: GitHub rejects auto-merge when no
     check is required.
6. It runs `git fetch origin main && git merge --ff-only origin/main` in the main checkout and prints `merged <sha>`.
7. Unless `--no-cleanup`: sends `/exit` to the agents of the task and of `review-<id>` (an agent that is `working` or
   `blocked` is not sent anything: the script says so, after the merge, and stops) and runs
   `remove-task.sh --id <id> --volumes` for each, the review first. It never passes `--force-leftovers`. The branches are
   kept (a rebase merge leaves `git branch -d` unable to see them as merged).

## Retire a worktree

```sh
scripts/herdr/remove-task.sh --id <id>                                  # keeps the branch
scripts/herdr/remove-task.sh --id <id> --delete-branch --volumes
scripts/herdr/remove-task.sh --id <id> --force-leftovers                # only after reading what it listed
```

Before anything else the script lists **leftovers**: processes listening on the slot's ports (PID, command line and
working directory; a listener whose PID `ss` cannot show is listed as such, never taken for a free port) and, when
Compose is on, containers of the task's project in any state. If there are any it stops and removes nothing, and never
kills a process itself: stop them yourself, or rerun with `--force-leftovers`. Then, **only when `HERDR_COMPOSE=1`**, it
stops the task's Compose project (`--volumes` also removes its volumes, even when no container is left); with Compose
off it never calls `docker`, and `--volumes` does nothing. It runs `herdr worktree remove` (which also closes the
workspace) and marks the task as removed. It refuses while the checkout has uncommitted changes or a live agent, warns
about commits that are not pushed, and only deletes the branch when `git branch -d` agrees that it is merged. Logs stay
in `logs/<id>/`.

## Docker Compose

Off by default: the repository has nothing to compose. With `HERDR_COMPOSE=1`, each task records the Compose project
`<HERDR_PROJECT_ID>-<task id>`, `.env.herdr` gains `COMPOSE_PROJECT_NAME`, reviews rewrite the project in the commands
they run, and `remove-task.sh` checks and stops it (compose file: `HERDR_COMPOSE_FILE`, in the worktree or, failing
that, the main checkout). Nothing else is written to `.env.herdr`: no database, API or identity-provider variables.

## Recover after a failure

| Situation | What to do |
| --- | --- |
| The agent exited or crashed | `scripts/herdr/start-agent.sh --id <id> --name <name> --continue` starts it again in the same pane and resumes its last conversation; drop `--continue` for a fresh one. Files and commits stay, and so does the effort file. |
| The Herdr server restarted | Workspaces come back from Herdr's saved session and Claude Code panes are resumed. Check with `scripts/herdr/status.sh`; if a pane id changed, update `tasks/<id>/task.json`. |
| The workspace was closed but the worktree exists | `herdr worktree open --cwd <repo> --path ~/forma-ui-herdr/worktrees/<id> --no-focus`, then put the new ids in `task.json`. |
| `task.json` is missing | Recreate it from `git worktree list`, `herdr worktree list` and `.env.herdr`; the scripts only need those fields. |
| A prompt timed out | Read the agent (`herdr agent read`) before deciding whether to resend. |
| Ports are busy | `ss -ltnp` shows the owner; pick another slot rather than killing processes you do not own. |

Detaching the client keeps every pane and agent running; stopping the Herdr server or rebooting ends every process
(worktrees, branches and the files under the tasks root survive).

## Tests of the scripts

```sh
scripts/herdr/tests/run.sh [task|brief|review|ship|remove|load …]
```

Runs the scenarios in disposable environments: a temporary git repository with a local bare remote, a
`HERDR_TASKS_ROOT` of its own, and **fake** `herdr`, `gh`, `docker` and `npm` first in `PATH` (`tests/bin/`), so it
never reaches GitHub, a real Herdr, a Docker daemon or a real tasks root. `lib.sh` refuses to run if a tool is not the
fake or the tasks root is outside the temporary directory, ignores any `HERDR_*` setting of your shell, and picks slots
whose configured ports are free on the machine (a few tests start one real listener on a free port and kill it by PID).
It needs `jq`, `git`, `ss` and `python3`, runs one copy at a time, exits non-zero on any failure and prints
`ALL TESTS PASSED` otherwise. It takes a few minutes. `HERDR_TEST_KEEP=1` keeps the temporary directory;
`HERDR_SCRIPTS_SRC=<dir>` runs the tests against a modified copy of `scripts/herdr`, to check that a scenario fails
without its fix. Run it after changing anything under `scripts/herdr/`; it is not part of CI.

## Notes

- The scripts never write permission rules. To let a task's agent run Docker Compose without asking, add the rule to
  that worktree's `.claude/settings.local.json` yourself.
- `.env.herdr` holds ports only, never secrets. It keeps the `.env.*` name so the existing `.gitignore` rule covers it.
- `CLAUDE.md` is versioned, so every worktree has it; nothing local (secrets, exports, editor settings) is copied.
- Claude Code keeps its memory per directory, so an agent in a worktree does not see what was learnt elsewhere: briefs
  must be complete.
- The scripts are plain Bash on purpose. Herdr already provides workspaces, agents, prompts, waits and reads; the
  scripts only add the checks around them.
