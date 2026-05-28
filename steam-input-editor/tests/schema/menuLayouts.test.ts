import { describe, expect, it } from 'vitest';
import {
  TOUCH_MENU_LAYOUTS,
  isDocumentedTouchMenuCount,
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
