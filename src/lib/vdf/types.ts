/**
 * Lossless AST for Valve KeyValues (VDF) files.
 *
 * The two non-obvious things we model:
 *   1. Sibling keys can repeat at the same nesting level (e.g. multiple "group" blocks).
 *      We therefore use an ordered list of entries, not a JS object.
 *   2. Insertion order matters for some consumers (and for diff-friendly output).
 *      An ordered list preserves it for free.
 */

export type VdfValue = string | VdfBlock;

export interface VdfEntry {
  /** Key as written on disk. Always quoted in serializer output. */
  key: string;
  /** Either a leaf string value or a nested block. */
  value: VdfValue;
  /**
   * Optional `[$WIN32]` / `[$LINUX]` / `[!$WIN32]` style conditional appended to the entry line.
   * Stored without the brackets, e.g. `"$WIN32"` or `"!$WIN32"`.
   */
  conditional?: string;
  /** Comments that appeared immediately above this entry, preserved for round-trip. */
  leadingComments?: string[];
  /** Trailing same-line comment, if any (the `// ...` after the value on the same line). */
  trailingComment?: string;
}

export interface VdfBlock {
  entries: VdfEntry[];
}

export const isBlock = (v: VdfValue): v is VdfBlock => typeof v !== 'string';
export const asBlock = (v: VdfValue): VdfBlock => {
  if (typeof v === 'string') throw new Error(`Expected block, got string ${JSON.stringify(v)}`);
  return v;
};
export const asString = (v: VdfValue): string => {
  if (typeof v !== 'string') throw new Error(`Expected string, got block`);
  return v;
};

/** Convenience: find the first entry with the given key (case-insensitive). */
export const findEntry = (block: VdfBlock, key: string): VdfEntry | undefined => {
  const k = key.toLowerCase();
  return block.entries.find((e) => e.key.toLowerCase() === k);
};

/** Convenience: find all entries with the given key (case-insensitive). */
export const findEntries = (block: VdfBlock, key: string): VdfEntry[] => {
  const k = key.toLowerCase();
  return block.entries.filter((e) => e.key.toLowerCase() === k);
};

/** Convenience: get string value for a key, or undefined. */
export const getString = (block: VdfBlock, key: string): string | undefined => {
  const e = findEntry(block, key);
  if (!e) return undefined;
  return typeof e.value === 'string' ? e.value : undefined;
};

/** Convenience: get block value for a key, or undefined. */
export const getBlock = (block: VdfBlock, key: string): VdfBlock | undefined => {
  const e = findEntry(block, key);
  if (!e) return undefined;
  return typeof e.value === 'string' ? undefined : e.value;
};

/** Build a new empty block. */
export const emptyBlock = (): VdfBlock => ({ entries: [] });
