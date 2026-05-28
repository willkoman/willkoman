# Touchpad menus — the headline feature

Steam Input ships two on-screen menu types that overlay the running game:

|                    | **Touch Menu**                                         | **Radial Menu**                          |
| ------------------ | ------------------------------------------------------ | ---------------------------------------- |
| Shape              | Grid                                                   | Ring                                     |
| Slot count         | 2, 4, 7, 9, 12, 13, 16                                 | 1–20 (≤ 8 on button sources)             |
| Selection          | Touch a region                                         | Aim then click/release                   |
| Activation styles  | Button Click / Button Release / Touch Release / Always | same                                     |
| Compatible sources | Trackpads, gyro, dpads                                 | Trackpads, joysticks, dpads, button-pads |
| Renders best on    | Trackpads (1:1 touch)                                  | Trackpads + joysticks                    |

Both are stored in the VDF as ordinary `group` blocks with `mode = "touch_menu"` or `"radial_menu"`. See `steam-input-schema.md` for the field reference.

## Why the built-in editor is painful

The Steam Input configurator surfaces touch / radial menu slots as a vertical list of "Menu Button 1, Menu Button 2…" items. That UI:

1. Hides the actual grid / ring layout — you can't see which slot is northwest of the touchpad without trial-and-error.
2. Buries the activation style and icon picker behind two-tap menus per slot.
3. Has no concept of "this slot opens a nested layer" beyond manually wiring two layers' bindings.
4. Doesn't let you copy a slot's binding to another slot.
5. Re-renders on every change, losing scroll position.

## What we build instead

### Touch Menu Designer

A visual grid that matches the in-game overlay exactly. Each slot:

- Renders the selected icon (from Valve's binding-icon catalog, or a user-supplied name).
- Shows the binding's short label.
- Is a click target that opens the binding picker inline (no nav).
- Is a drag source / drop target — drag binding from slot A to slot B to copy/swap.
- Shows a small chevron if the slot triggers an action layer (nested menu).

Layout per `touch_menu_button_count`:

```
 2 : ▢ ▢                  4 : ▢ ▢          7 :  ▢ . ▢          9 :  ▢ ▢ ▢
                              ▢ ▢               ▢ ▢ ▢               ▢ ▢ ▢
                                                ▢ . ▢               ▢ ▢ ▢

12 :  ▢ ▢ ▢ ▢            13 :  ▢ ▢ ▢ ▢      16 :  ▢ ▢ ▢ ▢
       ▢ ▢ ▢ ▢                  ▢ ◧◨ ▢          ▢ ▢ ▢ ▢
       ▢ ▢ ▢ ▢                  ▢ ▢ ▢ ▢          ▢ ▢ ▢ ▢
                                                  ▢ ▢ ▢ ▢
```

**Verified (we have screenshot evidence):** 2, 4, 9, 16.
**Unverified (best-guess pending verification on a real Deck):** 7, 12, 13. The UI renders a warning strip when a user opens a config with an unverified slot count.

**The 13-slot fix (2026-05 audit):** slot index `12` is rendered **centred over the middle of the 3×4 grid, spanning two columns of the middle row** — not as a 5th button in a bottom row of 5 as the 0.0.1 scaffold had it. Shipping the wrong layout would have mis-targeted user bindings in-game. Use `isVerifiedTouchMenuLayout(n)` from `src/lib/schema/menuLayouts.ts` to gate features.

(Implementation details in `src/components/TouchMenuPreview.tsx`; slot-index → grid-cell mappings in `src/lib/schema/menuLayouts.ts`.)

### Radial Menu Designer

A ring rendered as an SVG. Slots are positioned at `angle = (i / count) * 2π - π/2` (top-first, clockwise — matches Steam). The user can:

- Click a slot to bind.
- Drag to reorder.
- Toggle a centre / unselected binding (separate slot).
- Set the menu's screen position and opacity via sliders mirrored in the live preview.

### Settings panel (shared)

| Setting             | VDF key                      | UI                                                   |
| ------------------- | ---------------------------- | ---------------------------------------------------- |
| Slot count          | `touch_menu_button_count`    | Buttons 2/4/7/9/12/13/16 (or 1–20 slider for radial) |
| Activation style    | `touchmenu_button_fire_type` | Radio: Click / Release / Touch-Release / Always      |
| Show labels         | `touch_menu_show_labels`     | Toggle                                               |
| Opacity             | `touch_menu_opacity`         | Slider 0–100                                         |
| Horizontal position | `touch_menu_position_x`      | Slider 0–100                                         |
| Vertical position   | `touch_menu_position_y`      | Slider 0–100                                         |
| Size                | `touch_menu_scale`           | Slider 50–150                                        |
| Click action        | `bindings.click`             | Binding picker                                       |
| Center / unselected | `bindings.center` (radial)   | Binding picker                                       |

### Nested menus

Two-step: a slot in menu A binds `controller_action ADD_LAYER <layer_id>`, a slot in menu B (which is the layer) binds `controller_action REMOVE_LAYER <layer_id>`. We don't add new VDF semantics; we add a UI affordance:

- A toggle on each slot: "Opens nested menu →" with a dropdown of action layers.
- Selecting it auto-wires the ADD_LAYER binding here and prompts the user to either pick an existing layer or create a new one (which auto-wires REMOVE_LAYER on slot 0 of the new menu).

## Icons

Three sources, in priority order:

1. **Per-game custom**: `<game-install-dir>/touchmenuicons/<name>.png`. We can't see the game's install dir from a browser sandbox, so we let the user paste a filename and trust Steam to resolve it.
2. **Global custom**: `~/.steam/steam/tenfoot/resource/images/library/controller/binding_icons/<name>.png`. Same caveat.
3. **Valve defaults**: shipped with Steam, browsable in the configurator. We bundle a small catalog of the most common ones (keys 1–9, common verbs, ABXY etc.) for previews. Anything else renders as a labelled accent-coloured tile.

## Edge cases

- **Always-on activation with gyro source**: documented anti-pattern. Wiki warns that the menu becomes unusable. We surface this as a warning banner on the settings panel.
- **>8 slots on a button-source radial menu**: documented as unusable. We warn.
- **Slot 0 of a touch menu is also the "click" action on some Deck builds**: we treat `click` as a separate slot in the data, since the VDF treats it separately.
- **Sub-cardinal radial slots with "Button Release" on a button source**: Steam fires inaccurately per the wiki. We warn.
