import { describe, expect, it } from 'vitest';
import { binding, isKnownVerb, parseBinding, serializeBinding } from '../../src/lib/schema/bindings';

describe('parseBinding', () => {
  it('returns null for empty input', () => {
    expect(parseBinding('')).toBeNull();
    expect(parseBinding('   ')).toBeNull();
  });

  it('extracts a simple key_press', () => {
    const b = parseBinding('key_press W');
    expect(b).toEqual({ verb: 'key_press', args: ['W'], raw: 'key_press W' });
  });

  it('extracts the label after ", "', () => {
    const b = parseBinding('key_press W, Move Forward');
    expect(b?.verb).toBe('key_press');
    expect(b?.args).toEqual(['W']);
    expect(b?.label).toBe('Move Forward');
  });

  it('parses xinput_button with localized label tokens', () => {
    const b = parseBinding('xinput_button A, #abutton');
    expect(b?.verb).toBe('xinput_button');
    expect(b?.label).toBe('#abutton');
  });

  it('parses controller_action with multiple args', () => {
    const b = parseBinding('controller_action CHANGE_PRESET 32765 0 1');
    expect(b?.verb).toBe('controller_action');
    expect(b?.args).toEqual(['CHANGE_PRESET', '32765', '0', '1']);
    expect(b?.label).toBeUndefined();
  });

  it('parses mode_shift', () => {
    const b = parseBinding('mode_shift right_trigger 41');
    expect(b?.verb).toBe('mode_shift');
    expect(b?.args).toEqual(['right_trigger', '41']);
  });

  it('round-trips through serializeBinding', () => {
    const samples = [
      'key_press W, Move Forward',
      'xinput_button A',
      'mouse_button LEFT, Fire',
      'controller_action CHANGE_PRESET 32765 0 1',
      'mode_shift right_trigger 41',
    ];
    for (const s of samples) {
      const parsed = parseBinding(s);
      expect(serializeBinding(parsed!)).toBe(s);
    }
  });
});

describe('isKnownVerb', () => {
  it('returns true for documented verbs', () => {
    expect(isKnownVerb('key_press')).toBe(true);
    expect(isKnownVerb('controller_action')).toBe(true);
  });
  it('returns false for unknown verbs (so we surface them as warnings, not errors)', () => {
    expect(isKnownVerb('totally_made_up_verb')).toBe(false);
  });
});

describe('binding factory', () => {
  it('builds a labelled binding string', () => {
    const b = binding('key_press', ['W'], 'Move Forward');
    expect(b.raw).toBe('key_press W, Move Forward');
  });
});
