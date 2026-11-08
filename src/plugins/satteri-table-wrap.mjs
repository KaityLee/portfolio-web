// Sätteri HAST plugins for Markdown output (configured in astro.config.mjs).
// Styled by src/styles/prose.css.

// Wraps every <table> in a focusable <div class="table-wrap"> so wide tables scroll sideways on
// narrow screens while the <table> keeps its semantics, and keyboard users can scroll it
// (axe: scrollable-region-focusable).
export const tableWrap = {
  name: 'table-wrap',
  element: {
    filter: ['table'],
    visit(node, ctx) {
      ctx.wrapNode(node, {
        type: 'element',
        tagName: 'div',
        properties: { className: ['table-wrap'], tabindex: 0 },
        children: [],
      });
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
      const props = node.properties ?? {};
      if (props.type !== 'checkbox') return;
      ctx.setProperty(node, 'ariaHidden', 'true');
      ctx.setProperty(node, 'tabindex', -1);
    },
  },
};
