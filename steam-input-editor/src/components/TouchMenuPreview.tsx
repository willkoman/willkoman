import type { CSSProperties } from 'react';
import { useState } from 'react';
import type { Group } from '../lib/schema';
import { TOUCH_MENU_LAYOUTS, parseBinding, setBinding, swapBindings } from '../lib/schema';
import { useConfigStore } from '../lib/state/configStore';
import BindingPicker from './BindingPicker';
import MenuPositionSliders from './MenuPositionSliders';

interface Props {
  group: Group;
}

/**
 * Visual touch-menu designer — the headline feature.
 *
 * Interactions:
 *   - Click an empty slot → BindingPicker
 *   - Drag a bound slot onto another → swap (or move to empty)
 *   - Click a bound slot → BindingPicker (edit)
 *
 * Drag uses native HTML5 drag-and-drop which the Deck's Firefox supports
 * for touch via long-press in Wayland. We keep it dependency-free by using
 * the platform `dataTransfer` API; pure click-to-bind keeps working if
 * drag is unsupported.
 *
 * Layouts marked `verified: false` (counts 7/12/13) get a warning strip.
 */
export default function TouchMenuPreview({ group }: Props) {
  const config = useConfigStore((s) => s.config);
  const applyMutation = useConfigStore((s) => s.applyMutation);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);

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
    applyMutation(setBinding(config, group.id, `touch_menu_button_${activeSlot}`, value));
    setActiveSlot(null);
  };

  const onDrop = (toSlot: number, fromSlotStr: string | null) => {
    setDragOverSlot(null);
    if (fromSlotStr === null || !config) return;
    const fromSlot = Number.parseInt(fromSlotStr, 10);
    if (Number.isNaN(fromSlot) || fromSlot === toSlot) return;
    applyMutation(
      swapBindings(config, group.id, `touch_menu_button_${fromSlot}`, `touch_menu_button_${toSlot}`)
    );
  };

  return (
    <div className="space-y-3">
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
          const isDragOver = dragOverSlot === i;
          const className =
            `rounded p-2 text-xs flex flex-col justify-between text-left transition-colors ` +
            (isDragOver
              ? 'bg-[var(--color-panel-3)] border-2 border-[var(--color-accent)]'
              : bound
                ? 'bg-[var(--color-panel)] border border-[var(--color-border)] hover:border-[var(--color-accent-dim)]'
                : 'bg-transparent border border-dashed border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-accent-dim)] hover:text-[var(--color-text-dim)]');
          return (
            <button
              key={i}
              onClick={() => setActiveSlot(i)}
              draggable={bound}
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', String(i));
                e.dataTransfer.effectAllowed = 'move';
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                setDragOverSlot(i);
              }}
              onDragLeave={() => setDragOverSlot((s) => (s === i ? null : s))}
              onDrop={(e) => {
                e.preventDefault();
                onDrop(i, e.dataTransfer.getData('text/plain'));
              }}
              className={className}
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

      <MenuPositionSliders group={group} />

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
