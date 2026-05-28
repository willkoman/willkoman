import type { VdfBlock, VdfEntry } from './types';
import { emptyBlock } from './types';

/**
 * Parse a Valve KeyValues (VDF) text file into a lossless AST.
 *
 * Grammar (informal):
 *   document   := entry*
 *   entry      := comments? key WS value (WS conditional)? (WS trailing-comment)?
 *   key        := quoted-string | bare-string
 *   value      := quoted-string | bare-string | "{" entry* "}"
 *   conditional:= "[" "!"? "$"? identifier "]"
 *   comment    := "//" .* EOL
 *
 * Quirks honoured:
 *   - duplicate sibling keys allowed
 *   - // comments line-only, preserved as leading comments on the next entry
 *   - escape sequences in quoted strings: \\ \" \n \t
 *   - bare (unquoted) strings allowed if no whitespace, braces, or quotes
 */

class ParseError extends Error {
  constructor(
    message: string,
    public line: number,
    public col: number
  ) {
    super(`VDF parse error at ${line}:${col}: ${message}`);
  }
}

export class VdfParser {
  private text: string;
  private pos = 0;
  private line = 1;
  private col = 1;

  constructor(text: string) {
    // Strip a leading BOM if present.
    this.text = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  }

  parse(): VdfBlock {
    const root = emptyBlock();
    let pendingComments: string[] = [];
    while (this.pos < this.text.length) {
      this.skipWhitespaceAndCollectComments(pendingComments);
      if (this.pos >= this.text.length) break;
      const ch = this.peek();
      if (ch === '}') {
        throw new ParseError("unexpected '}' at top level", this.line, this.col);
      }
      const entry = this.parseEntry();
      if (pendingComments.length) {
        entry.leadingComments = pendingComments;
        pendingComments = [];
      }
      root.entries.push(entry);
    }
    return root;
  }

  /** Parse a single key/value entry starting at the current position. */
  private parseEntry(): VdfEntry {
    const key = this.parseString();
    // Skip any whitespace (including newlines) and comments between the key
    // and its value. VDF allows blocks to start on the next line:
    //   "controller_mappings"
    //   { ... }
    this.skipWhitespaceAndCollectComments([]);
    const ch = this.peek();
    if (ch === '{') {
      this.advance();
      const block = this.parseBlock();
      return { key, value: block };
    }
    // leaf value
    const value = this.parseString();
    // optional `[$COND]` and trailing `// comment` on the same line
    let conditional: string | undefined;
    let trailingComment: string | undefined;
    this.skipInlineWhitespace();
    if (this.peek() === '[') {
      conditional = this.parseConditional();
      this.skipInlineWhitespace();
    }
    if (this.peek() === '/' && this.peekAt(1) === '/') {
      trailingComment = this.consumeLineComment();
    }
    const entry: VdfEntry = { key, value };
    if (conditional !== undefined) entry.conditional = conditional;
    if (trailingComment !== undefined) entry.trailingComment = trailingComment;
    return entry;
  }

  /** Parse a `{ ... }` block whose opening `{` has just been consumed. */
  private parseBlock(): VdfBlock {
    const block = emptyBlock();
    let pendingComments: string[] = [];
    while (true) {
      this.skipWhitespaceAndCollectComments(pendingComments);
      if (this.pos >= this.text.length) {
        throw new ParseError("unterminated block (expected '}')", this.line, this.col);
      }
      const ch = this.peek();
      if (ch === '}') {
        this.advance();
        return block;
      }
      const entry = this.parseEntry();
      if (pendingComments.length) {
        entry.leadingComments = pendingComments;
        pendingComments = [];
      }
      block.entries.push(entry);
    }
  }

  /** Parse a quoted or bare string. */
  private parseString(): string {
    const ch = this.peek();
    if (ch === '"') return this.parseQuotedString();
    return this.parseBareString();
  }

  private parseQuotedString(): string {
    this.advance(); // consume opening "
    let result = '';
    while (this.pos < this.text.length) {
      const ch = this.peek();
      if (ch === '"') {
        this.advance();
        return result;
      }
      if (ch === '\\') {
        this.advance();
        const esc = this.peek();
        this.advance();
        switch (esc) {
          case 'n':
            result += '\n';
            break;
          case 't':
            result += '\t';
            break;
          case '\\':
            result += '\\';
            break;
          case '"':
            result += '"';
            break;
          case 'r':
            result += '\r';
            break;
          default:
            result += esc;
            break;
        }
        continue;
      }
      if (ch === '\n') {
        throw new ParseError('unterminated string literal', this.line, this.col);
      }
      result += ch;
      this.advance();
    }
    throw new ParseError('unterminated string literal at EOF', this.line, this.col);
  }

  private parseBareString(): string {
    let result = '';
    while (this.pos < this.text.length) {
      const ch = this.peek();
      if (
        ch === ' ' ||
        ch === '\t' ||
        ch === '\n' ||
        ch === '\r' ||
        ch === '{' ||
        ch === '}' ||
        ch === '"' ||
        ch === '['
      )
        break;
      // a `//` starts a comment; stop before it
      if (ch === '/' && this.peekAt(1) === '/') break;
      result += ch;
      this.advance();
    }
    if (result.length === 0) {
      throw new ParseError(
        `expected string, got ${JSON.stringify(this.peek())}`,
        this.line,
        this.col
      );
    }
    return result;
  }

  private parseConditional(): string {
    this.advance(); // [
    let s = '';
    while (this.pos < this.text.length) {
      const ch = this.peek();
      if (ch === ']') {
        this.advance();
        return s;
      }
      if (ch === '\n') throw new ParseError('unterminated conditional', this.line, this.col);
      s += ch;
      this.advance();
    }
    throw new ParseError('unterminated conditional at EOF', this.line, this.col);
  }

  /** Consume `// ...` to end of line, returning the comment text without the `//`. */
  private consumeLineComment(): string {
    this.advance(); // /
    this.advance(); // /
    let s = '';
    while (this.pos < this.text.length && this.peek() !== '\n') {
      s += this.peek();
      this.advance();
    }
    return s.trimEnd();
  }

  /**
   * Skip whitespace (including newlines) and collect any `// ...` line comments
   * into the provided array.
   */
  private skipWhitespaceAndCollectComments(into: string[]): void {
    while (this.pos < this.text.length) {
      const ch = this.peek();
      if (ch === ' ' || ch === '\t' || ch === '\r' || ch === '\n') {
        this.advance();
        continue;
      }
      if (ch === '/' && this.peekAt(1) === '/') {
        into.push(this.consumeLineComment());
        continue;
      }
      break;
    }
  }

  /** Skip spaces and tabs only (not newlines). Used when looking for inline trailing tokens. */
  private skipInlineWhitespace(): void {
    while (this.pos < this.text.length) {
      const ch = this.peek();
      if (ch === ' ' || ch === '\t') {
        this.advance();
      } else {
        break;
      }
    }
  }

  private peek(): string {
    return this.text[this.pos] ?? '';
  }

  private peekAt(offset: number): string {
    return this.text[this.pos + offset] ?? '';
  }

  private advance(): void {
    const ch = this.text[this.pos];
    this.pos++;
    if (ch === '\n') {
      this.line++;
      this.col = 1;
    } else {
      this.col++;
    }
  }
}

export function parseVdf(text: string): VdfBlock {
  return new VdfParser(text).parse();
}
