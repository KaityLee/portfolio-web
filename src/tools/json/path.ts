// Paths to a node in the JSON Formatter tree. A `json` step marks the boundary where a string
// value was parsed as embedded JSON. JSONPath (RFC 9535) and JSON Pointer (RFC 6901) cannot go
// inside a string, so paths are written in the syntax of the tool that will run them: jq (shown
// on screen, `| fromjson`), JavaScript (`JSON.parse`) and Python (`json.loads`).

export type PathStep = { k: string } | { i: number } | { json: true };

const JS_IDENT = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
const JQ_IDENT = /^[A-Za-z_][A-Za-z0-9_]*$/;
// Words jq 1.6 rejects after a dot (`.and`); quote them so the filter works in every version.
const JQ_KEYWORDS = new Set(['and', 'or', 'not', 'if', 'then', 'elif', 'else', 'end', 'as', 'def', 'reduce', 'foreach', 'try', 'catch', 'label', 'import', 'include', '__loc__']);

/**
 * jq filter, e.g. `.output[0].text | fromjson | .elements[3]`. The root is `.`; keys that are not
 * plain identifiers use `["my key"]` (`.["my key"]` at the start).
 */
export function jqPath(path: readonly PathStep[]): string {
  const stages: string[] = [];
  let stage = '';
  for (const step of path) {
    if ('json' in step) {
      stages.push(stage || '.', 'fromjson');
      stage = '';
    } else if ('i' in step) {
      stage += stage === '' ? `.[${step.i}]` : `[${step.i}]`;
    } else {
      // `.a["b c"]` (not `.a.["b c"]`) works in every jq version, including 1.6.
      const quoted = `[${JSON.stringify(step.k)}]`;
      stage += JQ_IDENT.test(step.k) && !JQ_KEYWORDS.has(step.k) ? `.${step.k}` : stage === '' ? `.${quoted}` : quoted;
    }
  }
  if (stage !== '' || stages.length === 0) stages.push(stage || '.');
  return stages.join(' | ');
}

/** JavaScript expression that reaches the node from a variable named `root`. */
export function jsAccessor(path: readonly PathStep[], root = 'data'): string {
  let expr = root;
  for (const step of path) {
    if ('json' in step) expr = `JSON.parse(${expr})`;
    else if ('i' in step) expr += `[${step.i}]`;
    else expr += JS_IDENT.test(step.k) ? `.${step.k}` : `[${JSON.stringify(step.k)}]`;
  }
  return expr;
}

/**
 * Python expression that reaches the node from a variable named `root` (after `import json`).
 * JSON string literals are valid Python string literals, so keys are quoted with JSON.stringify.
 */
export function pythonAccessor(path: readonly PathStep[], root = 'data'): string {
  let expr = root;
  for (const step of path) {
    if ('json' in step) expr = `json.loads(${expr})`;
    else if ('i' in step) expr += `[${step.i}]`;
    else expr += `[${JSON.stringify(step.k)}]`;
  }
  return expr;
}

/** Stable string id for a path, used as a map key for expanded state. */
export function pathKey(path: readonly PathStep[]): string {
  return path.map((step) => ('json' in step ? '~' : 'i' in step ? `#${step.i}` : `.${encodeURIComponent(step.k)}`)).join('');
}
