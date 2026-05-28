import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseVdf, serializeVdf } from '../../src/lib/vdf';

const fixture = (name: string) =>
  readFileSync(join(import.meta.dirname, 'fixtures', name), 'utf-8');

/**
 * Round-trip safety net.
 *
 * Old version of this file used `JSON.stringify` for AST equality, which is
 * weaker than it looks: it agrees on key-order differences for OBJECTS (where
 * order is irrelevant) but disagrees on minor whitespace/escape changes in
 * VALUES. Since our AST uses ordered arrays of `{key, value}` entries, the
 * stringify approach happened to work by accident. We now use Vitest's
 * `toEqual` which deep-compares structurally with explicit array-order
 * semantics — that's what we actually want.
 *
 * The invariants we assert:
 *   (a) parse → serialize → parse round-trips structurally
 *   (b) serialize → parse → serialize is byte-stable (idempotent)
 *
 * What we still do NOT assert (and need a "golden file" test for):
 *   - serializer output exactly matches a canonical form per fixture
 *   - Steam itself accepts the output (requires a Deck in CI)
 */

const FIXTURES = ['minimal.vdf', 'gtav-v2.vdf', 'touch-menu.vdf'] as const;

describe('round trip', () => {
  for (const name of FIXTURES) {
    it(`parse → serialize → parse yields an equivalent AST for ${name}`, () => {
      const text = fixture(name);
      const first = parseVdf(text);
      const second = parseVdf(serializeVdf(first));
      expect(second).toEqual(first);
    });

    it(`serialize → parse → serialize is byte-stable for ${name}`, () => {
      const text = fixture(name);
      const ast = parseVdf(text);
      const a = serializeVdf(ast);
      const b = serializeVdf(parseVdf(a));
      expect(b).toBe(a);
    });
  }
});
