// JSON Formatter page script (src/views/tools/JsonFormatterView.astro). Everything happens in
// the browser: input is never uploaded or stored. Only the indent choice is remembered.
import { stringify, tokenize, type Indent } from './format.ts';
import { ERROR_TEXT, errorText, type JsonNode, type ParseResult } from './parse.ts';
import { jsAccessor, pathKey, pathLabel, type PathStep } from './path.ts';
import { handle, type WorkerRequest, type WorkerResponse } from './worker.ts';

const CHUNK = 200; // children rendered per "show more"
const DEFAULT_ROW_BUDGET = 250; // rows opened automatically after formatting
const AUTO_OPEN_MAX_CHILDREN = 100; // containers larger than this start collapsed
const PREVIEW_CHARS = 600;
const PREVIEW_LINES = 8;
const INLINE_STRING_MAX = 80;
const HIGHLIGHT_LIMIT = 300_000;
// Text view guard: one multi-megabyte line (a JSON document kept as a string) or megabytes of
// output freeze layout, so the page shows a cut preview and offers copy and download instead.
const PREVIEW_OVER_CHARS = 1_000_000;
const PREVIEW_OVER_LINE = 10_000;
const PREVIEW_LINES_MAX = 1000;
const PREVIEW_LINE_CHARS = 2000;
const SEARCH_LIMIT = 1000;
const MAX_FILE_BYTES = 64 * 1024 * 1024;
const INDENT_KEY = 'jf-indent';
const SIDE_KEY = 'jf-panel-side';

type Messages = Record<string, string> & { errors?: Record<string, string> };
type NoId<T> = T extends unknown ? Omit<T, 'id'> : never;
type Options = { decode: boolean; embedded: boolean; hideEmpty: boolean; inline: boolean; hideKeys: Set<string> };
interface Child {
  steps: PathStep[];
  node: JsonNode;
}
interface Row {
  node: JsonNode;
  path: PathStep[];
  el: HTMLElement;
  toggle?: HTMLButtonElement;
  childBox?: HTMLElement;
  children?: Child[];
  shown: number;
}

const numberFormat = new Intl.NumberFormat('en');

function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''));
}

function h<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

function formatBytes(bytes: number): string {
  const [value, unit] = bytes >= 1_000_000 ? [bytes / 1_000_000, 'megabyte'] : bytes >= 1000 ? [bytes / 1000, 'kilobyte'] : [bytes, 'byte'];
  return new Intl.NumberFormat('en', { style: 'unit', unit, unitDisplay: 'narrow', maximumFractionDigits: 1 }).format(value);
}

/** Worker with an in-page fallback for browsers or contexts that cannot start one. */
class Engine {
  private worker: Worker | null = null;
  private seq = 0;
  private pending = new Map<number, { request: WorkerRequest; resolve: (r: WorkerResponse) => void }>();

  constructor() {
    try {
      this.worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
      this.worker.addEventListener('message', (event: MessageEvent<WorkerResponse>) => {
        const job = this.pending.get(event.data.id);
        this.pending.delete(event.data.id);
        job?.resolve(event.data);
      });
      this.worker.addEventListener('error', () => this.fallBack());
    } catch {
      this.worker = null;
    }
  }

  private fallBack(): void {
    this.worker?.terminate();
    this.worker = null;
    for (const [id, job] of this.pending) {
      this.pending.delete(id);
      job.resolve(handle(job.request));
    }
  }

  request(message: NoId<WorkerRequest>): Promise<WorkerResponse> {
    const request = { ...message, id: ++this.seq } as WorkerRequest;
    if (!this.worker) return Promise.resolve(handle(request));
    return new Promise((resolve) => {
      this.pending.set(request.id, { request, resolve });
      this.worker?.postMessage(request);
    });
  }
}

// A small LLM-style response: escaped multi-line text, JSON in a string, and a 64-bit number.
const EXAMPLE = JSON.stringify({
  id: 'resp_example',
  object: 'response',
  created_at: 1767225600,
  model: 'example-model',
  output: [
    {
      type: 'message',
      role: 'assistant',
      content: [
        {
          type: 'output_text',
          text: 'Here is the forecast:\n\n```json\n{"city": "Seoul", "temp_c": 3}\n```\n\nAsk me about "tomorrow" too.',
        },
      ],
    },
    { type: 'function_call', name: 'get_weather', call_id: 'call_1', arguments: JSON.stringify({ city: 'Seoul', unit: 'celsius', days: [1, 2, 3] }) },
  ],
  usage: { input_tokens: 412, output_tokens: 87, total_tokens: 499 },
  metadata: { request_id: '__BIG__', note: null, tags: [] },
}).replace('"__BIG__"', '9007199254740993');

function init(root: HTMLElement): void {
  const msg = JSON.parse(root.dataset.jfMessages ?? '{}') as Messages;
  const $ = <T extends HTMLElement>(selector: string): T => {
    const el = root.querySelector<T>(selector);
    if (!el) throw new Error(`JSON Formatter: missing ${selector}`);
    return el;
  };

  const source = $<HTMLTextAreaElement>('[data-jf-source]');
  const fileInput = $<HTMLInputElement>('[data-jf-file]');
  const dropZone = $<HTMLElement>('[data-jf-drop]');
  const indentSelect = $<HTMLSelectElement>('[data-jf-indent]');
  const errorBox = $<HTMLElement>('[data-jf-error]');
  const status = $<HTMLElement>('[data-jf-status]');
  const dialog = $<HTMLDialogElement>('[data-jf-output]');
  const resultStatus = $<HTMLElement>('[data-jf-result-status]');
  const reopenButton = $<HTMLButtonElement>('[data-jf-reopen]');
  const searchToggle = $<HTMLButtonElement>('[data-jf-search-toggle]');
  const panelToggle = $<HTMLButtonElement>('[data-jf-panel-toggle]');
  const sideSwap = $<HTMLButtonElement>('[data-jf-side-swap]');
  const nameEls = [...root.querySelectorAll<HTMLElement>('[data-jf-name]')];
  const treeOnly = [...root.querySelectorAll<HTMLElement>('[data-jf-tree-only]')];
  const textOnly = [...root.querySelectorAll<HTMLElement>('[data-jf-text-only]')];
  const treePanel = $<HTMLElement>('[data-jf-tree-panel]');
  const textPanel = $<HTMLElement>('[data-jf-text-panel]');
  const tree = $<HTMLElement>('[data-jf-tree]');
  const textOut = $<HTMLElement>('[data-jf-text]');
  const textNote = $<HTMLElement>('[data-jf-text-note]');
  const searchInput = $<HTMLInputElement>('[data-jf-search]');
  const searchCount = $<HTMLElement>('[data-jf-search-count]');
  const pathCode = $<HTMLElement>('[data-jf-path]');
  const hideKeysInput = $<HTMLInputElement>('[data-jf-hide-keys]');
  const viewButtons = [...root.querySelectorAll<HTMLButtonElement>('[data-jf-view]')];
  const optionBoxes = [...root.querySelectorAll<HTMLInputElement>('[data-jf-opt]')];

  const engine = new Engine();
  const opts: Options = { decode: true, embedded: true, hideEmpty: false, inline: false, hideKeys: new Set() };
  let current: JsonNode | null = null;
  let view: 'tree' | 'text' = 'tree';
  let textMode: 'pretty' | 'minified' = 'pretty';
  let textCache = new Map<string, string>();
  let rows = new Map<string, Row>();
  let defaults = new Set<string>();
  const overrides = new Map<string, boolean>();
  let selected: PathStep[] = [];
  let matches: PathStep[][] = [];
  let matchKeys = new Set<string>();
  let matchIndex = -1;
  let capped = false;
  let lastQuery = '';
  let parseToken = 0;
  /** Shown as the result's title: the opened file's name, or a label for typed and example input. */
  let sourceName: string | null = null;

  try {
    const saved = localStorage.getItem(INDENT_KEY);
    if (saved === '2' || saved === '4' || saved === 'tab') indentSelect.value = saved;
  } catch {
    /* storage unavailable: keep the default */
  }
  const indent = (): Indent => indentSelect.value as Indent;

  // ---- children and filtering -------------------------------------------------------------

  const isEmpty = (node: JsonNode): boolean =>
    node.t === 'z' || (node.t === 's' && node.v === '') || ((node.t === 'o' || node.t === 'a') && node.e.length === 0);

  function childrenOf(node: JsonNode): Child[] | null {
    let target = node;
    const prefix: PathStep[] = [];
    if (node.t === 's') {
      if (!opts.embedded || !node.j) return null;
      target = node.j;
      prefix.push({ json: true });
    }
    if (target.t === 'o') {
      const out: Child[] = [];
      for (const [key, value] of target.e) {
        if (opts.hideKeys.has(key) || (opts.hideEmpty && isEmpty(value))) continue;
        out.push({ steps: [...prefix, { k: key }], node: value });
      }
      return out;
    }
    if (target.t === 'a') {
      const out: Child[] = [];
      target.e.forEach((value, i) => {
        if (!(opts.hideEmpty && isEmpty(value))) out.push({ steps: [...prefix, { i }], node: value });
      });
      return out;
    }
    return null;
  }

  function computeDefaults(rootNode: JsonNode): Set<string> {
    const open = new Set<string>();
    let budget = DEFAULT_ROW_BUDGET;
    const queue: Array<{ node: JsonNode; path: PathStep[] }> = [{ node: rootNode, path: [] }];
    for (let q = 0; q < queue.length; q++) {
      const { node, path } = queue[q];
      const children = childrenOf(node);
      if (!children) continue;
      const visible = Math.min(children.length, CHUNK);
      if (path.length > 0 && (children.length > AUTO_OPEN_MAX_CHILDREN || visible > budget)) continue;
      open.add(pathKey(path));
      budget -= visible;
      for (const child of children.slice(0, visible)) queue.push({ node: child.node, path: [...path, ...child.steps] });
    }
    return open;
  }

  // ---- tree rendering ---------------------------------------------------------------------

  function summary(node: JsonNode, children: Child[]): HTMLElement {
    const wrap = h('span', 'jt-summary');
    const target = node.t === 's' && node.j ? node.j : node;
    if (node.t === 's') wrap.append(h('span', 'jt-badge', msg.jsonBadge));
    const count = target.t === 'o' ? target.e.length : target.t === 'a' ? target.e.length : 0;
    const base = target.t === 'o' ? 'keys' : 'items';
    const label = fill(msg[count === 1 ? `${base}One` : base], { n: numberFormat.format(count) });
    const hidden = count - children.length;
    wrap.append(h('span', 'jt-brace', target.t === 'o' ? '{ }' : '[ ]'), h('span', 'jt-meta', hidden > 0 ? `${label} · ${fill(msg.hidden, { n: numberFormat.format(hidden) })}` : label));
    return wrap;
  }

  function stringValue(node: Extract<JsonNode, { t: 's' }>, line: HTMLElement, wrap: HTMLElement): void {
    const value = node.v;
    if (!opts.decode) {
      const encoded = JSON.stringify(value);
      const span = h('span', 'jt-string');
      line.append(span);
      if (encoded.length <= PREVIEW_CHARS) {
        span.textContent = encoded;
        return;
      }
      span.textContent = `${encoded.slice(0, PREVIEW_CHARS)}…`;
      line.append(showAllButton(value.length, () => (span.textContent = encoded)));
      return;
    }
    const multiline = value.includes('\n') || value.length > INLINE_STRING_MAX;
    if (!multiline) {
      line.append(h('span', 'jt-string', `"${value}"`));
      return;
    }
    line.append(h('span', 'jt-meta', fill(msg.chars, { n: numberFormat.format(value.length) })));
    const block = h('div', 'jt-text');
    const lines = value.split('\n', PREVIEW_LINES + 1);
    let preview = lines.slice(0, PREVIEW_LINES).join('\n');
    if (preview.length > PREVIEW_CHARS) preview = preview.slice(0, PREVIEW_CHARS);
    const truncated = preview.length < value.length;
    block.textContent = truncated ? `${preview}…` : value;
    wrap.append(block);
    if (truncated) block.append(showAllButton(value.length, () => (block.textContent = value)));
  }

  function showAllButton(length: number, reveal: () => void): HTMLButtonElement {
    const button = h('button', 'jt-more', fill(msg.showAll, { n: numberFormat.format(length) }));
    button.type = 'button';
    button.addEventListener('click', () => {
      button.remove();
      reveal();
    });
    return button;
  }

  function renderRow(node: JsonNode, path: PathStep[]): HTMLElement {
    const key = pathKey(path);
    const wrap = h('div', 'jt-node');
    wrap.dataset.path = key;
    const line = h('div', 'jt-line');
    wrap.append(line);
    const row: Row = { node, path, el: wrap, shown: 0 };
    rows.set(key, row);
    const children = childrenOf(node);

    if (children) {
      const toggle = h('button', 'jt-toggle');
      toggle.type = 'button';
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', msg.toggle);
      toggle.addEventListener('click', () => {
        const open = toggle.getAttribute('aria-expanded') !== 'true';
        overrides.set(key, open);
        setOpen(row, open);
      });
      row.toggle = toggle;
      line.append(toggle);
    } else {
      line.append(h('span', 'jt-spacer'));
    }

    const last = path[path.length - 1];
    const label = h('button', last && 'i' in last ? 'jt-index' : 'jt-key', last === undefined ? '$' : 'i' in last ? String(last.i) : 'k' in last ? last.k : '');
    label.type = 'button';
    label.addEventListener('click', () => select(path));
    line.append(label, h('span', 'jt-colon', ':'));

    if (children) line.append(summary(node, children));
    else if (node.t === 's') stringValue(node, line, wrap);
    else if (node.t === 'n') line.append(h('span', 'jt-number', node.v));
    else if (node.t === 'b') line.append(h('span', 'jt-boolean', String(node.v)));
    else if (node.t === 'z') line.append(h('span', 'jt-null', 'null'));

    if (matchKeys.has(key)) wrap.classList.add('jt-match');
    if (key === pathKey(selected)) wrap.classList.add('jt-selected');
    if (children && (overrides.get(key) ?? defaults.has(key))) setOpen(row, true);
    return wrap;
  }

  function setOpen(row: Row, open: boolean): void {
    if (!row.toggle) return;
    row.toggle.setAttribute('aria-expanded', String(open));
    if (open && !row.childBox) {
      row.children = childrenOf(row.node) ?? [];
      row.childBox = h('div', 'jt-children');
      row.el.append(row.childBox);
      showMore(row);
    }
    if (row.childBox) row.childBox.hidden = !open;
  }

  function showMore(row: Row): void {
    const children = row.children ?? [];
    const box = row.childBox;
    if (!box) return;
    box.querySelector(':scope > .jt-show-more')?.remove();
    const end = Math.min(children.length, row.shown + CHUNK);
    const frag = document.createDocumentFragment();
    for (let i = row.shown; i < end; i++) frag.append(renderRow(children[i].node, [...row.path, ...children[i].steps]));
    box.append(frag);
    row.shown = end;
    if (end < children.length) {
      const left = children.length - end;
      const more = h('button', 'jt-more jt-show-more', fill(msg.showMore, { n: numberFormat.format(Math.min(CHUNK, left)), left: numberFormat.format(left) }));
      more.type = 'button';
      more.addEventListener('click', () => showMore(row));
      box.append(more);
    }
  }

  function renderTree(): void {
    if (!current) return;
    rows = new Map();
    defaults = computeDefaults(current);
    tree.replaceChildren(renderRow(current, []));
  }

  // ---- selection and paths ----------------------------------------------------------------

  function select(path: PathStep[]): void {
    rows.get(pathKey(selected))?.el.classList.remove('jt-selected');
    selected = path;
    rows.get(pathKey(path))?.el.classList.add('jt-selected');
    pathCode.textContent = pathLabel(path);
  }

  function selectedValue(): string {
    const row = rows.get(pathKey(selected));
    if (!row) return '';
    const node = row.node.t === 's' && row.node.j && opts.embedded ? row.node.j : row.node;
    return stringify(node, { indent: indent(), inlineEmbedded: opts.inline });
  }

  /** Opens every ancestor of `path` (and pages "show more") so its row exists in the DOM. */
  function reveal(path: PathStep[]): Row | undefined {
    let parent = rows.get('');
    for (let n = 0; n < path.length && parent; n++) {
      if ('json' in path[n]) continue;
      setOpen(parent, true);
      overrides.set(pathKey(parent.path), true);
      const target = pathKey(path.slice(0, n + 1));
      const pos = (parent.children ?? []).findIndex((c) => pathKey([...parent!.path, ...c.steps]) === target);
      while (pos >= parent.shown && parent.shown < (parent.children?.length ?? 0)) showMore(parent);
      parent = rows.get(target);
    }
    return parent;
  }

  // ---- search -----------------------------------------------------------------------------

  function runSearch(): void {
    const query = searchInput.value.trim().toLowerCase();
    lastQuery = query;
    matches = [];
    capped = false;
    if (current && query) {
      const visit = (node: JsonNode, path: PathStep[], key: string | null): void => {
        if (matches.length >= SEARCH_LIMIT) {
          capped = true;
          return;
        }
        const children = childrenOf(node);
        let hit = key !== null && key.toLowerCase().includes(query);
        if (!children && !hit) {
          const text = node.t === 's' ? node.v : node.t === 'n' ? node.v : node.t === 'b' ? String(node.v) : node.t === 'z' ? 'null' : '';
          hit = text.toLowerCase().includes(query);
        }
        if (hit) matches.push(path);
        for (const child of children ?? []) {
          const last = child.steps[child.steps.length - 1];
          visit(child.node, [...path, ...child.steps], 'k' in last ? last.k : null);
        }
      };
      visit(current, [], null);
    }
    for (const key of matchKeys) rows.get(key)?.el.classList.remove('jt-match', 'jt-current');
    matchKeys = new Set(matches.map(pathKey));
    for (const key of matchKeys) rows.get(key)?.el.classList.add('jt-match');
    matchIndex = -1;
    if (matches.length) goTo(0);
    else searchCount.textContent = query ? msg.noMatches : '';
  }

  function goTo(index: number): void {
    if (!matches.length) return;
    matchIndex = (index + matches.length) % matches.length;
    tree.querySelector('.jt-current')?.classList.remove('jt-current');
    const path = matches[matchIndex];
    const row = reveal(path);
    for (const key of matchKeys) rows.get(key)?.el.classList.add('jt-match');
    if (row) {
      row.el.classList.add('jt-current');
      row.el.querySelector(':scope > .jt-line')?.scrollIntoView({ block: 'nearest' });
    }
    select(path);
    searchCount.textContent = fill(capped ? msg.matchesCapped : msg.matches, {
      i: numberFormat.format(matchIndex + 1),
      n: numberFormat.format(matches.length),
    });
  }

  // ---- text view --------------------------------------------------------------------------

  /** Full text output for the current options (cached; produced in the worker). */
  async function outputText(): Promise<string> {
    const key = `${textMode === 'minified' ? 'min' : indent()}|${opts.inline}`;
    let text = textCache.get(key);
    if (text === undefined) {
      const response = await engine.request({ type: 'stringify', indent: textMode === 'minified' ? null : indent(), inlineEmbedded: opts.inline });
      text = response.type === 'stringify' ? response.text : '';
      textCache.set(key, text);
    }
    return text;
  }

  /** A cut-down copy for display, or null when the whole text is safe to render. */
  function preview(text: string): { text: string; lines: number; total: number } | null {
    let longest = 0;
    let lines = 1;
    for (let at = 0, next = text.indexOf('\n'); ; at = next + 1, next = text.indexOf('\n', at)) {
      const end = next === -1 ? text.length : next;
      if (end - at > longest) longest = end - at;
      if (next === -1) break;
      lines++;
    }
    if (text.length <= PREVIEW_OVER_CHARS && longest <= PREVIEW_OVER_LINE) return null;
    const shown = text
      .split('\n', PREVIEW_LINES_MAX)
      .map((line) => (line.length > PREVIEW_LINE_CHARS ? `${line.slice(0, PREVIEW_LINE_CHARS)} …` : line))
      .join('\n');
    return { text: lines > PREVIEW_LINES_MAX ? `${shown}\n…` : shown, lines: Math.min(lines, PREVIEW_LINES_MAX), total: lines };
  }

  async function renderText(): Promise<void> {
    const text = await outputText();
    const cut = preview(text);
    if (cut) {
      textOut.textContent = cut.text;
      textNote.textContent = fill(cut.lines < cut.total ? msg.largeText : msg.largeTextCut, {
        lines: numberFormat.format(cut.lines),
        total: numberFormat.format(cut.total),
        chars: numberFormat.format(PREVIEW_LINE_CHARS),
      });
      textNote.hidden = false;
      return;
    }
    if (text.length > HIGHLIGHT_LIMIT) {
      textOut.textContent = text;
      textNote.hidden = true;
      return;
    }
    const frag = document.createDocumentFragment();
    for (const [kind, part] of tokenize(text)) {
      if (kind === 'space' || kind === 'punct') frag.append(part);
      else frag.append(h('span', `jt-${kind}`, part));
    }
    textOut.replaceChildren(frag);
    textNote.hidden = true;
  }

  function setView(next: 'tree' | 'text'): void {
    view = next;
    for (const button of viewButtons) button.setAttribute('aria-pressed', String(button.dataset.jfView === next));
    treePanel.hidden = next !== 'tree';
    textPanel.hidden = next !== 'text';
    for (const el of treeOnly) el.hidden = next !== 'tree';
    for (const el of textOnly) el.hidden = next !== 'text';
    if (next === 'text') void renderText();
  }

  // ---- result dialog ----------------------------------------------------------------------
  // A history entry is pushed on open so the browser's Back button (and the phone back gesture)
  // closes the result like leaving a page; the data never leaves memory.

  let historyPushed = false;

  function openResult(): void {
    if (dialog.open) return;
    dialog.showModal();
    tree.scrollTop = 0;
    try {
      history.pushState({ ...(history.state ?? {}), jfResult: true }, '');
      historyPushed = true;
    } catch {
      historyPushed = false;
    }
  }

  function closeResult(): void {
    if (!dialog.open) return;
    if (historyPushed) history.back(); // popstate closes the dialog
    else dialog.close();
  }

  function setPanelOpen(open: boolean): void {
    dialog.classList.toggle('is-panel-open', open);
    panelToggle.setAttribute('aria-expanded', String(open));
  }

  function setSide(side: 'left' | 'right'): void {
    dialog.dataset.side = side;
    const label = side === 'right' ? msg.panelToLeft : msg.panelToRight;
    sideSwap.setAttribute('aria-label', label);
    sideSwap.title = label;
  }

  function setSearchOpen(open: boolean): void {
    dialog.classList.toggle('is-search-open', open);
    searchToggle.setAttribute('aria-expanded', String(open));
    if (open) searchInput.focus();
  }

  window.addEventListener('popstate', () => {
    historyPushed = false;
    if (dialog.open) dialog.close();
  });
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault(); // Esc: go back through history like the Back button
    if (dialog.classList.contains('is-panel-open')) setPanelOpen(false); // phones: close the drawer first
    else closeResult();
  });
  dialog.addEventListener('close', () => {
    setSearchOpen(false);
    setPanelOpen(false);
  });
  panelToggle.addEventListener('click', () => setPanelOpen(!dialog.classList.contains('is-panel-open')));
  // Phones: a tap on the result outside the drawer closes the drawer instead of acting on the tree.
  $<HTMLElement>('.jf-result-body').addEventListener(
    'click',
    (event) => {
      if (!dialog.classList.contains('is-panel-open')) return;
      event.preventDefault();
      event.stopPropagation();
      setPanelOpen(false);
    },
    { capture: true },
  );
  let savedSide: string | null = null;
  try {
    savedSide = localStorage.getItem(SIDE_KEY);
  } catch {
    savedSide = null;
  }
  setSide(savedSide === 'left' ? 'left' : 'right');
  sideSwap.addEventListener('click', () => {
    const next = dialog.dataset.side === 'left' ? 'right' : 'left';
    setSide(next);
    try {
      localStorage.setItem(SIDE_KEY, next);
    } catch {
      /* storage unavailable: the choice lasts for this page */
    }
  });
  dialog.addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'f' && view === 'tree') {
      event.preventDefault(); // search the JSON, not the hidden page behind the dialog
      setSearchOpen(true);
      searchInput.select();
    }
  });
  for (const button of root.querySelectorAll<HTMLButtonElement>('[data-jf-close]')) button.addEventListener('click', closeResult);
  searchToggle.addEventListener('click', () => setSearchOpen(!dialog.classList.contains('is-search-open')));
  reopenButton.addEventListener('click', openResult);

  // ---- parse and report -------------------------------------------------------------------

  function showError(result: Extract<ParseResult, { ok: false }>): void {
    const { code, params, line, column, offset } = result.error;
    const message = errorText(msg.errors?.[code] ?? ERROR_TEXT[code], params, msg.endOfInput);
    errorBox.textContent = fill(msg.errorAt, { line, column, message });
    errorBox.hidden = false;
    reopenButton.hidden = true;
    closeResult();
    status.textContent = '';
    source.focus();
    source.setSelectionRange(offset, Math.min(offset + 1, source.value.length));
  }

  async function run(mode: 'pretty' | 'minified'): Promise<void> {
    const text = source.value;
    const token = ++parseToken;
    status.textContent = msg.working;
    const response = await engine.request({ type: 'parse', text });
    if (token !== parseToken || response.type !== 'parse') return; // a newer run started
    const { result } = response;
    if (!result.ok) {
      current = null;
      showError(result);
      return;
    }
    errorBox.hidden = true;
    current = result.root;
    textCache = new Map();
    overrides.clear();
    selected = [];
    pathCode.textContent = pathLabel([]);
    textMode = mode;
    status.textContent = fill(msg.status, {
      size: formatBytes(new Blob([text]).size),
      values: numberFormat.format(result.stats.values),
      embedded: numberFormat.format(result.stats.embedded),
      ms: numberFormat.format(response.ms),
    });
    resultStatus.textContent = status.textContent;
    for (const el of nameEls) el.textContent = sourceName ?? msg.sourceInput;
    reopenButton.hidden = false;
    openResult(); // open first so search can scroll the first match into view
    renderTree();
    runSearch();
    setView(mode === 'minified' ? 'text' : view);
  }

  async function loadFile(file: File): Promise<void> {
    if (file.size > MAX_FILE_BYTES) {
      errorBox.textContent = msg.fileTooLarge;
      errorBox.hidden = false;
      return;
    }
    source.value = await file.text();
    sourceName = file.name;
    await run('pretty');
  }

  // ---- wiring -----------------------------------------------------------------------------

  $<HTMLButtonElement>('[data-jf-format]').addEventListener('click', () => void run('pretty'));
  $<HTMLButtonElement>('[data-jf-minify]').addEventListener('click', () => void run('minified'));
  $<HTMLButtonElement>('[data-jf-example]').addEventListener('click', () => {
    source.value = EXAMPLE;
    sourceName = msg.sourceExample;
    void run('pretty');
  });
  source.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      void run('pretty');
    }
  });
  source.addEventListener('input', () => (sourceName = null)); // typed or pasted: no file name any more
  source.addEventListener('paste', () => setTimeout(() => void run('pretty'), 0));
  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (file) void loadFile(file);
    fileInput.value = '';
  });
  dropZone.addEventListener('dragover', (event) => {
    event.preventDefault();
    dropZone.classList.add('is-dragging');
  });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('is-dragging'));
  dropZone.addEventListener('drop', (event) => {
    event.preventDefault();
    dropZone.classList.remove('is-dragging');
    const file = event.dataTransfer?.files[0];
    if (file) void loadFile(file);
  });

  indentSelect.addEventListener('change', () => {
    try {
      localStorage.setItem(INDENT_KEY, indentSelect.value);
    } catch {
      /* storage unavailable */
    }
    if (current) {
      textMode = 'pretty';
      if (view === 'text') void renderText();
    }
  });

  for (const button of viewButtons) button.addEventListener('click', () => setView(button.dataset.jfView === 'text' ? 'text' : 'tree'));

  for (const box of optionBoxes) {
    const name = box.dataset.jfOpt as 'decode' | 'embedded' | 'hideEmpty' | 'inline';
    opts[name] = box.checked;
    box.addEventListener('change', () => {
      opts[name] = box.checked;
      if (!current) return;
      if (name === 'inline') void renderText();
      else {
        renderTree();
        runSearch();
      }
    });
  }

  let hideTimer = 0;
  hideKeysInput.addEventListener('input', () => {
    clearTimeout(hideTimer);
    hideTimer = window.setTimeout(() => {
      opts.hideKeys = new Set(hideKeysInput.value.split(',').map((s) => s.trim()).filter(Boolean));
      if (!current) return;
      renderTree();
      runSearch();
    }, 250);
  });

  let searchTimer = 0;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = window.setTimeout(runSearch, 200);
  });
  searchInput.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    if (searchInput.value.trim().toLowerCase() !== lastQuery) {
      // Typed faster than the debounce: search now instead of stepping through stale matches.
      clearTimeout(searchTimer);
      runSearch();
      return;
    }
    goTo(matchIndex + (event.shiftKey ? -1 : 1));
  });
  $<HTMLButtonElement>('[data-jf-search-prev]').addEventListener('click', () => goTo(matchIndex - 1));
  $<HTMLButtonElement>('[data-jf-search-next]').addEventListener('click', () => goTo(matchIndex + 1));

  $<HTMLButtonElement>('[data-jf-download]').addEventListener('click', async () => {
    // Built in the page from the parsed input; nothing leaves the browser.
    const url = URL.createObjectURL(new Blob([await outputText()], { type: 'application/json' }));
    const link = h('a');
    link.href = url;
    link.download = textMode === 'minified' ? 'minified.json' : 'formatted.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  for (const button of root.querySelectorAll<HTMLButtonElement>('[data-jf-copy]')) {
    const original = button.textContent ?? '';
    button.addEventListener('click', async () => {
      const kind = button.dataset.jfCopy;
      const text = kind === 'path' ? pathLabel(selected) : kind === 'js' ? jsAccessor(selected) : kind === 'value' ? selectedValue() : await outputText();
      try {
        await navigator.clipboard.writeText(text);
        button.textContent = msg.copied;
        setTimeout(() => (button.textContent = original), 1600);
      } catch {
        /* clipboard denied: nothing to report beyond the unchanged label */
      }
    });
  }
}

for (const el of document.querySelectorAll<HTMLElement>('[data-jf]')) init(el);
