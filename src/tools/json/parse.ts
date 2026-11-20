// JSON parser for the JSON Formatter tool. It builds a compact tree instead of JS values so the
// tool can keep number text exactly as written (64-bit IDs, 1.10, 1e-7) and can parse JSON that
// is stored inside string values, which LLM and pipeline responses do a lot.
// No dependencies; runs in a Web Worker and in Node (tests/unit).

/** Tree node. Short tags keep structured clones between the worker and the page small. */
export type JsonNode =
  | { t: 'o'; e: Array<[string, JsonNode]> }
  | { t: 'a'; e: JsonNode[] }
  /** `j` is the parsed tree when the string itself holds a JSON object or array. */
  | { t: 's'; v: string; j?: JsonNode }
  /** Number source text, unchanged. */
  | { t: 'n'; v: string }
  | { t: 'b'; v: boolean }
  | { t: 'z' };

/** Error kinds; the page localizes them from `code` and `params`, tests read `message`. */
export const ERROR_TEXT = {
  empty: 'Input is empty',
  unexpectedEnd: 'Unexpected end of input',
  unexpected: 'Unexpected {found}',
  afterValue: 'Unexpected {found} after the JSON value',
  trailingComma: 'Trailing comma before {close}',
  keyQuotes: 'Keys need double quotes',
  stringQuotes: 'Strings need double quotes',
  expectedKey: 'Expected a "key" but found {found}',
  expectedColon: "Expected ':' after the key but found {found}",
  expectedComma: "Expected ',' or '{close}' but found {found}",
  unterminated: 'Unterminated string',
  badEscape: "Invalid escape '\\{found}'",
  badUnicode: 'Invalid \\u escape: expected four hex digits',
  lineBreak: 'Line break inside a string; use \\n',
  controlChar: 'Control character inside a string',
  leadingZero: 'Leading zeros are not allowed',
  digitAfterPoint: 'Expected a digit after the decimal point',
  digitInExponent: 'Expected a digit in the exponent',
  tooDeep: 'Nesting deeper than {max} levels',
  stackOverflow: 'Input is nested too deeply to parse',
} as const;
export type ParseErrorCode = keyof typeof ERROR_TEXT;
/** `found` is the offending character in quotes, or absent at the end of the input. */
export type ParseErrorParams = { found?: string; close?: string; max?: number };

export function errorText(template: string, params: ParseErrorParams, endOfInput = 'end of input'): string {
  return template.replace(/\{(found|close|max)\}/g, (_, key: keyof ParseErrorParams) => String(params[key] ?? (key === 'found' ? endOfInput : '')));
}

export interface ParseError {
  code: ParseErrorCode;
  params: ParseErrorParams;
  /** English text of the error. */
  message: string;
  /** UTF-16 offset into the input. */
  offset: number;
  /** 1-based. */
  line: number;
  /** 1-based, in UTF-16 code units. */
  column: number;
}

export interface ParseStats {
  /** Every node, including those inside embedded JSON. */
  values: number;
  /** Strings that were parsed as embedded JSON. */
  embedded: number;
  depth: number;
}

export type ParseResult = { ok: true; root: JsonNode; stats: ParseStats } | { ok: false; error: ParseError };

export interface ParseOptions {
  /** Parse strings that hold a JSON object or array. Default true. */
  embedded?: boolean;
  /** How many levels of JSON-in-a-string to follow. Default 8. */
  maxEmbeddedDepth?: number;
}

const MAX_DEPTH = 1000;

// No parameter properties: Node's type stripping (tests/unit) cannot run them.
class JsonSyntaxError extends Error {
  readonly offset: number;
  readonly code: ParseErrorCode;
  readonly params: ParseErrorParams;
  constructor(code: ParseErrorCode, params: ParseErrorParams, offset: number) {
    super(errorText(ERROR_TEXT[code], params));
    this.code = code;
    this.params = params;
    this.offset = offset;
  }
}

export function lineColumn(text: string, offset: number): { line: number; column: number } {
  let line = 1;
  let lineStart = 0;
  const end = Math.min(offset, text.length);
  for (let i = 0; i < end; i++) {
    if (text.charCodeAt(i) === 10) {
      line++;
      lineStart = i + 1;
    }
  }
  return { line, column: end - lineStart + 1 };
}

function found(text: string, i: number): ParseErrorParams {
  if (i >= text.length) return {};
  const ch = text[i];
  return { found: ch === '\n' ? "'\\n'" : `'${ch}'` };
}

function isWs(c: number): boolean {
  return c === 32 || c === 10 || c === 13 || c === 9;
}

/** Strict JSON (RFC 8259) parser producing a JsonNode tree. */
function parseTree(text: string, stats: ParseStats, embeddedLeft: number, options: Required<ParseOptions>): JsonNode {
  let i = 0;
  const n = text.length;
  if (text.charCodeAt(0) === 0xfeff) i = 1; // byte order mark

  const skip = () => {
    while (i < n && isWs(text.charCodeAt(i))) i++;
  };

  const fail = (code: ParseErrorCode, params: ParseErrorParams = {}, at = i): never => {
    throw new JsonSyntaxError(code, params, at);
  };

  const parseString = (): string => {
    // text[i] is the opening quote
    const start = ++i;
    let out = '';
    let chunk = start;
    while (i < n) {
      const c = text.charCodeAt(i);
      if (c === 34) {
        out += text.slice(chunk, i);
        i++;
        return out;
      }
      if (c === 92) {
        out += text.slice(chunk, i);
        const e = text[i + 1];
        switch (e) {
          case '"':
            out += '"';
            break;
          case '\\':
            out += '\\';
            break;
          case '/':
            out += '/';
            break;
          case 'b':
            out += '\b';
            break;
          case 'f':
            out += '\f';
            break;
          case 'n':
            out += '\n';
            break;
          case 'r':
            out += '\r';
            break;
          case 't':
            out += '\t';
            break;
          case 'u': {
            const hex = text.slice(i + 2, i + 6);
            if (!/^[0-9a-fA-F]{4}$/.test(hex)) fail('badUnicode', {}, i);
            out += String.fromCharCode(parseInt(hex, 16));
            i += 4;
            break;
          }
          default:
            if (e === undefined) fail('unterminated', {}, i);
            fail('badEscape', { found: e }, i);
        }
        i += 2;
        chunk = i;
        continue;
      }
      if (c < 0x20) fail(c === 10 ? 'lineBreak' : 'controlChar', {}, i);
      i++;
    }
    return fail('unterminated', {}, start - 1);
  };

  const parseNumber = (): JsonNode => {
    const start = i;
    if (text[i] === '-') i++;
    if (text[i] === '0') {
      i++;
      if (text[i] !== undefined && text[i] >= '0' && text[i] <= '9') fail('leadingZero', {}, start);
    } else if (text[i] !== undefined && text[i] >= '1' && text[i] <= '9') {
      while (text[i] !== undefined && text[i] >= '0' && text[i] <= '9') i++;
    } else {
      fail('unexpected', found(text, i));
    }
    if (text[i] === '.') {
      i++;
      if (!(text[i] >= '0' && text[i] <= '9')) fail('digitAfterPoint');
      while (text[i] !== undefined && text[i] >= '0' && text[i] <= '9') i++;
    }
    if (text[i] === 'e' || text[i] === 'E') {
      i++;
      if (text[i] === '+' || text[i] === '-') i++;
      if (!(text[i] >= '0' && text[i] <= '9')) fail('digitInExponent');
      while (text[i] !== undefined && text[i] >= '0' && text[i] <= '9') i++;
    }
    return { t: 'n', v: text.slice(start, i) };
  };

  const literal = (word: string, node: JsonNode): JsonNode => {
    if (text.startsWith(word, i)) {
      i += word.length;
      return node;
    }
    return fail('unexpected', found(text, i));
  };

  const stringNode = (value: string): JsonNode => {
    const node: { t: 's'; v: string; j?: JsonNode } = { t: 's', v: value };
    if (embeddedLeft > 0 && options.embedded) {
      const inner = tryEmbedded(value, stats, embeddedLeft - 1, options);
      if (inner) node.j = inner;
    }
    return node;
  };

  const parseValue = (depth: number): JsonNode => {
    if (depth > MAX_DEPTH) fail('tooDeep', { max: MAX_DEPTH });
    if (depth > stats.depth) stats.depth = depth;
    skip();
    stats.values++;
    const c = text[i];
    switch (c) {
      case '{': {
        i++;
        const entries: Array<[string, JsonNode]> = [];
        skip();
        if (text[i] === '}') {
          i++;
          return { t: 'o', e: entries };
        }
        for (;;) {
          skip();
          if (text[i] !== '"') {
            if (text[i] === '}' && entries.length > 0) fail('trailingComma', { close: '}' });
            if (text[i] === "'") fail('keyQuotes');
            fail('expectedKey', found(text, i));
          }
          const key = parseString();
          skip();
          if (text[i] !== ':') fail('expectedColon', found(text, i));
          i++;
          entries.push([key, parseValue(depth + 1)]);
          skip();
          if (text[i] === ',') {
            i++;
            continue;
          }
          if (text[i] === '}') {
            i++;
            return { t: 'o', e: entries };
          }
          fail('expectedComma', { close: '}', ...found(text, i) });
        }
      }
      case '[': {
        i++;
        const items: JsonNode[] = [];
        skip();
        if (text[i] === ']') {
          i++;
          return { t: 'a', e: items };
        }
        for (;;) {
          skip();
          if (text[i] === ']' && items.length > 0) fail('trailingComma', { close: ']' });
          items.push(parseValue(depth + 1));
          skip();
          if (text[i] === ',') {
            i++;
            continue;
          }
          if (text[i] === ']') {
            i++;
            return { t: 'a', e: items };
          }
          fail('expectedComma', { close: ']', ...found(text, i) });
        }
      }
      case '"':
        return stringNode(parseString());
      case 't':
        return literal('true', { t: 'b', v: true });
      case 'f':
        return literal('false', { t: 'b', v: false });
      case 'n':
        return literal('null', { t: 'z' });
      case "'":
        return fail('stringQuotes');
      default:
        if (c === '-' || (c !== undefined && c >= '0' && c <= '9')) return parseNumber();
        return fail(i >= n ? 'unexpectedEnd' : 'unexpected', found(text, i));
    }
  };

  skip();
  if (i >= n) fail('empty');
  const root = parseValue(0);
  skip();
  if (i < n) fail('afterValue', found(text, i));
  return root;
}

/** Parses a string value as JSON when it looks like an object or array; null otherwise. */
function tryEmbedded(value: string, stats: ParseStats, embeddedLeft: number, options: Required<ParseOptions>): JsonNode | null {
  let s = 0;
  let e = value.length - 1;
  while (s <= e && isWs(value.charCodeAt(s))) s++;
  while (e >= s && isWs(value.charCodeAt(e))) e--;
  if (e - s < 1) return null;
  const open = value[s];
  const close = value[e];
  if (!((open === '{' && close === '}') || (open === '[' && close === ']'))) return null;
  const inner: ParseStats = { values: 0, embedded: 0, depth: 0 };
  try {
    const node = parseTree(value, inner, embeddedLeft, options);
    stats.values += inner.values;
    stats.embedded += inner.embedded + 1;
    return node;
  } catch {
    return null; // not JSON after all: keep it a plain string
  }
}

export function parseJson(text: string, options: ParseOptions = {}): ParseResult {
  const opts: Required<ParseOptions> = { embedded: options.embedded ?? true, maxEmbeddedDepth: options.maxEmbeddedDepth ?? 8 };
  const stats: ParseStats = { values: 0, embedded: 0, depth: 0 };
  try {
    const root = parseTree(text, stats, opts.maxEmbeddedDepth, opts);
    // A whole input that is one JSON string holding JSON (double-encoded) is expanded like any other.
    return { ok: true, root, stats };
  } catch (err) {
    if (err instanceof JsonSyntaxError) {
      return { ok: false, error: { code: err.code, params: err.params, message: err.message, offset: err.offset, ...lineColumn(text, err.offset) } };
    }
    if (err instanceof RangeError) {
      return { ok: false, error: { code: 'stackOverflow', params: {}, message: ERROR_TEXT.stackOverflow, offset: 0, line: 1, column: 1 } };
    }
    throw err;
  }
}
