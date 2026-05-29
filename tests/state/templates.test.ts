import { describe, expect, it } from 'vitest';
import { parseVdf, serializeVdf } from '../../src/lib/vdf';
import { configFromVdf, validate } from '../../src/lib/schema';
import { TEMPLATES, templateById } from '../../src/lib/state/templates';
import { gameHintFromFilename, makeRecentId } from '../../src/lib/state/idb';

describe('templates', () => {
  it('exposes the four built-in templates', () => {
    const ids = TEMPLATES.map((t) => t.id);
    expect(ids).toEqual(['empty-deck', 'fps', 'strategy', 'emulation']);
  });

  for (const tpl of TEMPLATES) {
    it(`${tpl.id}: parses cleanly`, () => {
      expect(() => parseVdf(tpl.vdf)).not.toThrow();
    });

    it(`${tpl.id}: round-trips byte-stably`, () => {
      const a = serializeVdf(parseVdf(tpl.vdf));
      const b = serializeVdf(parseVdf(a));
      expect(b).toBe(a);
    });

    it(`${tpl.id}: produces a typed config with at least one action set and preset`, () => {
      const cfg = configFromVdf(parseVdf(tpl.vdf));
      expect(cfg.actionSets.length).toBeGreaterThanOrEqual(1);
      expect(cfg.presets.length).toBeGreaterThanOrEqual(1);
    });

    it(`${tpl.id}: passes validation with zero errors`, () => {
      const findings = validate(configFromVdf(parseVdf(tpl.vdf)));
      const errors = findings.filter((f) => f.severity === 'error');
      expect(errors).toEqual([]);
    });
  }

  it('templateById resolves known ids and returns undefined for unknown', () => {
    expect(templateById('fps')?.name).toBe('FPS preset');
    expect(templateById('does-not-exist')).toBeUndefined();
  });
});

describe('IDB helpers', () => {
  it('makeRecentId is stable for identical inputs and unique for different inputs', () => {
    const a = makeRecentId('foo.vdf', 100, 1000);
    const b = makeRecentId('foo.vdf', 100, 1000);
    const c = makeRecentId('foo.vdf', 100, 1001);
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });

  it('gameHintFromFilename extracts the appid from controller_neptune_<appid>.vdf', () => {
    expect(gameHintFromFilename('controller_neptune_440.vdf')).toBe('440');
    expect(gameHintFromFilename('controller_xbox360_730.vdf')).toBe('730');
    expect(gameHintFromFilename('controller_ps5_2767030.vdf')).toBe('2767030');
  });

  it('gameHintFromFilename falls back to a bare numeric filename', () => {
    expect(gameHintFromFilename('440.vdf')).toBe('440');
  });

  it('gameHintFromFilename returns undefined for unrecognised filenames', () => {
    expect(gameHintFromFilename('my-custom.vdf')).toBeUndefined();
  });
});
