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
- [ ] Real-world fixture corpus: Portal 2 (V3 + activators +
      `controller_caps`), Dolphin GameCube (V3 activators), PS5 trigger
      effects, Steam Deck default Neptune template, hotbar menu sample,
      Unicode + conditional `[$WIN32]` test case
- [ ] Visual snapshot tests (Playwright) for `TouchMenuPreview`,
      `RadialMenuPreview`, and the Deck SVG canvas

Ship criterion: any config from SteamInputDB opens, round-trips byte-
stably through the editor, and exports a `.vdf` that Steam loads
without complaint.

## Phase 2 — Premium Editor (0.2.0)

Goal: the headline use case ships.

- [ ] **Deck SVG canvas** replaces the list view of input sources
- [ ] **Inspector becomes a bottom sheet** on ≤1280px viewports (drag
      handle, snap points), stays as right rail on desktop
- [ ] **Touch menu designer** with real interactions: tap-to-bind, long-
      press-to-drag, drop-to-swap, animated layout transitions between slot
      counts
- [ ] **Radial menu designer** with rotate gesture (two-finger twist on
      Deck, shift+drag on desktop), live position/opacity sliders
- [ ] **Binding picker dialog** — keyboard / mouse / gamepad / system /
      SIAPI tabs; common icons bundled for live preview
- [ ] **Action set + action layer CRUD** with explicit nested-menu
      wiring (auto-creates ADD_LAYER / REMOVE_LAYER bindings)
- [ ] **Undo/redo visible** in the header with hover-tooltip showing
      what each step changed
- [ ] **Command palette** (Cmd/Ctrl+K) for fast jump-to-action-set, jump
      -to-group, change-input-style
- [ ] **Validation strip** docked above the inspector (anti-pattern
      warnings, missing-group-ref warnings, undocumented slot counts)
- [ ] **Diff drawer** (left: original VDF text, right: current, scrolled
      together) — the trust promise made visible

Ship criterion: the full success scenario in `architecture.md` is
performable in under 8 minutes, no docs read.

## Phase 3 — Multi-game polish (0.3.0)

Goal: comfortable to use across many configs over time.

- [ ] **Library view** — recent files, per-game grouping (auto from
      `creator` + `title` + heuristics on filename)
- [ ] **Templates** — start from "Empty Deck (Neptune)", "FPS preset",
      "Strategy/RTS preset", "Emulation hotbar preset"
- [ ] **Import from SteamInputDB URL** (coordinated with Alia5 first —
      see THIRD_PARTY_NOTICES)
- [ ] **In-app tutorial** — first-run, dismissable, walks through opening
      the Deck default config and editing a touch menu slot
- [ ] **Validation report** — a "Pre-flight" panel before export listing
      every warning with one-click fixes

## Phase 4 — Polishing for the Deck (0.4.0)

Goal: feels like it belongs on the Deck.

- [ ] Touch-target audit pass (everything ≥ 44px on Deck viewport)
- [ ] **PWA install** with a service worker that respects hotfix releases
      (no stale-cache lockout)
- [ ] In-app help: opt-out telemetry toggle, file location guide per OS,
      keyboard shortcut overlay (press `?`)
- [ ] Marketing assets: 12-second screen-cap GIF in README, hosted
      landing page on `padsmith.app`
- [ ] **Opt-in telemetry**: Plausible (cookieless page-views) + Sentry
      (errors only; `beforeSend` scrubs every file path and config content)

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
