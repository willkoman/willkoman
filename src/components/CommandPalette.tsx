import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useConfigStore } from '../lib/state/configStore';
import { INPUT_STYLE_MAP, setGroupMode } from '../lib/schema';
import { fuzzyFilter } from '../lib/state/fuzzy';

interface Command {
  id: string;
  label: string;
  hint?: string;
  run: () => void;
}

interface CommandPaletteProps {
  onClose: () => void;
}

/**
 * Cmd/Ctrl+K command palette.
 *
 * Builds a fresh command list every open from the current config + store
 * state. Commands include: jump to action set, jump to group, change input
 * style on the selected group, undo, redo, export.
 *
 * The dialog renders to a portal-style fixed overlay; click-outside or
 * Escape closes it. Up/Down + Enter to navigate; the highlighted item
 * runs on Enter. The fuzzy match highlights are rendered as spans.
 */
export default function CommandPalette({ onClose }: CommandPaletteProps) {
  const config = useConfigStore((s) => s.config);
  const selectActionSet = useConfigStore((s) => s.selectActionSet);
  const selectGroup = useConfigStore((s) => s.selectGroup);
  const selectedGroupId = useConfigStore((s) => s.selectedGroupId);
  const applyMutation = useConfigStore((s) => s.applyMutation);
  const undo = useConfigStore((s) => s.undo);
  const redo = useConfigStore((s) => s.redo);
  const canUndo = useConfigStore((s) => s.canUndo());
  const canRedo = useConfigStore((s) => s.canRedo());
  const exportText = useConfigStore((s) => s.exportText);
  const fileName = useConfigStore((s) => s.fileName);

  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  const commands = useMemo<Command[]>(() => {
    if (!config) return [];
    const cmds: Command[] = [];

    for (const set of config.actionSets) {
      cmds.push({
        id: `set:${set.name}`,
        label: `Go to action set: ${set.title ?? set.name}`,
        hint: 'Set',
        run: () => {
          selectActionSet(set.name);
          onClose();
        },
      });
    }

    for (const group of config.groups) {
      const styleLabel = INPUT_STYLE_MAP[group.mode]?.label ?? group.mode;
      cmds.push({
        id: `group:${group.id}`,
        label: `Jump to group #${group.id} (${styleLabel})`,
        hint: 'Group',
        run: () => {
          selectGroup(group.id);
          onClose();
        },
      });
    }

    if (selectedGroupId !== null) {
      for (const style of Object.values(INPUT_STYLE_MAP)) {
        cmds.push({
          id: `mode:${style.id}`,
          label: `Change selected group #${selectedGroupId} to ${style.label}`,
          hint: 'Mode',
          run: () => {
            if (!config) return;
            applyMutation(setGroupMode(config, selectedGroupId, style.id));
            onClose();
          },
        });
      }
    }

    if (canUndo) {
      cmds.push({
        id: 'undo',
        label: 'Undo last edit',
        hint: 'Ctrl+Z',
        run: () => {
          undo();
          onClose();
        },
      });
    }
    if (canRedo) {
      cmds.push({
        id: 'redo',
        label: 'Redo',
        hint: 'Ctrl+Shift+Z',
        run: () => {
          redo();
          onClose();
        },
      });
    }
    cmds.push({
      id: 'export',
      label: `Export ${fileName ?? 'controller_neptune.vdf'}`,
      hint: 'Save',
      run: () => {
        const text = exportText();
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName ?? 'controller_neptune.vdf';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        onClose();
      },
    });

    return cmds;
  }, [
    config,
    selectActionSet,
    selectGroup,
    selectedGroupId,
    applyMutation,
    canUndo,
    canRedo,
    undo,
    redo,
    fileName,
    exportText,
    onClose,
  ]);

  const filtered = useMemo(() => fuzzyFilter(commands, query, (c) => c.label), [commands, query]);

  useEffect(() => {
    setCursor(0);
  }, [query]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setCursor((c) => Math.min(filtered.length - 1, c + 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setCursor((c) => Math.max(0, c - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const pick = filtered[cursor];
        if (pick) pick.item.run();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [filtered, cursor, onClose]);

  useEffect(() => {
    const item = listRef.current?.children[cursor] as HTMLElement | undefined;
    item?.scrollIntoView({ block: 'nearest' });
  }, [cursor]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-panel)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          autoFocus
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type to search… (jump, change mode, undo, export)"
          className="w-full px-4 py-3 bg-transparent border-b border-[var(--color-border)] text-sm outline-none"
        />
        <ul ref={listRef} className="max-h-80 overflow-y-auto py-1">
          {filtered.length === 0 && (
            <li className="px-4 py-3 text-sm text-[var(--color-text-dim)]">
              No matching commands.
            </li>
          )}
          {filtered.map(({ item, result }, i) => {
            const selected = i === cursor;
            return (
              <li key={item.id}>
                <button
                  onClick={() => item.run()}
                  onMouseEnter={() => setCursor(i)}
                  className={`w-full flex items-center justify-between px-4 py-2 text-left text-sm ${
                    selected
                      ? 'bg-[var(--color-panel-2)] text-[var(--color-text)]'
                      : 'text-[var(--color-text-dim)] hover:text-[var(--color-text)]'
                  }`}
                >
                  <span>{highlight(item.label, result.indices)}</span>
                  {item.hint && (
                    <span className="text-xs text-[var(--color-text-muted)] ml-3 font-mono">
                      {item.hint}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function highlight(label: string, indices: number[]) {
  if (indices.length === 0) return label;
  const set = new Set(indices);
  const out: ReactNode[] = [];
  for (let i = 0; i < label.length; i++) {
    const ch = label[i];
    if (set.has(i)) {
      out.push(
        <span key={i} className="text-[var(--color-accent)] font-medium">
          {ch}
        </span>
      );
    } else {
      out.push(<span key={i}>{ch}</span>);
    }
  }
  return out;
}
