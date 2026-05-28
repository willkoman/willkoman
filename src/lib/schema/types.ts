import type { VdfBlock } from '../vdf';

/**
 * Typed view over a Steam Input controller_mappings config.
 *
 * Importantly: `raw` is preserved verbatim. Edits made via the schema layer
 * mutate both the typed view AND the raw AST, so serialization stays
 * round-trip-clean and we never silently drop fields we don't know about.
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
  /** Bitmask used by Steam to filter compatible configs. v3 only. */
  controllerCaps?: number;
  revision?: number;
  majorRevision?: number;
  minorRevision?: number;
  timestamp?: string;
}

export type ControllerType =
  | 'controller_neptune'                // Steam Deck
  | 'controller_xbox360'
  | 'controller_xboxone'
  | 'controller_ps4'
  | 'controller_ps5'
  | 'controller_switch_pro'
  | 'controller_steamcontroller_gordon' // Steam Controller (2015)
  | 'keyboard'
  | (string & {});

export interface ActionSet {
  /** Internal name used by `preset.name`. */
  name: string;
  /** Display title. */
  title?: string;
  /** v2 marker. */
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
  /** Slot name → binding string (e.g. `"button_A" → "xinput_button A, label"`). */
  bindings: Record<string, string>;
  /** Free-form mode-specific settings. */
  settings: Record<string, string>;
  /**
   * v3 nested `inputs.<slot>.activators.<activator>.bindings.binding` tree, if present.
   * Stored as raw block for now; a Phase 2 schema would expand to typed activators.
   */
  inputs?: VdfBlock;
  /** v3 SIAPI game-actions sub-block. */
  gameActions?: VdfBlock;
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
  | 'hotbar_menu'
  | 'flick_stick'
  | 'directional_swipe'
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
