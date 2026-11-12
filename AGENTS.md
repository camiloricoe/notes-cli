# Notes CLI

A tiny command-line notes app in TypeScript: `node src/cli.ts add <text> | list | delete <id>`.
Node runs the TypeScript directly (type stripping), so there is no build step.

## Commands
- Test: the TEST_CMD in factory.conf (vitest; must pass before any PR)
- Lint: the LINT_CMD in factory.conf (the TypeScript type check)

## Conventions
- TypeScript, strict. Relative imports end in `.ts`. Only erasable syntax (no enums, no namespaces).
- Logic lives in `src/notes.ts` as pure functions; `src/cli.ts` only parses arguments and prints.
- Every behaviour change gets a vitest test in `test/`, written BEFORE the implementation.
- Keep functions under 30 lines. package.json is protected, so nothing new can be installed.

## Factory rules
- Phase state lives in `.factory/` as markdown files. Never put plan or review text in code comments.
- Only the paths in SCOPE (factory.conf) may change. Do not touch factory.sh, lib/, gates/, .claude/, package.json or this file.

## Exact commands (copy them exactly)
- Test: `npm test --silent` (the TEST_CMD). Lint/type check: `npm run lint --silent` (the LINT_CMD).
- Run them exactly as written: no `cd`, no env vars, no pipes or `&&`, no other spelling.
  Anything else is blocked by the factory and the run is rejected.

## Review scope
- Security findings are about the diff (`git diff main`). Files the change did not touch,
  such as factory.conf, are out of scope for the review.
- Prefer the smallest change that fully meets the ticket; every gate in gates/ must pass.

