/**
 * Binding string grammar helpers.
 *
 * Steam Input binding strings look like:
 *   "<verb> <args>[, <label>]"
 *
 * Examples:
 *   "key_press W, Move Forward"
 *   "xinput_button A, #abutton"
 *   "mouse_button LEFT, Fire"
 *   "controller_action CHANGE_PRESET 32765 0 1"
 *   "mode_shift right_trigger 41"
 *   "game_action InGameControls jump, Jump"
 *
 * The verb catalog is intentionally incomplete — Steam's reference is partial.
 * Unknown verbs round-trip unchanged.
 */

export type BindingVerb =
  | 'key_press'
  | 'mouse_button'
  | 'mouse_wheel'
  | 'xinput_button'
  | 'controller_action'
  | 'mode_shift'
  | 'game_action'
  | 'empty_binding'
  | (string & {});

export interface ParsedBinding {
  verb: BindingVerb;
  args: string[];
  /** Optional human label after the last comma. */
  label?: string;
  /** Original string, unchanged. */
  raw: string;
}

const KNOWN_VERBS = new Set<string>([
  'key_press',
  'mouse_button',
  'mouse_wheel',
  'xinput_button',
  'controller_action',
  'mode_shift',
  'game_action',
  'empty_binding',
]);

/**
 * Parse a binding string into a structured form.
 * Returns `null` for an empty input.
 *
 * Note: a label may itself contain commas in Valve's emitter; we treat the
 * label as the substring after the FIRST `,` that appears after the verb's
 * arg list. Since arg parsing is verb-specific and we don't fully model every
 * verb, we use a heuristic: split on the first ", " (comma + space). Anything
 * without ", " has no label.
 */
export function parseBinding(s: string): ParsedBinding | null {
  const trimmed = s.trim();
  if (!trimmed) return null;

  let label: string | undefined;
  let body = trimmed;
  const labelSep = body.indexOf(', ');
  if (labelSep !== -1) {
    label = body.slice(labelSep + 2).trim();
    body = body.slice(0, labelSep).trim();
  }

  const tokens = body.split(/\s+/);
  const verb = tokens[0] ?? '';
  const args = tokens.slice(1);

  const result: ParsedBinding = { verb, args, raw: s };
  if (label !== undefined) result.label = label;
  return result;
}

export function isKnownVerb(verb: string): boolean {
  return KNOWN_VERBS.has(verb);
}

export function serializeBinding(b: ParsedBinding): string {
  const head = b.args.length ? `${b.verb} ${b.args.join(' ')}` : b.verb;
  return b.label !== undefined ? `${head}, ${b.label}` : head;
}

/** Convenient constructor: `binding('key_press', ['SPACE'], 'Jump')`. */
export function binding(verb: BindingVerb, args: string[] = [], label?: string): ParsedBinding {
  const parts = args.length ? `${verb} ${args.join(' ')}` : verb;
  return {
    verb,
    args,
    ...(label !== undefined ? { label } : {}),
    raw: label !== undefined ? `${parts}, ${label}` : parts,
  };
}
