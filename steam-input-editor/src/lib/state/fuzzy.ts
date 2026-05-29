/**
 * Tiny fuzzy matcher used by the command palette.
 *
 * Returns a score (higher = better match) and the matched-character indices
 * for highlight rendering. Returns null if any query character is missing
 * in order. This is a deliberately simple implementation — not as good as
 * fzf, but ~50 lines of dependency-free code that handles "wtm" → "Wire
 * Touch Menu" cleanly.
 *
 * Scoring heuristics:
 *   - +10 per consecutive matched character (rewards prefixes)
 *   - +6  if matched char follows a word boundary (space, hyphen, _, /)
 *   - +3  if matched char is uppercase (CamelCase initials)
 *   - +1  per matched char (baseline)
 *   - -2  per gap character between matches (penalises sparse matches)
 *   - +50 if query is a prefix of the target
 */

export interface FuzzyResult {
  score: number;
  indices: number[];
}

export function fuzzyScore(query: string, target: string): FuzzyResult | null {
  const q = query.toLowerCase();
  const t = target;
  const tl = target.toLowerCase();
  if (q.length === 0) return { score: 0, indices: [] };
  if (q.length > t.length) return null;

  const indices: number[] = [];
  let ti = 0;
  let score = 0;
  let lastMatched = -2;
  let prevChar = ' ';

  for (let qi = 0; qi < q.length; qi++) {
    const qc = q[qi]!;
    let found = -1;
    while (ti < tl.length) {
      if (tl[ti] === qc) {
        found = ti;
        break;
      }
      prevChar = t[ti] ?? ' ';
      ti++;
    }
    if (found === -1) return null;

    score += 1;
    if (found === lastMatched + 1) score += 10;
    if (isBoundary(prevChar)) score += 6;
    const ch = t[found]!;
    if (ch === ch.toUpperCase() && ch !== ch.toLowerCase()) score += 3;

    const gap = found - lastMatched - 1;
    if (lastMatched >= 0) score -= Math.min(gap * 2, 10);

    indices.push(found);
    lastMatched = found;
    prevChar = ch;
    ti = found + 1;
  }

  if (tl.startsWith(q)) score += 50;
  return { score, indices };
}

function isBoundary(ch: string): boolean {
  return ch === ' ' || ch === '_' || ch === '-' || ch === '/' || ch === '.';
}

/** Rank items by fuzzy score against the query, dropping non-matches. */
export function fuzzyFilter<T>(
  items: T[],
  query: string,
  getLabel: (item: T) => string
): Array<{ item: T; result: FuzzyResult }> {
  if (!query.trim()) return items.map((item) => ({ item, result: { score: 0, indices: [] } }));
  const scored: Array<{ item: T; result: FuzzyResult }> = [];
  for (const item of items) {
    const result = fuzzyScore(query, getLabel(item));
    if (result) scored.push({ item, result });
  }
  scored.sort((a, b) => b.result.score - a.result.score);
  return scored;
}
