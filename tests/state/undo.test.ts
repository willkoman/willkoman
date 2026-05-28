import { describe, expect, it } from 'vitest';
import { canRedo, canUndo, emptyUndoState, recordEdit, redo, undo } from '../../src/lib/state/undo';

const fakePatch = (label: string) => [{ op: 'replace' as const, path: [label], value: label }];

describe('UndoState', () => {
  it('is empty by default', () => {
    const s = emptyUndoState();
    expect(canUndo(s)).toBe(false);
    expect(canRedo(s)).toBe(false);
  });

  it('recordEdit pushes onto past and clears future', () => {
    let s = emptyUndoState();
    s = recordEdit(s, 'a', fakePatch('a'), fakePatch('a_inv'));
    s = recordEdit(s, 'b', fakePatch('b'), fakePatch('b_inv'));
    expect(canUndo(s)).toBe(true);
    expect(canRedo(s)).toBe(false);
    expect(s.past.length).toBe(2);
  });

  it('undo moves the last entry from past to future and returns it', () => {
    let s = emptyUndoState();
    s = recordEdit(s, 'a', fakePatch('a'), fakePatch('a_inv'));
    s = recordEdit(s, 'b', fakePatch('b'), fakePatch('b_inv'));
    const { state, entry } = undo(s);
    expect(entry?.label).toBe('b');
    expect(state.past.map((e) => e.label)).toEqual(['a']);
    expect(state.future.map((e) => e.label)).toEqual(['b']);
  });

  it('redo moves the last future back to past', () => {
    let s = emptyUndoState();
    s = recordEdit(s, 'a', fakePatch('a'), fakePatch('a_inv'));
    s = undo(s).state;
    const { state, entry } = redo(s);
    expect(entry?.label).toBe('a');
    expect(state.past.map((e) => e.label)).toEqual(['a']);
    expect(state.future).toEqual([]);
  });

  it('a fresh edit clears the redo stack', () => {
    let s = emptyUndoState();
    s = recordEdit(s, 'a', fakePatch('a'), fakePatch('a_inv'));
    s = undo(s).state;
    expect(canRedo(s)).toBe(true);
    s = recordEdit(s, 'c', fakePatch('c'), fakePatch('c_inv'));
    expect(canRedo(s)).toBe(false);
  });

  it('evicts oldest entries when totalBytes exceeds the cap', () => {
    // Tiny cap so we hit eviction quickly
    let s = emptyUndoState(200);
    // Each patch JSON.stringifies to ~30 bytes; label adds; we expect eviction after ~5 entries.
    for (let i = 0; i < 50; i++) {
      s = recordEdit(s, `edit-${i}`, fakePatch(`p-${i}`), fakePatch(`i-${i}`));
    }
    expect(s.totalBytes).toBeLessThanOrEqual(200 + 100); // allow some slack
    expect(s.past.length).toBeLessThan(50);
    // Most recent entry must still be present
    expect(s.past[s.past.length - 1]!.label).toBe('edit-49');
  });

  it('undo on empty state is a no-op', () => {
    const s = emptyUndoState();
    const { state, entry } = undo(s);
    expect(entry).toBeUndefined();
    expect(state).toEqual(s);
  });
});
