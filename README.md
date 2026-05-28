# steam-input-editor

A **visual editor for Steam Input controller schemas** (`.vdf` files), designed to be opened on a Steam Deck in Desktop Mode and used touch-first. Built because Steam's built-in configurator is clunky, especially for touchpad menus.

> Status: **Phase 0 — scaffolded**. The parser, schema model, planning docs, and app skeleton are in place. UI is stubs. See [`docs/roadmap.md`](docs/roadmap.md).
>
> Living here under `willkoman/willkoman/steam-input-editor/` for now — designed to be extracted to its own repo once it leaves Phase 0.

## What it does

- **Open** any existing `controller_*.vdf` (v2 legacy or v3 modern) — yours or pulled from [SteamInputDB](https://www.steaminputdb.com/).
- **Visualise** action sets, action layers, groups, and presets in a way Steam doesn't.
- **Design touch menus and radial menus** as actual grids and rings, not vertical lists of "Menu Button N".
- **Round-trip** without data loss — unknown fields are preserved verbatim.
- **Export** a `.vdf` you can drop back into Steam.

## What it explicitly doesn't do (yet)

- Hot-apply configs to a running Steam — Steam owns the files while running. See [`docs/limitations.md`](docs/limitations.md).
- Browse community configs — [SteamInputDB](https://www.steaminputdb.com/) already does that.
- Talk to Steamworks Web API — local-only by design.

## Get started

```bash
cd steam-input-editor
npm install
npm run dev          # opens http://localhost:5173
npm test             # vitest
npm run build        # static SPA into dist/
```

Open `http://localhost:5173` in a browser (Chromium recommended for File System Access API support).

## On a Steam Deck

1. Switch to **Desktop Mode** (Power → Switch to Desktop).
2. Open Firefox/Chromium.
3. Either run `npm run dev` locally and visit it, or load a built copy hosted anywhere.
4. Drop your `controller_*.vdf` into the editor.

A future Tauri / Decky-Loader build will skip the dev-server step. See [`docs/roadmap.md`](docs/roadmap.md) Phase 5.

## Docs

- [`docs/architecture.md`](docs/architecture.md) — what we built and why.
- [`docs/steam-input-schema.md`](docs/steam-input-schema.md) — the VDF schema we model, both v2 and v3.
- [`docs/touchpad-menus.md`](docs/touchpad-menus.md) — the headline feature, in detail.
- [`docs/limitations.md`](docs/limitations.md) — honest list of what's not feasible.
- [`docs/forks-in-the-road.md`](docs/forks-in-the-road.md) — design decisions with rejected alternatives.
- [`docs/roadmap.md`](docs/roadmap.md) — phased plan.
- [`docs/references.md`](docs/references.md) — all sources.

## License

MIT.
