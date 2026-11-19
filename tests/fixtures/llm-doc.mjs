// Synthetic stand-in for a document-AI pipeline response (parse → classify → extract) in a
// Responses-API style envelope. Same shape as the real payloads the JSON Formatter is built for,
// with invented values only: never replace this with a real response (the repository is public).

const round = (n) => Math.round(n * 10000) / 10000;

function box(x, y, w, h) {
  return [
    { x: round(x), y: round(y) },
    { x: round(x + w), y: round(y) },
    { x: round(x + w), y: round(y + h) },
    { x: round(x), y: round(y + h) },
  ];
}

const WORDS = ['Sample', 'Notional', 'Amount', 'Trade', 'Date', 'Party', 'Rate', 'Payment', 'Schedule', 'Period', 'Index', 'Reset'];

function element(id, page, wordsPerElement) {
  const category = id % 3 === 0 ? 'table' : id % 3 === 1 ? 'header' : 'paragraph';
  const words = Array.from({ length: wordsPerElement }, (_, w) => ({
    text: WORDS[(id + w) % WORDS.length],
    confidence: round(0.9 + ((id * 7 + w) % 10) / 100),
    coordinates: box(0.05 + (w % 20) * 0.045, 0.05 + (id % 30) * 0.03, 0.04, 0.01),
  }));
  const html =
    category === 'table'
      ? `<table id="${id}"><tr><td>Notional</td><td>"1,000,000"</td></tr><tr><td>Rate</td><td>3.25%</td></tr></table>`
      : `<p data-category="${category}" id="${id}" style="font-size:14px">Sample ${category} ${id}</p>`;
  return {
    id,
    page,
    category,
    content: { html, markdown: '', text: words.map((w) => w.text).join(' ') },
    coordinates: box(0.05, 0.05 + (id % 30) * 0.03, 0.9, 0.025),
    words,
  };
}

function field(value, confidence, score) {
  return {
    _value: value,
    confidence,
    page: 1,
    coordinates: box(0.1, 0.2, 0.3, 0.02),
    word_coordinates: [box(0.1, 0.2, 0.05, 0.02), box(0.16, 0.2, 0.05, 0.02)],
    confidence_score: score,
  };
}

function message(id, model, text, additional) {
  return {
    id,
    type: 'message',
    status: 'completed',
    created_at: 1767225601,
    updated_at: 1767225601,
    is_deleted: false,
    model,
    response_id: null,
    raw_content: null,
    content_parsed: null,
    sources: null,
    tool_calls: null,
    role: 'assistant',
    content: [{ type: 'output_text', text, annotations: [], additional_values: JSON.stringify(additional) }],
  };
}

/** @param {{ elements?: number, wordsPerElement?: number }} [size] */
export function makeLlmDocFixture({ elements = 60, wordsPerElement = 200 } = {}) {
  const els = Array.from({ length: elements }, (_, i) => element(i, 1 + Math.floor(i / 3), wordsPerElement));
  const parsed = {
    api: '2.0',
    content: {
      html: els.map((e) => e.content.html).join('\n'),
      markdown: '',
      text: els.map((e) => e.content.text).join('\n'),
    },
    elements: els,
    usage: { pages: Math.ceil(elements / 3) },
  };
  const extracted = { counterparty: 'Example Bank', trade_date: '2026-01-02', notional: 1000000, spread: 0.25, trade_id: '__BIG__' };
  const extractedMeta = {
    previous_step_name: 'step_2_classify',
    step_run_id: '00000000-0000-4000-8000-000000000003',
    cache_hit: true,
    counterparty: field('Example Bank', 'low', 0.4521),
    trade_date: field('2026-01-02', 'high', 0.9812),
  };
  // trade_id is written as raw text so the fixture carries a number above 2^53 unchanged.
  const extractedText = JSON.stringify(extracted).replace('"__BIG__"', '9007199254740993');
  return {
    id: 'job_sample',
    object: 'response',
    created_at: 1767225600,
    status: 'completed',
    error: null,
    instructions: null,
    model: 'agt_sample',
    output: [
      message('m1', 'step_1_parse', JSON.stringify(parsed), { previous_step_name: null, step_run_id: '00000000-0000-4000-8000-000000000001', cache_hit: false }),
      message('m2', 'step_2_classify', 'SAMPLE', { previous_step_name: 'step_1_parse', document_type: { _value: 'SAMPLE', confidence: 'low', confidence_score: 0.61 } }),
      message('m3', 'extract', extractedText, extractedMeta),
    ],
    usage: { input_tokens: 0, output_tokens: 0, total_tokens: 0 },
    metadata: { source: 'api', cached: 'true' },
  };
}

/** Fixture as JSON text (about 2.5 MB with the defaults). */
export function makeLlmDocText(size) {
  return JSON.stringify(makeLlmDocFixture(size), null, 4);
}
