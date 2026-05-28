# Contributing to Padsmith

Welcome. This is a tool that takes user files in and emits user files out —
the bar for correctness is high. Please read the bug-protection rules below
before opening a PR.

## Quick start

```bash
git clone https://github.com/willkoman/padsmith.git    # once extracted
cd padsmith
npm install
npm test           # 49 tests should pass
npm run dev        # opens http://localhost:5173
```

You'll also need `npm run lint`, `npm run format:check`, and `npm run typecheck`
to pass before pushing.

## The bug-protection rules

1. **Never break round-trip.** Every PR that touches the parser, serializer,
   schema, or mutators must keep the round-trip and golden-file tests green.
   If your change intentionally alters serializer output (e.g. better
   quoting), refresh the goldens with `npm run test:update-golden`, eyeball
   the diff, and explain it in the PR.
2. **Never silently drop unknown fields.** Padsmith's promise is lossless
   round-trip — anything we don't understand passes through unchanged. If
   you find yourself dropping a field, you're doing something wrong; raise
   it for discussion.
3. **Never recompute `controller_caps`.** Bit semantics are not publicly
   documented. Wrong caps silently hides configs from Steam's picker.
   Round-trip the value verbatim.
4. **Never mutate the typed view directly.** The AST in `config.raw` is the
   source of truth. Edits go through `lib/schema/mutators` (Phase 1).
5. **Never commit `*.tsbuildinfo`, `dist/`, or generated VDF files.**
   `.gitignore` covers them; the pre-commit hook should too.

## Pull request checklist

- [ ] `npm test` passes locally (all 49+ tests)
- [ ] `npm run lint` and `npm run format:check` pass
- [ ] `npm run typecheck` is clean
- [ ] `npm run build` succeeds
- [ ] If parser/serializer changed: round-trip + golden tests still pass, or goldens deliberately refreshed and explained
- [ ] If schema added: added a test fixture demonstrating the new shape
- [ ] CHANGELOG.md updated under `## [Unreleased]`
- [ ] No `console.log` left behind (lint catches `console.log` but allows `console.warn` / `console.error`)

## Discussing big changes first

Open an issue before:

- Adding a runtime dependency
- Changing the visual identity, palette, or typography
- Changing what's exported from `lib/`
- Editing `docs/forks-in-the-road.md` (decisions are decisions)

## Fixture donations are gold

If you have a real-world `controller_*.vdf` that exercises a corner of the
format we don't cover yet (a `[$WIN32]` conditional, a 20-action-set sim
config, an IGA file, etc.), please contribute it under
`tests/vdf/fixtures/` — strip your SteamID64 from `creator` first, and add a
short comment about where it came from.

## License

By contributing you agree your contributions are licensed under MIT, the
project's license.
