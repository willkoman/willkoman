# Steam Input VDF schema (what we support and how we model it)

Steam Input controller configs are **VDF / KeyValues** text files. There are two major schema versions in the wild:

- **Version 2** (legacy) — used by configs marked `"legacy_set" "1"`. Single-action-set games, simpler structure. The reference example in `tests/fixtures/gtav-v2.vdf` is one of these.
- **Version 3** (modern) — used by everything created in the current Steam Deck / Steam client UI. Adds first-class action layers, the `activators` block, `controller_type`, `progenitor`, `export_type`, and many small fields.

Both versions share the same top-level `controller_mappings` root and the same general structure of `group` / `preset` blocks. **We support both** and round-trip both losslessly.

## File format basics (VDF / KeyValues)

```
"controller_mappings"
{
    "version"     "3"
    "title"       "My Config"
    "group"
    {
        "id"      "0"
        "mode"    "four_buttons"
        "bindings"
        {
            "button_A"  "xinput_button A"
            "button_B"  "xinput_button B, Some label"
        }
    }
    "group"      // <-- KEY REPEATS at the same level
    {
        "id"      "1"
        ...
    }
}
```

Quirks we have to honour:

- **Duplicate keys** at the same level are legal and load-bearing. `group` and `preset` always repeat. A naive `JSON.parse`-style transform would clobber them.
- **Order matters** sometimes (especially for `preset.group_source_bindings` and for the visual order Steam shows things in). We preserve insertion order.
- **All scalar values are strings** in the wire format — even `"id" "3"` is a string `"3"`. We parse numerics in the typed schema layer, not in the AST.
- **Comments** `// ...` to end of line; we preserve them as separate AST nodes attached to the next entry.
- **Quoting** required only for values with whitespace or VDF-reserved chars. We always emit quotes for stability.
- **Conditionals** `[$WIN32]` / `[$LINUX]` style tags appear on some lines; we capture them on the entry.

The two-layer parser/AST is in `src/lib/vdf/`. The typed schema sitting on top is in `src/lib/schema/`.

## Top-level structure (`controller_mappings`)

| Key                                 | Type               | Versions | Notes                                                                                                                                                                                                                 |
| ----------------------------------- | ------------------ | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `version`                           | int                | 2, 3     | Schema version.                                                                                                                                                                                                       |
| `revision`                          | int                | 3        | Steam-assigned revision counter; bumped on save.                                                                                                                                                                      |
| `major_revision` / `minor_revision` | int                | 3        | Sometimes present.                                                                                                                                                                                                    |
| `title`                             | string             | 2, 3     | Display name in Steam UI.                                                                                                                                                                                             |
| `description`                       | string             | 2, 3     | Description text. May reference Steam tokens (`#SettingsController_…`).                                                                                                                                               |
| `creator`                           | string (SteamID64) | 2, 3     | Author's SteamID.                                                                                                                                                                                                     |
| `progenitor`                        | string             | 3        | The config this was forked from, if any.                                                                                                                                                                              |
| `export_type`                       | string             | 3        | `personal_cloud`, `personal_local`, `template`, `community`, …                                                                                                                                                        |
| `controller_type`                   | string             | 3        | `controller_neptune` (Deck), `controller_xbox360`, `controller_ps4`, `controller_ps5`, `controller_switch_pro`, `controller_steamcontroller_gordon`, `keyboard`, etc.                                                 |
| `controller_caps`                   | **opaque string**  | 3        | Capability bitmask. Bit semantics are NOT publicly documented. **Never recompute or derive.** Wrong caps silently hides the config from Steam's picker. Round-trip verbatim only. Sample value: `1590271` (Xbox One). |
| `Timestamp`                         | string             | 3        | Last-edited timestamp.                                                                                                                                                                                                |
| `actions`                           | block              | 2, 3     | **Action sets** — see below.                                                                                                                                                                                          |
| `action_layers`                     | block              | 3        | **Action layers** — narrower, additive overlays on a set.                                                                                                                                                             |
| `localization`                      | block              | 2, 3     | `{language}{key}{value}` translation tables for action/binding titles.                                                                                                                                                |
| `group`                             | block (repeats)    | 2, 3     | A single input-source configuration (one trackpad-as-dpad, one trigger, etc.).                                                                                                                                        |
| `preset`                            | block (repeats)    | 2, 3     | An action set's resolved binding state — which `group` is bound to which input source.                                                                                                                                |

## `actions` and action sets

```
"actions"
{
    "Menu"          { "title" "Menu"     "legacy_set" "1" }
    "OnFoot"        { "title" "Foot"     "legacy_set" "1" }
    "InVehicle"     { "title" "Vehicle"  "legacy_set" "1" }
}
```

An **action set** is a complete swap of bindings. The user can switch sets manually via a `controller_action CHANGE_PRESET …` binding, or the game can switch them via the Steam Input API (SIAPI).

`legacy_set "1"` flags a v2-style set. v3 also adds:

- `set_layer "1"` to mark a "layer" entry (additive overlay) — typically appears in a sibling `action_layers` block.
- `parent_set_name "OnFoot"` on a layer to declare which set it overlays.

## `group` — a single input source configuration

```
"group"
{
    "id"    "5"
    "mode"  "trigger"
    "bindings" { "click" "mouse_button LEFT, Fire" }
    "settings" { "output_trigger" "2" "hold_repeats" "1" }
}
```

| Field             | Notes                                                                                                                                                                                                                                                                                        |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`              | Numeric id (string). Referenced by `preset.group_source_bindings`. Must be unique within the file.                                                                                                                                                                                           |
| `mode`            | The **input style**. See the catalog in `src/lib/schema/inputStyles.ts`.                                                                                                                                                                                                                     |
| `bindings`        | Map of slot name → binding string. Slot names depend on `mode` (e.g. `dpad_north`, `button_A`, `click`, `touch_menu_button_3`). Radial menus, hotbar menus, AND touch menus all use the `touch_menu_button_0..N` slot key family — there is no separate `radial_menu_button_N`.              |
| `settings`        | Mode-specific settings (deadzones, haptic intensity, etc.).                                                                                                                                                                                                                                  |
| ~~`gameactions`~~ | **There is no `gameactions` sub-block inside a `group`.** Game-action references are inline bindings: `"binding" "game_action <SetName> <ActionName>[, label]"`. The IGA file (`game_actions_<appid>.vdf`) is a separate format with root key `"In Game Actions"` (mixed case, with spaces). |
| `inputs`          | v3: nested per-slot blocks containing `activators`. See the activator section below.                                                                                                                                                                                                         |

### Input style catalog (`mode` values)

From the SteamInputWiki + observed configs:

| `mode`              | Description                                                                                |
| ------------------- | ------------------------------------------------------------------------------------------ |
| `dpad`              | Directional pad (4/8-way).                                                                 |
| `four_buttons`      | Diamond / face-button layout.                                                              |
| `joystick_move`     | Standard analog stick.                                                                     |
| `joystick_camera`   | Stick configured as a camera (mouse-like) input.                                           |
| `joystick_mouse`    | Stick that acts as the mouse.                                                              |
| `mouse_joystick`    | Stick that emits mouse-like flicks.                                                        |
| `absolute_mouse`    | Trackpad as 1:1 mouse.                                                                     |
| `mouse_region`      | Trackpad as a 1:1 cursor anchor in a screen region.                                        |
| `scroll_wheel`      | Trackpad / stick as a scroll wheel.                                                        |
| `trigger`           | Analog or soft-pull trigger.                                                               |
| `single_button`     | Whole input as one giant button.                                                           |
| `switches`          | The "switches" virtual group used by buttons/bumpers/triggers shoulders.                   |
| `touch_menu`        | **On-screen grid menu** (2/4/7/9/12/13/16 slots).                                          |
| `radial_menu`       | **On-screen ring menu** (up to 20 slots; ≤ 8 on button sources).                           |
| `hotbar_menu`       | Scrollable horizontal bar (up to 16 slots). Uses the same `touch_menu_button_N` slot keys. |
| `flick_stick`       | Stick as absolute turning device.                                                          |
| `directional_swipe` | D-pad-with-travel: requires a swipe gesture.                                               |

### Binding string grammar

A binding value is a comma-separated `<verb> <args>[, <label>]` string. Examples:

| Pattern                                         | Example                                     | Meaning                                                                             |
| ----------------------------------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------- |
| `key_press <KEY>[, <label>]`                    | `key_press W, Move Forward`                 | Keyboard key.                                                                       |
| `mouse_button <BUTTON>`                         | `mouse_button LEFT, Fire`                   | Mouse button.                                                                       |
| `mouse_wheel <DIR>`                             | `mouse_wheel SCROLL_UP, Zoom in`            | Wheel tick.                                                                         |
| `xinput_button <NAME>`                          | `xinput_button A, #abutton`                 | XInput gamepad button.                                                              |
| `controller_action <VERB> [args...]`            | `controller_action CHANGE_PRESET 32765 0 1` | Steam-internal action: change set, take screenshot, open keyboard, set lights, etc. |
| `mode_shift <SOURCE> <GROUP_ID>`                | `mode_shift right_trigger 41`               | Modeshift another input's group to `<GROUP_ID>` while held.                         |
| `game_action <SET_NAME> <ACTION_NAME>[, label]` | `game_action InGameControls jump`           | SIAPI in-game action reference.                                                     |

The reference list lives in `src/lib/schema/bindings.ts`. It is incomplete (so is every public reference). The schema layer **passes through unknown verbs unchanged** so we never corrupt valid configs.

### V3 `inputs` and activators

Modern V3 configs nest activators under `inputs.<slot>.activators.<Activator>`. Each activator has its own `bindings { binding "..." }` and `settings { ... }`. **`binding` is a repeating key** inside `bindings { }` — a single activator can fire several bindings in sequence.

```
"group"
{
    "id"     "0"
    "mode"   "four_buttons"
    "inputs"
    {
        "button_A"
        {
            "activators"
            {
                "Full_Press"
                {
                    "bindings"
                    {
                        "binding"  "xinput_button A, #abutton"
                        "binding"  "controller_action ADD_LAYER 1, with combat layer"
                    }
                    "settings"
                    {
                        "haptic_intensity"  "1"
                    }
                }
                "Long_Press"
                {
                    "bindings"
                    {
                        "binding"  "key_press F, Interact alt"
                    }
                    "settings"
                    {
                        "long_press_time"  "350"
                    }
                }
            }
        }
    }
}
```

Activator names observed in real configs: `Full_Press`, `Long_Press`, `Double_Tap`, `Soft_Press`, `Start_Press`, `Release`, `Chord`, `analog_button`. The `ActivatorName` enum in `src/lib/schema/types.ts` lists them. Padsmith currently preserves the `inputs` block verbatim; typed editing of activators is a Phase 1 deliverable.

## `preset` — wiring groups to input sources for an action set

```
"preset"
{
    "id"     "1"
    "name"   "OnFoot"
    "group_source_bindings"
    {
        "6"   "button_diamond active"
        "10"  "joystick inactive"
        "20"  "joystick active"
        "22"  "gyro active"
    }
    "switch_bindings"
    {
        "bindings"
        {
            "button_back_left"   "key_press LEFT_CONTROL, Stealth"
            "button_back_right"  "key_press SPACE, Jump"
        }
    }
}
```

- `group_source_bindings` map: `"<group_id>" "<input_source> <state>"`.
  - **Input sources:** `button_diamond`, `dpad`, `left_trackpad`, `right_trackpad`, `joystick`, `right_joystick`, `left_trigger`, `right_trigger`, `gyro`, `switch`, plus Deck-specific `left_trackpad`/`right_trackpad`, etc.
  - **States:** `active`, `inactive`, `modeshift`, `active modeshift`.
  - The same input source can have multiple groups in different states — they're swapped at runtime by modeshift triggers.
- `switch_bindings` block: bindings for the "switches" group (shoulders, menu buttons, back paddles) baked directly into the preset.

## Touch menus & radial menus (the headline feature)

Touch menus and radial menus are just `group` entries with `mode = "touch_menu"` or `"radial_menu"`. The slots are numbered binding entries in the `bindings` block:

```
"group"
{
    "id"    "42"
    "mode"  "radial_menu"
    "bindings"
    {
        "touch_menu_button_0"   "key_press 1, Weapon 1"
        "touch_menu_button_1"   "key_press 2, Weapon 2"
        ...
        "touch_menu_button_15"  "key_press F, Flashlight"
        "click"                 "key_press SHIFT, Confirm"
    }
    "settings"
    {
        "touch_menu_button_count"      "16"
        "touchmenu_button_fire_type"   "2"  // activation style
        "touch_menu_show_labels"       "1"
        "touch_menu_opacity"           "85"
        "touch_menu_position_x"        "55"
        "touch_menu_position_y"        "60"
        "touch_menu_scale"             "100"
    }
}
```

Slot indices map to grid/ring positions deterministically. Our `TouchMenuDesigner` and `RadialMenuDesigner` components render them as the user would see them in-game:

- **Touch menu** layouts: 2 / 4 / 7 / 9 / 12 / 13 / 16 slots with documented grid arrangements.
- **Radial menu** layouts: 1–20 slots, evenly distributed angularly from the top.

**Custom icons** live in `<game-install-dir>/touchmenuicons/*.png` (per-game) or `~/.steam/steam/tenfoot/resource/images/library/controller/binding_icons/` (global). We can't ship these — we let the user enter an icon name and preview the binding's accent colour.

**Nested menus** are achieved by binding one slot to an "Apply Action Layer" controller_action, and a slot in the nested menu to "Remove Action Layer". The editor visualises this by showing a "→ opens [layer name]" chevron on the relevant slot.

## File locations

| Path                                                                                           | Purpose                                                    |
| ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `<steam>/userdata/<id>/241100/remote/controller_config/<appid>/`                               | Per-user, per-game custom configs (synced to Steam Cloud). |
| `<steam>/steamapps/common/Steam Controller Configs/<id>/config/<appid>/controller_neptune.vdf` | Newer Deck path for the same.                              |
| `<steam>/controller_base/`                                                                     | Default templates Steam ships.                             |
| `<steam>/controller_base/templates/`                                                           | User-created global templates.                             |
| `<game>/touchmenuicons/*.png`                                                                  | Per-game custom touch/radial menu icons.                   |

On Steam Deck (Linux), `<steam>` is `~/.local/share/Steam` or `~/.steam/steam`.

**Warning:** Steam owns these files while running. Edits made while Steam is open may be overwritten on shutdown or on a Cloud sync. The editor's import/export flow always advises closing Steam (or at least the Steam Input Configurator) before writing.

## What we model (typed schema)

See `src/lib/schema/types.ts` for the source of truth. In short:

```ts
interface SteamInputConfig {
  version: 2 | 3;
  meta: { title, description, creator, controllerType, exportType, … };
  actionSets: ActionSet[];
  actionLayers: ActionLayer[];
  groups: Group[];        // by id
  presets: Preset[];      // by actionSetName
  localization: Record<string, Record<string, string>>;
  raw: VdfBlock;          // preserved AST for round-trip
}
```

**The AST in `raw` is the only source of truth.** The typed view is rebuilt from the AST on load and after every mutator call. Serialisation walks `raw`, so unknown fields stay intact and edits made via the typed view alone (bypassing the mutators) will not appear in exported `.vdf` files — that's by design, see `docs/forks-in-the-road.md` for the rationale.
