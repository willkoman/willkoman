/**
 * Built-in starter templates for new configs.
 *
 * Each template is a complete, self-contained VDF text payload. The point
 * is that a user with no existing `.vdf` can still open Padsmith, pick a
 * template, and start editing immediately — closing the dead-end on the
 * Home route.
 *
 * Templates are intentionally minimal: a single Default action set, a few
 * sensible group entries, no SIAPI actions. The user fills in bindings
 * via the visual editor.
 */

export interface Template {
  id: string;
  name: string;
  description: string;
  /** Tags shown in the picker; mostly for SEO when a future search lands. */
  tags: string[];
  vdf: string;
}

const HEADER = (title: string, description: string) => `"controller_mappings"
{
\t"version"\t\t"3"
\t"revision"\t\t"1"
\t"title"\t\t\t"${title}"
\t"description"\t\t"${description}"
\t"creator"\t\t"0"
\t"controller_type"\t"controller_neptune"
\t"export_type"\t\t"personal_local"
\t"Timestamp"\t\t"-1"
`;

const FOOTER = `}\n`;

const EMPTY_DECK: Template = {
  id: 'empty-deck',
  name: 'Empty Deck',
  description:
    'Bare-bones Steam Deck config with one Default action set and gamepad-emulating groups.',
  tags: ['empty', 'deck', 'neptune', 'starter'],
  vdf:
    HEADER('Empty Deck', 'Starter template — Padsmith') +
    `\t"actions"
\t{
\t\t"Default"\t{ "title" "Default"\t"legacy_set" "0" }
\t}
\t"group"
\t{
\t\t"id"\t\t"0"
\t\t"mode"\t\t"four_buttons"
\t\t"bindings"
\t\t{
\t\t\t"button_A"\t"xinput_button A"
\t\t\t"button_B"\t"xinput_button B"
\t\t\t"button_X"\t"xinput_button X"
\t\t\t"button_Y"\t"xinput_button Y"
\t\t}
\t}
\t"group"
\t{
\t\t"id"\t\t"1"
\t\t"mode"\t\t"dpad"
\t\t"bindings"
\t\t{
\t\t\t"dpad_north"\t"xinput_button DPAD_UP"
\t\t\t"dpad_south"\t"xinput_button DPAD_DOWN"
\t\t\t"dpad_east"\t"xinput_button DPAD_RIGHT"
\t\t\t"dpad_west"\t"xinput_button DPAD_LEFT"
\t\t}
\t}
\t"group"
\t{
\t\t"id"\t\t"2"
\t\t"mode"\t\t"joystick_move"
\t}
\t"group"
\t{
\t\t"id"\t\t"3"
\t\t"mode"\t\t"joystick_camera"
\t}
\t"preset"
\t{
\t\t"id"\t\t"0"
\t\t"name"\t\t"Default"
\t\t"group_source_bindings"
\t\t{
\t\t\t"0"\t"button_diamond active"
\t\t\t"1"\t"dpad active"
\t\t\t"2"\t"joystick active"
\t\t\t"3"\t"right_joystick active"
\t\t}
\t}
` +
    FOOTER,
};

const FPS_PRESET: Template = {
  id: 'fps',
  name: 'FPS preset',
  description:
    'Mouse-emulating right trackpad, WASD on the left, trigger on R2. Tuned for shooters.',
  tags: ['fps', 'mouse', 'wasd', 'shooter'],
  vdf:
    HEADER('FPS preset', 'Mouse + WASD starter — Padsmith') +
    `\t"actions"
\t{
\t\t"Default"\t{ "title" "Default"\t"legacy_set" "0" }
\t}
\t"group"
\t{
\t\t"id"\t\t"0"
\t\t"mode"\t\t"absolute_mouse"
\t}
\t"group"
\t{
\t\t"id"\t\t"1"
\t\t"mode"\t\t"dpad"
\t\t"bindings"
\t\t{
\t\t\t"dpad_north"\t"key_press W, Forward"
\t\t\t"dpad_south"\t"key_press S, Back"
\t\t\t"dpad_east"\t"key_press D, Strafe right"
\t\t\t"dpad_west"\t"key_press A, Strafe left"
\t\t\t"click"\t\t"key_press LEFT_SHIFT, Sprint"
\t\t}
\t\t"settings" { "requires_click" "0" }
\t}
\t"group"
\t{
\t\t"id"\t\t"2"
\t\t"mode"\t\t"trigger"
\t\t"bindings" { "click" "mouse_button LEFT, Fire" }
\t\t"settings" { "output_trigger" "2" }
\t}
\t"group"
\t{
\t\t"id"\t\t"3"
\t\t"mode"\t\t"trigger"
\t\t"bindings" { "click" "mouse_button RIGHT, Aim" }
\t\t"settings" { "output_trigger" "1" }
\t}
\t"preset"
\t{
\t\t"id"\t\t"0"
\t\t"name"\t\t"Default"
\t\t"group_source_bindings"
\t\t{
\t\t\t"0"\t"right_trackpad active"
\t\t\t"1"\t"left_trackpad active"
\t\t\t"2"\t"right_trigger active"
\t\t\t"3"\t"left_trigger active"
\t\t}
\t}
` +
    FOOTER,
};

const STRATEGY: Template = {
  id: 'strategy',
  name: 'Strategy / RTS',
  description: 'Both trackpads as mouse; left as control-group / hotkey grid; right as cursor.',
  tags: ['strategy', 'rts', 'mouse', 'keyboard'],
  vdf:
    HEADER('Strategy / RTS', 'Mouse + hotkeys starter — Padsmith') +
    `\t"actions"
\t{
\t\t"Default"\t{ "title" "Default"\t"legacy_set" "0" }
\t}
\t"group"
\t{
\t\t"id"\t\t"0"
\t\t"mode"\t\t"absolute_mouse"
\t}
\t"group"
\t{
\t\t"id"\t\t"1"
\t\t"mode"\t\t"touch_menu"
\t\t"bindings"
\t\t{
\t\t\t"touch_menu_button_0"\t"key_press 1, CG 1"
\t\t\t"touch_menu_button_1"\t"key_press 2, CG 2"
\t\t\t"touch_menu_button_2"\t"key_press 3, CG 3"
\t\t\t"touch_menu_button_3"\t"key_press 4, CG 4"
\t\t\t"touch_menu_button_4"\t"key_press 5, CG 5"
\t\t\t"touch_menu_button_5"\t"key_press 6, CG 6"
\t\t\t"touch_menu_button_6"\t"key_press 7, CG 7"
\t\t\t"touch_menu_button_7"\t"key_press 8, CG 8"
\t\t\t"touch_menu_button_8"\t"key_press 9, CG 9"
\t\t}
\t\t"settings" { "touch_menu_button_count" "9" }
\t}
\t"preset"
\t{
\t\t"id"\t\t"0"
\t\t"name"\t\t"Default"
\t\t"group_source_bindings"
\t\t{
\t\t\t"0"\t"right_trackpad active"
\t\t\t"1"\t"left_trackpad active"
\t\t}
\t}
` +
    FOOTER,
};

const EMULATION: Template = {
  id: 'emulation',
  name: 'Emulation hotbar',
  description:
    'Right trackpad as a 12-slot touch menu (save/load slots, fast-forward, screenshot).',
  tags: ['emulation', 'retroarch', 'hotbar', 'emudeck'],
  vdf:
    HEADER('Emulation hotbar', 'Save-state hotbar starter — Padsmith') +
    `\t"actions"
\t{
\t\t"Default"\t{ "title" "Default"\t"legacy_set" "0" }
\t}
\t"group"
\t{
\t\t"id"\t\t"0"
\t\t"mode"\t\t"four_buttons"
\t\t"bindings"
\t\t{
\t\t\t"button_A"\t"xinput_button A"
\t\t\t"button_B"\t"xinput_button B"
\t\t\t"button_X"\t"xinput_button X"
\t\t\t"button_Y"\t"xinput_button Y"
\t\t}
\t}
\t"group"
\t{
\t\t"id"\t\t"1"
\t\t"mode"\t\t"touch_menu"
\t\t"bindings"
\t\t{
\t\t\t"touch_menu_button_0"\t"key_press F1, Save state 1"
\t\t\t"touch_menu_button_1"\t"key_press F2, Save state 2"
\t\t\t"touch_menu_button_2"\t"key_press F3, Save state 3"
\t\t\t"touch_menu_button_3"\t"key_press F4, Save state 4"
\t\t\t"touch_menu_button_4"\t"key_press F5, Load state 1"
\t\t\t"touch_menu_button_5"\t"key_press F6, Load state 2"
\t\t\t"touch_menu_button_6"\t"key_press F7, Load state 3"
\t\t\t"touch_menu_button_7"\t"key_press F8, Load state 4"
\t\t\t"touch_menu_button_8"\t"key_press SPACE, Fast forward"
\t\t\t"touch_menu_button_9"\t"key_press F12, Screenshot"
\t\t\t"touch_menu_button_10"\t"key_press P, Pause"
\t\t\t"touch_menu_button_11"\t"key_press ESCAPE, Menu"
\t\t}
\t\t"settings" { "touch_menu_button_count" "12" }
\t}
\t"preset"
\t{
\t\t"id"\t\t"0"
\t\t"name"\t\t"Default"
\t\t"group_source_bindings"
\t\t{
\t\t\t"0"\t"button_diamond active"
\t\t\t"1"\t"right_trackpad active"
\t\t}
\t}
` +
    FOOTER,
};

export const TEMPLATES: Template[] = [EMPTY_DECK, FPS_PRESET, STRATEGY, EMULATION];

export function templateById(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id);
}
