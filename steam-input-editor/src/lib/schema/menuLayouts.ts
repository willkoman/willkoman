/**
 * Touch-menu slot-index → grid position mappings.
 *
 * Slot counts: 2, 4, 7, 9, 12, 13, 16. Steam treats anything else as malformed.
 *
 * Each layout records cells in slot order as `[row, col]` zero-based, with a
 * `cellSpan?` for slots that occupy more than one cell. `verified: true` means
 * the layout was confirmed against Steam's actual on-screen render; `false`
 * means it's our best inference and the UI must warn the user before using it
 * to bind. (Domain audit, 2026-05: shipping wrong layout = mis-targeted
 * bindings in-game = corrupted user input.)
 *
 * For the hotbar menu (`mode = "hotbar_menu"`) the same `touch_menu_button_N`
 * keys are reused but the layout is a horizontal scrollable strip with up to
 * 16 entries; we render it linearly and don't grid-map it.
 */

export interface TouchMenuLayout {
  count: number;
  rows: number;
  cols: number;
  /** Cell coords by slot index; [row, col] zero-based. */
  cells: ReadonlyArray<readonly [number, number]>;
  /**
   * Optional per-slot cell span: `[rowSpan, colSpan]`. Slots without an entry
   * default to `[1, 1]`. Used by the 13-slot layout where slot 12 spans the
   * centre of a 3×4 grid as an overlay.
   */
  spans?: ReadonlyArray<readonly [number, number] | undefined>;
  /**
   * `true` = empirically verified against Steam's rendered overlay.
   * `false` = our best guess pending verification; UI must surface a warning.
   */
  verified: boolean;
}

export const TOUCH_MENU_LAYOUTS: Readonly<Record<number, TouchMenuLayout>> = {
  2: {
    count: 2,
    rows: 1,
    cols: 2,
    cells: [
      [0, 0],
      [0, 1],
    ],
    verified: true,
  },
  4: {
    count: 4,
    rows: 2,
    cols: 2,
    cells: [
      [0, 0],
      [0, 1],
      [1, 0],
      [1, 1],
    ],
    verified: true,
  },
  7: {
    // Diamond / 2-3-2. Wiki and screenshots suggest 2/3/2, but the actual
    // Steam Big Picture render has not been independently verified for this
    // count. Marked unverified until we eyeball it on a real Deck.
    count: 7,
    rows: 3,
    cols: 3,
    cells: [
      [0, 0],
      [0, 2],
      [1, 0],
      [1, 1],
      [1, 2],
      [2, 0],
      [2, 2],
    ],
    verified: false,
  },
  9: {
    count: 9,
    rows: 3,
    cols: 3,
    cells: [
      [0, 0],
      [0, 1],
      [0, 2],
      [1, 0],
      [1, 1],
      [1, 2],
      [2, 0],
      [2, 1],
      [2, 2],
    ],
    verified: true,
  },
  12: {
    count: 12,
    rows: 3,
    cols: 4,
    cells: [
      [0, 0],
      [0, 1],
      [0, 2],
      [0, 3],
      [1, 0],
      [1, 1],
      [1, 2],
      [1, 3],
      [2, 0],
      [2, 1],
      [2, 2],
      [2, 3],
    ],
    verified: false,
  },
  13: {
    // Slots 0-11 fill a 3×4 grid; slot 12 is a centred overlay (2×2 span
    // covering rows 0-1, cols 1-2 of a centred sub-grid).
    // Per Domain audit 2026-05, the 13th slot is rendered in the centre,
    // NOT as a bottom-row-of-5. Shipping the bottom-row layout would
    // mis-target slot 12 bindings — corruption-risk fix.
    count: 13,
    rows: 3,
    cols: 4,
    cells: [
      [0, 0],
      [0, 1],
      [0, 2],
      [0, 3],
      [1, 0],
      [1, 1],
      [1, 2],
      [1, 3],
      [2, 0],
      [2, 1],
      [2, 2],
      [2, 3],
      [1, 1], // slot 12: centred overlay
    ],
    spans: [
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      [1, 2], // slot 12 spans 1 row × 2 cols (centre overlay)
    ],
    verified: false,
  },
  16: {
    count: 16,
    rows: 4,
    cols: 4,
    cells: [
      [0, 0],
      [0, 1],
      [0, 2],
      [0, 3],
      [1, 0],
      [1, 1],
      [1, 2],
      [1, 3],
      [2, 0],
      [2, 1],
      [2, 2],
      [2, 3],
      [3, 0],
      [3, 1],
      [3, 2],
      [3, 3],
    ],
    verified: true,
  },
};

/**
 * Radial menu slot positions in unit circle coordinates.
 * Angle 0 = top, increasing clockwise.
 */
export function radialSlotPositions(
  count: number,
  radius = 1
): Array<{ x: number; y: number; angleDeg: number }> {
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

export function isVerifiedTouchMenuLayout(n: number): boolean {
  return TOUCH_MENU_LAYOUTS[n]?.verified === true;
}
