import type { CSSProperties } from 'react';
import { useState } from 'react';
import type { Group } from '../lib/schema';
import { TOUCH_MENU_LAYOUTS, parseBinding, setBinding } from '../lib/schema';
import { useConfigStore } from '../lib/state/configStore';
import BindingPicker from './BindingPicker';

interface Props {
  group: Group;
}

/**
 * Visual touch-menu designer — the headline feature.
 *
 * Each slot is a clickable target that opens the BindingPicker; applying a
 * binding routes through the mutator façade (AST-first, patch-based undo).
 * Empty slots render a dashed outline + plus glyph; bound slots show the
 * label or the args.
 *
 * Layouts marked `verified: false` (counts 7/12/13) get a warning strip
 * above the grid — those cell positions are our best guess pending eyeball-
 * on-a-Deck verification.
 */
export default function TouchMenuPreview({ group }: Props) {
  const config = useConfigStore((s) => s.config);
  const applyMutation = useConfigStore((s) => s.applyMutation);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);

  const countStr = group.settings.touch_menu_button_count;
  const count = countStr ? Number.parseInt(countStr, 10) : 0;
  const layout = TOUCH_MENU_LAYOUTS[count];

  if (!layout) {
    return (
      <div className="text-xs text-[var(--color-warn)]">
        Unknown touch_menu_button_count: {countStr ?? '(missing)'}. Cannot render preview.
      </div>
    );
  }

  const onSlotApply = (value: string) => {
    if (activeSlot === null || !config) return;
    const slotKey = `touch_menu_button_${activeSlot}`;
    const result = setBinding(config, group.id, slotKey, value);
    applyMutation(result);
    setActiveSlot(null);
  };

  return (
    <div className="space-y-2">
      {!layout.verified && (
        <div className="text-xs text-[var(--color-warn)] px-2 py-1 rounded bg-[color-mix(in_oklab,var(--color-warn)_15%,transparent)]">
          {count}-slot layout positions are unverified; use with care.
        </div>
      )}
      <div
        className="grid gap-1 p-2 rounded-md bg-[var(--color-panel-2)] border border-[var(--color-border)]"
        style={{
          gridTemplateColumns: `repeat(${layout.cols}, 1fr)`,
          gridTemplateRows: `repeat(${layout.rows}, 1fr)`,
          aspectRatio: `${layout.cols} / ${layout.rows}`,
        }}
      >
        {layout.cells.map(([row, col], i) => {
          const slotKey = `touch_menu_button_${i}`;
          const raw = group.bindings[slotKey];
          const parsed = raw ? parseBinding(raw) : null;
          const span = layout.spans?.[i];
          const style: CSSProperties = {
            gridRow: span ? `${row + 1} / span ${span[0]}` : row + 1,
            gridColumn: span ? `${col + 1} / span ${span[1]}` : col + 1,
          };
          const bound = !!raw;
          return (
            <button
              key={i}
              onClick={() => setActiveSlot(i)}
              className={`rounded p-2 text-xs flex flex-col justify-between text-left transition-colors ${
                bound
                  ? 'bg-[var(--color-panel)] border border-[var(--color-border)] hover:border-[var(--color-accent-dim)]'
                  : 'bg-transparent border border-dashed border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-accent-dim)] hover:text-[var(--color-text-dim)]'
              }`}
              style={style}
              title={raw ?? `Slot ${i} — click to bind`}
            >
              <span className="font-mono opacity-75">{i}</span>
              <span className="truncate">
                {bound ? (parsed?.label ?? parsed?.args.join(' ') ?? raw) : '+ bind'}
              </span>
            </button>
          );
        })}
      </div>

      {activeSlot !== null && (
        <BindingPicker
          initial={group.bindings[`touch_menu_button_${activeSlot}`]}
          title={`Slot ${activeSlot} · group #${group.id}`}
          onApply={onSlotApply}
          onCancel={() => setActiveSlot(null)}
        />
      )}
    </div>
  );
}
