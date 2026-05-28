import type { Group } from '../lib/schema';
import { TOUCH_MENU_LAYOUTS, parseBinding } from '../lib/schema';

interface Props {
  group: Group;
}

/**
 * Renders the touch menu as the actual grid the user would see in-game.
 * Read-only preview (Phase 1); Phase 2 will make it click-to-bind.
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
        return (
          <div
            key={i}
            className="rounded bg-[var(--color-panel)] border border-[var(--color-border)] p-2 text-xs flex flex-col justify-between"
            style={{ gridRow: row + 1, gridColumn: col + 1 }}
            title={raw ?? '(unbound)'}
          >
            <span className="text-[var(--color-text-dim)] font-mono">{i}</span>
            <span className="truncate">{parsed?.label ?? parsed?.args.join(' ') ?? '(unbound)'}</span>
          </div>
        );
      })}
    </div>
  );
}
