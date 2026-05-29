import type { Group } from '../lib/schema';
import { setGroupSetting } from '../lib/schema';
import { useConfigStore } from '../lib/state/configStore';

interface Props {
  group: Group;
}

const SLIDERS: Array<{
  key: string;
  label: string;
  min: number;
  max: number;
  default: number;
  unit?: string;
}> = [
  { key: 'touch_menu_position_x', label: 'Position X', min: 0, max: 100, default: 50, unit: '%' },
  { key: 'touch_menu_position_y', label: 'Position Y', min: 0, max: 100, default: 50, unit: '%' },
  { key: 'touch_menu_opacity', label: 'Opacity', min: 0, max: 100, default: 85, unit: '%' },
  { key: 'touch_menu_scale', label: 'Size', min: 50, max: 150, default: 100, unit: '%' },
];

const FIRE_TYPES: Array<{ value: string; label: string }> = [
  { value: '0', label: 'Button Click' },
  { value: '1', label: 'Button Release' },
  { value: '2', label: 'Touch Release' },
  { value: '3', label: 'Always' },
];

/**
 * Position / opacity / size / activation-style controls shared by
 * touch_menu, radial_menu, and hotbar_menu groups. Maps directly to the
 * documented VDF settings keys; every change goes through setGroupSetting
 * (so it lands in the patch undo stack).
 */
export default function MenuPositionSliders({ group }: Props) {
  const config = useConfigStore((s) => s.config);
  const applyMutation = useConfigStore((s) => s.applyMutation);

  if (!config) return null;

  const setSetting = (key: string, value: string) => {
    applyMutation(setGroupSetting(config, group.id, key, value));
  };

  return (
    <details className="rounded-md border border-[var(--color-border)] bg-[var(--color-panel-2)]">
      <summary className="cursor-pointer px-3 py-2 text-xs text-[var(--color-text-dim)] hover:text-[var(--color-text)]">
        On-screen settings
      </summary>
      <div className="px-3 pb-3 space-y-3">
        <div>
          <label className="block text-xs text-[var(--color-text-dim)] mb-1">Activation</label>
          <div className="grid grid-cols-4 gap-1">
            {FIRE_TYPES.map((ft) => {
              const active = (group.settings.touchmenu_button_fire_type ?? '0') === ft.value;
              return (
                <button
                  key={ft.value}
                  onClick={() => setSetting('touchmenu_button_fire_type', ft.value)}
                  className={`px-2 py-1 rounded text-xs ${
                    active
                      ? 'bg-[var(--color-accent)] text-black'
                      : 'bg-[var(--color-panel)] text-[var(--color-text-dim)] hover:text-[var(--color-text)]'
                  }`}
                >
                  {ft.label}
                </button>
              );
            })}
          </div>
        </div>

        {SLIDERS.map(({ key, label, min, max, default: dflt, unit }) => {
          const current = Number.parseInt(group.settings[key] ?? String(dflt), 10);
          return (
            <div key={key}>
              <label className="flex items-center justify-between text-xs text-[var(--color-text-dim)] mb-1">
                <span>{label}</span>
                <span className="font-mono">
                  {current}
                  {unit ?? ''}
                </span>
              </label>
              <input
                type="range"
                min={min}
                max={max}
                value={current}
                onChange={(e) => setSetting(key, e.target.value)}
                className="w-full accent-[var(--color-accent)]"
              />
            </div>
          );
        })}

        <label className="flex items-center gap-2 text-xs text-[var(--color-text-dim)]">
          <input
            type="checkbox"
            checked={group.settings.touch_menu_show_labels === '1'}
            onChange={(e) => setSetting('touch_menu_show_labels', e.target.checked ? '1' : '0')}
            className="accent-[var(--color-accent)]"
          />
          Show binding labels on each slot
        </label>
      </div>
    </details>
  );
}
