import { create } from 'zustand';
import { parseVdf, serializeVdf } from '../vdf';
import { configFromVdf } from '../schema';
import type { SteamInputConfig } from '../schema';

export interface UndoEntry {
  config: SteamInputConfig;
  label: string;
}

interface ConfigState {
  /** Currently-open config, or null if none. */
  config: SteamInputConfig | null;
  /** Source filename, if any. Used as the default for export. */
  fileName: string | null;
  /** Editor has unsaved changes. */
  dirty: boolean;
  /** Selected action set name (drives which preset is rendered). */
  selectedActionSet: string | null;
  /** Selected group id, if any (drives the inspector panel). */
  selectedGroupId: number | null;
  /** Undo stack (most-recent last). */
  undo: UndoEntry[];
  /** Redo stack (most-recent last). */
  redo: UndoEntry[];

  loadFromText: (text: string, fileName?: string) => void;
  exportText: () => string;
  selectActionSet: (name: string) => void;
  selectGroup: (id: number | null) => void;
  markDirty: () => void;
  reset: () => void;
}

const HISTORY_LIMIT = 100;

export const useConfigStore = create<ConfigState>((set, get) => ({
  config: null,
  fileName: null,
  dirty: false,
  selectedActionSet: null,
  selectedGroupId: null,
  undo: [],
  redo: [],

  loadFromText: (text, fileName) => {
    const ast = parseVdf(text);
    const config = configFromVdf(ast);
    const firstSet = config.actionSets[0]?.name ?? null;
    set({
      config,
      fileName: fileName ?? null,
      dirty: false,
      selectedActionSet: firstSet,
      selectedGroupId: null,
      undo: [],
      redo: [],
    });
  },

  exportText: () => {
    const { config } = get();
    if (!config) return '';
    return serializeVdf(config.raw);
  },

  selectActionSet: (name) => set({ selectedActionSet: name }),
  selectGroup: (id) => set({ selectedGroupId: id }),

  markDirty: () => {
    const { undo, config } = get();
    if (!config) return;
    const next = undo.length >= HISTORY_LIMIT ? undo.slice(1) : undo;
    set({ dirty: true, undo: [...next, { config, label: 'edit' }], redo: [] });
  },

  reset: () =>
    set({
      config: null,
      fileName: null,
      dirty: false,
      selectedActionSet: null,
      selectedGroupId: null,
      undo: [],
      redo: [],
    }),
}));
