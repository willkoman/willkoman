import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseVdf } from '../../src/lib/vdf';
import { findEntries, findEntry, getBlock, getString, isBlock } from '../../src/lib/vdf';

const fixture = (name: string) =>
  readFileSync(join(import.meta.dirname, 'fixtures', name), 'utf-8');

describe('VdfParser', () => {
  it('parses an empty top-level block', () => {
    const ast = parseVdf('"root" {}');
    expect(ast.entries.length).toBe(1);
    expect(ast.entries[0]!.key).toBe('root');
    expect(isBlock(ast.entries[0]!.value)).toBe(true);
  });

  it('parses a simple key/value pair', () => {
    const ast = parseVdf('"key" "value"');
    expect(ast.entries[0]!.key).toBe('key');
    expect(ast.entries[0]!.value).toBe('value');
  });

  it('handles escape sequences in quoted strings', () => {
    const ast = parseVdf(String.raw`"k" "line1\nline2\t\"quoted\""`);
    expect(ast.entries[0]!.value).toBe('line1\nline2\t"quoted"');
  });

  it('parses bare (unquoted) values', () => {
    const ast = parseVdf('key value');
    expect(ast.entries[0]!.key).toBe('key');
    expect(ast.entries[0]!.value).toBe('value');
  });

  it('preserves duplicate sibling keys (the load-bearing case for "group")', () => {
    const ast = parseVdf(`
      "root" {
        "group" { "id" "0" }
        "group" { "id" "1" }
        "group" { "id" "2" }
      }
    `);
    const root = ast.entries[0]!.value;
    if (typeof root === 'string') throw new Error('root should be a block');
    const groups = findEntries(root, 'group');
    expect(groups).toHaveLength(3);
    const ids = groups.map((g) => getString(g.value as never, 'id'));
    expect(ids).toEqual(['0', '1', '2']);
  });

  it('captures leading line comments on the next entry', () => {
    const ast = parseVdf(`
      // first comment
      // second comment
      "key" "value"
    `);
    expect(ast.entries[0]!.leadingComments).toEqual([' first comment', ' second comment']);
  });

  it('captures trailing comments on the same line', () => {
    const ast = parseVdf('"k" "v" // inline\n');
    expect(ast.entries[0]!.trailingComment).toBe(' inline');
  });

  it('captures conditional brackets', () => {
    const ast = parseVdf('"k" "v" [$WIN32]\n');
    expect(ast.entries[0]!.conditional).toBe('$WIN32');
  });

  it('parses the minimal Steam Input fixture', () => {
    const ast = parseVdf(fixture('minimal.vdf'));
    const root = findEntry(ast, 'controller_mappings');
    expect(root).toBeDefined();
    const rootBlock = root!.value;
    if (typeof rootBlock === 'string') throw new Error();
    expect(getString(rootBlock, 'version')).toBe('3');
    const actions = getBlock(rootBlock, 'actions');
    expect(actions).toBeDefined();
    expect(actions!.entries.map((e) => e.key)).toEqual(['Default']);
  });

  it('parses the real-world GTAV v2 fixture without throwing', () => {
    const ast = parseVdf(fixture('gtav-v2.vdf'));
    const root = findEntry(ast, 'controller_mappings');
    if (!root || typeof root.value === 'string') throw new Error();
    const rootBlock = root.value;
    expect(getString(rootBlock, 'version')).toBe('2');
    const groups = findEntries(rootBlock, 'group');
    expect(groups.length).toBeGreaterThan(0);
    const presets = findEntries(rootBlock, 'preset');
    expect(presets.length).toBe(1);
  });

  it('parses the touch-menu fixture and finds the slot bindings', () => {
    const ast = parseVdf(fixture('touch-menu.vdf'));
    const root = findEntry(ast, 'controller_mappings');
    if (!root || typeof root.value === 'string') throw new Error();
    const groups = findEntries(root.value, 'group');
    expect(groups.length).toBe(2);
    const touchGroup = groups[0]!.value;
    if (typeof touchGroup === 'string') throw new Error();
    expect(getString(touchGroup, 'mode')).toBe('touch_menu');
    const bindings = getBlock(touchGroup, 'bindings')!;
    expect(getString(bindings, 'touch_menu_button_0')).toBe('key_press 1, Slot 1');
  });
});
