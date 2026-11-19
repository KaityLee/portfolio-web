// Paths to a node in the JSON Formatter tree. A `json` step marks the boundary where a string
// value was parsed as embedded JSON, so the copied accessor can call JSON.parse at that point.

export type PathStep = { k: string } | { i: number } | { json: true };

const IDENT = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

function member(key: string): string {
  return IDENT.test(key) ? `.${key}` : `[${JSON.stringify(key)}]`;
}

/** Display path, e.g. `$.output[0].text ⟨json⟩ .elements[3]`. */
export function pathLabel(path: readonly PathStep[]): string {
  let out = '$';
  for (const step of path) {
    if ('json' in step) out += ' ⟨json⟩ ';
    else if ('i' in step) out += `[${step.i}]`;
    else out += member(step.k);
  }
  return out.trimEnd();
}

/** JavaScript expression that reaches the node from a variable named `root`. */
export function jsAccessor(path: readonly PathStep[], root = 'data'): string {
  let expr = root;
  for (const step of path) {
    if ('json' in step) expr = `JSON.parse(${expr})`;
    else if ('i' in step) expr += `[${step.i}]`;
    else expr += member(step.k);
  }
  return expr;
}

/** Stable string id for a path, used as a map key for expanded state. */
export function pathKey(path: readonly PathStep[]): string {
  return path.map((step) => ('json' in step ? '~' : 'i' in step ? `#${step.i}` : `.${encodeURIComponent(step.k)}`)).join('');
}
