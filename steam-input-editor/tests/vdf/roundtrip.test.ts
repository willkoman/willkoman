import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseVdf, serializeVdf } from '../../src/lib/vdf';

const fixture = (name: string) =>
  readFileSync(join(import.meta.dirname, 'fixtures', name), 'utf-8');

/**
 * Parse → serialize → parse should produce an equivalent AST.
 *
 * We don't expect byte-exact text equivalence (whitespace normalises), but
 * the second parse must produce the same logical tree. This protects against
 * silent data loss in the parser/serializer round trip.
 */
function structurallyEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

describe('round trip', () => {
  for (const name of ['minimal.vdf', 'gtav-v2.vdf', 'touch-menu.vdf']) {
    it(`parses → serializes → parses to an equivalent AST for ${name}`, () => {
      const text = fixture(name);
      const first = parseVdf(text);
      const out = serializeVdf(first);
      const second = parseVdf(out);
      expect(structurallyEqual(first, second)).toBe(true);
    });

    it(`serializing twice is idempotent for ${name}`, () => {
      const text = fixture(name);
      const ast = parseVdf(text);
      const a = serializeVdf(ast);
      const b = serializeVdf(parseVdf(a));
      expect(a).toBe(b);
    });
  }
});
