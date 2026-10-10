# Shared agent rules

1. Inspect repository instructions, Git state and task scope before edits.
2. Preserve unrelated changes. Never force-clean or reset other work.
3. Work only in the assigned worktree and branch.
4. One owner per shared file. Coordinate token schema, exports, dependencies, lockfiles and CI.
5. Keep changes small and reviewable. Do not combine product extraction with major dependency upgrades.
6. State assumptions and distinguish implemented features from proposals.
7. Run checks appropriate to the change. Test behavior and risk, not implementation details.
8. Do not weaken tests, accessibility or branch protection to pass CI.
9. Never commit tokens, secrets, machine paths or personal agent settings.
10. Do not publish packages or merge PRs automatically.
11. Report changed behavior, commits, checks, limitations and escalation history.
12. When conflicts arise, preserve the verified consumer behavior and resolve the contract explicitly.

## Design system specifics

- Bind colors and dimensions to tokens.
- Do not use color alone to communicate state.
- Avoid speculative components and enormous variant matrices.
- Do not copy Resolve business logic into Forma UI.
- Do not build a generic DataTable before multiple consumers justify it.
- A screenshot match does not prove semantics, contrast or keyboard behavior.
- Document any visual drift introduced by proposed Figma variants.

## Parallel work

Implementers own their assigned files. Reviews check immutable commits in separate checkouts. Do not parallelize dependent token and component changes until the token schema is stable.

An idle agent is not acceptance evidence. Check files, tests and completion criteria.

## Working rules

- **Commits:** Conventional Commits in English, with a `Co-Authored-By` trailer when an assistant contributed. Pull requests are squash-merged by default (one commit on `main`, titled `<title> (#PR)`, whose body lists the series and its `Co-Authored-By` trailers), so only the tip has to pass everything. When a task asks for «fusión con rebase», every commit reaches `main` and must pass the checks of its layer on its own, verified once at the end.
- **Changesets:** every change a package user can notice carries a changeset (see `CONTRIBUTING.md`). A visual change (CSS, a token value, the markup a component renders) is at least `minor`, never `patch`: consumers merge patches automatically.
- **Formatting:** format only the files you changed, never a whole source directory.
- **Mutations to prove a test:** commit first, or back up the file, and restore from that. Never `git checkout -- <file>` over uncommitted work.
- **Shell safety:** `rm` only with literal paths or guarded variables (`"${DIR:?}"/x`). Never `pkill -f` or `pgrep -f`; stop your own processes by PID. Use only your task's ports, and free them when you finish.
- **Shared machines:** every heavy run (Playwright, Vitest in browser mode, axe, a package or site build, `pack:check`, `pack:reproducible`, `check:consumer`, a per-commit `git archive` check) runs at low priority, `nice -n 10 <command>`, in parallel with other agents. The owner can bring back the machine-wide lock for every project at once by creating `~/.herdr-heavy-serial`; while that file exists, heavy runs queue on `flock /tmp/herdr-heavy.lock`. Write each heavy command so that it honours the switch: `if [ -e ~/.herdr-heavy-serial ]; then flock /tmp/herdr-heavy.lock nice -n 10 <command>; else nice -n 10 <command>; fi`. Playwright and Vitest in browser mode run with one worker (`--workers=1` / `--maxWorkers=1`), Vitest in jsdom with `--maxWorkers=2`. Never run the full end-to-end or browser suite locally: run the specs the change can affect and list them in the delivery; CI runs the full suites on the pull request. If a test fails only under load, rerun it alone before changing code and say so.
- **History rewrites** (rebase, `--fixup` autosquash) only on your own unpublished branch, and as a command of their own.
- **Self-check before delivering:**
  - every new test fails without its change (note the mutation);
  - no layout shift when data arrives;
  - the widths 320, 390, 767, 768, 1024, 1199, 1200 and 1440 in both themes, with no horizontal scroll or clipped text;
  - focus never lands on `body`;
  - async errors and states are announced;
  - every state is covered: loading, empty, error with retry, disabled and read-only.
- **Language:** no user-facing copy hard-coded in one language.
  - The site's strings go through the i18n mechanism, with the Spanish and English entries added together.
  - Library components take their built-in strings from props or a provider, with English defaults.
  - URLs and slugs are English and never depend on the language.
  - A change that adds or edits copy updates both languages and passes the pseudo-locale check.
