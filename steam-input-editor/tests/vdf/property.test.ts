/**
 * Property-based fuzz tests for the VDF parser/serializer.
 *
 * Goal: for any grammar-valid VDF document `d`, both invariants hold:
 *   I1) parse(serialize(parse(d))) is structurally equal to parse(d)
 *   I2) serialize(parse(d)) is byte-stable when serialized a second time
 *
 * If either invariant breaks under a fuzzed input, we want to see the
 * minimal counterexample fast-check produces, not a vague timeout.
 *
 * The arbitrary builds a tree of `{key, value}` entries with realistic
 * shapes: short alphanumeric keys, optional duplicates, occasional escape-
 * worthy characters in values, two levels of nesting max (keeps shrinking
 * fast and runtimes low).
 */

import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { parseVdf, serializeVdf } from '../../src/lib/vdf';

const keyArb = fc
  .stringMatching(/^[a-z_][a-z0-9_]{0,16}$/)
  .filter((s) => s.length > 0 && !/^\/\//.test(s));

const leafValueArb = fc.oneof(
  fc.stringMatching(/^[A-Za-z0-9 _-]{0,40}$/),
  // Some values include characters that the serializer must escape
  fc.constantFrom('with "quoted" inside', 'tab\there', 'newline\\nhere', 'back\\slash')
);

const blockArb: fc.Arbitrary<{ key: string; value: string | { entries: unknown[] } }[]> = fc.letrec(
  (tie) => ({
    block: fc.array(
      fc.record({
        key: keyArb,
        value: fc.oneof(
          { weight: 3, arbitrary: leafValueArb as fc.Arbitrary<unknown> },
          { weight: 1, arbitrary: fc.record({ entries: tie('block') }) as fc.Arbitrary<unknown> }
        ),
      }),
      { maxLength: 8 }
    ),
  })
).block as fc.Arbitrary<{ key: string; value: string | { entries: unknown[] } }[]>;

/** Hand-serialize an arbitrary's output into VDF text we can feed the parser. */
function arbToVdf(entries: { key: string; value: unknown }[]): string {
  const esc = (s: string) =>
    s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\t/g, '\\t');
  const emit = (es: { key: string; value: unknown }[], depth: number): string => {
    const indent = '\t'.repeat(depth);
    return es
      .map((e) => {
        if (typeof e.value === 'string') {
          return `${indent}"${esc(e.key)}"\t\t"${esc(e.value)}"`;
        }
        const inner = (e.value as { entries: { key: string; value: unknown }[] }).entries;
        return `${indent}"${esc(e.key)}"\n${indent}{\n${emit(inner, depth + 1)}\n${indent}}`;
      })
      .join('\n');
  };
  return emit(entries, 0) + '\n';
}

describe('property: VDF round-trip', () => {
  it('parse(serialize(parse(d))) is structurally equal to parse(d)', () => {
    fc.assert(
      fc.property(blockArb, (entries) => {
        const text = arbToVdf(entries);
        const first = parseVdf(text);
        const second = parseVdf(serializeVdf(first));
        expect(second).toEqual(first);
      }),
      { numRuns: 200 }
    );
  });

  it('serialize(parse(d)) is idempotent when serialized again', () => {
    fc.assert(
      fc.property(blockArb, (entries) => {
        const text = arbToVdf(entries);
        const ast = parseVdf(text);
        const a = serializeVdf(ast);
        const b = serializeVdf(parseVdf(a));
        expect(b).toBe(a);
      }),
      { numRuns: 200 }
    );
  });
});
