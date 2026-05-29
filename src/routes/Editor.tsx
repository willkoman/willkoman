import { useState } from 'react';
import { useConfigStore } from '../lib/state/configStore';
import { useIsDeckLayout } from '../lib/state/viewport';
import ActionSetTabs from '../components/ActionSetTabs';
import ControllerView from '../components/ControllerView';
import GroupInspector from '../components/GroupInspector';
import InspectorSurface from '../components/InspectorSurface';
import PreflightDialog from '../components/PreflightDialog';
import ValidationStrip from '../components/ValidationStrip';

export default function Editor() {
  const config = useConfigStore((s) => s.config);
  const isDeck = useIsDeckLayout();
  const [preflightOpen, setPreflightOpen] = useState(false);

  if (!config) {
    return (
      <div className="h-full grid place-items-center text-[var(--color-text-dim)]">
        Open a .vdf from the Home tab to start editing.
      </div>
    );
  }

  const onExport = () => setPreflightOpen(true);

  return (
    <div
      className={
        isDeck
          ? 'h-full grid grid-cols-[200px_1fr] divide-x divide-[var(--color-border)]'
          : 'h-full grid grid-cols-[260px_1fr_360px] divide-x divide-[var(--color-border)]'
      }
    >
      <aside className="overflow-y-auto p-3 bg-[var(--color-panel)]">
        <ActionSetTabs />
      </aside>
      <section className="overflow-y-auto p-4 space-y-4">
        <div className="flex items-center justify-between">
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
        <ValidationStrip />
        <ControllerView />
        {/* Spacer so the bottom sheet on Deck doesn't cover the bottom of the canvas. */}
        {isDeck && <div className="h-12" />}
      </section>
      {!isDeck && (
        <InspectorSurface>
          <GroupInspector />
        </InspectorSurface>
      )}
      {isDeck && (
        <InspectorSurface>
          <GroupInspector />
        </InspectorSurface>
      )}
      {preflightOpen && <PreflightDialog onClose={() => setPreflightOpen(false)} />}
    </div>
  );
}
