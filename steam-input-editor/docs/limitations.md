# Honest limitations

Things this tool **cannot** do, and won't pretend to.

## 1. Cannot live-edit Steam's running state

Steam owns the controller-config files while it is running. Writing a `.vdf` into `~/.local/share/Steam/userdata/.../controller_config/<appid>/` will be either:

- ignored (Steam reads from its in-memory model),
- silently overwritten on Steam Cloud sync, or
- overwritten on Steam shutdown.

**Workflow we recommend in the UI:**

1. Close Steam (or at least exit Big Picture / the configurator).
2. Save the `.vdf` from the editor to the target path.
3. Re-open Steam.
4. In the configurator, "Browse Configs → My Personal Configs" should show the imported config.

A Phase 2 companion (Tauri or Decky plugin) could automate step 1 + 3, but a pure web app cannot.

## 2. File System Access API support is uneven

Direct directory-level read/write requires the **File System Access API**, which is Chromium-only as of writing. Firefox (the Deck's default browser) does not support it, so we fall back to:

- **Import**: file picker / drag-and-drop a single `.vdf`.
- **Export**: trigger a download with the correct filename (`controller_neptune.vdf` or `<appid>.vdf`).

The user is responsible for placing the downloaded file in the right directory. The editor shows the full target path to copy.

## 3. The VDF grammar is partly undocumented

Valve's docs cover the high-level concepts but not the complete enumeration of:

- All valid `controller_action` verbs.
- All `mode`-specific `settings` keys.
- The exact bitmask values of `controller_caps`.
- The `inputs.activators` v3 sub-structure for every input style.

Our parser is **lossless** by design — anything we don't understand passes through unchanged on save. The editor surfaces unknown fields as "raw passthrough" so they don't get silently dropped, but it can't help the user edit them. As community knowledge of the format grows (the SteamInputWiki effort is the best public source), we'll add more typed coverage.

## 4. SIAPI in-game actions need the game's IGA file

Native Steam Input games (SIAPI) define their own action names in `game_actions_<appid>.vdf`. We don't have those — they ship inside the game. We can detect that a config uses `game_action` bindings and display them as opaque strings, but we can't offer an autocomplete of available actions per game.

A Phase 2 enhancement: if the user points us at a Steam install, we can scan `steamapps/common/<game>/game_actions_*.vdf` and build the action catalog. That's a Tauri/Decky feature, not browser-feasible.

## 5. We don't (and shouldn't) sync to Steam Cloud

Steam Cloud sync for controller configs is mediated by the Steam client. Anything we save locally is local-only until Steam picks it up. We don't talk to Steamworks Web API for this, and won't.

## 6. Non-Steam-Deck controllers

The schema applies to any Steam Input controller (`controller_xbox360`, `controller_ps4`, `controller_ps5`, `controller_switch_pro`, `controller_steamcontroller_gordon`, `controller_neptune`). The MVP **renders** the Steam Deck (Neptune) layout — touchpads, sticks, triggers, gyro, ABXY, dpad, L4/L5/R4/R5 back paddles, L1/L2/R1/R2, Start/Select/Steam/Quick Access. Other controllers' input sources are present in the typed model but render with a generic input-source list rather than a custom illustration. Adding a Dualsense / Xbox / Pro Controller render is straightforward but cosmetic.

## 7. No undo across file open

Undo/redo stack is per-session and per-file. Opening a new file resets it. This is normal for editors but worth calling out.

## 8. We don't help you author custom icons

Icon PNGs need to exist in either the game directory or the Steam tenfoot resources directory. We display the icon name and a placeholder; we don't paint the image. A Tauri shell could read the icon files directly.

## 9. Validation is best-effort

We can warn about:

- Duplicate `group.id`s.
- A `preset.group_source_bindings` reference to a non-existent group id.
- Documented anti-patterns (e.g. always-on radial menu on gyro).
- Slot counts outside documented sets (e.g. a touch menu with `count = 5`).

We **cannot** validate that a binding string is semantically valid — Steam itself silently ignores unrecognised verbs. The most we do is flag verbs not in our known catalog as "unverified".

## 10. Won't fight the user

If you want to write something the spec says is wrong, you can. We surface a warning; we don't block save.

## 11. `controller_caps` is opaque

The `controller_caps` field is a capability bitmask Steam uses to filter configs to compatible controllers. The exact bit layout is not publicly documented anywhere we could find. Padsmith stores the value as a verbatim string and never computes, derives, or zeroes it. If you change controllers in a config, the `controller_caps` value will not update — and you generally do not want it to, because wrong caps silently hides the config from Steam's picker. Start from a `controller_base` template for the target controller type instead.

## 12. Touch-menu layouts for 7/12/13 slots are best-guess

Steam renders touch menus at these counts in specific ways that we have not yet visually verified on a Deck. The 0.1.0 build flags these layouts as `verified: false` and shows a warning strip in the preview. Slot counts 2, 4, 9, 16 are well-tested; slot 12 (the 13th slot) in particular has been corrected from the 0.0.1 scaffold's wrong "bottom row of 5" layout to the centred-overlay layout. If you find a layout that differs from what the editor shows, please file an issue with a screenshot from Steam Big Picture / Game Mode.

## 13. We don't model V3 activators as editable yet

Modern V3 configs nest bindings under `inputs.<slot>.activators.<Full_Press|Long_Press|…>.bindings.binding`. Padsmith parses and round-trips this verbatim, but the editor UI cannot yet edit them as activators — you'll see a "raw passthrough" notice on those groups. Typed activator editing is the next deliverable in Phase 1. If you try to use the v2-style flat `bindings` editor on a v3 group that uses activators, your changes will land in a sibling block that Steam ignores. The UI warns about this.
