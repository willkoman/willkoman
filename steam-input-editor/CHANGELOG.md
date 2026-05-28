# Changelog

All notable changes to Padsmith are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versioning is
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Pending Phase 1 (Trust Layer)

- Activator typed model (`Full_Press` / `Long_Press` / `Double_Tap` / …) and a real-world V3 fixture exercising it
- Patch-based undo via `immer` patches; cap at 5 MB total, not entry count
- Mutator façade (`lib/schema/mutators.ts`) that writes to the AST first
- Real-world fixture corpus from SteamInputDB (Portal 2, Dolphin GameCube, PS5, Deck default Neptune template, hotbar sample, conditionals + Unicode case)
- Property-based fuzz tests via `fast-check`
- Visual snapshot tests for `TouchMenuPreview`, `RadialMenuPreview`, `ControllerView`

## [0.1.0] — 2026-05-28

Renamed from `steam-input-editor` to **Padsmith**. Trust-layer corrections from
the multi-role specialist audit landed; see commit message for the full panel
of findings.

### Added

- ESLint v9 flat config + Prettier; `npm run lint` and `npm run format:check` now real and gated in CI
- Golden-file snapshot tests under `tests/vdf/golden/` — the canary for serializer drift
- `isVerifiedTouchMenuLayout()` and a UI warning surface for unverified layouts
- `ActivatorName` type documenting the V3 activator enum (typed editing comes in 1.0)
- `RADIAL_MENU_BUTTON_SOURCE_MAX = 8` constant for the documented anti-pattern warning
- `THIRD_PARTY_NOTICES.md`, `CONTRIBUTING.md`, `CHANGELOG.md`
- Warm-amber visual identity (`#e8a341` on `#0c0a08` near-black) replacing the generic blue

### Changed

- **Brand**: `steam-input-editor` → `Padsmith`. Header, page title, README, docs, package name all updated
- `ConfigMeta.controllerCaps` is now an opaque `string`, not `number`. Bit semantics are not publicly documented; wrong caps silently hides configs from Steam's picker. Round-trip verbatim only.
- Round-trip test replaced `JSON.stringify` equality with proper deep-equal (`toEqual`)
- CI now runs `lint` + `format:check` before `typecheck` + `test` + `build`; uploads the build artifact on PRs

### Fixed

- **Touch-menu 13-slot layout was wrong** — the 13th button is centred, not a 5th in the bottom row. Domain audit flagged it as a corruption-risk: shipping the wrong layout would mis-target user bindings in-game.
- **`Group.gameActions` field was fictional** — there is no `gameactions` sub-block inside `controller_mappings` groups. The IGA file (`game_actions_<appid>.vdf`) is a separate format. Field removed.

### Removed

- The "cross-config compare / copy / diff" idea from the v1.0 scope (per user clarification — the tool supports editing many games' configs over time, but does not compare or copy between them)

## [0.0.1] — initial scaffold

- Lossless VDF parser + serializer with round-trip tests (GTAV v2, touch-menu v3, minimal fixtures)
- Typed schema view over the AST
- React + Vite + Tailwind v4 SPA skeleton
- Planning docs: architecture, schema, touchpad menus, limitations, forks-in-the-road, roadmap
- 42 tests passing, build green

[Unreleased]: https://github.com/willkoman/padsmith/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/willkoman/padsmith/releases/tag/v0.1.0
