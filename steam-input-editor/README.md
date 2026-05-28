# Padsmith

A **craft tool for Steam Input controller schemas** — a visual editor for
`controller_*.vdf` files, designed touch-first for the Steam Deck. Built
because Steam's built-in configurator buries the things that matter
(touchpad menus, action sets, activators) under several layers of nested
lists.

> **Status:** v0.1.0 · Trust Layer. The parser, schema model, fixtures,
> ESLint/Prettier/CI gates, and the visual identity are in place. The full
> premium editor UI (Deck SVG canvas, bottom-sheet inspector, real
> menu-designer interactions, undo/redo) is the next milestone.
>
> The project currently lives under `willkoman/willkoman/steam-input-editor/`
> on a feature branch; it will be extracted to its own repo at
> `willkoman/padsmith` before public launch.

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
