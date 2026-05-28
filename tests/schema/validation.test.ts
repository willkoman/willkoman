import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseVdf } from '../../src/lib/vdf';
import { configFromVdf, validate } from '../../src/lib/schema';

const load = (name: string) =>
  configFromVdf(
    parseVdf(readFileSync(join(import.meta.dirname, '..', 'vdf', 'fixtures', name), 'utf-8'))
  );

describe('validate', () => {
  it('returns no errors on a clean fixture', () => {
    const findings = validate(load('minimal.vdf'));
    const errors = findings.filter((f) => f.severity === 'error');
    expect(errors).toEqual([]);
  });

  it('reports preset → missing group reference as an error', () => {
    const cfg = configFromVdf(
      parseVdf(`
      "controller_mappings" {
        "version" "3"
        "actions" { "Default" { "title" "Default" } }
        "group" { "id" "0" "mode" "four_buttons" }
        "preset" {
          "id" "0" "name" "Default"
          "group_source_bindings" { "99" "button_diamond active" }
        }
      }
    `)
    );
    const findings = validate(cfg);
    const err = findings.find((f) => f.code === 'preset-missing-group-ref');
    expect(err).toBeDefined();
    expect(err!.severity).toBe('error');
    expect(err!.message).toMatch(/#99/);
  });

  it('reports duplicate group ids as errors', () => {
    const cfg = configFromVdf(
      parseVdf(`
      "controller_mappings" {
        "version" "3"
        "group" { "id" "0" "mode" "four_buttons" }
        "group" { "id" "0" "mode" "dpad" }
      }
    `)
    );
    const findings = validate(cfg);
    const err = findings.find((f) => f.code === 'duplicate-group-id');
    expect(err).toBeDefined();
    expect(err!.message).toMatch(/2 times/);
  });

  it('flags an undocumented touch_menu slot count as an error', () => {
    const cfg = configFromVdf(
      parseVdf(`
      "controller_mappings" {
        "version" "3"
        "group" {
          "id" "0" "mode" "touch_menu"
          "settings" { "touch_menu_button_count" "5" }
        }
      }
    `)
    );
    const findings = validate(cfg);
    expect(findings.some((f) => f.code === 'touch-menu-bad-count')).toBe(true);
  });

  it('warns on an unverified touch_menu layout (count 13)', () => {
    const cfg = configFromVdf(
      parseVdf(`
      "controller_mappings" {
        "version" "3"
        "group" {
          "id" "0" "mode" "touch_menu"
          "settings" { "touch_menu_button_count" "13" }
        }
      }
    `)
    );
    const findings = validate(cfg);
    expect(findings.some((f) => f.code === 'touch-menu-unverified-layout')).toBe(true);
  });

  it('warns about >8 radial slots on a button source', () => {
    const cfg = configFromVdf(
      parseVdf(`
      "controller_mappings" {
        "version" "3"
        "group" {
          "id" "5" "mode" "radial_menu"
          "settings" { "touch_menu_button_count" "12" }
        }
        "preset" {
          "id" "0" "name" "Default"
          "group_source_bindings" { "5" "button_diamond active" }
        }
      }
    `)
    );
    const findings = validate(cfg);
    expect(findings.some((f) => f.code === 'radial-menu-button-source-too-many')).toBe(true);
  });

  it('errors on a radial menu with >20 slots', () => {
    const cfg = configFromVdf(
      parseVdf(`
      "controller_mappings" {
        "version" "3"
        "group" {
          "id" "0" "mode" "radial_menu"
          "settings" { "touch_menu_button_count" "30" }
        }
      }
    `)
    );
    const findings = validate(cfg);
    expect(findings.some((f) => f.code === 'radial-menu-too-many-slots')).toBe(true);
  });

  it('reports orphan action sets as info, not error', () => {
    const cfg = configFromVdf(
      parseVdf(`
      "controller_mappings" {
        "version" "3"
        "actions" {
          "Default" { "title" "Default" }
          "Unused"  { "title" "Unused"  }
        }
      }
    `)
    );
    const findings = validate(cfg);
    const orphan = findings.find(
      (f) => f.code === 'action-set-no-preset' && f.target?.id === 'Unused'
    );
    expect(orphan?.severity).toBe('info');
  });

  it('sorts findings by severity (errors → warns → infos)', () => {
    // Multiple findings of different severities should come out sorted.
    const cfg = configFromVdf(
      parseVdf(`
      "controller_mappings" {
        "version" "3"
        "actions" { "Unused" { "title" "Unused" } }
        "group" { "id" "0" "mode" "four_buttons" }
        "group" { "id" "0" "mode" "dpad" }
      }
    `)
    );
    const findings = validate(cfg);
    const ranks = { error: 0, warn: 1, info: 2 };
    for (let i = 1; i < findings.length; i++) {
      expect(ranks[findings[i]!.severity]).toBeGreaterThanOrEqual(ranks[findings[i - 1]!.severity]);
    }
  });

  it('does not crash on real fixtures and only flags expected items', () => {
    // ps5 fixture is clean → no errors
    const ps5 = validate(load('ps5-trigger-effects.vdf'));
    expect(ps5.filter((f) => f.severity === 'error')).toEqual([]);
    // complex-action-layers fixture: AimDownSights/Crouch/Boost are action LAYERS, not sets,
    // so the orphan-action-set check should still pass (they live in action_layers, not actions).
    const layers = validate(load('complex-action-layers.vdf'));
    expect(layers.filter((f) => f.severity === 'error')).toEqual([]);
  });
});
