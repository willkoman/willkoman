# Changelog

All notable changes to Padsmith are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versioning is
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added (Phase 3.2 + Phase 4 — tutorial, pre-flight, PWA, telemetry)

- **First-run tutorial** (`<Tutorial>` + `useTutorial()`) — 6-step overlay
  shown on first visit; "Don't show again" persists via localStorage; the
  `?` button in the header re-opens it on demand. Arrow keys + Enter
  navigate; Escape dismisses.
- **Pre-flight export dialog** (`<PreflightDialog>`) — replaces the
  bare "Export .vdf" button. Groups validation findings by severity,
  jumps to the offending group on click, gates the actual download with
  a clearly-labelled "Export anyway" when errors are present. Padsmith
  still never refuses to save.
- **PWA service worker** via vite-plugin-pwa with `registerType:
autoUpdate` + Workbox `cleanupOutdatedCaches`. Hotfixes reach existing
  users on the next session rather than weeks-stale cache. `dist/sw.js`
  - `workbox-*.js` ship in every build. Manifest declares the warm-amber
    theme color and standalone display.
- **Opt-in telemetry** (`lib/state/telemetry.ts`) — Plausible-compatible
  fetch to `/api/event`. Off by default; settings dialog has the toggle.
  Tracked events: `open file`, `open template`, `export`. No file
  contents, no IDs, no cookies. Endpoint configured via
  `VITE_PLAUSIBLE_DOMAIN` at build time; unset → all calls are no-ops.
  4 unit tests.
- **In-app settings dialog** (`<SettingsDialog>`, ⚙ button in header) —
  current contents: telemetry opt-in + keyboard-shortcut reference.

### Added (Phase 2 — action set CRUD, command palette, diff drawer)

- **Action set CRUD UI** in `<ActionSetTabs>` — add via `+ add`, rename in
  place (double-click or pencil icon), remove via ✕ (disabled on the last
  remaining set). Hover-revealed controls; Enter/Escape commit or cancel
  the rename. All edits route through `renameActionSet` / `addActionSet` /
  `removeActionSet` mutators and land in the patch undo stack.
- **`<CommandPalette>`** (Cmd/Ctrl+K) — dependency-free fuzzy palette. Builds
  commands from current store state: jump to any action set, jump to any
  group, change selected group's input style to any of the 17 catalog
  entries, undo, redo, export. Arrow keys + Enter to navigate; Escape or
  click-outside to dismiss; auto-scroll keeps cursor visible.
- **`lib/state/fuzzy.ts`** — fuzzy scorer with prefix / consecutive /
  word-boundary / CamelCase heuristics. 9 unit tests cover ranking
  invariants. No external dependency (fzf-class scoring in ~70 LOC).
- **`<DiffDrawer>`** (Cmd/Ctrl+Shift+D, also via header "Diff" button) —
  side-by-side original-vs-current text. Original is the canonical
  serialization captured at load. Line-level LCS diff with added/
  removed/unchanged tinting; "Changes only" / "All lines" toggle. The
  drawer disables when nothing's dirty; if a user has zero changes the
  drawer shows the byte-stable confirmation message. The trust promise
  made visible.
- **`lib/state/lineDiff.ts`** — LCS line diff with 1-based line numbers
  on both sides, 10k-line safety cap. 7 unit tests covering identical /
  replacement / pure insertion / pure deletion / divergence / line
  numbering.
- **`useConfigStore.originalText`** — canonical serialization captured at
  file open; null when no file loaded; reset on `reset()`.

### Added (Phase 2 visual core)

- **`<DeckSvg>`** — stylised top-down Steam Deck illustration with hit
  regions for every input source. Trackpads, sticks, dpad, ABXY, triggers,
  bumpers, back paddles, gyro, and centre buttons each mapped to their VDF
  input-source id (`button_diamond`, `left_trackpad`, `joystick`, …).
  Bound sources show their input-style label inline; selected source gets
  the accent stroke; non-group sources (bumpers, paddles, menu buttons)
  render as informational only. Keyboard-accessible (`tabIndex`,
  Enter/Space activates), scales responsively at any viewport.
- **`<ControllerView>` rewrite** — the debug list view is now a "Show
  details" toggle; the Deck SVG is the primary canvas. Clicking a region
  selects the active group bound to that source (with fallback to any
  state if no active wiring exists).
- **Interactive `<RadialMenuPreview>`** — every slot is now a click target
  opening the `BindingPicker`; slot count is a live slider (1–20) wired
  through `setGroupSetting`. Empty slots render dashed outlines; bound
  slots get the accent stroke. Slot radius scales inversely with count so
  large rings stay legible.
- **`<InspectorSurface>`** — viewport-responsive inspector container.
  Desktop (>1280px) keeps the right-rail layout; Deck (≤1280px) switches
  to a draggable bottom sheet with collapsed/half/full snap points,
  pointer-drag support, Esc-to-collapse, and chrome that disappears on
  desktop. Layout switch is driven by `useIsDeckLayout()`.
- **`useIsDeckLayout()`** — `matchMedia`-backed hook at 1280px breakpoint;
  SSR-safe (returns false on server, hydrates on client).

### Added (Phase 1 closeout + Phase 2 opening moves)

- **Real-world fixture corpus expansion** — 4 new fixtures covering corners of the format the original 3 didn't reach:
  - `hotbar-menu.vdf` — `hotbar_menu` mode sharing the `touch_menu_button_N` slot keys
  - `conditionals-unicode.vdf` — `[$WIN32]`/`[!$WIN32]` conditionals + Japanese/Russian/emoji titles, multi-language `localization` block
  - `ps5-trigger-effects.vdf` — `controller_type controller_ps5` with adaptive-trigger settings + verbatim `controller_caps` opaque value
  - `complex-action-layers.vdf` — 3 action sets + 3 action layers with `parent_set_name` references
- **`tests/vdf/fixture-corpus.test.ts`** — auto-discovers every `.vdf` in `tests/vdf/fixtures/` and runs round-trip + projection invariants on each. 7 fixtures × 6 assertions = 49 tests, growing automatically as the corpus grows.
- **`lib/schema/validation.ts`** — pure-function validation engine with error/warn/info severity tiers. Detects: duplicate group ids, preset → missing group references, unverified touch-menu layouts (7/12/13 slots), >8 radial slots on button sources, >20 radial slots, always-on radial on gyro, orphan action sets, unknown binding verbs.
- **`<ValidationStrip>`** — collapsible panel above the controller view; clicking a finding's group target jumps to that group in the inspector.
- **`<BindingPicker>`** — modal dialog with Keyboard / Mouse / Gamepad / System / Raw tabs. Uses the `binding()` builder + `serializeBinding()`, returns a finished VDF string ready to feed into the `setBinding` mutator. Includes an editable "label" field that lands on every applied binding.
- **Undo / Redo header buttons** + `Cmd/Ctrl+Z` / `Cmd/Ctrl+Shift+Z` / `Cmd/Ctrl+Y` shortcuts wired through the existing patch-based undo store. Buttons show the next undo/redo action's label on hover.
- **Interactive `TouchMenuPreview`** — every slot is now a click target that opens the `BindingPicker`. Empty slots render dashed with a `+ bind` affordance; bound slots show the label or args. The first delivered piece of the Phase 2 headline feature.

### Added (Phase 1 — mutator + undo + property tests)

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
