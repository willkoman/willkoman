import { useMemo, useState } from 'react';
import { useConfigStore } from '../lib/state/configStore';
import { INPUT_STYLE_MAP } from '../lib/schema';
import DeckSvg from './DeckSvg';

/**
 * The editor's primary canvas. Renders the Steam Deck illustration with
 * each input source bound to the currently-selected action set's preset.
 *
 * Selection model:
 *   - clicking a hit region selects the GROUP wired to that source
 *     (preset.groupSourceBindings)
 *   - if multiple groups are wired (active / inactive / modeshift), we
 *     prefer the "active" one and stash the rest in a small chip menu
 *     under the canvas (Phase 2 polish)
 *
 * A "Details" toggle reveals the raw list view from 0.0.1 for power
 * users who want to scan every group at once.
 */
export default function ControllerView() {
  const config = useConfigStore((s) => s.config);
  const setName = useConfigStore((s) => s.selectedActionSet);
  const selectGroup = useConfigStore((s) => s.selectGroup);
  const selectedGroupId = useConfigStore((s) => s.selectedGroupId);
  const [showDetails, setShowDetails] = useState(false);

  // Stable hooks — compute even if preset is missing, then early-return.
  const sourceLabels = useMemo(() => {
    if (!config || !setName) return {} as Record<string, string>;
    const preset = config.presets.find((p) => p.name === setName);
    if (!preset) return {};
    const out: Record<string, string> = {};
    for (const [groupIdStr, sourceState] of Object.entries(preset.groupSourceBindings)) {
      const id = Number.parseInt(groupIdStr, 10);
      const group = config.groups.find((g) => g.id === id);
      if (!group) continue;
      // sourceState is like "left_trackpad active" — take the source name.
      const source = sourceState.split(' ')[0] ?? '';
      const style = INPUT_STYLE_MAP[group.mode];
      // Prefer "active" assignments; only overwrite if the slot is empty.
      const isActive = sourceState.includes('active') && !sourceState.includes('modeshift');
      if (!out[source] || isActive) {
        out[source] = style?.label ?? group.mode;
      }
    }
    return out;
  }, [config, setName]);

  const selectedSourceId = useMemo(() => {
    if (!config || selectedGroupId === null) return undefined;
    for (const preset of config.presets) {
      const match = Object.entries(preset.groupSourceBindings).find(
        ([gid]) => Number.parseInt(gid, 10) === selectedGroupId
      );
      if (match) return match[1].split(' ')[0];
    }
    return undefined;
  }, [config, selectedGroupId]);

  if (!config || !setName) return null;
  const preset = config.presets.find((p) => p.name === setName);
  if (!preset) {
    return (
      <div className="text-sm text-[var(--color-text-dim)]">
        No preset for action set &quot;{setName}&quot;.
      </div>
    );
  }

  const sourceToActiveGroupId = (sourceId: string): number | null => {
    const entries = Object.entries(preset.groupSourceBindings);
    // First match an explicitly "active" assignment for this source.
    for (const [gid, ss] of entries) {
      const [src, ...state] = ss.split(' ');
      if (src === sourceId && state.join(' ') === 'active') return Number.parseInt(gid, 10);
    }
    // Fall back to the first wiring (any state) for this source.
    for (const [gid, ss] of entries) {
      if (ss.startsWith(sourceId + ' ') || ss === sourceId) return Number.parseInt(gid, 10);
    }
    return null;
  };

  const onSourceSelect = (sourceId: string) => {
    const groupId = sourceToActiveGroupId(sourceId);
    if (groupId !== null) selectGroup(groupId);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm text-[var(--color-text-dim)]">
          Preset <span className="text-[var(--color-text)] font-medium">{preset.name}</span> ·{' '}
          {Object.keys(preset.groupSourceBindings).length} bindings
        </div>
        <button
          onClick={() => setShowDetails((v) => !v)}
          className="text-xs text-[var(--color-text-dim)] hover:text-[var(--color-text)] px-2 py-1 rounded hover:bg-[var(--color-panel-2)]"
        >
          {showDetails ? 'Hide details' : 'Show details'}
        </button>
      </div>

      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] p-4">
        <DeckSvg
          labels={sourceLabels}
          selectedSource={selectedSourceId}
          onSelect={onSourceSelect}
        />
      </div>

      {showDetails && (
        <ul className="space-y-1">
          {Object.entries(preset.groupSourceBindings).map(([groupIdStr, sourceState]) => {
            const groupId = Number.parseInt(groupIdStr, 10);
            const group = config.groups.find((g) => g.id === groupId);
            const style = group ? INPUT_STYLE_MAP[group.mode] : undefined;
            const active = selectedGroupId === groupId;
            return (
              <li key={`${groupId}-${sourceState}`}>
                <button
                  onClick={() => selectGroup(groupId)}
                  className={`w-full grid grid-cols-[80px_1fr_160px] gap-3 px-3 py-2 rounded-md text-left text-xs transition-colors ${
                    active
                      ? 'bg-[var(--color-panel-2)] border border-[var(--color-accent)]'
                      : 'bg-[var(--color-panel)] hover:bg-[var(--color-panel-2)] border border-transparent'
                  }`}
                >
                  <span className="text-[var(--color-text-dim)] font-mono">#{groupId}</span>
                  <span>
                    <span className="font-medium">{style?.label ?? group?.mode ?? 'unknown'}</span>
                    {group && (
                      <span className="ml-2 text-[var(--color-text-dim)]">
                        {Object.keys(group.bindings).length} bindings
                      </span>
                    )}
                  </span>
                  <span className="text-[var(--color-text-dim)] text-right">{sourceState}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
