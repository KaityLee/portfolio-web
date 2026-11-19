// Behaviour of the JSON Formatter (src/tools/json). Runs on one phone and one desktop project;
// the design matrix in design.spec.ts covers layout, contrast and overflow on every project.
// Most checks use the English route; the last ones check the Korean copy on `/`.
import { expect, test } from '@playwright/test';

import { makeLlmDocText } from './fixtures/llm-doc.mjs';

const PAGE = '/en/tools/json-formatter/';

test.beforeEach(async ({ page }, testInfo) => {
  test.skip(!['390-light', '1280-light'].includes(testInfo.project.name), 'behaviour is checked on one phone and one desktop width');
  await page.goto(PAGE);
});

test('formats the example and opens JSON stored in a string', async ({ page }) => {
  await page.getByRole('button', { name: 'Load example' }).click();
  const tree = page.getByRole('region', { name: 'JSON tree' });
  await expect(tree).toBeVisible();
  const args = tree.locator('.jt-node', { has: page.locator(':scope > .jt-line > .jt-key', { hasText: /^arguments$/ }) });
  await expect(args.locator(':scope > .jt-line .jt-badge')).toHaveText('JSON');
  await expect(args.locator('.jt-key', { hasText: /^city$/ })).toBeVisible();
  await expect(tree.locator('.jt-text')).toContainText('Ask me about "tomorrow" too.');
  await expect(page.locator('[data-jf-status]')).toContainText('JSON in strings: 1');
});

test('keeps 64-bit numbers and minifies in the text view', async ({ page }) => {
  await page.getByRole('button', { name: 'Load example' }).click();
  await page.getByRole('button', { name: 'Minify' }).click();
  const text = page.getByRole('region', { name: 'Formatted JSON' }).or(page.locator('.jf-text'));
  await expect(text).toContainText('"request_id":9007199254740993');
  await expect(page.getByRole('button', { name: 'Text' })).toHaveAttribute('aria-pressed', 'true');
});

test('reports syntax errors with line and column', async ({ page }) => {
  await page.getByLabel('JSON input').fill('{\n  "a": 1,\n}');
  await page.getByRole('button', { name: 'Format' }).click();
  await expect(page.getByRole('alert')).toHaveText('Line 3, column 1: Trailing comma before }');
  await expect(page.locator('[data-jf-output]')).toBeHidden();
});

test('opens a multi-megabyte pipeline response, hides keys, searches and shows paths', async ({ page }) => {
  const text = makeLlmDocText();
  await page.locator('[data-jf-file]').setInputFiles({ name: 'response.json', mimeType: 'application/json', buffer: Buffer.from(text) });
  await expect(page.locator('[data-jf-status]')).toContainText('values', { timeout: 10_000 });
  const tree = page.getByRole('region', { name: 'JSON tree' });

  // Search reaches into JSON stored in output[0].content[0].text and opens the way there.
  await page.getByPlaceholder('Search keys and values').fill('trade_date');
  await expect(page.locator('[data-jf-search-count]')).toHaveText(/^1 of \d+$/);
  await expect(tree.locator('.jt-current')).toBeVisible();
  await expect(page.locator('[data-jf-path]')).toContainText('⟨json⟩');

  // Large arrays start collapsed with a count.
  const search = page.getByPlaceholder('Search keys and values');
  await search.fill('Sample header 13');
  await expect(page.locator('[data-jf-path]')).toHaveText(/\.content\.html$/); // parse step content.html first
  await expect(page.locator('[data-jf-search-count]')).toHaveText('1 of 2'); // then elements[13]
  await search.press('Enter');
  await expect(page.locator('[data-jf-search-count]')).toHaveText('2 of 2');
  await expect(tree.locator('.jt-node', { has: page.locator(':scope > .jt-line > .jt-key', { hasText: /^words$/ }) }).first()).toContainText('200 items');

  // Hidden keys drop out of the tree and of search.
  await page.getByPlaceholder('words, coordinates').fill('words, coordinates, word_coordinates');
  await expect(tree.locator('.jt-key', { hasText: /^words$/ })).toHaveCount(0);

  // The selected node's path is offered as a JavaScript accessor.
  await page.getByPlaceholder('Search keys and values').fill('counterparty');
  await expect(page.locator('[data-jf-path]')).toHaveText(/^\$\.output\[2\]\.content\[0\]\.(text|additional_values) ⟨json⟩ \.counterparty$/);

  // The text view cuts the 2 MB single-line string instead of laying it out, and still offers it in full.
  await page.getByRole('button', { name: 'Text', exact: true }).click();
  await expect(page.locator('[data-jf-text-note]')).toContainText('cut');
  const shown = await page.locator('[data-jf-text]').evaluate((el) => (el.textContent ?? '').split('\n').reduce((max, line) => Math.max(max, line.length), 0));
  expect(shown).toBeLessThanOrEqual(2002);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download .json' }).click();
  expect((await download).suggestedFilename()).toBe('formatted.json');
});

test('Korean route: English title, Korean controls and errors', async ({ page }) => {
  await page.goto('/tools/json-formatter/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ko');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('JSON Formatter');
  await expect(page.getByRole('heading', { level: 1 })).toHaveAttribute('lang', 'en');
  await page.getByLabel('JSON 입력').fill('[1, 2,]');
  await page.getByRole('button', { name: '정렬', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('1번째 줄, 7번째 열: ] 앞에 쉼표가 남아 있습니다');
});
