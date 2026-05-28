import { describe, expect, it } from 'vitest';
import {
  TOUCH_MENU_LAYOUTS,
  isDocumentedTouchMenuCount,
  isVerifiedTouchMenuLayout,
  radialSlotPositions,
} from '../../src/lib/schema/menuLayouts';

describe('TOUCH_MENU_LAYOUTS', () => {
  it('covers all documented slot counts (2, 4, 7, 9, 12, 13, 16)', () => {
    for (const n of [2, 4, 7, 9, 12, 13, 16]) {
      expect(TOUCH_MENU_LAYOUTS[n]).toBeDefined();
      expect(TOUCH_MENU_LAYOUTS[n]!.count).toBe(n);
      expect(TOUCH_MENU_LAYOUTS[n]!.cells.length).toBe(n);
    }
  });

  it('rejects undocumented counts', () => {
    expect(isDocumentedTouchMenuCount(5)).toBe(false);
    expect(isDocumentedTouchMenuCount(20)).toBe(false);
    expect(isDocumentedTouchMenuCount(9)).toBe(true);
  });

  it('marks 2/4/9/16 as verified (we have screenshot evidence) and 7/12/13 as unverified', () => {
    expect(isVerifiedTouchMenuLayout(2)).toBe(true);
    expect(isVerifiedTouchMenuLayout(4)).toBe(true);
    expect(isVerifiedTouchMenuLayout(9)).toBe(true);
    expect(isVerifiedTouchMenuLayout(16)).toBe(true);
    expect(isVerifiedTouchMenuLayout(7)).toBe(false);
    expect(isVerifiedTouchMenuLayout(12)).toBe(false);
    expect(isVerifiedTouchMenuLayout(13)).toBe(false);
  });

  it('places the 13th slot (index 12) at the centre of the grid, not as a 5th in the bottom row', () => {
    // Per Domain audit 2026-05: shipping bottom-row-of-5 would mis-target the
    // 13th binding in-game. Slot 12 must be a centred overlay.
    const layout = TOUCH_MENU_LAYOUTS[13]!;
    const slot12 = layout.cells[12]!;
    expect(slot12[0]).toBe(1); // middle row
    expect(slot12[1]).toBe(1); // not edge column
    expect(layout.spans?.[12]).toEqual([1, 2]); // spans 2 cols
  });
});

describe('radialSlotPositions', () => {
  it('returns the requested number of slots', () => {
    expect(radialSlotPositions(8)).toHaveLength(8);
    expect(radialSlotPositions(1)).toHaveLength(1);
    expect(radialSlotPositions(20)).toHaveLength(20);
  });

  it('places slot 0 at the top (angleDeg ~ 0)', () => {
    const slots = radialSlotPositions(8);
    expect(slots[0]!.angleDeg).toBeCloseTo(0);
    expect(slots[0]!.x).toBeCloseTo(0);
    expect(slots[0]!.y).toBeCloseTo(-1);
  });

  it('distributes slots evenly around the ring', () => {
    const slots = radialSlotPositions(4);
    expect(slots[1]!.angleDeg).toBeCloseTo(90);
    expect(slots[2]!.angleDeg).toBeCloseTo(180);
    expect(slots[3]!.angleDeg).toBeCloseTo(270);
  });
});
