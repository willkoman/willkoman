# Forks in the road — decisions, with the alternatives we rejected (or deferred)

This is the "we considered X but went with Y because" file. Future-you (or a contributor) deserves to know the reasoning, not just the outcome.

---

## 1. Web app vs Linux desktop app

**Chosen:** Web app (static SPA).

| Pro | Con |
|---|---|
| Zero install on Steam Deck (open Firefox/Chromium in Desktop Mode) | No direct r/w access to Steam's config dirs |
| Same URL works on Deck, laptop, phone | Steam can overwrite our files if running |
| PWA-installable for offline use | File System Access API is Chromium-only |
| Vite/React stack is portable to Tauri later | We can't watch the filesystem |

**Deferred alternative:** A Tauri shell wrapping the same React UI. Adds < 5 MB and gives us direct filesystem access on Deck. Designed for, not built — Phase 2.

**Rejected:** Native GTK/Qt app. Big install lift on the Deck (immutable rootfs → must Flatpak), no portability win.

---

## 2. Standalone vs Decky plugin

**Chosen:** Standalone (web app). A Decky plugin is Phase 2.

| Pro of Decky plugin | Con |
|---|---|
| Works in Game Mode (no need to switch to Desktop Mode) | Decky-only — useless on a non-Deck Linux machine |
| Can talk to running Steam directly | Constrained UI (must fit Decky's quick-access shell) |
| Auto-installs configs | Decky is third-party and has its own update cycle |

A standalone-first design gives us a working tool today; Decky comes next once the editor is solid.

---

## 3. Round-trip lossless VDF AST vs typed-only model

**Chosen:** Two-layer (lossless AST + typed schema view).

**Rejected:** Parse straight into a strongly-typed model and re-emit from it.

Why the two-layer approach matters:

- VDF has fields we don't know about. A typed-only emitter drops them. **Dropping fields on a config the user wants to round-trip is destructive.** That's the worst-possible failure mode for an editor.
- A typed-only model fights us on the duplicate-key cases (`group`, `preset`, `localization`) — we'd have to encode "this is really a list, not a map".
- The AST is the source of truth on disk; the typed view is an annotation we paint on top of it.

Cost: every edit must update both views. We push this through a small `mutators` module that keeps them in sync.

---

## 4. Custom VDF parser vs npm dependency

**Chosen:** In-house TypeScript parser.

**Evaluated:**

- `vdf-parser`, `simple-vdf`, `node-vdf`: all lose duplicate-key ordering. Most produce `{group: {...}}` collapsing repeated keys.
- `steam-binary-vdf`: handles the binary subformat we don't need.

A KeyValues parser is ~300 lines of TS. The cost of writing it once with explicit tests (`tests/vdf/`) is far lower than the cost of patching a 3rd-party lib that doesn't model the format we need.

---

## 5. React vs Svelte vs SolidJS

**Chosen:** React 19 + Vite + TypeScript.

| | React | Svelte | Solid |
|---|---|---|---|
| Ecosystem | Largest | Mid | Small |
| Bundle size | Bigger | Smaller | Smallest |
| Touch-UI libs | Many | Some | Few |
| Familiarity | Universal | Trendy | Niche |

For a tool the user maintains and likely wants others to contribute to, React's ecosystem reach wins. Bundle size is a non-issue for a desktop-mode SPA.

**If you want to switch:** the schema/parser layer is framework-free. Only `src/components/` and `src/routes/` would change.

---

## 6. Tailwind v4 vs CSS Modules vs vanilla CSS

**Chosen:** Tailwind v4.

**Rationale:** the editor is dense with chrome (sidebars, modals, sliders, menu grids). Tailwind's utility approach lets us iterate on layout without thrashing CSS files. v4 dropped its config-file overhead — it's now opt-in via CSS `@import` and `@theme`.

If Tailwind ever becomes a maintenance burden, swap in CSS Modules; nothing else depends on it.

---

## 7. Zustand vs Redux Toolkit vs Context+reducer

**Chosen:** Zustand.

Editor state has: current config, dirty flag, undo stack, current selection (which group / which slot). It does not have: complex server-state, cross-tab sync, time-travel-debugging needs.

Zustand is ~1 KB, no Provider boilerplate, plays well with selectors, and Redux DevTools support is one-line if we ever want it.

---

## 8. Action-set switching: simulate in editor vs static rendering?

**Choice still open. Currently: static rendering per active set tab; user clicks an action-set tab to swap the view.**

**Alternative:** simulate runtime modeshifts and layer applications so the editor visualises what each combination of held buttons would actually produce. Pro: lets users debug complex stacks. Con: a lot of code for an arguable benefit. Defer until we have real users asking for it.

---

## 9. Versioning: read+write v2 + v3 vs v3-only

**Chosen:** Read + write both.

Half the old, tested community configs on SteamInputDB are v2. Refusing to load them would gut the "use existing config as starting point" use case. The cost is a few extra branches in the schema transform.

We **save as the version we loaded** — never silently migrate.

---

## 10. Storage: localStorage vs IndexedDB vs File System Access only

**Chosen:** All three, layered.

- **File System Access API** when available — directly open/save `.vdf` files in place.
- **IndexedDB** as a "scratchpad" so closing the tab doesn't lose work.
- **localStorage** for UI preferences only.

Auto-saving to IndexedDB every N seconds protects against tab crashes without polluting the user's actual files.

---

## 11. Icon catalog: ship our own vs link to Steam's?

**Chosen:** Ship a small bundled subset (~50 icons) for live preview; for everything else accept an icon name string and render an accent-coloured placeholder.

We can't bundle the full Valve catalog (license + size). We can't read the user's local Steam icon dir from a browser sandbox. Best of both: cover the common cases visually, let everything else still work in the file format.

A Tauri shell could load icons from `~/.steam/steam/tenfoot/resource/images/library/controller/binding_icons/*.png` at runtime.

---

## 12. Schema validation severity

**Chosen:** Warnings, never errors. Editor never refuses to save.

Steam Input has too many half-documented corners. Hard validation would block legitimate configs. We surface a "Validation" panel listing issues; the user decides.
