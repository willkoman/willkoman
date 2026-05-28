# Changelog

All notable changes to Padsmith are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versioning is
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added (Phase 1 continued — mutator + undo + property tests)

- **`lib/schema/mutators.ts`** — the AST-first mutator façade. Every editor edit must route through these: `setBinding`, `removeBinding`, `setGroupSetting`, `setGroupMode`, `addGroup`, `removeGroup`, `setMetaField`, `renameActionSet`, `addActionSet`, `removeActionSet`, `setPresetGroupSourceBinding`, `setActivatorBinding`, `appendActivatorBinding`. Each uses `immer.produceWithPatches` and returns the new config + forward + inverse patches.
- **`lib/state/undo.ts`** — patch-based undo history with a 5 MB resident cap (default; configurable). Replaces the previous full-clone-per-edit stack that would have hit 200 MB on long sessions.
- **`useConfigStore`** rewired to use the patch undo store. `applyMutation()`, `undo()`, `redo()`, `canUndo()`, `canRedo()` exposed.
- **`ActivatorName` type** for the V3 activator enum (`Full_Press` / `Long_Press` / `Double_Tap` / `Soft_Press` / `Start_Press` / `Release` / `Chord` / `analog_button`).
- **`tests/vdf/fixtures/v3-activators.vdf`** — synthetic V3 fixture exercising the `inputs.<slot>.activators.<Activator>.bindings.binding` tree, including the repeating `binding` key.
- **`tests/vdf/property.test.ts`** — fast-check fuzzer over grammar-valid VDF docs. Two invariants asserted across 200 random inputs each: `parse(serialize(parse(d))) ≡ parse(d)` and `serialize` is idempotent.
- **27 new tests** across mutators, undo, V3 activator parsing, property fuzzing. Total: 76 tests (was 49).

### Pending Phase 1

- Real-world fixture corpus expansion (Portal 2 V3, PS5 trigger effects, Steam Deck default Neptune template, hotbar sample, `[$WIN32]` conditionals + Unicode case)
- Visual snapshot tests (Playwright) for `TouchMenuPreview`, `RadialMenuPreview`, `ControllerView`

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
