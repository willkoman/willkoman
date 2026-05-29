import { useState } from 'react';
import type { Group } from '../lib/schema';
import {
  RADIAL_MENU_MAX_SLOTS,
  parseBinding,
  radialSlotPositions,
  setBinding,
  setGroupSetting,
} from '../lib/schema';
import { useConfigStore } from '../lib/state/configStore';
import BindingPicker from './BindingPicker';
import MenuPositionSliders from './MenuPositionSliders';

interface Props {
  group: Group;
}

/**
 * Interactive radial menu designer.
 *
 * Each slot circle is a click target that opens the BindingPicker; applying
 * a binding routes through the mutator façade. The slot-count slider
 * triggers `setGroupSetting` for `touch_menu_button_count` and animates
 * via CSS transitions on slot positions.
 *
 * Slots use the same `touch_menu_button_N` key family as touch menus —
 * radial menus do NOT have a `radial_menu_button_N` namespace.
 */
export default function RadialMenuPreview({ group }: Props) {
  const config = useConfigStore((s) => s.config);
  const applyMutation = useConfigStore((s) => s.applyMutation);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);

  const countStr = group.settings.touch_menu_button_count;
  const count = countStr ? Number.parseInt(countStr, 10) : 0;

  if (!count) {
    return (
      <div className="text-xs text-[var(--color-warn)] space-y-2">
        <p>Missing touch_menu_button_count — setting to 8 will render the ring.</p>
        <button
          onClick={() => {
            if (!config) return;
            applyMutation(setGroupSetting(config, group.id, 'touch_menu_button_count', '8'));
          }}
          className="px-2 py-1 rounded bg-[var(--color-accent)] text-black text-xs"
        >
          Set to 8 slots
        </button>
      </div>
    );
  }

  const positions = radialSlotPositions(count);
  const size = 280;
  const radius = size / 2 - 36;
  const slotRadius = Math.max(14, Math.min(26, 220 / count));

  const changeSlotCount = (next: number) => {
    if (!config) return;
    const clamped = Math.max(1, Math.min(RADIAL_MENU_MAX_SLOTS, next));
    applyMutation(setGroupSetting(config, group.id, 'touch_menu_button_count', String(clamped)));
  };

  const onSlotApply = (value: string) => {
    if (activeSlot === null || !config) return;
    applyMutation(setBinding(config, group.id, `touch_menu_button_${activeSlot}`, value));
    setActiveSlot(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-center">
        <svg
          viewBox={`-${size / 2} -${size / 2} ${size} ${size}`}
          width={size}
          height={size}
          className="rounded-md bg-[var(--color-panel-2)] border border-[var(--color-border)]"
        >
          <circle
            r={radius}
            cx={0}
            cy={0}
            fill="none"
            stroke="var(--color-border)"
            strokeWidth={1}
          />
          {positions.map((pos, i) => {
            const slotKey = `touch_menu_button_${i}`;
            const raw = group.bindings[slotKey];
            const parsed = raw ? parseBinding(raw) : null;
            const cx = pos.x * radius;
            const cy = pos.y * radius;
            const bound = !!raw;
            return (
              <g
                key={i}
                style={{ cursor: 'pointer', transition: 'transform 200ms ease' }}
                onClick={() => setActiveSlot(i)}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setActiveSlot(i);
                  }
                }}
                aria-label={`Slot ${i}${raw ? ': ' + raw : ' — unbound'}`}
              >
                <circle
                  cx={cx}
                  cy={cy}
                  r={slotRadius}
                  fill={bound ? 'var(--color-panel)' : 'transparent'}
                  stroke={bound ? 'var(--color-accent-dim)' : 'var(--color-border-strong)'}
                  strokeWidth={1.5}
                  strokeDasharray={bound ? undefined : '3 3'}
                />
                <text
                  x={cx}
                  y={cy - 3}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="9"
                  fill="var(--color-text-dim)"
                  pointerEvents="none"
                >
                  {i}
                </text>
                <text
                  x={cx}
                  y={cy + 8}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="7"
                  fill="var(--color-text)"
                  pointerEvents="none"
                >
                  {(parsed?.label ?? parsed?.args.join(' ') ?? '').slice(0, 8)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="flex items-center gap-3 text-xs">
        <label className="text-[var(--color-text-dim)]">Slots</label>
        <input
          type="range"
          min={1}
          max={RADIAL_MENU_MAX_SLOTS}
          value={count}
          onChange={(e) => changeSlotCount(Number.parseInt(e.target.value, 10))}
          className="flex-1 accent-[var(--color-accent)]"
        />
        <span className="font-mono w-8 text-right">{count}</span>
      </div>

      <MenuPositionSliders group={group} />

      {activeSlot !== null && (
        <BindingPicker
          initial={group.bindings[`touch_menu_button_${activeSlot}`]}
          title={`Radial slot ${activeSlot} · group #${group.id}`}
          onApply={onSlotApply}
          onCancel={() => setActiveSlot(null)}
        />
      )}
    </div>
  );
}
