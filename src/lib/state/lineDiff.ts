/**
 * Line-level diff via Longest Common Subsequence.
 *
 * Returns an array of segments tagged with `kind`. The diff drawer renders
 * `added` lines on the right and `removed` lines on the left; `same` lines
 * appear on both sides. We don't compute character-level diffs — line
 * granularity is enough for the trust drawer.
 *
 * Performance: O(n*m) DP. For configs with O(2000 lines) on both sides
 * that's 4M cells, ~16 MB of int8 — fine for a one-shot computation
 * triggered by the user opening the drawer. We cap input at 10k lines
 * per side to bound worst-case memory.
 */

export type DiffSegmentKind = 'same' | 'added' | 'removed';

export interface DiffSegment {
  kind: DiffSegmentKind;
  /** 1-based line number on the left side. Undefined for `added`. */
  leftLine?: number;
  /** 1-based line number on the right side. Undefined for `removed`. */
  rightLine?: number;
  text: string;
}

const MAX_LINES = 10_000;

export function lineDiff(leftText: string, rightText: string): DiffSegment[] {
  const left = leftText.split('\n');
  const right = rightText.split('\n');

  if (left.length > MAX_LINES || right.length > MAX_LINES) {
    // Bail out to a trivial "all changed" diff; UI can render a notice.
    return [
      ...left.map((text, i) => ({ kind: 'removed' as const, leftLine: i + 1, text })),
      ...right.map((text, i) => ({ kind: 'added' as const, rightLine: i + 1, text })),
    ];
  }

  const m = left.length;
  const n = right.length;
  // dp[i][j] = LCS length of left[..i] vs right[..j]
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (left[i - 1] === right[j - 1]) {
        dp[i]![j] = dp[i - 1]![j - 1]! + 1;
      } else {
        dp[i]![j] = Math.max(dp[i - 1]![j]!, dp[i]![j - 1]!);
      }
    }
  }

  // Walk back to produce segments in reverse, then flip.
  const out: DiffSegment[] = [];
  let i = m;
  let j = n;
  while (i > 0 && j > 0) {
    if (left[i - 1] === right[j - 1]) {
      out.push({ kind: 'same', leftLine: i, rightLine: j, text: left[i - 1]! });
      i--;
      j--;
    } else if (dp[i - 1]![j]! >= dp[i]![j - 1]!) {
      out.push({ kind: 'removed', leftLine: i, text: left[i - 1]! });
      i--;
    } else {
      out.push({ kind: 'added', rightLine: j, text: right[j - 1]! });
      j--;
    }
  }
  while (i > 0) {
    out.push({ kind: 'removed', leftLine: i, text: left[i - 1]! });
    i--;
  }
  while (j > 0) {
    out.push({ kind: 'added', rightLine: j, text: right[j - 1]! });
    j--;
  }
  return out.reverse();
}

/** Summary counts for the strip header. */
export function diffSummary(segments: DiffSegment[]): {
  added: number;
  removed: number;
  same: number;
} {
  const out = { added: 0, removed: 0, same: 0 };
  for (const s of segments) out[s.kind]++;
  return out;
}
