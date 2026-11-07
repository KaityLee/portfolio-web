// Sätteri HAST plugin: wraps every Markdown <table> in <div class="table-wrap"> so wide
// tables scroll sideways on narrow screens while the <table> keeps its semantics.
// Styled by src/styles/prose.css (.table-wrap).
export const tableWrap = {
  name: 'table-wrap',
  element: {
    filter: ['table'],
    visit(node, ctx) {
      ctx.wrapNode(node, {
        type: 'element',
        tagName: 'div',
        properties: { className: ['table-wrap'] },
        children: [],
      });
    },
  },
};
