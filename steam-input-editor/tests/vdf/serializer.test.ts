import { describe, expect, it } from 'vitest';
import { parseVdf, serializeVdf } from '../../src/lib/vdf';

describe('serializeVdf', () => {
  it('emits a quoted leaf entry', () => {
    const ast = parseVdf('"k" "v"');
    expect(serializeVdf(ast).trim()).toBe('"k"\t\t"v"');
  });

  it('emits nested blocks with brace lines', () => {
    const ast = parseVdf('"root" { "k" "v" }');
    const out = serializeVdf(ast);
    expect(out).toContain('"root"\n');
    expect(out).toContain('{\n');
    expect(out).toContain('\t"k"\t\t"v"');
    expect(out).toContain('}\n');
  });

  it('escapes special characters in values', () => {
    const ast = parseVdf(String.raw`"k" "a\"b"`);
    expect(serializeVdf(ast).trim()).toBe(String.raw`"k"		"a\"b"`);
  });

  it('writes leading comments before the entry', () => {
    const ast = parseVdf('// note\n"k" "v"\n');
    const out = serializeVdf(ast);
    expect(out.split('\n')[0]).toBe('// note');
  });

  it('writes conditional after the value', () => {
    const ast = parseVdf('"k" "v" [$WIN32]\n');
    expect(serializeVdf(ast).trim()).toBe('"k"\t\t"v"\t[$WIN32]');
  });
});
