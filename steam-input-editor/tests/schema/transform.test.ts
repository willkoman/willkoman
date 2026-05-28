import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseVdf } from '../../src/lib/vdf';
import { configFromVdf } from '../../src/lib/schema';

const fixture = (name: string) =>
  readFileSync(join(import.meta.dirname, '..', 'vdf', 'fixtures', name), 'utf-8');

describe('configFromVdf', () => {
  it('throws when given non-controller_mappings input', () => {
    const ast = parseVdf('"other_root" { "k" "v" }');
    expect(() => configFromVdf(ast)).toThrow(/controller_mappings/);
  });

  it('reads version, meta, and action sets from the minimal fixture', () => {
    const ast = parseVdf(fixture('minimal.vdf'));
    const cfg = configFromVdf(ast);
    expect(cfg.version).toBe(3);
    expect(cfg.meta.title).toBe('Minimal Test');
    expect(cfg.meta.controllerType).toBe('controller_neptune');
    expect(cfg.actionSets).toEqual([{ name: 'Default', title: 'Default', legacy: true }]);
  });

  it('preserves controller_caps as an opaque string (never parses the bitmask)', () => {
    // Bit semantics are not publicly documented; wrong caps silently hides
    // configs from Steam's picker. We round-trip verbatim and never recompute.
    const ast = parseVdf(`"controller_mappings" {
      "version" "3"
      "controller_type" "controller_xboxone"
      "controller_caps" "1590271"
    }`);
    const cfg = configFromVdf(ast);
    expect(cfg.meta.controllerCaps).toBe('1590271');
    expect(typeof cfg.meta.controllerCaps).toBe('string');
  });

  it('does NOT read a fictional gameactions sub-block on group (the field does not exist)', () => {
    const ast = parseVdf(`"controller_mappings" {
      "version" "3"
      "group" {
        "id" "0"
        "mode" "four_buttons"
        "gameactions" { "ignored" "by_us" }
      }
    }`);
    const cfg = configFromVdf(ast);
    expect(cfg.groups[0]).toBeDefined();
    // The Group type has no gameActions field — TypeScript won't even let us
    // reference it, but the runtime object should also not carry it.
    const groupBag = cfg.groups[0] as unknown as Record<string, unknown>;
    expect(groupBag.gameActions).toBeUndefined();
  });

  it('reads groups and presets from the GTAV fixture (v2 legacy)', () => {
    const ast = parseVdf(fixture('gtav-v2.vdf'));
    const cfg = configFromVdf(ast);
    expect(cfg.version).toBe(2);
    expect(cfg.actionSets.map((s) => s.name)).toEqual([
      'Menu',
      'OnFoot',
      'InVehicle',
      'InFlyingVehicle',
    ]);
    expect(cfg.groups.length).toBeGreaterThanOrEqual(6);
    const group0 = cfg.groups.find((g) => g.id === 0)!;
    expect(group0.mode).toBe('four_buttons');
    expect(group0.bindings.button_A).toBe('xinput_button A');
    const menuPreset = cfg.presets.find((p) => p.name === 'Menu')!;
    expect(menuPreset.groupSourceBindings['0']).toBe('button_diamond active');
    expect(menuPreset.switchBindings['left_bumper']).toBe('xinput_button SHOULDER_LEFT');
  });

  it('reads touch and radial menu groups', () => {
    const ast = parseVdf(fixture('touch-menu.vdf'));
    const cfg = configFromVdf(ast);
    const touchGroup = cfg.groups.find((g) => g.mode === 'touch_menu')!;
    expect(touchGroup.settings.touch_menu_button_count).toBe('9');
    expect(touchGroup.bindings.touch_menu_button_0).toBe('key_press 1, Slot 1');
    const radial = cfg.groups.find((g) => g.mode === 'radial_menu')!;
    expect(Object.keys(radial.bindings)).toHaveLength(8);
  });

  it('preserves the raw AST on the typed view', () => {
    const ast = parseVdf(fixture('minimal.vdf'));
    const cfg = configFromVdf(ast);
    expect(cfg.raw).toBe(ast);
  });
});
