import { useState } from 'react';
import { useConfigStore } from '../lib/state/configStore';
import { addActionSet, removeActionSet, renameActionSet } from '../lib/schema';

/**
 * Action set + action layer sidebar with CRUD.
 *
 * Mutators are the AST-first ones from `lib/schema/mutators`; every edit
 * routes through `applyMutation` so it lands in the patch-based undo
 * stack and the typed projection.
 *
 * Layers are currently read-only here — Phase 2 adds layer editing in
 * a follow-up because the nested-menu auto-wiring (ADD_LAYER /
 * REMOVE_LAYER) UX needs a dedicated dialog. We surface the existing
 * layers and which set they overlay; the user can edit them via the
 * bindings on the corresponding group for now.
 */
export default function ActionSetTabs() {
  const config = useConfigStore((s) => s.config);
  const selected = useConfigStore((s) => s.selectedActionSet);
  const select = useConfigStore((s) => s.selectActionSet);
  const applyMutation = useConfigStore((s) => s.applyMutation);

  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');

  if (!config) return null;

  const beginRename = (currentName: string) => {
    setEditing(currentName);
    setDraft(currentName);
  };

  const commitRename = () => {
    if (!editing || !config) return;
    const next = draft.trim();
    if (!next || next === editing) {
      setEditing(null);
      return;
    }
    if (config.actionSets.some((s) => s.name === next)) {
      // Don't clobber — bail silently. Future polish: toast.
      setEditing(null);
      return;
    }
    const result = renameActionSet(config, editing, next);
    applyMutation(result);
    select(next);
    setEditing(null);
  };

  const cancelRename = () => setEditing(null);

  const onRemove = (name: string) => {
    if (!config) return;
    if (config.actionSets.length <= 1) return; // never remove the last set
    const result = removeActionSet(config, name);
    applyMutation(result);
    if (selected === name) {
      select(result.config.actionSets[0]?.name ?? '');
    }
  };

  const onAdd = () => {
    if (!config) return;
    const name = newName.trim();
    if (!name) return;
    if (config.actionSets.some((s) => s.name === name)) return;
    const result = addActionSet(config, name, name);
    applyMutation(result);
    select(name);
    setNewName('');
    setShowNew(false);
  };

  return (
    <div className="space-y-4">
      <section>
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs uppercase tracking-wider text-[var(--color-text-dim)]">
            Action sets
          </div>
          <button
            onClick={() => setShowNew((v) => !v)}
            className="text-xs text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] px-1"
            aria-label="Add action set"
          >
            + add
          </button>
        </div>

        {showNew && (
          <div className="flex gap-1 mb-2">
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onAdd();
                if (e.key === 'Escape') {
                  setShowNew(false);
                  setNewName('');
                }
              }}
              placeholder="Set name (e.g. OnFoot)"
              className="flex-1 px-2 py-1 rounded bg-[var(--color-panel-2)] border border-[var(--color-border)] text-xs"
            />
            <button
              onClick={onAdd}
              disabled={!newName.trim()}
              className="px-2 py-1 rounded bg-[var(--color-accent)] text-black text-xs disabled:opacity-50"
            >
              Add
            </button>
          </div>
        )}

        <ul className="space-y-1">
          {config.actionSets.map((set) => {
            const active = set.name === selected;
            const isEditing = editing === set.name;
            const canRemove = config.actionSets.length > 1;
            return (
              <li key={set.name} className="group">
                {isEditing ? (
                  <div className="flex gap-1">
                    <input
                      autoFocus
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitRename();
                        if (e.key === 'Escape') cancelRename();
                      }}
                      onBlur={commitRename}
                      className="flex-1 px-2 py-1 rounded bg-[var(--color-panel-2)] border border-[var(--color-accent)] text-sm"
                    />
                  </div>
                ) : (
                  <div className="flex items-stretch">
                    <button
                      onClick={() => select(set.name)}
                      onDoubleClick={() => beginRename(set.name)}
                      className={`flex-1 text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        active
                          ? 'bg-[var(--color-panel-2)] text-[var(--color-text)]'
                          : 'text-[var(--color-text-dim)] hover:bg-[var(--color-panel-2)] hover:text-[var(--color-text)]'
                      }`}
                    >
                      <div className="font-medium">{set.title ?? set.name}</div>
                      <div className="text-xs opacity-75">{set.name}</div>
                    </button>
                    <div className="flex flex-col justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => beginRename(set.name)}
                        title="Rename"
                        className="px-2 py-1 text-xs text-[var(--color-text-dim)] hover:text-[var(--color-text)]"
                        aria-label={`Rename ${set.name}`}
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => onRemove(set.name)}
                        disabled={!canRemove}
                        title={canRemove ? 'Remove' : 'Cannot remove last set'}
                        className="px-2 py-1 text-xs text-[var(--color-text-dim)] hover:text-[var(--color-error)] disabled:opacity-30 disabled:hover:text-[var(--color-text-dim)]"
                        aria-label={`Remove ${set.name}`}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {config.actionLayers.length > 0 && (
        <section>
          <div className="text-xs uppercase tracking-wider text-[var(--color-text-dim)] mb-2">
            Action layers
          </div>
          <ul className="space-y-1">
            {config.actionLayers.map((layer) => (
              <li
                key={layer.name}
                className="px-3 py-2 rounded-md text-sm text-[var(--color-text-dim)] bg-[var(--color-panel-2)]"
              >
                <div className="font-medium">{layer.title ?? layer.name}</div>
                {layer.parentSetName && (
                  <div className="text-xs opacity-75">on {layer.parentSetName}</div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
