import type { VdfBlock, VdfEntry, VdfValue } from './types';

export interface SerializeOptions {
  /** Indentation unit. Default: a single tab (matches Steam's emitter). */
  indent?: string;
  /** Line ending. Default: "\n". */
  newline?: string;
  /** Number of tabs/spaces between key and value on leaf lines. Default: "\t\t" (Steam-ish). */
  keyValueGap?: string;
}

const ESCAPE_MAP: Record<string, string> = {
  '\\': '\\\\',
  '"': '\\"',
  '\n': '\\n',
  '\t': '\\t',
  '\r': '\\r',
};

function escapeString(s: string): string {
  let out = '';
  for (const ch of s) {
    out += ESCAPE_MAP[ch] ?? ch;
  }
  return out;
}

function quote(s: string): string {
  return `"${escapeString(s)}"`;
}

export function serializeVdf(root: VdfBlock, opts: SerializeOptions = {}): string {
  const indent = opts.indent ?? '\t';
  const newline = opts.newline ?? '\n';
  const gap = opts.keyValueGap ?? '\t\t';
  const out: string[] = [];

  const writeEntries = (entries: VdfEntry[], depth: number) => {
    const prefix = indent.repeat(depth);
    for (const entry of entries) {
      if (entry.leadingComments) {
        for (const c of entry.leadingComments) {
          out.push(`${prefix}//${c}`);
        }
      }
      writeEntry(entry, depth);
    }
  };

  const writeEntry = (entry: VdfEntry, depth: number) => {
    const prefix = indent.repeat(depth);
    if (typeof entry.value === 'string') {
      let line = `${prefix}${quote(entry.key)}${gap}${quote(entry.value)}`;
      if (entry.conditional) line += `\t[${entry.conditional}]`;
      if (entry.trailingComment) line += `\t//${entry.trailingComment}`;
      out.push(line);
    } else {
      out.push(`${prefix}${quote(entry.key)}`);
      out.push(`${prefix}{`);
      writeEntries(entry.value.entries, depth + 1);
      out.push(`${prefix}}`);
    }
  };

  writeEntries(root.entries, 0);
  return out.join(newline) + newline;
}

/** Convenience for writing a single nested value (used in tests). */
export function serializeVdfValue(value: VdfValue, opts: SerializeOptions = {}): string {
  if (typeof value === 'string') return quote(value);
  return serializeVdf(value, opts);
}
