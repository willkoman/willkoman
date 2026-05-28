import type { VdfBlock } from '../vdf';

/**
 * Typed view over a Steam Input controller_mappings config.
 *
 * **Architectural rule (Principal Engineer audit 2026-05):** the AST in `raw`
 * is the single source of truth. The typed view is a projection populated on
 * load and rebuilt by mutators. All editing must go through `lib/schema/mutators`
 * — direct mutation of `groups[].bindings` or `actionSets[]` will NOT survive
 * serialization. The serializer walks `raw`; the typed view is for queries.
 */
export interface SteamInputConfig {
  version: 2 | 3;
  meta: ConfigMeta;
  actionSets: ActionSet[];
  actionLayers: ActionLayer[];
  groups: Group[];
  presets: Preset[];
  /** language -> key -> value */
  localization: Record<string, Record<string, string>>;
  /** Round-trip-preserved underlying AST. Source of truth for serialization. */
  raw: VdfBlock;
}

export interface ConfigMeta {
  title?: string;
  description?: string;
  /** SteamID64 of the author. */
  creator?: string;
  /** Earlier config this was forked from. */
  progenitor?: string;
  /** e.g. `personal_cloud`, `personal_local`, `template`, `community`. */
  exportType?: string;
  /** e.g. `controller_neptune`, `controller_xbox360`. v3 only. */
  controllerType?: ControllerType;
  /**
   * Bitmask used by Steam to filter compatible configs. v3 only.
   *
   * **Opaque** — stored as the original string. Bit semantics are not
   * publicly documented. NEVER recompute, derive, or zero this value;
   * wrong caps causes Steam to silently hide the config from the user's
   * config picker. Round-trip verbatim only.
   */
  controllerCaps?: string;
  revision?: number;
  majorRevision?: number;
  minorRevision?: number;
  timestamp?: string;
}

export type ControllerType =
  | 'controller_neptune' // Steam Deck (Neptune)
  | 'controller_xbox360'
  | 'controller_xboxone' // Series X/S also reports as xboxone
  | 'controller_ps4'
  | 'controller_ps5' // includes DualSense Edge (no separate ID)
  | 'controller_switch_pro' // exact token unconfirmed; Steam handles many Switch variants
  | 'controller_steamcontroller_gordon' // Steam Controller (2015)
  | 'keyboard'
  | (string & {}); // Steam Controller 2 (2026) and others will appear here

export interface ActionSet {
  /** Internal name used by `preset.name`. */
  name: string;
  /** Display title. */
  title?: string;
  /** v2 marker; still emitted in v3 for legacy-style sets. Do not strip. */
  legacy?: boolean;
  /** v3 marker for action-layer entries (only meaningful in `action_layers`). */
  isLayer?: boolean;
}

export interface ActionLayer extends ActionSet {
  isLayer: true;
  /** v3: which set this layer overlays. */
  parentSetName?: string;
}

export interface Group {
  /** Unique numeric id (stored as string in VDF, parsed to number here). */
  id: number;
  /** Input style — `dpad`, `touch_menu`, `radial_menu`, … */
  mode: InputStyle;
  /**
   * Slot name → single binding string (flat v2-style bindings).
   * Example: `"button_A" → "xinput_button A, label"`.
   *
   * For v3 configs with activators, the per-slot bindings live in `inputs`
   * (see below); this map holds only the simple flat bindings.
   */
  bindings: Record<string, string>;
  /** Free-form mode-specific settings. */
  settings: Record<string, string>;
  /**
   * v3 nested `inputs.<slot>.activators.<Activator>.bindings.binding` tree,
   * preserved as opaque AST. The Activator structure is:
   *
   *   inputs {
   *     button_a {
   *       activators {
   *         Full_Press {
   *           bindings {
   *             binding "xinput_button A, #abutton"
   *             // `binding` is a REPEATING key — multiple bindings per activator
   *           }
   *           settings { haptic_intensity "1" ... }
   *         }
   *         Long_Press { ... }
   *         Double_Tap { ... }
   *       }
   *     }
   *   }
   *
   * Activator names observed: Full_Press, Long_Press, Double_Tap, Soft_Press,
   * Start_Press, Release, Chord, analog_button. Typed UI editing of activators
   * is Phase 2 of the roadmap; for now we round-trip the block verbatim.
   */
  inputs?: VdfBlock;
}

export type InputStyle =
  | 'dpad'
  | 'four_buttons'
  | 'joystick_move'
  | 'joystick_camera'
  | 'joystick_mouse'
  | 'mouse_joystick'
  | 'absolute_mouse'
  | 'mouse_region'
  | 'scroll_wheel'
  | 'trigger'
  | 'single_button'
  | 'switches'
  | 'touch_menu'
  | 'radial_menu'
  | 'hotbar_menu' // shares touch_menu_button_N slot keys
  | 'flick_stick'
  | 'directional_swipe'
  | (string & {});

/**
 * Activator names observed inside `inputs.<slot>.activators`. Phase 2
 * introduces typed editing; for now this enum is documentation.
 */
export type ActivatorName =
  | 'Full_Press'
  | 'Long_Press'
  | 'Double_Tap'
  | 'Soft_Press'
  | 'Start_Press'
  | 'Release'
  | 'Chord'
  | 'analog_button'
  | (string & {});

export interface Preset {
  id: number;
  /** Matches an ActionSet name (or an ActionLayer name in v3). */
  name: string;
  /** `<group_id>` -> `<input_source> <state>` */
  groupSourceBindings: Record<string, string>;
  /** Bindings baked into the preset itself (the legacy "switches" group). */
  switchBindings: Record<string, string>;
}

export type InputSource =
  | 'button_diamond'
  | 'left_trackpad'
  | 'right_trackpad'
  | 'joystick'
  | 'right_joystick'
  | 'left_trigger'
  | 'right_trigger'
  | 'gyro'
  | 'switch'
  | 'dpad'
  | (string & {});

export type SourceState = 'active' | 'inactive' | 'modeshift' | 'active modeshift' | (string & {});

/** Documented touch-menu slot counts. Anything else is a warning. */
export const TOUCH_MENU_SLOT_COUNTS = [2, 4, 7, 9, 12, 13, 16] as const;

/** Radial menu hard upper bound (per Steam Input Wiki). */
export const RADIAL_MENU_MAX_SLOTS = 20;

/**
 * Radial menu warning threshold for button-source input sources
 * (face buttons, dpad). Documented as unusable beyond 8.
 */
export const RADIAL_MENU_BUTTON_SOURCE_MAX = 8;
