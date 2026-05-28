# Architecture

## One-line pitch

**Padsmith** is a Steam-Deck-friendly **visual editor for Steam Input
controller schemas** (`controller_*.vdf`), with first-class focus on
touchpad menus, action sets, and round-trippable import/export of
existing configs.

## High-level goals

1. **Open, edit, save** any `controller_*.vdf` Steam Input config (V2 or
   V3) without losing data.
2. **Touchpad menu designer** that is dramatically clearer than Steam's
   built-in UI: visual grid for touch menus, visual ring for radial
   menus, drag-to-rearrange, per-slot binding picker, icon picker,
   nested-menu visualisation.
3. **Action sets, action layers, and activators** as first-class concepts
   — visible at a glance, switchable in the editor, clearly distinguished
   from modeshifts.
4. **Works on a Steam Deck** in Desktop Mode at 1280×800, touch-first,
   large hit targets.
5. **Trust** — round-trip without data loss; never recompute opaque
   fields like `controller_caps`; surface warnings rather than block save.

## Why a web app (and not a Linux desktop app)

| Concern                       | Web app (chosen)                                                                               | Linux desktop app                                          |
| ----------------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| **Install on Steam Deck**     | Zero — open in Firefox/Chromium in Desktop Mode                                                | Flatpak install, sandbox quirks, immutable rootfs friction |
| **Cross-machine portability** | Open same URL on Deck, dev laptop, phone                                                       | One build per OS/arch                                      |
| **Touch UX**                  | First-class in modern browsers                                                                 | Toolkit-dependent (GTK/Qt touch is variable)               |
| **Updates**                   | Reload page (service worker handles cache)                                                     | Repackage + redistribute                                   |
| **Filesystem access**         | File System Access API on Chromium gives directory-level r/w; otherwise file picker / download | Direct, no permission dance                                |
| **Steam state awareness**     | Cannot read processes, cannot watch fs from sandbox                                            | Can do anything                                            |
| **Offline**                   | Works once cached (PWA)                                                                        | Always                                                     |

**Verdict:** the install/UX wins matter more than the lost native FS
integration. The web app is shippable to a Steam Deck today with no
install. For users who want deeper integration, a Phase 5 companion
(Tauri shell or Decky plugin) sits on top of the same web UI.

## Tech stack

| Layer         | Choice                                                                      | Rationale                                                                                               |
| ------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Build         | **Vite 7**                                                                  | Fast HMR, mature, simple static-site output                                                             |
| Framework     | **React 19 + TypeScript**                                                   | Universal familiarity, strong typing on the schema model                                                |
| Styling       | **Tailwind CSS v4**                                                         | Touch-friendly utilities, warm dark theme via CSS vars                                                  |
| State         | **Zustand 5**                                                               | Small, no boilerplate; patch-based undo in Phase 1                                                      |
| Routing       | **React Router 7**                                                          | Explicit routes are clearer for an editor                                                               |
| Testing       | **Vitest** + golden snapshots + (Phase 1) fast-check + (Phase 1) Playwright | Vite-native, fast                                                                                       |
| Lint / format | **ESLint v9 flat + Prettier**                                               | Gated in CI before typecheck                                                                            |
| VDF parser    | **In-house TypeScript**                                                     | No existing JS lib handles Steam KeyValues's repeating-key + comment-preservation needs round-trippably |
| Packaging     | **Static site** (Vite build)                                                | Deployable to Cloudflare Pages, GitHub Pages, or any CDN                                                |

## Architectural rule — AST is the source of truth

The 0.0.1 scaffold claimed the parser + schema layers "mutate both
views" but actually copied data out of the AST into a typed view that
had no link back. That's a silent data-loss trap as soon as any UI
mutator is written. Fixed in 0.1.0 by making the contract explicit:

> The AST stored in `SteamInputConfig.raw` is the only source of
> truth. The typed view (`groups`, `actionSets`, `presets`) is a
> read-only projection rebuilt from the AST on load. All editing must
> go through `lib/schema/mutators` — those functions write to the AST
> first, then trigger a typed-view rebuild.

This makes serialization trivially correct (`configToVdf(c) === c.raw`)
and means we never have to reconcile two diverging models. The cost is
that mutators must walk the AST to apply changes, which is more code
than naïve typed-view writes — that's the right trade.

## Module layout

```
src/
├── lib/
│   ├── vdf/            # round-trippable VDF (KeyValues) parser + serializer
│   ├── schema/         # typed Steam Input domain model + transforms ↔ VDF AST
│   │   ├── types.ts        — ConfigMeta, Group, Preset, Activator (Phase 1)
│   │   ├── inputStyles.ts  — catalog of `mode` values + UI labels
│   │   ├── bindings.ts     — binding-string grammar
│   │   ├── menuLayouts.ts  — touch/radial slot positions (with verified flags)
│   │   ├── transform.ts    — AST → typed view
│   │   └── mutators.ts     — (Phase 1) typed view → AST writes
│   ├── state/          # editor store (current config, dirty flag, patch-based undo)
│   ├── fs/             # File System Access API wrapper, fallback file I/O
│   └── steam/          # well-known paths, controller-type catalog
├── routes/             # top-level pages
├── components/         # reusable UI
└── App.tsx             # shell + router
```

## Data flow

```
.vdf file
   │  parse
   ▼
VDF AST (lossless: preserves order, duplicates, comments, conditionals)
   │  configFromVdf()
   ▼
SteamInputConfig (typed projection: actionSets[], groups[], presets[], …)
   │  read by UI
   │
UI mutation (e.g. setBinding(groupId, slot, value))
   │  routes through lib/schema/mutators
   ▼
AST mutated in place
   │  rebuild typed projection
   ▼
SteamInputConfig (updated)
   │  serialize(config.raw)
   ▼
.vdf file (textually clean, lossless)
```

## UI structure (Phase 2 target)

```
┌────────────────────────────────────────────────────────────┐
│  AppShell: file open/save, undo/redo, validation, settings │
├──────────────┬─────────────────────────────────────────────┤
│              │                                             │
│ Action set   │   Controller View (Deck SVG)                │
│ + Layer      │   Clickable input sources;                  │
│ tabs         │   each source shows its current input style │
│              │   and a tap shows the inspector             │
│              │                                             │
│              ├─────────────────────────────────────────────┤
│              │  Inspector (right rail on ≥1281px,          │
│              │  bottom sheet on Deck-sized ≤1280px):       │
│              │   ┌─ Input style picker                     │
│              │   ├─ Bindings table (or Menu Designer)      │
│              │   ├─ Settings panel                         │
│              │   └─ Validation strip                       │
└──────────────┴─────────────────────────────────────────────┘
```

The **Menu Designer** is the most opinionated UI we ship — the entire
reason this tool exists. It shows the menu visually (grid or ring), each
slot is a drop target for a binding, icons can be picked from a gallery,
and nested menus are visualised as collapsible cards. The 0.1.0 build
ships read-only previews of these; full interaction lands in Phase 2.

## Non-goals (out of scope, by design)

- Live application of configs to a running Steam process (Phase 5).
- Browsing the community config database — SteamInputDB exists; we link
  out only.
- SIAPI integration for native action discovery (would require reading
  game-side `game_actions_<appid>.vdf` files; not feasible from a
  browser sandbox).
- **Cross-config comparison or copy-paste of bindings between two open
  configs.** The tool is designed for sequential single-config editing.
- Anything that requires being signed in as a Steam user.

## Phase 5 hooks (designed for, not built)

- **Tauri shell** for direct r/w to
  `~/.local/share/Steam/userdata/<id>/241100/remote/controller_config/<appid>/`
  and similar paths. Same React UI; native filesystem replaces the FSA
  - download fallback.
- **Decky Loader plugin** for in-Game-Mode use on Steam Deck (Phase 5+).
- **PWA service worker** for offline use and reliable hotfix
  distribution (Phase 4).
