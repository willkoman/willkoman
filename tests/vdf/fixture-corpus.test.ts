/**
 * Trust-layer corpus test.
 *
 * Every fixture under tests/vdf/fixtures/*.vdf must:
 *   1. Parse without throwing.
 *   2. Round-trip byte-stably (serialize → parse → serialize is idempotent).
 *   3. Project to a typed SteamInputConfig with sane fields.
 *
 * As we collect more real-world configs from SteamInputDB and friends, this
 * suite grows automatically — every file in the fixtures directory is
 * picked up. The bar is "never silently corrupt a user's file."
 */

import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parseVdf, serializeVdf } from '../../src/lib/vdf';
import { configFromVdf } from '../../src/lib/schema';

const fixturesDir = join(import.meta.dirname, 'fixtures');
const fixtures = readdirSync(fixturesDir).filter((f) => f.endsWith('.vdf'));

describe('fixture corpus — every .vdf in tests/vdf/fixtures/', () => {
  it('discovers at least one fixture', () => {
    expect(fixtures.length).toBeGreaterThanOrEqual(1);
  });

  for (const name of fixtures) {
    describe(name, () => {
      const text = readFileSync(join(fixturesDir, name), 'utf-8');

      it('parses without throwing', () => {
        expect(() => parseVdf(text)).not.toThrow();
      });

      it('serialize → parse → serialize is byte-stable', () => {
        const ast = parseVdf(text);
        const a = serializeVdf(ast);
        const b = serializeVdf(parseVdf(a));
        expect(b).toBe(a);
      });

      it('parse → serialize → parse yields structurally-equal AST', () => {
        const first = parseVdf(text);
        const second = parseVdf(serializeVdf(first));
        expect(second).toEqual(first);
      });

      it('projects to a typed SteamInputConfig with version 2 or 3', () => {
        const cfg = configFromVdf(parseVdf(text));
        expect([2, 3]).toContain(cfg.version);
        expect(cfg.raw).toBeDefined();
      });
    });
  }
});

describe('cross-fixture invariants', () => {
  for (const name of fixtures) {
    it(`${name}: controller_caps (if present) is opaque string, not number`, () => {
      const cfg = configFromVdf(parseVdf(readFileSync(join(fixturesDir, name), 'utf-8')));
      if (cfg.meta.controllerCaps !== undefined) {
        expect(typeof cfg.meta.controllerCaps).toBe('string');
      }
    });

    it(`${name}: Group typed view has no fictional gameActions field`, () => {
      const cfg = configFromVdf(parseVdf(readFileSync(join(fixturesDir, name), 'utf-8')));
      for (const g of cfg.groups) {
        const bag = g as unknown as Record<string, unknown>;
        expect(bag.gameActions).toBeUndefined();
      }
    });
  }
});
