import { useConfigStore } from '../lib/state/configStore';
import { INPUT_STYLE_MAP, isDocumentedTouchMenuCount } from '../lib/schema';
import TouchMenuPreview from './TouchMenuPreview';
import RadialMenuPreview from './RadialMenuPreview';

export default function GroupInspector() {
  const config = useConfigStore((s) => s.config);
  const id = useConfigStore((s) => s.selectedGroupId);

  if (!config) return null;
  if (id === null) {
    return (
      <div className="text-sm text-[var(--color-text-dim)]">
        Select an input source to inspect its group.
      </div>
    );
  }
  const group = config.groups.find((g) => g.id === id);
  if (!group) {
    return <div className="text-sm text-[var(--color-text-dim)]">Group #{id} not found.</div>;
  }
  const style = INPUT_STYLE_MAP[group.mode];
  const isTouchMenu = group.mode === 'touch_menu';
  const isRadialMenu = group.mode === 'radial_menu';
  const slotCountStr = group.settings.touch_menu_button_count;
  const slotCount = slotCountStr ? Number.parseInt(slotCountStr, 10) : undefined;

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs uppercase tracking-wider text-[var(--color-text-dim)]">
          Group #{group.id}
        </div>
        <div className="font-semibold">{style?.label ?? group.mode}</div>
        {style?.description && (
          <div className="text-xs text-[var(--color-text-dim)] mt-1">{style.description}</div>
        )}
      </div>

      {isTouchMenu && (
        <section>
          <div className="text-xs uppercase tracking-wider text-[var(--color-text-dim)] mb-2">
            Touch menu preview
          </div>
          <TouchMenuPreview group={group} />
          {slotCount !== undefined && !isDocumentedTouchMenuCount(slotCount) && (
            <div className="mt-2 text-xs text-[var(--color-warn)]">
              Slot count {slotCount} is outside the documented set (2, 4, 7, 9, 12, 13, 16).
            </div>
          )}
        </section>
      )}

      {isRadialMenu && (
        <section>
          <div className="text-xs uppercase tracking-wider text-[var(--color-text-dim)] mb-2">
            Radial menu preview
          </div>
          <RadialMenuPreview group={group} />
        </section>
      )}

      <section>
        <div className="text-xs uppercase tracking-wider text-[var(--color-text-dim)] mb-2">
          Bindings
        </div>
        <ul className="space-y-1 text-xs">
          {Object.entries(group.bindings).map(([slot, value]) => (
            <li key={slot} className="grid grid-cols-[1fr_2fr] gap-2 py-1 border-b border-[var(--color-border)]">
              <span className="font-mono text-[var(--color-text-dim)]">{slot}</span>
              <span className="break-all">{value}</span>
            </li>
          ))}
        </ul>
      </section>

      {Object.keys(group.settings).length > 0 && (
        <section>
          <div className="text-xs uppercase tracking-wider text-[var(--color-text-dim)] mb-2">
            Settings
          </div>
          <ul className="space-y-1 text-xs">
            {Object.entries(group.settings).map(([k, v]) => (
              <li key={k} className="grid grid-cols-[1fr_2fr] gap-2 py-1 border-b border-[var(--color-border)]">
                <span className="font-mono text-[var(--color-text-dim)]">{k}</span>
                <span>{v}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
