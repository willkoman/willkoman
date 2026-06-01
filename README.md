# Padsmith

A **craft tool for Steam Input controller schemas** — a visual editor for
`controller_*.vdf` files, designed touch-first for the Steam Deck. Built
because Steam's built-in configurator buries the things that matter
(touchpad menus, action sets, activators) under several layers of nested
lists.

> **Status:** v1.0 ship candidate. The editor is feature-complete —
> Deck SVG canvas, bottom-sheet inspector, interactive touch + radial
> menu designers, binding picker, action set CRUD, command palette,
> diff drawer, validation engine with pre-flight gate, first-run
> tutorial, library view with IndexedDB recent files + 4 starter
> templates, PWA install with auto-update, opt-in telemetry. 181 tests
> passing. ~100 KB gzipped.
>
> The project currently lives under `willkoman/willkoman/steam-input-editor/`
> on a feature branch; it will be extracted to its own repo at
> `willkoman/padsmith` before public launch.

## Headline features

- **Touch + radial menu designers** — the things Steam's built-in UI
  surfaces as vertical lists of "Menu Button N" become an actual grid
  and an actual ring. Click to bind, drag to swap, slider to resize.
- **Lossless round-trip** — your file goes in, your file comes out, only
  the bits you changed are different. Golden-file snapshots in CI catch
  any serializer drift. Diff drawer (`Ctrl+Shift+D`) makes the change
  list visible.
- **AST-first edits + patch-based undo** — every mutation is invertible.
  200 edits = ~1 MB resident, not 200.
- **Validation that respects you** — warnings, never blocks. Documented
  anti-patterns surface as findings; pre-flight dialog gates export with
  a clear "Export anyway" when errors present.
- **Steam Deck-first ergonomics** — viewport switches the inspector to a
  draggable bottom sheet at ≤1280px; touch targets enforced ≥44px;
  warm-amber palette + paper-grain background; visual identity tuned for
  the Deck's IPS panel.
- **First-run tutorial + library + templates** — newcomers have a path,
  power users have `Cmd+K` and keyboard shortcuts.

## Keyboard shortcuts

|                               |                                 |
| ----------------------------- | ------------------------------- |
| `Cmd/Ctrl+Z`                  | Undo                            |
| `Cmd/Ctrl+Shift+Z` / `Ctrl+Y` | Redo                            |
| `Cmd/Ctrl+K`                  | Command palette                 |
| `Cmd/Ctrl+Shift+D`            | Diff drawer                     |
| `?` (header button)           | Tutorial                        |
| `⚙` (header button)           | Settings (telemetry, shortcuts) |
| `Esc`                         | Close any dialog                |

## What it does

- **Opens** any `controller_*.vdf` (V2 legacy or V3 modern Deck)
- **Round-trips** without data loss — unknown fields preserved verbatim;
  golden-file snapshots in CI catch any serializer drift
- **Visualises** action sets, action layers, groups, and presets
- **Designs touch menus and radial menus** as actual grids and rings, with
  warnings on unverified layouts and documented anti-patterns
- **Exports** a `.vdf` you can drop back into Steam

## What it explicitly doesn't do

- Hot-apply configs to a running Steam — Steam owns the files while running.
  Workflow: close Steam, save the file, re-open Steam. (Native r/w arrives
  in Phase 5 via a Tauri shell / Decky plugin.)
- Compare or copy bindings between two open configs — out of scope.
- Browse community configs — [SteamInputDB](https://www.steaminputdb.com/)
  already does that. We link out.

## Get started

```bash
cd steam-input-editor
npm install
npm run dev          # opens http://localhost:5173
npm test             # vitest, 49 tests
npm run lint         # eslint
npm run typecheck
npm run build        # static SPA into dist/
```

Chromium recommended for File System Access API support. Firefox works
via download-fallback (Steam Deck Desktop Mode ships Firefox; install
Chrome from Discover for the directly-save flow).

## On a Steam Deck

1. Switch to **Desktop Mode** (Power → Switch to Desktop)
2. Open Firefox/Chromium
3. Visit the local dev URL or the hosted build
4. Drop your `controller_*.vdf` into the editor

## Deploying

Build target is **`willko.dev/padsmith/`** — `vite.config.ts` sets
`base: '/padsmith/'` so every asset, the PWA manifest, the service
worker, and the React Router basename all resolve under that prefix.

```bash
npm run build      # emits dist/ with /padsmith/-prefixed asset URLs
```

Then point your web server at `dist/`. Two things the server must do:

1. **SPA fallback** — any request to `/padsmith/*` that doesn't match an
   on-disk file must serve `/padsmith/index.html` so React Router can
   pick up the route. Example nginx:

   ```nginx
   location /padsmith/ {
     alias /var/www/padsmith/;
     try_files $uri $uri/ /padsmith/index.html;
   }
   ```

   Caddy equivalent:

   ```caddy
   handle_path /padsmith/* {
     root * /var/www/padsmith
     try_files {path} /index.html
     file_server
   }
   ```

2. **HTTPS** — the PWA service worker only registers over HTTPS or
   `localhost`. Without it, install + offline don't work but the
   editor itself still functions.

To deploy at a different subpath (or at the root), pass `VITE_BASE`:

```bash
VITE_BASE=/foo/ npm run build      # /foo/ subpath
VITE_BASE=/      npm run build      # root
```

`src/main.tsx` reads `import.meta.env.BASE_URL` so the router's
basename always matches the build's base.

## The Trust Layer (what shipped in 0.1.0)

The first specialist audit caught data-corruption-risk bugs in the
0.0.1 scaffold:

- The **13-slot touch-menu layout was wrong** (we placed slot 12 as a 5th
  cell in the bottom row; Steam centres it). Shipping that would mis-target
  user bindings in-game. **Fixed.**
- A **fictional `gameactions` sub-block on `Group`** was being read into the
  typed view. There is no such block — game actions are inline bindings.
  **Removed.**
- **`controller_caps` was typed as `number`**, implying we might recompute
  it. Bit semantics are not publicly documented; wrong caps silently hides
  configs from Steam's picker. **Now opaque `string`, round-tripped only.**
- The **round-trip test used `JSON.stringify` equality**, which silently
  agrees on differences VDF semantics actually depend on. **Replaced with
  deep-equal plus golden-file snapshots.**
- **No ESLint config** — the `lint` script in `package.json` would have
  failed. **Added flat config, gated in CI.**

See [`CHANGELOG.md`](CHANGELOG.md) for the full 0.1.0 delta.

## Docs

- [`docs/architecture.md`](docs/architecture.md) — what we built and why; the
  AST-as-source-of-truth rule
- [`docs/steam-input-schema.md`](docs/steam-input-schema.md) — VDF schema
  reference, V2 + V3, with the corrections from the domain audit
- [`docs/touchpad-menus.md`](docs/touchpad-menus.md) — the headline feature,
  in detail
- [`docs/limitations.md`](docs/limitations.md) — honest list of what's not
  feasible (with mitigations where possible)
- [`docs/forks-in-the-road.md`](docs/forks-in-the-road.md) — design
  decisions with rejected alternatives
- [`docs/roadmap.md`](docs/roadmap.md) — phased plan
- [`docs/references.md`](docs/references.md) — all sources, with what we
  used each for
- [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) — community
  acknowledgements
- [`CONTRIBUTING.md`](CONTRIBUTING.md) — the bug-protection rules

## License

MIT (see [`LICENSE`](LICENSE)).
