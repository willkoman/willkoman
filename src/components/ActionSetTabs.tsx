import { useConfigStore } from '../lib/state/configStore';

export default function ActionSetTabs() {
  const config = useConfigStore((s) => s.config);
  const selected = useConfigStore((s) => s.selectedActionSet);
  const select = useConfigStore((s) => s.selectActionSet);

  if (!config) return null;

  return (
    <div className="space-y-4">
      <section>
        <div className="text-xs uppercase tracking-wider text-[var(--color-text-dim)] mb-2">
          Action sets
        </div>
        <ul className="space-y-1">
          {config.actionSets.map((set) => {
            const active = set.name === selected;
            return (
              <li key={set.name}>
                <button
                  onClick={() => select(set.name)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    active
                      ? 'bg-[var(--color-panel-2)] text-[var(--color-text)]'
                      : 'text-[var(--color-text-dim)] hover:bg-[var(--color-panel-2)] hover:text-[var(--color-text)]'
                  }`}
                >
                  <div className="font-medium">{set.title ?? set.name}</div>
                  <div className="text-xs opacity-75">{set.name}</div>
                </button>
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
