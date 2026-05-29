import { describe, expect, it } from 'vitest';
import { diffSummary, lineDiff } from '../../src/lib/state/lineDiff';

describe('lineDiff', () => {
  it('reports zero diffs when inputs are identical', () => {
    const segs = lineDiff('a\nb\nc', 'a\nb\nc');
    const sum = diffSummary(segs);
    expect(sum.added).toBe(0);
    expect(sum.removed).toBe(0);
    expect(sum.same).toBe(3);
  });

  it('detects a single-line replacement', () => {
    const segs = lineDiff('a\nb\nc', 'a\nB\nc');
    const sum = diffSummary(segs);
    expect(sum.added).toBe(1);
    expect(sum.removed).toBe(1);
    expect(sum.same).toBe(2);
  });

  it('detects pure insertion', () => {
    const segs = lineDiff('a\nc', 'a\nb\nc');
    const sum = diffSummary(segs);
    expect(sum.added).toBe(1);
    expect(sum.removed).toBe(0);
    expect(sum.same).toBe(2);
  });

  it('detects pure deletion', () => {
    const segs = lineDiff('a\nb\nc', 'a\nc');
    const sum = diffSummary(segs);
    expect(sum.added).toBe(0);
    expect(sum.removed).toBe(1);
    expect(sum.same).toBe(2);
  });

  it('handles complete divergence', () => {
    const segs = lineDiff('a\nb\nc', 'x\ny\nz');
    const sum = diffSummary(segs);
    expect(sum.added).toBe(3);
    expect(sum.removed).toBe(3);
    expect(sum.same).toBe(0);
  });

  it('produces 1-based line numbers on both sides', () => {
    const segs = lineDiff('a\nb', 'a\nc');
    const sameA = segs.find((s) => s.kind === 'same' && s.text === 'a')!;
    expect(sameA.leftLine).toBe(1);
    expect(sameA.rightLine).toBe(1);
    const removedB = segs.find((s) => s.kind === 'removed' && s.text === 'b')!;
    expect(removedB.leftLine).toBe(2);
    const addedC = segs.find((s) => s.kind === 'added' && s.text === 'c')!;
    expect(addedC.rightLine).toBe(2);
  });

  it('is byte-stable when the second input matches the first after parsing changes', () => {
    // Realistic shape: original VDF, then user edits one binding.
    const before = `"controller_mappings"
{
\t"version" "3"
\t"group" {
\t\t"id" "0"
\t\t"mode" "four_buttons"
\t\t"bindings" {
\t\t\t"button_A" "xinput_button A"
\t\t}
\t}
}`;
    const after = before.replace('xinput_button A', 'key_press SPACE');
    const segs = lineDiff(before, after);
    const sum = diffSummary(segs);
    expect(sum.added).toBe(1);
    expect(sum.removed).toBe(1);
    expect(sum.same).toBe(before.split('\n').length - 1);
  });
});
