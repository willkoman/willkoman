# Architecture

## One-line pitch

A Steam-Deck-friendly **visual editor for Steam Input controller schemas** (`.vdf` files), with first-class focus on **touchpad menus**, action sets, and round-trippable import/export of existing configs.

## High-level goals

1. **Open, edit, save** any existing `controller_*.vdf` Steam Input config without losing data.
2. **Touchpad menu designer** that is dramatically clearer than Steam's built-in UI: visual grid for touch menus, visual ring for radial menus, drag-to-rearrange, per-slot binding picker, icon picker, nested-menu visualization.
3. **Action sets & action layers** as first-class concepts — visible at a glance, switchable in the editor, clearly distinguished from modeshifts.
4. **Works on a Steam Deck** in Desktop Mode at 1280x800, touch-first, large hit targets.

## Why a web app (and not a Linux desktop app)

| Concern | Web app (chosen) | Linux desktop app |
|---|---|---|
| **Install on Steam Deck** | Zero — open in Firefox/Chromium in Desktop Mode | Flatpak install, sandbox quirks, immutable rootfs friction |
| **Cross-machine portability** | Open same URL on Deck, dev laptop, phone | One build per OS/arch |
| **Touch UX** | Already first-class in modern browsers | Toolkit-dependent (GTK/Qt touch is variable) |
| **Updates** | Reload page | Repackage + redistribute |
| **Filesystem access** | File System Access API on Chromium gives directory-level r/w; otherwise file picker / download | Direct, no permission dance |
| **Steam state awareness** | Cannot read processes, cannot watch fs from sandbox | Can do anything |
| **Offline** | Works once cached (PWA) | Always |

**Verdict:** the install/UX wins matter more than the small loss of native FS integration. The web app is shippable to a Steam Deck today with no install. For users who want deeper integration, a Phase 2 companion (Tauri shell or Decky plugin) can sit on top of the same web UI.

## Tech stack

| Layer | Choice | Rationale |
|---|---|---|
| Build | **Vite 7** | Fast HMR, mature, simple static-site output |
| Framework | **React 19 + TypeScript** | Universal familiarity, strong typing on the schema model |
| Styling | **Tailwind CSS v4** | Touch-friendly utilities, dark theme out of the box, no config bloat |
| State | **Zustand** | Small, no boilerplate, fits an editor-with-undo well |
| Routing | **React Router 7** | File-based not needed; explicit routes are clearer for an editor |
| Testing | **Vitest** | Vite-native, fast, ESM-native |
| VDF parser | **In-house TypeScript** | No existing JS lib handles Steam KeyValues quirks (duplicate keys, ordered output, conditionals) round-trippably |
| Packaging | **Static site** (Vite build) | Deployable to GitHub Pages, Netlify, or just `python -m http.server` |

## Module layout

```
src/
├── lib/
│   ├── vdf/            # round-trippable VDF (KeyValues) parser + serializer
│   ├── schema/         # typed Steam Input domain model + transforms ↔ VDF AST
│   ├── state/          # editor store (current config, dirty flag, undo stack)
│   ├── fs/             # File System Access API wrapper, fallback file I/O
│   └── steam/          # well-known paths, controller-type catalog, input source catalog
├── routes/             # top-level pages
├── components/         # reusable UI (binding picker, menu designer, etc.)
└── App.tsx             # shell + router
```

The two-layer model — **lossless VDF AST** + **opinionated typed Schema** — is the central design decision. See `steam-input-schema.md`.

## Data flow

```
.vdf file
   │  parse
   ▼
VDF AST (lossless: preserves order, duplicates, comments)
   │  schema.fromVdf()
   ▼
SteamInputConfig (typed: actionSets[], groups[], presets[], …)
   │  edit in UI via Zustand store
   ▼
SteamInputConfig (mutated)
   │  schema.toVdf()
   ▼
VDF AST (preserves untouched nodes)
   │  serialize
   ▼
.vdf file (textually clean, round-tripped)
```

The "preserves untouched nodes" property is critical: Steam Input has many half-documented fields. If we drop anything we don't recognize, exported configs become lossy and unsafe. The schema layer **annotates** the AST rather than rebuilding it from scratch.

## UI structure

```
┌────────────────────────────────────────────────────────────┐
│  AppShell: file open/save, undo/redo, settings             │
├──────────────┬─────────────────────────────────────────────┤
│              │                                             │
│ Action Set   │         Controller View                     │
│ Tabs         │   (clickable input sources: trackpads,      │
│              │    sticks, buttons, triggers, gyro)         │
│ + Layers     │                                             │
│              ├─────────────────────────────────────────────┤
│              │  Selected Group/Input editor:               │
│              │   ┌─ Input style picker (dpad/touch_menu/   │
│              │   │   radial_menu/joystick_move/…)          │
│              │   ├─ Bindings table                         │
│              │   ├─ Settings panel                         │
│              │   └─ (if touch/radial) Menu Designer        │
└──────────────┴─────────────────────────────────────────────┘
```

The **Menu Designer** is the most opinionated UI we ship — it is the entire reason this tool exists. It shows the menu visually (grid or ring), each slot is a drop target for a binding, icons can be picked from a gallery, and nested menus are visualised as collapsible cards.

## Non-goals (explicitly out of scope for MVP)

- Live application of configs to a running Steam process. Steam owns `controller_config/` while running and will overwrite changes. The user exports a `.vdf` and the editor tells them where to drop it.
- Browsing the community config database. SteamInputDB already exists; we link out.
- SteamInput API (SIAPI) integration for native action discovery — the IGA file flow is dev-side, not user-side.
- Anything that requires being signed in as a Steam user.

## Phase 2 hooks (designed for, not built)

- **Tauri wrapper** for direct r/w to `~/.local/share/Steam/userdata/<id>/241100/remote/controller_config/<appid>/` and `~/.local/share/Steam/steamapps/common/Steam Controller Configs/<id>/config/<appid>/`.
- **Decky Loader plugin** for in-Game-Mode use on Steam Deck.
- **VDF binary (`vdf3`/protobuf) variant** if Valve ships it for newer features.
