# Roadmap

Phases are ordered for the smallest possible useful slice first. Each
phase ends with Padsmith being **shippable** at the corresponding
maturity level.

## Phase 0 — Scaffolded (0.0.1)

- [x] Repo skeleton: Vite + React + TS + Tailwind v4
- [x] Lossless VDF parser + serializer with round-trip tests
- [x] Typed schema model with read-only transform
- [x] Planning docs
- [x] CI workflow stub
- [x] 42 tests passing, build green

## Phase 1 — Trust Layer (0.1.0, this milestone)

Goal: every promise the README makes is testable, gated in CI, and free
of corruption-risk bugs.

- [x] Brand: rename to **Padsmith**; warm-amber visual identity
- [x] **Data-corruption fixes**: 13-slot layout centring, fictional
      `gameActions` field removed, `controller_caps` made opaque string
- [x] Round-trip test uses real deep-equal, not `JSON.stringify`
- [x] Golden-file snapshots in `tests/vdf/golden/`
- [x] ESLint v9 + Prettier; both gated in CI before tests
- [x] CHANGELOG, CONTRIBUTING, THIRD_PARTY_NOTICES
- [x] Touch-menu preview surfaces unverified-layout warning
- [x] **Activator typed model** (`Full_Press`, `Long_Press`, `Double_Tap`,
      `Soft_Press`, `Start_Press`, `Release`, `Chord`, `analog_button`) +
      synthetic V3 fixture `tests/vdf/fixtures/v3-activators.vdf` exercising
      the `inputs.<slot>.activators.<Activator>.bindings.binding` tree
      including repeating `binding` keys
- [x] **Mutator façade** (`lib/schema/mutators.ts`) — `setBinding`,
      `removeBinding`, `setGroupSetting`, `setGroupMode`, `addGroup`,
      `removeGroup`, `setMetaField`, `renameActionSet`, `addActionSet`,
      `removeActionSet`, `setPresetGroupSourceBinding`,
      `setActivatorBinding`, `appendActivatorBinding`. AST-first via
      `immer.produceWithPatches`; typed view rebuilt on every call.
- [x] **Patch-based undo** (immer patches), capped at 5 MB resident.
      `lib/state/undo.ts` + wired through `useConfigStore`.
- [x] Property-based fuzz test via fast-check: parse → serialize →
      parse round-trip on randomly-generated grammar-valid VDF (200
      iterations × 2 invariants)
- [x] Real-world fixture corpus expansion: V3 activator sample,
      hotbar_menu, PS5 trigger effects, Unicode + `[$WIN32]` conditional,
      complex action layers with `parent_set_name`. Auto-discovered by
      `tests/vdf/fixture-corpus.test.ts` so growth is free.
- [ ] Visual snapshot tests (Playwright) — deferred until the Phase 2
      components stabilize; snapshotting stub UIs locks in stub UI.

Ship criterion: any config from SteamInputDB opens, round-trips byte-
stably through the editor, and exports a `.vdf` that Steam loads
without complaint.

## Phase 2 — Premium Editor (0.2.0)

Goal: the headline use case ships.

- [x] **Deck SVG canvas** replaces the list view of input sources;
      list survives as a "Show details" toggle for power users
- [x] **Inspector becomes a bottom sheet** on ≤1280px viewports
      (collapsed/half/full snap points, drag handle, Esc collapses)
- [ ] **Touch menu designer** with real interactions: ~~tap-to-bind~~ (done),
      long-press-to-drag, drop-to-swap, animated layout transitions
      between slot counts
- [x] **Radial menu designer** — ~~tap-to-bind~~ (done) + slot-count slider;
      rotate gesture (two-finger twist on Deck, shift+drag on desktop)
      and live position/opacity sliders still pending
- [x] **Binding picker dialog** — Keyboard / Mouse / Gamepad / System / Raw
      tabs; editable label field; uses the `binding()` builder. Icons
      bundled in Phase 3.
- [x] **Action set CRUD** (add / inline rename / remove with
      cascade-clean) wired through the mutator façade. Layer CRUD with
      explicit nested-menu wiring (auto-creates ADD_LAYER /
      REMOVE_LAYER bindings) still pending.
- [x] **Undo/redo visible** in the header with hover-tooltip showing
      what each step changed; Cmd/Ctrl+Z / Shift+Z / Y bound
- [x] **Command palette** (Cmd/Ctrl+K) — fuzzy search across action
      sets, groups, input-style changes, undo/redo/export. Built in-
      house, no fuse.js dep
- [x] **Validation strip** docked above the controller view
      (anti-pattern warnings, missing-group-ref errors, undocumented
      slot counts); click a finding to jump to its group
- [x] **Diff drawer** (Ctrl+Shift+D) — original-vs-current side-by-
      side. LCS line diff with "Changes only" / "All" toggle.

Ship criterion: the full success scenario in `architecture.md` is
performable in under 8 minutes, no docs read.

## Phase 3 — Multi-game polish (0.3.0)

Goal: comfortable to use across many configs over time.

- [x] **Library view** — recent files (IndexedDB, 100-entry cap, delete
      button per row); per-game heuristic from filename
- [x] **Templates** — 4 starter configs: Empty Deck (Neptune), FPS
      preset, Strategy/RTS, Emulation hotbar. All pass validation.
- [ ] **Import from SteamInputDB URL** (coordinated with Alia5 first —
      see THIRD_PARTY_NOTICES)
- [x] **In-app tutorial** — first-run, dismissable, 6-step overlay
- [x] **Pre-flight validation dialog** — gating the export with a
      severity-grouped findings panel

## Phase 4 — Polishing for the Deck (0.4.0)

Goal: feels like it belongs on the Deck.

- [x] Touch-target enforcement at ≤1280px viewport (since Phase 2)
- [x] **PWA install** via vite-plugin-pwa; autoUpdate + cleanupOutdatedCaches
      so hotfixes land on the next session, no stale-cache lockout
- [x] In-app settings dialog (⚙) with telemetry toggle + keyboard-shortcut
      reference; tutorial (`?` button) for newcomers
- [ ] Marketing assets: 12-second screen-cap GIF in README, hosted
      landing page on `padsmith.app`
- [x] **Opt-in telemetry**: Plausible-compatible /api/event POST; off
      by default; no file contents, no IDs, no cookies; endpoint set via
      VITE_PLAUSIBLE_DOMAIN at build time
- [ ] Sentry error reporting (deferred — needs domain & DSN before it
      can ship)

## Phase 5 — Native integration (0.5.0)

Goal: bypass Steam's file ownership.

- [ ] **Tauri shell** with direct r/w to controller_config dirs
- [ ] **Decky Loader plugin** for in-Game-Mode use on Steam Deck
- [ ] Steam process detection (warn before save if Steam is running)
- [ ] Auto-scan installed games for SIAPI action catalogs (game*actions*\*.vdf)

## Phase 6 — Community (1.0.0)

Only if there is demand.

- [ ] Optional publish-to-SteamInputDB integration
- [ ] Shareable config URLs (encode config in URL hash)

## Success criterion for v1.0

> A Steam Deck owner who plays one or two main games (e.g. an MMO and an
> FPS) opens `padsmith.app` in Desktop Mode → drops their existing
> `controller_neptune.vdf` → redesigns the 16-slot hotbar touch menu
> visually (drag bindings in, pick icons, set activation style) → exports
> the file → drops it into Steam → it works. Comes back next week with
> their other game's config and does the same thing in less time because
> the templates and shortcuts now feel familiar. **End to end under 10
> minutes per config. No terminal. No `.md` read.**
