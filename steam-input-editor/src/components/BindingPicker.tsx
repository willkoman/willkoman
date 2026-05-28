import { useState } from 'react';
import { binding, parseBinding, serializeBinding } from '../lib/schema';

interface BindingPickerProps {
  /** Initial binding value (raw VDF string), if any. */
  initial?: string;
  /** Title shown in the header. e.g. "Slot 3 · button_A". */
  title: string;
  /** Called with the new raw VDF string on Apply. */
  onApply: (value: string) => void;
  /** Called when the user dismisses without applying. */
  onCancel: () => void;
}

type Category = 'keyboard' | 'mouse' | 'gamepad' | 'system' | 'raw';

const KEYBOARD_KEYS = [
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '0',
  'Q',
  'W',
  'E',
  'R',
  'T',
  'Y',
  'U',
  'I',
  'O',
  'P',
  'A',
  'S',
  'D',
  'F',
  'G',
  'H',
  'J',
  'K',
  'L',
  'Z',
  'X',
  'C',
  'V',
  'B',
  'N',
  'M',
  'SPACE',
  'TAB',
  'RETURN',
  'ESCAPE',
  'LEFT_SHIFT',
  'LEFT_CONTROL',
  'LEFT_ALT',
  'F1',
  'F2',
  'F3',
  'F4',
  'F5',
  'F6',
  'F7',
  'F8',
  'F9',
  'F10',
  'F11',
  'F12',
];

const MOUSE_BUTTONS = ['LEFT', 'RIGHT', 'MIDDLE', 'BUTTON_4', 'BUTTON_5'];
const MOUSE_WHEEL = ['SCROLL_UP', 'SCROLL_DOWN'];

const XINPUT_BUTTONS = [
  'A',
  'B',
  'X',
  'Y',
  'DPAD_UP',
  'DPAD_DOWN',
  'DPAD_LEFT',
  'DPAD_RIGHT',
  'SHOULDER_LEFT',
  'SHOULDER_RIGHT',
  'TRIGGER_LEFT',
  'TRIGGER_RIGHT',
  'JOYSTICK_LEFT',
  'JOYSTICK_RIGHT',
  'START',
  'SELECT',
];

const SYSTEM_ACTIONS = [
  { verb: 'controller_action', args: ['TAKE_SCREENSHOT'], label: 'Take screenshot' },
  { verb: 'controller_action', args: ['SHOW_KEYBOARD'], label: 'Show on-screen keyboard' },
  { verb: 'controller_action', args: ['OPEN_BIG_PICTURE'], label: 'Open Big Picture' },
  { verb: 'controller_action', args: ['CHANGE_PRESET'], label: 'Change action set…' },
  { verb: 'controller_action', args: ['ADD_LAYER'], label: 'Add action layer…' },
  { verb: 'controller_action', args: ['REMOVE_LAYER'], label: 'Remove action layer…' },
  { verb: 'empty_binding', args: [], label: 'Empty (do nothing)' },
];

export default function BindingPicker({ initial, title, onApply, onCancel }: BindingPickerProps) {
  const [category, setCategory] = useState<Category>(() => {
    if (!initial) return 'keyboard';
    const parsed = parseBinding(initial);
    if (!parsed) return 'keyboard';
    switch (parsed.verb) {
      case 'key_press':
        return 'keyboard';
      case 'mouse_button':
      case 'mouse_wheel':
        return 'mouse';
      case 'xinput_button':
        return 'gamepad';
      case 'controller_action':
      case 'empty_binding':
        return 'system';
      default:
        return 'raw';
    }
  });
  const [rawValue, setRawValue] = useState(initial ?? '');
  const [label, setLabel] = useState(() => parseBinding(initial ?? '')?.label ?? '');

  const apply = (value: string) => {
    onApply(value);
  };

  const applyWithLabel = (verb: string, args: string[]) => {
    apply(serializeBinding(binding(verb, args, label || undefined)));
  };

  const tabBtn = (id: Category, txt: string) => (
    <button
      key={id}
      onClick={() => setCategory(id)}
      className={`px-3 py-2 rounded-md text-sm transition-colors ${
        category === id
          ? 'bg-[var(--color-accent)] text-black'
          : 'bg-[var(--color-panel-2)] text-[var(--color-text-dim)] hover:text-[var(--color-text)]'
      }`}
    >
      {txt}
    </button>
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="binding-picker-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-panel)]"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
          <h2 id="binding-picker-title" className="text-sm font-medium">
            {title}
          </h2>
          <button
            onClick={onCancel}
            className="text-[var(--color-text-dim)] hover:text-[var(--color-text)] px-2"
            aria-label="Close"
          >
            ✕
          </button>
        </header>

        <div className="flex gap-2 px-4 py-3 border-b border-[var(--color-border)] overflow-x-auto">
          {tabBtn('keyboard', 'Keyboard')}
          {tabBtn('mouse', 'Mouse')}
          {tabBtn('gamepad', 'Gamepad')}
          {tabBtn('system', 'System')}
          {tabBtn('raw', 'Raw')}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {category === 'keyboard' && (
            <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
              {KEYBOARD_KEYS.map((k) => (
                <button
                  key={k}
                  onClick={() => applyWithLabel('key_press', [k])}
                  className="px-3 py-2 rounded bg-[var(--color-panel-2)] hover:bg-[var(--color-panel-3)] text-sm"
                >
                  {k}
                </button>
              ))}
            </div>
          )}

          {category === 'mouse' && (
            <div className="space-y-4">
              <section>
                <div className="text-xs uppercase tracking-wider text-[var(--color-text-dim)] mb-2">
                  Mouse buttons
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {MOUSE_BUTTONS.map((b) => (
                    <button
                      key={b}
                      onClick={() => applyWithLabel('mouse_button', [b])}
                      className="px-3 py-2 rounded bg-[var(--color-panel-2)] hover:bg-[var(--color-panel-3)] text-sm"
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </section>
              <section>
                <div className="text-xs uppercase tracking-wider text-[var(--color-text-dim)] mb-2">
                  Wheel
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {MOUSE_WHEEL.map((b) => (
                    <button
                      key={b}
                      onClick={() => applyWithLabel('mouse_wheel', [b])}
                      className="px-3 py-2 rounded bg-[var(--color-panel-2)] hover:bg-[var(--color-panel-3)] text-sm"
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </section>
            </div>
          )}

          {category === 'gamepad' && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {XINPUT_BUTTONS.map((b) => (
                <button
                  key={b}
                  onClick={() => applyWithLabel('xinput_button', [b])}
                  className="px-3 py-2 rounded bg-[var(--color-panel-2)] hover:bg-[var(--color-panel-3)] text-sm"
                >
                  {b}
                </button>
              ))}
            </div>
          )}

          {category === 'system' && (
            <div className="space-y-2">
              {SYSTEM_ACTIONS.map((a) => (
                <button
                  key={a.verb + a.args.join('-')}
                  onClick={() => applyWithLabel(a.verb, a.args)}
                  className="w-full px-3 py-3 rounded bg-[var(--color-panel-2)] hover:bg-[var(--color-panel-3)] text-left text-sm"
                >
                  <div className="font-medium">{a.label}</div>
                  <div className="text-xs text-[var(--color-text-dim)] font-mono">
                    {a.verb} {a.args.join(' ')}
                  </div>
                </button>
              ))}
            </div>
          )}

          {category === 'raw' && (
            <div className="space-y-3">
              <p className="text-xs text-[var(--color-text-dim)]">
                Paste an exact VDF binding string. Unknown verbs round-trip unchanged.
              </p>
              <input
                type="text"
                value={rawValue}
                onChange={(e) => setRawValue(e.target.value)}
                placeholder="e.g. game_action InGameControls jump, Jump"
                className="w-full px-3 py-2 rounded bg-[var(--color-panel-2)] border border-[var(--color-border)] text-sm font-mono"
              />
              <button
                onClick={() => apply(rawValue)}
                disabled={!rawValue.trim()}
                className="px-4 py-2 rounded bg-[var(--color-accent)] text-black text-sm font-medium disabled:opacity-50"
              >
                Apply raw
              </button>
            </div>
          )}
        </div>

        <footer className="px-4 py-3 border-t border-[var(--color-border)] flex items-center gap-3">
          <label className="text-xs text-[var(--color-text-dim)]">Label:</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="optional (shown in Steam UI + menu icons)"
            className="flex-1 px-2 py-1.5 rounded bg-[var(--color-panel-2)] border border-[var(--color-border)] text-xs"
          />
        </footer>
      </div>
    </div>
  );
}
