/**
 * Patch-based undo history.
 *
 * Each entry holds the immer patches needed to go forward (`patches`) and
 * back (`inversePatches`), plus a short label for UI display. The store
 * caps memory by estimating each entry's JSON size and dropping the oldest
 * when total exceeds `memoryCapBytes`.
 *
 * Tradeoff vs full-snapshot undo: patches are ~3 orders of magnitude
 * smaller for typical single-field edits. A 200-edit session of binding
 * changes lands under 1 MB instead of 200 MB.
 */

import type { Patch } from 'immer';

export interface UndoEntry {
  label: string;
  patches: Patch[];
  inversePatches: Patch[];
  /** Approximate JSON size in bytes. Used for the memory cap. */
  bytes: number;
}

export interface UndoState {
  past: UndoEntry[];
  future: UndoEntry[];
  /** Approximate total resident size. */
  totalBytes: number;
  /** Hard cap; oldest entries drop when crossed. Default 5 MB. */
  memoryCapBytes: number;
}

export const DEFAULT_UNDO_CAP_BYTES = 5 * 1024 * 1024;

export const emptyUndoState = (memoryCapBytes = DEFAULT_UNDO_CAP_BYTES): UndoState => ({
  past: [],
  future: [],
  totalBytes: 0,
  memoryCapBytes,
});

export function recordEdit(
  state: UndoState,
  label: string,
  patches: Patch[],
  inversePatches: Patch[]
): UndoState {
  const bytes = estimateBytes(patches) + estimateBytes(inversePatches) + label.length;
  const entry: UndoEntry = { label, patches, inversePatches, bytes };
  const next: UndoState = {
    past: [...state.past, entry],
    future: [], // any new edit invalidates redo
    totalBytes: state.totalBytes + bytes,
    memoryCapBytes: state.memoryCapBytes,
  };
  return evict(next);
}

export function undo(state: UndoState): { state: UndoState; entry?: UndoEntry } {
  const last = state.past[state.past.length - 1];
  if (!last) return { state };
  return {
    state: {
      past: state.past.slice(0, -1),
      future: [...state.future, last],
      totalBytes: state.totalBytes,
      memoryCapBytes: state.memoryCapBytes,
    },
    entry: last,
  };
}

export function redo(state: UndoState): { state: UndoState; entry?: UndoEntry } {
  const last = state.future[state.future.length - 1];
  if (!last) return { state };
  return {
    state: {
      past: [...state.past, last],
      future: state.future.slice(0, -1),
      totalBytes: state.totalBytes,
      memoryCapBytes: state.memoryCapBytes,
    },
    entry: last,
  };
}

export function canUndo(state: UndoState): boolean {
  return state.past.length > 0;
}

export function canRedo(state: UndoState): boolean {
  return state.future.length > 0;
}

function evict(state: UndoState): UndoState {
  if (state.totalBytes <= state.memoryCapBytes) return state;
  let past = state.past;
  let total = state.totalBytes;
  while (total > state.memoryCapBytes && past.length > 1) {
    const dropped = past[0]!;
    past = past.slice(1);
    total -= dropped.bytes;
  }
  return { ...state, past, totalBytes: total };
}

function estimateBytes(patches: Patch[]): number {
  // Rough — JSON.stringify is slow but accurate enough for budgeting.
  // For pathological cases (huge values) we still cap above; the editor
  // doesn't need byte-perfect accounting.
  try {
    return JSON.stringify(patches).length;
  } catch {
    return 1024; // pessimistic fallback
  }
}
