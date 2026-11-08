// Sätteri HAST plugins for Markdown output (configured in astro.config.mjs).
// Styled by src/styles/prose.css. UI strings come from src/i18n/ui.ts via the entry's `lang`.
import { defaultLocale, ui } from '../i18n/ui.ts';

function t(ctx, key) {
  const lang = ctx.data?.astro?.frontmatter?.lang;
  const table = ui[lang] ?? ui[defaultLocale];
  return table[key] ?? ui[defaultLocale][key] ?? key;
}

const el = (tagName, properties = {}, children = []) => ({ type: 'element', tagName, properties, children });
const text = (value) => ({ type: 'text', value });

// Wraps every <table> in a focusable <div class="table-wrap"> so wide tables scroll sideways on
// narrow screens while the <table> keeps its semantics, and keyboard users can scroll it
// (axe: scrollable-region-focusable).
export const tableWrap = {
  name: 'table-wrap',
  element: {
    filter: ['table'],
    visit(node, ctx) {
      ctx.wrapNode(node, el('div', { className: ['table-wrap'], tabindex: 0 }));
    },
  },
};

// GFM task lists render disabled checkboxes with no label; the list item text is the label, so
// the box is decorative for assistive tech (axe: label).
export const taskListCheckbox = {
  name: 'task-list-checkbox',
  element: {
    filter: ['input'],
    visit(node, ctx) {
      if ((node.properties ?? {}).type !== 'checkbox') return;
      ctx.setProperty(node, 'ariaHidden', 'true');
      ctx.setProperty(node, 'tabindex', -1);
    },
  },
};

// Callouts (DESIGN.md §8): a blockquote whose first line is [!NOTE] / [!TIP] / [!IMPORTANT] /
// [!WARNING] / [!CAUTION] becomes <blockquote class="callout callout-<kind>"> with a title line.
const CALLOUT_KINDS = { NOTE: 'note', TIP: 'tip', IMPORTANT: 'important', WARNING: 'warning', CAUTION: 'caution' };
const MARKER = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*\n?/;

export const callouts = {
  name: 'callouts',
  element: {
    filter: ['blockquote'],
    visit(node, ctx) {
      const firstP = (node.children ?? []).find((c) => c.type === 'element' && c.tagName === 'p');
      const firstText = firstP?.children?.[0];
      if (!firstText || firstText.type !== 'text') return;
      const match = firstText.value.match(MARKER);
      if (!match) return;
      const kind = CALLOUT_KINDS[match[1]];
      const rest = firstText.value.slice(match[0].length);
      // Rebuild the first paragraph without the marker; drop it entirely if it only held the marker.
      const restChildren = [...firstP.children.slice(1)];
      if (rest.trim()) restChildren.unshift(text(rest));
      const newChildren = (node.children ?? []).filter((c) => c !== firstP && !(c.type === 'text' && !c.value.trim()));
      const title = el('p', { className: ['callout-title'] }, [text(t(ctx, `callout.${kind}`))]);
      const body = restChildren.length ? [el('p', {}, restChildren)] : [];
      ctx.replaceNode(node, el('blockquote', { className: ['callout', `callout-${kind}`] }, [title, ...body, ...newChildren]));
    },
  },
};

// Code blocks (DESIGN.md §8 CodeBlock): <pre class="astro-code"> gets a bar with the language
// label and a copy button; the click handler lives in src/components/ArticleShell.astro.
export const codeBlocks = {
  name: 'code-blocks',
  element: {
    filter: ['pre'],
    visit(node, ctx) {
      const props = node.properties ?? {};
      // The highlighter writes `class`, not `className`; accept both spellings.
      const raw = props.className ?? props.class ?? '';
      const classes = Array.isArray(raw) ? raw : String(raw).split(/\s+/);
      if (!classes.includes('astro-code')) return;
      const lang = props.dataLanguage ?? props['data-language'] ?? '';
      const bar = el('div', { className: ['code-block-bar'] }, [
        el('span', { className: ['code-block-lang'] }, [text(String(lang))]),
        el(
          'button',
          {
            type: 'button',
            className: ['code-copy'],
            ariaLabel: t(ctx, 'code.copy'),
            dataCopyLabel: t(ctx, 'code.copy'),
            dataCopiedLabel: t(ctx, 'code.copied'),
          },
          [el('span', { className: ['code-copy-icon'], ariaHidden: 'true' }), el('span', { className: ['code-copy-text'] }, [text(t(ctx, 'code.copy'))])],
        ),
      ]);
      ctx.replaceNode(node, el('figure', { className: ['code-block'] }, [bar, { ...node }]));
    },
  },
};
