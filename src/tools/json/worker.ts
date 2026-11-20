// JSON Formatter worker: parsing and stringifying multi-megabyte inputs off the main thread.
// The last parsed tree stays here so text output can be regenerated without re-parsing.
import { stringify, type Indent } from './format.ts';
import { parseJson, type JsonNode } from './parse.ts';

export type WorkerRequest =
  | { id: number; type: 'parse'; text: string }
  | { id: number; type: 'stringify'; indent: Indent | null; inlineEmbedded: boolean };

export type WorkerResponse = { id: number } & (
  | { type: 'parse'; result: ReturnType<typeof parseJson>; ms: number }
  | { type: 'stringify'; text: string }
);

let last: JsonNode | null = null;

export function handle(request: WorkerRequest): WorkerResponse {
  if (request.type === 'parse') {
    const started = performance.now();
    const result = parseJson(request.text);
    last = result.ok ? result.root : null;
    return { id: request.id, type: 'parse', result, ms: Math.round(performance.now() - started) };
  }
  const text = last ? stringify(last, { indent: request.indent, inlineEmbedded: request.inlineEmbedded }) : '';
  return { id: request.id, type: 'stringify', text };
}

// Only register as a worker when loaded as one (the page imports handle() as a fallback).
interface WorkerScope {
  document?: unknown;
  postMessage(message: WorkerResponse): void;
  addEventListener(type: 'message', listener: (event: MessageEvent<WorkerRequest>) => void): void;
}
const scope = (typeof self === 'undefined' ? undefined : self) as unknown as WorkerScope | undefined;
if (scope && scope.document === undefined) {
  scope.addEventListener('message', (event) => scope.postMessage(handle(event.data)));
}
