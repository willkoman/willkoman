import type { Group } from '../lib/schema';
import { parseBinding, radialSlotPositions } from '../lib/schema';

interface Props {
  group: Group;
}

/**
 * Read-only SVG ring rendering. Phase 2 makes slots clickable to bind.
 */
export default function RadialMenuPreview({ group }: Props) {
  const countStr = group.settings.touch_menu_button_count;
  const count = countStr ? Number.parseInt(countStr, 10) : 0;
  if (!count) {
    return (
      <div className="text-xs text-[var(--color-warn)]">
        Missing touch_menu_button_count; cannot render preview.
      </div>
    );
  }
  const positions = radialSlotPositions(count);
  const size = 240;
  const radius = size / 2 - 32;
  const slotRadius = 22;

  return (
    <svg
      viewBox={`-${size / 2} -${size / 2} ${size} ${size}`}
      width={size}
      height={size}
      className="rounded-md bg-[var(--color-panel-2)] border border-[var(--color-border)]"
    >
      <circle r={radius} cx={0} cy={0} fill="none" stroke="var(--color-border)" strokeWidth={1} />
      {positions.map((pos, i) => {
        const slotKey = `touch_menu_button_${i}`;
        const raw = group.bindings[slotKey];
        const parsed = raw ? parseBinding(raw) : null;
        const cx = pos.x * radius;
        const cy = pos.y * radius;
        return (
          <g key={i}>
            <circle
              cx={cx}
              cy={cy}
              r={slotRadius}
              fill="var(--color-panel)"
              stroke="var(--color-border)"
            />
            <text
              x={cx}
              y={cy - 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="9"
              fill="var(--color-text-dim)"
            >
              {i}
            </text>
            <text
              x={cx}
              y={cy + 10}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="7"
              fill="var(--color-text)"
            >
              {(parsed?.label ?? parsed?.args.join(' ') ?? '').slice(0, 8)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
