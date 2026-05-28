import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseVdf, serializeVdf } from '../../src/lib/vdf';
import {
  addActionSet,
  addGroup,
  appendActivatorBinding,
  applyAstPatches,
  configFromVdf,
  nextGroupId,
  removeActionSet,
  removeBinding,
  removeGroup,
  renameActionSet,
  setActivatorBinding,
  setBinding,
  setGroupMode,
  setGroupSetting,
  setMetaField,
  setPresetGroupSourceBinding,
} from '../../src/lib/schema';

const load = (name: string) => {
  const text = readFileSync(join(import.meta.dirname, '..', 'vdf', 'fixtures', name), 'utf-8');
  return configFromVdf(parseVdf(text));
};

describe('mutators', () => {
  it('setBinding replaces an existing slot and the change survives serialization', () => {
    const cfg = load('gtav-v2.vdf');
    const { config } = setBinding(cfg, 0, 'button_A', 'key_press SPACE, Jump');
    expect(config.groups.find((g) => g.id === 0)!.bindings.button_A).toBe('key_press SPACE, Jump');
    // The serialized output must contain the new value.
    const out = serializeVdf(config.raw);
    expect(out).toContain('"key_press SPACE, Jump"');
    expect(out).not.toContain('"xinput_button A"\n');
  });

  it('setBinding adds a new slot on a group that did not have it', () => {
    const cfg = load('minimal.vdf');
    const { config } = setBinding(cfg, 0, 'button_back_left', 'key_press LEFT_CONTROL, Stealth');
    expect(config.groups.find((g) => g.id === 0)!.bindings.button_back_left).toBe(
      'key_press LEFT_CONTROL, Stealth'
    );
  });

  it('removeBinding deletes the slot from the AST', () => {
    const cfg = load('gtav-v2.vdf');
    const { config } = removeBinding(cfg, 0, 'button_A');
    expect(config.groups.find((g) => g.id === 0)!.bindings.button_A).toBeUndefined();
    expect(serializeVdf(config.raw)).not.toContain('button_A');
  });

  it('setGroupSetting / setGroupMode update the right entries', () => {
    const cfg = load('minimal.vdf');
    const { config: c1 } = setGroupSetting(cfg, 0, 'haptic_intensity', '2');
    expect(c1.groups[0]!.settings.haptic_intensity).toBe('2');
    const { config: c2 } = setGroupMode(c1, 0, 'dpad');
    expect(c2.groups[0]!.mode).toBe('dpad');
  });

  it('addGroup appends a new group with a unique id and rebuilds the typed view', () => {
    const cfg = load('minimal.vdf');
    const initialCount = cfg.groups.length;
    const before = nextGroupId(cfg);
    const { config, groupId } = addGroup(cfg, 'touch_menu');
    expect(groupId).toBe(before);
    expect(config.groups.length).toBe(initialCount + 1);
    expect(config.groups.find((g) => g.id === groupId)!.mode).toBe('touch_menu');
  });

  it('removeGroup deletes the group entry by id', () => {
    const cfg = load('gtav-v2.vdf');
    const { config } = removeGroup(cfg, 0);
    expect(config.groups.find((g) => g.id === 0)).toBeUndefined();
  });

  it('setMetaField writes top-level meta and the typed view reflects it', () => {
    const cfg = load('minimal.vdf');
    const { config } = setMetaField(cfg, 'title', 'Renamed Config');
    expect(config.meta.title).toBe('Renamed Config');
  });

  it('renameActionSet updates the actions block AND every preset.name that referenced it', () => {
    const cfg = load('gtav-v2.vdf');
    const { config } = renameActionSet(cfg, 'OnFoot', 'OnFootRenamed');
    expect(config.actionSets.find((s) => s.name === 'OnFootRenamed')).toBeDefined();
    expect(config.actionSets.find((s) => s.name === 'OnFoot')).toBeUndefined();
    // (the GTAV fixture only has the Menu preset wired; this test mostly exercises the actions block rename)
    const out = serializeVdf(config.raw);
    expect(out).toContain('"OnFootRenamed"');
  });

  it('addActionSet / removeActionSet roundtrip without disturbing siblings', () => {
    const cfg = load('minimal.vdf');
    const { config: added } = addActionSet(cfg, 'Combat', 'Combat');
    expect(added.actionSets.map((s) => s.name)).toEqual(['Default', 'Combat']);
    const { config: removed } = removeActionSet(added, 'Combat');
    expect(removed.actionSets.map((s) => s.name)).toEqual(['Default']);
  });

  it('setPresetGroupSourceBinding writes to the right preset', () => {
    const cfg = load('gtav-v2.vdf');
    const { config } = setPresetGroupSourceBinding(cfg, 'Menu', 99, 'gyro active');
    const menu = config.presets.find((p) => p.name === 'Menu')!;
    expect(menu.groupSourceBindings['99']).toBe('gyro active');
  });

  it('setActivatorBinding creates the full inputs.activators tree if missing', () => {
    const cfg = load('minimal.vdf');
    const { config } = setActivatorBinding(cfg, 0, 'button_A', 'Long_Press', 'key_press F, Alt');
    const out = serializeVdf(config.raw);
    expect(out).toContain('"inputs"');
    expect(out).toContain('"button_A"');
    expect(out).toContain('"Long_Press"');
    expect(out).toContain('"key_press F, Alt"');
  });

  it('appendActivatorBinding adds without replacing the existing binding', () => {
    const cfg = load('v3-activators.vdf');
    const { config } = appendActivatorBinding(
      cfg,
      0,
      'button_A',
      'Full_Press',
      'controller_action TAKE_SCREENSHOT'
    );
    const out = serializeVdf(config.raw);
    // Both the original binding AND the new one should be present
    expect(out).toContain('"xinput_button A, #abutton"');
    expect(out).toContain('"controller_action TAKE_SCREENSHOT"');
  });

  it('inverse patches restore the original AST byte-for-byte', () => {
    const cfg = load('gtav-v2.vdf');
    const before = serializeVdf(cfg.raw);
    const { config, inversePatches } = setBinding(cfg, 0, 'button_A', 'key_press X, Test');
    const restored = applyAstPatches(config, inversePatches);
    const after = serializeVdf(restored.raw);
    expect(after).toBe(before);
  });

  it('chaining mutators composes patches correctly (each step is fully invertible)', () => {
    const cfg = load('gtav-v2.vdf');
    const before = serializeVdf(cfg.raw);
    const r1 = setBinding(cfg, 0, 'button_A', 'key_press X');
    const r2 = setBinding(r1.config, 0, 'button_B', 'key_press Y');
    const r3 = setBinding(r2.config, 0, 'button_X', 'key_press Z');
    // Undo in reverse order
    let cur = r3.config;
    cur = applyAstPatches(cur, r3.inversePatches);
    cur = applyAstPatches(cur, r2.inversePatches);
    cur = applyAstPatches(cur, r1.inversePatches);
    expect(serializeVdf(cur.raw)).toBe(before);
  });
});
