// Text output for the JSON Formatter: pretty print, minify, and JSON-in-a-string inlining.
// Works on the JsonNode tree from parse.ts, so number text is written back exactly as it came in.
import type { JsonNode } from './parse.ts';

export type Indent = '2' | '4' | 'tab';

export interface StringifyOptions {
  /** null minifies. */
  indent: Indent | null;
  /** Replace strings that hold JSON with the parsed value. This changes the document's shape. */
  inlineEmbedded?: boolean;
}

export function indentUnit(indent: Indent): string {
  return indent === 'tab' ? '\t' : ' '.repeat(Number(indent));
}

export function quote(value: string): string {
  return JSON.stringify(value);
}

export function stringify(root: JsonNode, options: StringifyOptions): string {
  const unit = options.indent === null ? null : indentUnit(options.indent);
  const inline = options.inlineEmbedded ?? false;
  const out: string[] = [];

  // Recursion depth is bounded by the parser's nesting limit.
  const write = (node: JsonNode, pad: string): void => {
    switch (node.t) {
      case 'z':
        out.push('null');
        return;
      case 'b':
        out.push(node.v ? 'true' : 'false');
        return;
      case 'n':
        out.push(node.v);
        return;
      case 's':
        if (inline && node.j) write(node.j, pad);
        else out.push(quote(node.v));
        return;
      case 'a':
      case 'o': {
        const [open, close] = node.t === 'a' ? ['[', ']'] : ['{', '}'];
        if (node.e.length === 0) {
          out.push(open + close);
          return;
        }
        out.push(open);
        const inner = unit === null ? '' : pad + unit;
        node.e.forEach((item, idx) => {
          if (idx > 0) out.push(',');
          if (unit !== null) out.push('\n', inner);
          if (node.t === 'o') {
            const [key, value] = item as [string, JsonNode];
            out.push(quote(key), unit === null ? ':' : ': ');
            write(value, inner);
          } else {
            write(item as JsonNode, inner);
          }
        });
        if (unit !== null) out.push('\n', pad);
        out.push(close);
        return;
      }
    }
  };

  write(root, '');
  return out.join('');
}

export type TokenKind = 'key' | 'string' | 'number' | 'boolean' | 'null' | 'punct' | 'space';

const TOKEN = /("(?:[^"\\]|\\.)*")(\s*:)?|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|\b(true|false)\b|\b(null)\b|([{}[\],:])|(\s+)/g;

/** Splits text produced by stringify() into highlight tokens. */
export function tokenize(text: string): Array<[TokenKind, string]> {
  const tokens: Array<[TokenKind, string]> = [];
  let last = 0;
  for (const m of text.matchAll(TOKEN)) {
    const at = m.index ?? 0;
    if (at > last) tokens.push(['punct', text.slice(last, at)]);
    if (m[1] !== undefined) {
      tokens.push([m[2] !== undefined ? 'key' : 'string', m[1]]);
      if (m[2] !== undefined) tokens.push(['punct', m[2]]);
    } else if (m[3] !== undefined) tokens.push(['number', m[3]]);
    else if (m[4] !== undefined) tokens.push(['boolean', m[4]]);
    else if (m[5] !== undefined) tokens.push(['null', m[5]]);
    else if (m[6] !== undefined) tokens.push(['punct', m[6]]);
    else tokens.push(['space', m[7] ?? '']);
    last = at + m[0].length;
  }
  if (last < text.length) tokens.push(['punct', text.slice(last)]);
  return tokens;
}
