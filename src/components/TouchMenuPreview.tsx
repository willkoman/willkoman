import type { CSSProperties } from 'react';
import type { Group } from '../lib/schema';
import { TOUCH_MENU_LAYOUTS, parseBinding } from '../lib/schema';

interface Props {
  group: Group;
}

/**
 * Renders the touch menu as the actual grid the user would see in-game.
 * Read-only preview (Phase 1); Phase 2 will make it click-to-bind.
 *
 * If the layout is `verified: false` we render a warning strip — those
 * cell positions are our best guess and the user should not trust the
 * picker UI to match what they see in-game until verified.
 */
export default function TouchMenuPreview({ group }: Props) {
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
          return (
            <div
              key={i}
              className="rounded bg-[var(--color-panel)] border border-[var(--color-border)] p-2 text-xs flex flex-col justify-between"
              style={style}
              title={raw ?? '(unbound)'}
            >
              <span className="text-[var(--color-text-dim)] font-mono">{i}</span>
              <span className="truncate">
                {parsed?.label ?? parsed?.args.join(' ') ?? '(unbound)'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
