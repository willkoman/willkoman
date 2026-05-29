import { describe, expect, it } from 'vitest';
import { fuzzyFilter, fuzzyScore } from '../../src/lib/state/fuzzy';

describe('fuzzyScore', () => {
  it('returns null when no match exists', () => {
    expect(fuzzyScore('xyz', 'hello')).toBeNull();
  });

  it('returns zero-score / empty indices for empty query', () => {
    const r = fuzzyScore('', 'anything')!;
    expect(r.score).toBe(0);
    expect(r.indices).toEqual([]);
  });

  it('matches a sparse subsequence', () => {
    const r = fuzzyScore('abc', 'apple banana cherry')!;
    expect(r.indices.length).toBe(3);
  });

  it('rewards prefix matches more than mid-string', () => {
    const prefix = fuzzyScore('jump', 'Jump to action set')!;
    const middle = fuzzyScore('jump', 'Reset and jump now')!;
    expect(prefix.score).toBeGreaterThan(middle.score);
  });

  it('rewards consecutive matches more than scattered ones', () => {
    const consec = fuzzyScore('foo', 'foobar baz')!;
    const scatter = fuzzyScore('foo', 'fxOxoxoxxx')!;
    expect(consec.score).toBeGreaterThan(scatter.score);
  });

  it('rewards CamelCase boundary matches', () => {
    const camel = fuzzyScore('atm', 'AddTouchMenu')!;
    expect(camel.score).toBeGreaterThan(0);
    expect(camel.indices).toEqual([0, 3, 8]);
  });
});

describe('fuzzyFilter', () => {
  const items = ['Apple', 'Banana', 'Avocado', 'Apricot', 'Blueberry'];

  it('returns all items unfiltered for an empty query', () => {
    const r = fuzzyFilter(items, '', (x) => x);
    expect(r.length).toBe(items.length);
  });

  it('drops non-matches', () => {
    const r = fuzzyFilter(items, 'ap', (x) => x);
    const labels = r.map((x) => x.item);
    expect(labels).toContain('Apple');
    expect(labels).toContain('Apricot');
    expect(labels).not.toContain('Banana');
    expect(labels).not.toContain('Blueberry');
  });

  it('orders by descending score (best match first)', () => {
    const r = fuzzyFilter(items, 'ap', (x) => x);
    // Both 'Apple' and 'Apricot' start with 'Ap'; 'Apple' has the 'p' adjacent.
    // Whichever wins, the order should be stable by score.
    for (let i = 1; i < r.length; i++) {
      expect(r[i]!.result.score).toBeLessThanOrEqual(r[i - 1]!.result.score);
    }
  });
});
