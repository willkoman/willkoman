import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseVdf, serializeVdf } from '../../src/lib/vdf';
import { configFromVdf } from '../../src/lib/schema';

const fixture = readFileSync(join(import.meta.dirname, 'fixtures', 'v3-activators.vdf'), 'utf-8');

describe('V3 activator fixture', () => {
  it('parses without throwing and the typed view picks up groups + activators inputs blocks', () => {
    const cfg = configFromVdf(parseVdf(fixture));
    expect(cfg.version).toBe(3);
    expect(cfg.meta.controllerType).toBe('controller_neptune');
    // controller_caps is opaque string, never parsed to int
    expect(cfg.meta.controllerCaps).toBe('1590271');
    expect(typeof cfg.meta.controllerCaps).toBe('string');
    // Group 0 has an inputs block (activators); group 1 has flat bindings (touch menu)
    const g0 = cfg.groups.find((g) => g.id === 0)!;
    expect(g0.inputs).toBeDefined();
    const g1 = cfg.groups.find((g) => g.id === 1)!;
    expect(g1.inputs).toBeUndefined();
    expect(Object.keys(g1.bindings).length).toBe(13);
  });

  it('reads action layers with parent_set_name', () => {
    const cfg = configFromVdf(parseVdf(fixture));
    expect(cfg.actionLayers).toEqual([
      {
        name: 'AimDownSights',
        title: 'Aim Down Sights',
        parentSetName: 'Combat',
        isLayer: true,
      },
    ]);
  });

  it('round-trips byte-stably', () => {
    const ast = parseVdf(fixture);
    const a = serializeVdf(ast);
    const b = serializeVdf(parseVdf(a));
    expect(b).toBe(a);
  });

  it('preserves the repeating `binding` keys inside an activator on round-trip', () => {
    // button_B in fixture has two `binding` entries on Full_Press; both must survive.
    const ast = parseVdf(fixture);
    const out = serializeVdf(ast);
    const bbStart = out.indexOf('"button_B"');
    expect(bbStart).toBeGreaterThan(-1);
    const bbSection = out.slice(bbStart, bbStart + 800);
    const bindingCount = (bbSection.match(/"binding"/g) ?? []).length;
    expect(bindingCount).toBe(2);
  });
});
