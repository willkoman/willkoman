import { useConfigStore } from '../lib/state/configStore';
import { saveVdfFile } from '../lib/fs/fileSystem';
import ActionSetTabs from '../components/ActionSetTabs';
import ControllerView from '../components/ControllerView';
import GroupInspector from '../components/GroupInspector';

export default function Editor() {
  const config = useConfigStore((s) => s.config);
  const fileName = useConfigStore((s) => s.fileName);
  const exportText = useConfigStore((s) => s.exportText);

  if (!config) {
    return (
      <div className="h-full grid place-items-center text-[var(--color-text-dim)]">
        Open a .vdf from the Home tab to start editing.
      </div>
    );
  }

  const onExport = async () => {
    const name = fileName ?? 'controller_neptune.vdf';
    await saveVdfFile(name, exportText());
  };

  return (
    <div className="h-full grid grid-cols-[260px_1fr_360px] divide-x divide-[var(--color-border)]">
      <aside className="overflow-y-auto p-3 bg-[var(--color-panel)]">
        <ActionSetTabs />
      </aside>
      <section className="overflow-y-auto p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm text-[var(--color-text-dim)]">
              {config.meta.controllerType ?? 'unknown controller'} · v{config.version}
            </div>
            <h2 className="text-xl font-semibold">{config.meta.title ?? 'Untitled config'}</h2>
          </div>
          <button
            onClick={onExport}
            className="px-3 py-2 rounded-md bg-[var(--color-accent)] text-black text-sm font-medium hover:bg-[var(--color-accent-hover)]"
          >
            Export .vdf
          </button>
        </div>
        <ControllerView />
      </section>
      <aside className="overflow-y-auto p-3 bg-[var(--color-panel)]">
        <GroupInspector />
      </aside>
    </div>
  );
}
