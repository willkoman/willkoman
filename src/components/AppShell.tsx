import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useConfigStore } from '../lib/state/configStore';
import CommandPalette from './CommandPalette';
import DiffDrawer from './DiffDrawer';
import SettingsDialog from './SettingsDialog';
import Tutorial, { useTutorial } from './Tutorial';

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const location = useLocation();
  const fileName = useConfigStore((s) => s.fileName);
  const dirty = useConfigStore((s) => s.dirty);
  const config = useConfigStore((s) => s.config);
  const undo = useConfigStore((s) => s.undo);
  const redo = useConfigStore((s) => s.redo);
  const canUndo = useConfigStore((s) => s.canUndo());
  const canRedo = useConfigStore((s) => s.canRedo());
  const undoLabel = useConfigStore((s) => s.history.past[s.history.past.length - 1]?.label);
  const redoLabel = useConfigStore((s) => s.history.future[s.history.future.length - 1]?.label);

  const [paletteOpen, setPaletteOpen] = useState(false);
  const [diffOpen, setDiffOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const tutorial = useTutorial();

  // Cmd/Ctrl+Z / Shift+Z / Y / K shortcuts.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      if (e.key === 'k') {
        e.preventDefault();
        setPaletteOpen((v) => !v);
        return;
      }
      if (e.key === 'd' && e.shiftKey) {
        e.preventDefault();
        setDiffOpen((v) => !v);
        return;
      }
      if (e.key === 'z' && !e.shiftKey) {
        if (canUndo) {
          e.preventDefault();
          undo();
        }
      } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
        if (canRedo) {
          e.preventDefault();
          redo();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [canUndo, canRedo, undo, redo]);

  const navItem = (to: string, label: string) => {
    const active = location.pathname === to;
    return (
      <Link
        to={to}
        className={`px-3 py-2 rounded-md text-sm transition-colors ${
          active
            ? 'bg-[var(--color-panel-2)] text-[var(--color-text)]'
            : 'text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:bg-[var(--color-panel)]'
        }`}
      >
        {label}
      </Link>
    );
  };

  const historyBtn = (
    onClick: () => void,
    enabled: boolean,
    label: string,
    tooltipLabel: string | undefined,
    glyph: string
  ) => (
    <button
      onClick={onClick}
      disabled={!enabled}
      title={tooltipLabel ? `${label}: ${tooltipLabel}` : label}
      aria-label={label}
      className={`px-3 py-2 rounded-md text-sm transition-colors font-mono ${
        enabled
          ? 'text-[var(--color-text)] hover:bg-[var(--color-panel-2)]'
          : 'text-[var(--color-text-muted)] cursor-not-allowed'
      }`}
    >
      {glyph}
    </button>
  );

  return (
    <div className="h-full flex flex-col bg-[var(--color-bg)]">
      <header className="flex items-center gap-4 px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-panel)]">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold tracking-tight">Padsmith</span>
          <span className="text-xs text-[var(--color-text-dim)]">v0.1.0 · Trust Layer</span>
        </div>
        <nav className="flex items-center gap-1 ml-4">
          {navItem('/', 'Home')}
          {navItem('/editor', 'Editor')}
          {navItem('/library', 'Library')}
        </nav>
        <div className="flex-1" />
        {config && (
          <div className="flex items-center gap-1">
            {historyBtn(undo, canUndo, 'Undo', undoLabel, '↶')}
            {historyBtn(redo, canRedo, 'Redo', redoLabel, '↷')}
            <button
              onClick={() => setDiffOpen(true)}
              disabled={!dirty}
              title={dirty ? 'Diff: original vs current (Ctrl+Shift+D)' : 'No changes to diff'}
              className={`px-3 py-2 rounded-md text-sm transition-colors ${
                dirty
                  ? 'text-[var(--color-text)] hover:bg-[var(--color-panel-2)]'
                  : 'text-[var(--color-text-muted)] cursor-not-allowed'
              }`}
            >
              Diff
            </button>
            <button
              onClick={() => setPaletteOpen(true)}
              title="Command palette (Ctrl+K)"
              className="px-3 py-2 rounded-md text-sm text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:bg-[var(--color-panel-2)] font-mono"
            >
              ⌘K
            </button>
          </div>
        )}
        <button
          onClick={tutorial.openOnDemand}
          title="Tutorial"
          className="px-3 py-2 rounded-md text-sm text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:bg-[var(--color-panel-2)]"
          aria-label="Open tutorial"
        >
          ?
        </button>
        <button
          onClick={() => setSettingsOpen(true)}
          title="Settings"
          className="px-3 py-2 rounded-md text-sm text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:bg-[var(--color-panel-2)]"
          aria-label="Open settings"
        >
          ⚙
        </button>
        {fileName && (
          <div className="text-xs text-[var(--color-text-dim)]">
            {fileName}
            {dirty && <span className="ml-2 text-[var(--color-warn)]">● unsaved</span>}
          </div>
        )}
      </header>
      <main className="flex-1 overflow-hidden">{children}</main>
      {paletteOpen && <CommandPalette onClose={() => setPaletteOpen(false)} />}
      {diffOpen && <DiffDrawer onClose={() => setDiffOpen(false)} />}
      {settingsOpen && <SettingsDialog onClose={() => setSettingsOpen(false)} />}
      <Tutorial
        open={tutorial.open}
        step={tutorial.step}
        setStep={tutorial.setStep}
        dontShowAgain={tutorial.dontShowAgain}
        setDontShowAgain={tutorial.setDontShowAgain}
        close={tutorial.close}
      />
    </div>
  );
}
