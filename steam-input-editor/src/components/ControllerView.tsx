import { useConfigStore } from '../lib/state/configStore';
import { INPUT_STYLE_MAP } from '../lib/schema';

/**
 * Read-only summary of which group is bound to which input source for the
 * currently-selected action set. Phase 1 will turn this into the Deck SVG.
 */
export default function ControllerView() {
  const config = useConfigStore((s) => s.config);
  const setName = useConfigStore((s) => s.selectedActionSet);
  const selectGroup = useConfigStore((s) => s.selectGroup);
  const selectedGroupId = useConfigStore((s) => s.selectedGroupId);

  if (!config || !setName) return null;
  const preset = config.presets.find((p) => p.name === setName);
  if (!preset) {
    return (
      <div className="text-sm text-[var(--color-text-dim)]">
        No preset for action set "{setName}".
      </div>
    );
  }

  const rows = Object.entries(preset.groupSourceBindings).map(([groupIdStr, sourceState]) => {
    const groupId = Number.parseInt(groupIdStr, 10);
    const group = config.groups.find((g) => g.id === groupId);
    return { groupId, sourceState, group };
  });

  return (
    <div className="space-y-3">
      <div className="text-sm text-[var(--color-text-dim)]">
        Preset <span className="text-[var(--color-text)] font-medium">{preset.name}</span> ·{' '}
        {rows.length} input source bindings
      </div>
      <ul className="space-y-1">
        {rows.map(({ groupId, sourceState, group }) => {
          const style = group ? INPUT_STYLE_MAP[group.mode] : undefined;
          const active = selectedGroupId === groupId;
          return (
            <li key={`${groupId}-${sourceState}`}>
              <button
                onClick={() => selectGroup(groupId)}
                className={`w-full grid grid-cols-[80px_1fr_140px] gap-3 px-3 py-2 rounded-md text-left text-sm transition-colors ${
                  active
                    ? 'bg-[var(--color-panel-2)] border border-[var(--color-accent)]'
                    : 'bg-[var(--color-panel)] hover:bg-[var(--color-panel-2)] border border-transparent'
                }`}
              >
                <span className="text-[var(--color-text-dim)] font-mono">#{groupId}</span>
                <span>
                  <span className="font-medium">{style?.label ?? group?.mode ?? 'unknown'}</span>
                  {group && (
                    <span className="ml-2 text-xs text-[var(--color-text-dim)]">
                      {Object.keys(group.bindings).length} bindings
                    </span>
                  )}
                </span>
                <span className="text-xs text-[var(--color-text-dim)] text-right">{sourceState}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="text-xs text-[var(--color-text-dim)] pt-4 border-t border-[var(--color-border)]">
        Phase 1 will replace this list with a clickable Deck SVG illustration showing each input source
        in its physical position.
      </div>
    </div>
  );
}
