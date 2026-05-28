import { useNavigate } from 'react-router-dom';
import { useConfigStore } from '../lib/state/configStore';
import { openVdfFile } from '../lib/fs/fileSystem';

export default function Home() {
  const navigate = useNavigate();
  const load = useConfigStore((s) => s.loadFromText);

  const onOpen = async () => {
    const file = await openVdfFile();
    if (!file) return;
    load(file.text, file.name);
    navigate('/editor');
  };

  const onNew = () => {
    // Phase 1: from-scratch template. For now, hint the user where to go.
    navigate('/library');
  };

  return (
    <div className="h-full overflow-auto p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <section>
          <h1 className="text-3xl font-bold mb-2">Steam Input Editor</h1>
          <p className="text-[var(--color-text-dim)]">
            A visual editor for Steam Input controller schemas. Designed for the Steam Deck. Open a{' '}
            <code className="px-1.5 py-0.5 rounded bg-[var(--color-panel)] text-sm">.vdf</code> to start.
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={onOpen}
            className="p-6 rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] hover:bg-[var(--color-panel-2)] text-left transition-colors"
          >
            <div className="font-semibold mb-1">Open existing config…</div>
            <div className="text-sm text-[var(--color-text-dim)]">
              Pick a controller_neptune.vdf or any controller_*.vdf to import.
            </div>
          </button>
          <button
            onClick={onNew}
            className="p-6 rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] hover:bg-[var(--color-panel-2)] text-left transition-colors"
          >
            <div className="font-semibold mb-1">Browse templates</div>
            <div className="text-sm text-[var(--color-text-dim)]">
              Start from a built-in template (Phase 1).
            </div>
          </button>
        </section>

        <section className="text-sm text-[var(--color-text-dim)] space-y-2">
          <div className="font-semibold text-[var(--color-text)]">Status</div>
          <p>
            Phase 0 — scaffolded. The parser, schema model, and tests are in place. The UI surfaces below
            are stubs and will be filled in across phases. See <code>docs/roadmap.md</code>.
          </p>
        </section>
      </div>
    </div>
  );
}
