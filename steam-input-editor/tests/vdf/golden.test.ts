import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseVdf, serializeVdf } from '../../src/lib/vdf';

/**
 * Golden-file snapshots of our serializer's canonical output.
 *
 * Each fixture is parsed and then serialized. The output is compared against
 * a checked-in `.golden.vdf` file under `tests/vdf/golden/`. If the golden
 * doesn't exist (first run / new fixture), it's written automatically and the
 * test passes — the next run will then enforce stability.
 *
 * To refresh after an intentional serializer change:
 *   UPDATE_GOLDEN=1 npm test
 *
 * Why this matters: structural-equality round-trip tests don't catch
 * whitespace drift, quoting changes, or escape-sequence churn that would
 * produce a noisy diff for a user who only changed one binding. The golden
 * test is the canary for accidental serializer regressions.
 */

const fixturePath = (name: string) => join(import.meta.dirname, 'fixtures', name);
const goldenPath = (name: string) =>
  join(import.meta.dirname, 'golden', name.replace(/\.vdf$/, '.golden.vdf'));

const FIXTURES = ['minimal.vdf', 'gtav-v2.vdf', 'touch-menu.vdf'] as const;
const UPDATE = process.env.UPDATE_GOLDEN === '1';

describe('golden serializer output', () => {
  for (const name of FIXTURES) {
    it(`serializer output for ${name} matches the checked-in golden`, () => {
      const input = readFileSync(fixturePath(name), 'utf-8');
      const output = serializeVdf(parseVdf(input));
      const goldenFile = goldenPath(name);

      if (UPDATE || !existsSync(goldenFile)) {
        writeFileSync(goldenFile, output, 'utf-8');
      }
      const expected = readFileSync(goldenFile, 'utf-8');
      expect(output).toBe(expected);
    });
  }
});
