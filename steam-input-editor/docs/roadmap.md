# Roadmap

Phases are ordered for the smallest possible useful slice first. Each phase ends with the tool being **shippable**.

## Phase 0 — Scaffolded (this commit)

- [x] Repo skeleton: Vite + React + TS + Tailwind v4
- [x] VDF parser + serializer with round-trip tests
- [x] Typed schema model with bidirectional transform
- [x] Comprehensive planning docs
- [x] CI workflow stub (lint + test + build)

## Phase 1 — Read-only viewer (1–2 weeks)

Goal: open any `.vdf`, see what it actually does, more clearly than the Steam UI.

- [ ] File drop / picker (File System Access API + fallback)
- [ ] Controller view: Steam Deck SVG with clickable input sources
- [ ] Action set tabs + action layer chips
- [ ] Group inspector: input style, bindings table, settings dump
- [ ] Touch menu **preview** (read-only grid render)
- [ ] Radial menu **preview** (read-only ring render)
- [ ] Validation panel (warnings only)
- [ ] Export back to `.vdf` (verbatim round-trip)

This phase is already useful as a "what does this community config actually do?" viewer.

## Phase 2 — Editing (2–3 weeks)

- [ ] Binding picker dialog (keyboard / mouse / gamepad / system / SIAPI)
- [ ] Group editing (change input style, edit settings)
- [ ] **Touch menu designer** (click-to-bind, drag-to-rearrange)
- [ ] **Radial menu designer** (click-to-bind, drag-to-reorder)
- [ ] Action set + action layer CRUD
- [ ] Undo / redo
- [ ] Auto-save to IndexedDB scratchpad

## Phase 3 — Quality of life (1–2 weeks)

- [ ] Templates: start a new config from a stock "FPS / Strategy / Emulation" template
- [ ] Import from URL (paste a SteamInputDB link)
- [ ] Diff view: compare current edits vs imported file
- [ ] Nested-menu builder UI (auto-wires ADD_LAYER / REMOVE_LAYER)
- [ ] Icon picker with bundled common-icon catalog
- [ ] Per-binding labels and notes

## Phase 4 — Polishing for the Deck (1 week)

- [ ] Touch-target sweep (everything ≥ 44px on Deck viewport)
- [ ] PWA install (offline use)
- [ ] Steam Deck setup guide in-app
- [ ] Keyboard-only navigation pass

## Phase 5 — Native integration (optional, time-permitting)

- [ ] Tauri shell with direct r/w to `~/.local/share/Steam/userdata/.../controller_config/`
- [ ] Decky Loader plugin for in-Game-Mode use
- [ ] Steam process detection (warn before save if Steam is running)
- [ ] Auto-scan installed games for SIAPI action catalogs

## Phase 6 — Community (only if there's demand)

- [ ] Optional publish-to-SteamInputDB integration
- [ ] Shareable config URLs (encode config in URL hash)
- [ ] Built-in browse of community configs

## Success criteria for "v1.0"

- Opens every modern `.vdf` from SteamInputDB without data loss
- Round-trips a sample of 20+ real-world configs byte-equivalently (modulo whitespace)
- Visual touch-menu editor strictly better than Steam's built-in one (subjective; user-tested on the Deck)
- All-in install time on a Steam Deck: < 30 seconds (open URL, done)
