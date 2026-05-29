import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseVdf, serializeVdf } from '../../src/lib/vdf';
import { configFromVdf, swapBindings } from '../../src/lib/schema';

const load = (name: string) =>
  configFromVdf(
    parseVdf(readFileSync(join(import.meta.dirname, '..', 'vdf', 'fixtures', name), 'utf-8'))
  );

describe('swapBindings', () => {
  it('exchanges two bound slots', () => {
    const cfg = load('gtav-v2.vdf');
    const { config } = swapBindings(cfg, 0, 'button_A', 'button_B');
    const g = config.groups.find((g) => g.id === 0)!;
    expect(g.bindings.button_A).toBe('xinput_button B');
    expect(g.bindings.button_B).toBe('xinput_button A');
  });

  it('moves a bound slot to an empty one when target is empty', () => {
    const cfg = load('minimal.vdf');
    // minimal.vdf group 0 binds button_A..Y; pick an empty key for target.
    const { config } = swapBindings(cfg, 0, 'button_A', 'button_back_left');
    const g = config.groups.find((g) => g.id === 0)!;
    expect(g.bindings.button_A).toBeUndefined();
    expect(g.bindings.button_back_left).toBe('xinput_button A');
  });

  it('is a no-op when both slots are empty', () => {
    const cfg = load('minimal.vdf');
    const before = serializeVdf(cfg.raw);
    const { config } = swapBindings(cfg, 0, 'never_bound_a', 'never_bound_b');
    expect(serializeVdf(config.raw)).toBe(before);
  });

  it('round-trip stays byte-stable: swap then swap back equals original', () => {
    const cfg = load('gtav-v2.vdf');
    const before = serializeVdf(cfg.raw);
    const step1 = swapBindings(cfg, 0, 'button_A', 'button_B');
    const step2 = swapBindings(step1.config, 0, 'button_A', 'button_B');
    expect(serializeVdf(step2.config.raw)).toBe(before);
  });
});
