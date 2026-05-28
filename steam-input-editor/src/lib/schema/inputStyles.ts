import type { InputStyle } from './types';

export interface InputStyleDef {
  id: InputStyle;
  /** Human-readable label for the UI. */
  label: string;
  /** Short blurb describing what this style does. */
  description: string;
  /** Which input sources commonly use this style. Informational. */
  worksOn: ReadonlyArray<'trackpad' | 'joystick' | 'dpad' | 'buttons' | 'trigger' | 'gyro'>;
  /** Whether this style typically uses a slot-indexed binding namespace. */
  isMenuStyle?: boolean;
}

export const INPUT_STYLES: ReadonlyArray<InputStyleDef> = [
  {
    id: 'dpad',
    label: 'Directional Pad',
    description: '4- or 8-way d-pad emulation.',
    worksOn: ['trackpad', 'joystick', 'dpad'],
  },
  {
    id: 'four_buttons',
    label: 'Button Pad',
    description: 'ABXY-style face button cluster.',
    worksOn: ['trackpad', 'buttons'],
  },
  {
    id: 'joystick_move',
    label: 'Joystick Move',
    description: 'Analog stick output.',
    worksOn: ['joystick', 'trackpad'],
  },
  {
    id: 'joystick_camera',
    label: 'Joystick Camera',
    description: 'Stick tuned for camera control.',
    worksOn: ['joystick', 'trackpad'],
  },
  {
    id: 'joystick_mouse',
    label: 'Joystick Mouse',
    description: 'Stick acts as the mouse cursor.',
    worksOn: ['joystick'],
  },
  {
    id: 'mouse_joystick',
    label: 'Mouse Joystick',
    description: 'Stick emits mouse-like flicks.',
    worksOn: ['joystick', 'trackpad'],
  },
  {
    id: 'absolute_mouse',
    label: 'Mouse',
    description: '1:1 trackpad → mouse cursor.',
    worksOn: ['trackpad', 'gyro'],
  },
  {
    id: 'mouse_region',
    label: 'Mouse Region',
    description: '1:1 cursor anchored to a screen region.',
    worksOn: ['trackpad'],
  },
  {
    id: 'scroll_wheel',
    label: 'Scroll Wheel',
    description: 'Emulates a mouse scroll wheel.',
    worksOn: ['trackpad', 'joystick'],
  },
  {
    id: 'trigger',
    label: 'Trigger',
    description: 'Analog trigger with optional soft pull.',
    worksOn: ['trigger'],
  },
  {
    id: 'single_button',
    label: 'Single Button',
    description: 'Whole input acts as one big button.',
    worksOn: ['trackpad', 'buttons'],
  },
  {
    id: 'switches',
    label: 'Switches',
    description: 'Shoulder/back/menu button group.',
    worksOn: ['buttons'],
  },
  {
    id: 'touch_menu',
    label: 'Touch Menu',
    description: 'On-screen grid menu (2–16 slots).',
    worksOn: ['trackpad', 'gyro', 'dpad'],
    isMenuStyle: true,
  },
  {
    id: 'radial_menu',
    label: 'Radial Menu',
    description: 'On-screen ring menu (up to 20 slots).',
    worksOn: ['trackpad', 'joystick', 'dpad', 'buttons'],
    isMenuStyle: true,
  },
  {
    id: 'hotbar_menu',
    label: 'Hotbar Menu',
    description: 'Scrollable horizontal bar (up to 16 slots).',
    worksOn: ['dpad', 'buttons'],
    isMenuStyle: true,
  },
  {
    id: 'flick_stick',
    label: 'Flick Stick',
    description: 'Absolute turning device.',
    worksOn: ['joystick', 'trackpad'],
  },
  {
    id: 'directional_swipe',
    label: 'Directional Swipe',
    description: 'D-pad with required travel before firing.',
    worksOn: ['trackpad'],
  },
];

export const INPUT_STYLE_MAP: Readonly<Record<string, InputStyleDef>> = Object.fromEntries(
  INPUT_STYLES.map((s) => [s.id, s])
) as Record<string, InputStyleDef>;
