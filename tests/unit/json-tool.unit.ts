// Unit tests for the JSON Formatter core (src/tools/json). Run with `npm run test:unit`
// (Node's built-in test runner with TypeScript type stripping; no extra dependency).
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';

import { stringify, tokenize } from '../../src/tools/json/format.ts';
import { parseJson, type JsonNode } from '../../src/tools/json/parse.ts';
import { jqPath, jsAccessor, pythonAccessor, type PathStep } from '../../src/tools/json/path.ts';
import { makeLlmDocText } from '../fixtures/llm-doc.mjs';

function parseOk(text: string) {
  const result = parseJson(text);
  if (!result.ok) assert.fail(`expected valid JSON: ${result.error.message}`);
  return result;
}

function parseErr(text: string) {
  const result = parseJson(text);
  if (result.ok) assert.fail('expected a parse error');
  return result.error;
}

test('round-trips values and formats with each indent', () => {
  const text = '{"a":[1,2,{"b":null}],"c":true,"d":"x\\ny","e":{},"f":[]}';
  const { root } = parseOk(text);
  assert.equal(stringify(root, { indent: null }), text);
  assert.equal(
    stringify(root, { indent: '2' }),
    '{\n  "a": [\n    1,\n    2,\n    {\n      "b": null\n    }\n  ],\n  "c": true,\n  "d": "x\\ny",\n  "e": {},\n  "f": []\n}',
  );
  assert.ok(stringify(root, { indent: '4' }).includes('\n        1,'));
  assert.ok(stringify(root, { indent: 'tab' }).includes('\n\t\t1,'));
});

test('keeps number text exactly, including integers above 2^53', () => {
  const text = '[9007199254740993,1.10,-0,1e-7,2E+3]';
  assert.equal(stringify(parseOk(text).root, { indent: null }), text);
});

test('decodes escapes in strings and keys', () => {
  const { root } = parseOk('{"k\\u00e9y":"a\\"b\\\\c\\/d\\t\\uD83D\\uDE00"}');
  assert.equal(root.t, 'o');
  const [key, value] = (root as Extract<JsonNode, { t: 'o' }>).e[0];
  assert.equal(key, 'kéy');
  assert.deepEqual(value, { t: 's', v: 'a"b\\c/d\t😀' });
});

test('parses JSON stored inside strings, recursively', () => {
  const inner = JSON.stringify({ html: '<p id="1">x</p>', n: 1 });
  const outer = JSON.stringify({ text: inner, meta: JSON.stringify({ deeper: inner }) });
  const { root, stats } = parseOk(outer);
  const entries = (root as Extract<JsonNode, { t: 'o' }>).e;
  const text = entries[0][1];
  assert.equal(text.t, 's');
  assert.ok(text.t === 's' && text.j?.t === 'o');
  assert.equal(stats.embedded, 3);
  assert.equal(stringify(root, { indent: null }), outer, 'output stays the original document by default');
  assert.deepEqual(JSON.parse(stringify(root, { indent: null, inlineEmbedded: true })), {
    text: { html: '<p id="1">x</p>', n: 1 },
    meta: { deeper: { html: '<p id="1">x</p>', n: 1 } },
  });
});

test('leaves strings that only look like JSON alone', () => {
  const { root, stats } = parseOk('{"a":"{not json}","b":"[1, 2","c":"  "}');
  assert.equal(stats.embedded, 0);
  assert.ok((root as Extract<JsonNode, { t: 'o' }>).e.every(([, v]) => v.t === 's' && v.j === undefined));
});

test('expands a whole input that is a double-encoded JSON string', () => {
  const { root } = parseOk(JSON.stringify(JSON.stringify({ a: 1 })));
  assert.ok(root.t === 's' && root.j?.t === 'o');
});

test('reports line and column for syntax errors', () => {
  assert.deepEqual(parseErr('{\n  "a": 1,\n}'), { code: 'trailingComma', params: { close: '}' }, message: 'Trailing comma before }', offset: 12, line: 3, column: 1 });
  assert.equal(parseErr('[1, 2,]').message, 'Trailing comma before ]');
  assert.equal(parseErr("{'a': 1}").message, 'Keys need double quotes');
  assert.match(parseErr('{"a" 1}').message, /Expected ':'/);
  assert.equal(parseErr('"abc').message, 'Unterminated string');
  assert.equal(parseErr('"a\nb"').message, 'Line break inside a string; use \\n');
  assert.equal(parseErr('012').message, 'Leading zeros are not allowed');
  assert.equal(parseErr('').message, 'Input is empty');
  assert.match(parseErr('{} x').message, /after the JSON value/);
  const nested = parseErr('{"a": [1, 2}');
  assert.equal(nested.column, 12);
  assert.equal(nested.message, "Expected ',' or ']' but found '}'");
  assert.equal(parseErr('[1').message, "Expected ',' or ']' but found end of input");
});

test('paths: jq, JavaScript and Python across an embedded boundary', () => {
  const path: PathStep[] = [{ k: 'output' }, { i: 0 }, { k: 'text' }, { json: true }, { k: 'elements' }, { i: 3 }, { k: 'my key' }];
  assert.equal(jqPath(path), '.output[0].text | fromjson | .elements[3]["my key"]');
  assert.equal(jsAccessor(path), 'JSON.parse(data.output[0].text).elements[3]["my key"]');
  assert.equal(pythonAccessor(path), 'json.loads(data["output"][0]["text"])["elements"][3]["my key"]');
  assert.equal(jqPath([]), '.');
  assert.equal(jqPath([{ i: 2 }, { k: 'a b' }]), '.[2]["a b"]');
  assert.equal(jqPath([{ k: 's' }, { json: true }]), '.s | fromjson');
  assert.equal(jqPath([{ json: true }, { i: 0 }]), '. | fromjson | .[0]');
  assert.equal(jqPath([{ k: 'if' }]), '.["if"]', 'jq keywords are quoted');
});

/** Every value's path in a parsed tree, with the value as plain JSON text. */
function allPaths(node: JsonNode, path: PathStep[] = [], out: Array<{ path: PathStep[]; json: string }> = []) {
  out.push({ path, json: stringify(node, { indent: null }) });
  const inner = node.t === 's' && node.j ? node.j : node;
  const prefix: PathStep[] = node.t === 's' && node.j ? [...path, { json: true }] : path;
  if (inner.t === 'o') for (const [k, v] of inner.e) allPaths(v, [...prefix, { k }], out);
  if (inner.t === 'a') inner.e.forEach((v, i) => allPaths(v, [...prefix, { i }], out));
  return out;
}

const awkward = {
  plain: 1,
  'my key': 'space',
  'with"quote': 'quote',
  '한글 키': '유니코드',
  if: 'keyword',
  $dollar: true,
  'a.b': null,
  list: [{ x: 1 }, [2, 3]],
  text: JSON.stringify({ inner: [1, { deep: JSON.stringify({ last: 'level 2', 'odd key': [0] }) }] }),
  rows: JSON.stringify([{ id: 7 }]),
};
const awkwardText = JSON.stringify(awkward);
const awkwardPaths = allPaths(parseOk(awkwardText).root);

test('JavaScript accessors return the value they point at', () => {
  const data: unknown = JSON.parse(awkwardText);
  for (const { path, json } of awkwardPaths) {
    const value: unknown = new Function('data', `return ${jsAccessor(path)};`)(data);
    assert.equal(JSON.stringify(value), JSON.stringify(JSON.parse(json)), jsAccessor(path));
  }
});

const hasJq = spawnSync('jq', ['--version']).status === 0;
test('jq filters return the value they point at', { skip: !hasJq && 'jq is not installed' }, () => {
  for (const { path, json } of awkwardPaths) {
    const run = spawnSync('jq', ['-c', jqPath(path)], { input: awkwardText, encoding: 'utf8' });
    assert.equal(run.status, 0, `${jqPath(path)}: ${run.stderr}`);
    assert.equal(run.stdout.trim(), JSON.stringify(JSON.parse(json)), jqPath(path));
  }
});

const hasPython = spawnSync('python3', ['--version']).status === 0;
test('Python accessors return the value they point at', { skip: !hasPython && 'python3 is not installed' }, () => {
  const exprs = awkwardPaths.map(({ path }) => pythonAccessor(path));
  const script = `import json, sys\ndata = json.loads(sys.stdin.readline())\nfor expr in json.loads(sys.stdin.readline()):\n    print(json.dumps(eval(expr), ensure_ascii=False, separators=(",", ":")))\n`;
  const run = spawnSync('python3', ['-I', '-c', script], { input: `${awkwardText}\n${JSON.stringify(exprs)}\n`, encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr);
  const lines = run.stdout.trim().split('\n');
  awkwardPaths.forEach(({ json }, n) => assert.equal(lines[n], JSON.stringify(JSON.parse(json)), exprs[n]));
});

test('tokenize marks keys separately from string values', () => {
  const kinds = tokenize('{\n  "a": "b",\n  "n": -1.5e3\n}')
    .filter(([kind]) => kind !== 'space' && kind !== 'punct')
    .map(([kind, text]) => `${kind}:${text}`);
  assert.deepEqual(kinds, ['key:"a"', 'string:"b"', 'key:"n"', 'number:-1.5e3']);
});

test('handles a pipeline-sized response quickly', () => {
  const text = makeLlmDocText();
  assert.ok(text.length > 2_000_000, `fixture is ${text.length} chars`);
  const started = performance.now();
  const { root, stats } = parseOk(text);
  const elapsed = performance.now() - started;
  assert.ok(stats.embedded >= 4, 'parse step and additional_values are expanded');
  assert.ok(stats.values > 100_000);
  assert.ok(elapsed < 2000, `parse took ${Math.round(elapsed)} ms`);
  assert.ok(stringify(root, { indent: null }).includes('9007199254740993'));
});
