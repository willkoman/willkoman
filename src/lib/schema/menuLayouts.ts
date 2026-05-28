/**
 * Touch-menu slot-index → grid position mappings.
 *
 * These match how Steam renders the on-screen overlay. Slot count is fixed
 * per layout (2, 4, 7, 9, 12, 13, 16); anything else is a malformed config.
 *
 * Each layout is an array of [row, col] cells in slot order. Grid dimensions
 * are recorded in `rows` × `cols` (the maximum extent used).
 */

export interface TouchMenuLayout {
  count: number;
  rows: number;
  cols: number;
  /** Cell coords by slot index; [row, col] zero-based. */
  cells: ReadonlyArray<readonly [number, number]>;
}

export const TOUCH_MENU_LAYOUTS: Readonly<Record<number, TouchMenuLayout>> = {
  2: {
    count: 2,
    rows: 1,
    cols: 2,
    cells: [[0, 0], [0, 1]],
  },
  4: {
    count: 4,
    rows: 2,
    cols: 2,
    cells: [[0, 0], [0, 1], [1, 0], [1, 1]],
  },
  7: {
    // 2 / 3 / 2 pyramid
    count: 7,
    rows: 3,
    cols: 3,
    cells: [
      [0, 0], [0, 2],
      [1, 0], [1, 1], [1, 2],
      [2, 0], [2, 2],
    ],
  },
  9: {
    count: 9,
    rows: 3,
    cols: 3,
    cells: [
      [0, 0], [0, 1], [0, 2],
      [1, 0], [1, 1], [1, 2],
      [2, 0], [2, 1], [2, 2],
    ],
  },
  12: {
    count: 12,
    rows: 3,
    cols: 4,
    cells: [
      [0, 0], [0, 1], [0, 2], [0, 3],
      [1, 0], [1, 1], [1, 2], [1, 3],
      [2, 0], [2, 1], [2, 2], [2, 3],
    ],
  },
  13: {
    // 4 / 4 / 5 with a hanger
    count: 13,
    rows: 3,
    cols: 5,
    cells: [
      [0, 0], [0, 1], [0, 2], [0, 3],
      [1, 0], [1, 1], [1, 2], [1, 3],
      [2, 0], [2, 1], [2, 2], [2, 3], [2, 4],
    ],
  },
  16: {
    count: 16,
    rows: 4,
    cols: 4,
    cells: [
      [0, 0], [0, 1], [0, 2], [0, 3],
      [1, 0], [1, 1], [1, 2], [1, 3],
      [2, 0], [2, 1], [2, 2], [2, 3],
      [3, 0], [3, 1], [3, 2], [3, 3],
    ],
  },
};

/**
 * Radial menu slot positions in unit circle coordinates.
 * Angle 0 = top, increasing clockwise.
 */
export function radialSlotPositions(count: number, radius = 1): Array<{ x: number; y: number; angleDeg: number }> {
  const out: Array<{ x: number; y: number; angleDeg: number }> = [];
  for (let i = 0; i < count; i++) {
    const angleRad = (i / count) * 2 * Math.PI - Math.PI / 2;
    out.push({
      x: Math.cos(angleRad) * radius,
      y: Math.sin(angleRad) * radius,
      angleDeg: (angleRad * 180) / Math.PI + 90,
    });
  }
  return out;
}

export function isDocumentedTouchMenuCount(n: number): boolean {
  return n in TOUCH_MENU_LAYOUTS;
}
