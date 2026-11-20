// Behaviour of the JSON Formatter (src/tools/json). Behaviour runs on one phone and one desktop
// project; the result dialog's accessibility and overflow run in both themes. The page's own
// layout is covered by the design matrix in design.spec.ts.
// Most checks use the English route; the Korean test checks the copy on `/`.
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

import { makeLlmDocText } from './fixtures/llm-doc.mjs';

const PAGE = '/en/tools/json-formatter/';
const BEHAVIOUR = ['390-light', '1280-light'];

test.beforeEach(async ({ page }, testInfo) => {
  const themed = testInfo.title.startsWith('result dialog:');
  test.skip(!themed && !BEHAVIOUR.includes(testInfo.project.name), 'behaviour is checked on one phone and one desktop width');
  test.skip(themed && !testInfo.project.name.match(/^(390|1280)-/), 'dialog layout is checked on one phone and one desktop width');
  const scheme = testInfo.project.name.endsWith('dark') ? 'dark' : 'light';
  await page.addInitScript((value) => localStorage.setItem('theme', value), scheme);
  await page.goto(PAGE);
});

/** The result search is always shown from 768px; phones open it with the search button. */
async function search(page: Page) {
  await panel(page, false);
  const toggle = page.locator('[data-jf-search-toggle]');
  if ((await toggle.isVisible()) && (await toggle.getAttribute('aria-expanded')) !== 'true') await toggle.click();
  return page.getByPlaceholder('Search', { exact: true });
}

/** The side panel is always shown from 768px; phones open it as a drawer from the bar. */
async function panel(page: Page, open: boolean) {
  const toggle = page.locator('[data-jf-panel-toggle]');
  if (!(await toggle.isVisible())) return;
  if (((await toggle.getAttribute('aria-expanded')) === 'true') !== open) await toggle.click();
  await expect(page.locator('#jf-panel')).toBeVisible({ visible: open });
}

test('formats the example into a full-screen result and opens JSON stored in a string', async ({ page }) => {
  await page.getByRole('button', { name: 'Load example' }).click();
  await expect(page.getByRole('dialog', { name: 'Example response' })).toBeVisible();
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
  await page.getByRole('button', { name: 'Close' }).click(); // the result covers the page
  await page.getByRole('button', { name: 'Minify' }).click();
  const text = page.getByRole('region', { name: 'Formatted JSON' }).or(page.locator('.jf-text'));
  await expect(text).toContainText('"request_id":9007199254740993');
  await expect(page.locator('[data-jf-view="text"]')).toHaveAttribute('aria-pressed', 'true'); // in the panel (a drawer on phones)
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
  await expect(page.getByRole('dialog', { name: 'response.json' })).toBeVisible(); // the file name is the title
  const tree = page.getByRole('region', { name: 'JSON tree' });

  // Search reaches into JSON stored in output[0].content[0].text and opens the way there.
  const box = await search(page);
  await box.fill('trade_date');
  await expect(page.locator('[data-jf-search-count]')).toHaveText(/^1 of \d+$/);
  await expect(tree.locator('.jt-current')).toBeVisible();
  await expect(page.locator('[data-jf-path]')).toContainText('⟨json⟩');

  // Large arrays start collapsed with a count.
  await box.fill('Sample header 13');
  await expect(page.locator('[data-jf-path]')).toHaveText(/\.content\.html$/); // parse step content.html first
  await expect(page.locator('[data-jf-search-count]')).toHaveText('1 of 2'); // then elements[13]
  await box.press('Enter');
  await expect(page.locator('[data-jf-search-count]')).toHaveText('2 of 2');
  await expect(tree.locator('.jt-node', { has: page.locator(':scope > .jt-line > .jt-key', { hasText: /^words$/ }) }).first()).toContainText('200 items');

  // Hidden keys (in the side panel) drop out of the tree and of search.
  await panel(page, true);
  await page.getByPlaceholder('words, coordinates').fill('words, coordinates, word_coordinates');
  await expect(tree.locator('.jt-key', { hasText: /^words$/ })).toHaveCount(0);

  // The selected node's path is offered as a JavaScript accessor.
  await (await search(page)).fill('counterparty');
  await expect(page.locator('[data-jf-path]')).toHaveText(/^\$\.output\[2\]\.content\[0\]\.(text|additional_values) ⟨json⟩ \.counterparty$/);

  // The text view cuts the 2 MB single-line string instead of laying it out, and still offers it in full.
  await panel(page, true);
  await page.getByRole('button', { name: 'Text', exact: true }).click();
  await expect(page.locator('[data-jf-text-note]')).toContainText('cut');
  const shown = await page.locator('[data-jf-text]').evaluate((el) => (el.textContent ?? '').split('\n').reduce((max, line) => Math.max(max, line.length), 0));
  expect(shown).toBeLessThanOrEqual(2002);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download .json' }).click();
  expect((await download).suggestedFilename()).toBe('formatted.json');
});

test('Back, Esc and the close button close the result; Show result reopens it', async ({ page }) => {
  await page.getByRole('button', { name: 'Load example' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await page.goBack(); // browser Back closes the result and stays on the tool
  await expect(dialog).toBeHidden();
  await expect(page).toHaveURL(new RegExp(`${PAGE}$`));

  await page.getByRole('button', { name: 'Show result' }).click();
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();

  await page.getByRole('button', { name: 'Show result' }).click();
  await page.getByRole('button', { name: 'Close' }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole('button', { name: 'Format', exact: true })).toBeVisible();
});

test('Ctrl or Cmd + F searches the result', async ({ page }) => {
  await page.getByRole('button', { name: 'Load example' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('ControlOrMeta+f');
  await expect(page.getByPlaceholder('Search', { exact: true })).toBeFocused();
  await page.keyboard.type('celsius');
  await expect(page.locator('[data-jf-search-count]')).toHaveText('1 of 1');
});

test('result dialog: no overflow or serious accessibility violations', async ({ page }) => {
  await page.getByRole('button', { name: 'Load example' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await (await search(page)).fill('city');
  await panel(page, true); // phones: check the drawer's contents too
  const overflow = await page.evaluate(() => {
    const dialog = document.querySelector('dialog');
    return { page: document.documentElement.scrollWidth - document.documentElement.clientWidth, dialog: dialog ? dialog.scrollWidth - dialog.clientWidth : 0 };
  });
  expect(overflow).toEqual({ page: 0, dialog: 0 });
  const results = await new AxeBuilder({ page }).include('dialog').withTags(['wcag2a', 'wcag2aa', 'wcag22aa']).analyze();
  const bad = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
  expect(bad).toEqual([]);
  await page.screenshot({ path: `shots/tool-json-result-${test.info().project.name}.png` });
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
