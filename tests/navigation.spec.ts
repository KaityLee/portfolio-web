// Whole cards and rows are links (DESIGN.md §8): clicking away from the title still navigates.
import { expect, test, type Locator, type Page } from '@playwright/test';

/** Clicks the middle of `target` as a user would; the stretched link on top receives the click. */
async function clickAt(page: Page, target: Locator): Promise<void> {
  const box = await target.boundingBox();
  if (!box) throw new Error('target is not visible');
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
}

test.beforeEach(async ({}, testInfo) => {
  test.skip(!['390-light', '1280-light'].includes(testInfo.project.name), 'checked on one phone and one desktop width');
});

test('a project card opens its page from anywhere on the card', async ({ page }) => {
  await page.goto('/projects/');
  const card = page.locator('.post-list li').first();
  const box = await card.boundingBox();
  if (!box) throw new Error('no project card');
  await page.mouse.click(box.x + box.width - 12, box.y + box.height - 12); // bottom-right corner, away from the title
  await expect(page).toHaveURL(/\/projects\/[^/]+\/?$/);
});

test('a tool card opens the tool', async ({ page }) => {
  await page.goto('/tools/');
  await clickAt(page, page.locator('.post-list li p').first());
  await expect(page).toHaveURL(/\/tools\/json-formatter\/?$/);
});

test('a writing row opens the post from its date', async ({ page }) => {
  await page.goto('/writing/');
  await clickAt(page, page.locator('.post-rows li time').first());
  await expect(page).toHaveURL(/\/writing\/[^/]+\/?$/);
});

test('cards keep one link each for keyboards and screen readers', async ({ page }) => {
  await page.goto('/');
  const cards = page.locator('.post-list li');
  for (let i = 0; i < (await cards.count()); i++) await expect(cards.nth(i).locator('a')).toHaveCount(1);
});

test('the language switch slides to the new choice, then opens that language', async ({ page }, testInfo) => {
  await page.goto('/about/');
  if (testInfo.project.name.startsWith('390')) await page.getByRole('button', { name: '메뉴' }).click();
  const group = page.locator('[data-segmented]:visible').first();
  const indicatorOver = (label: string) =>
    group.evaluate((g, text) => {
      const box = g.querySelector('.segmented-indicator')!.getBoundingClientRect();
      const item = [...g.querySelectorAll('a')].find((a) => a.textContent?.trim() === text)!.getBoundingClientRect();
      return Math.abs(box.left - item.left) < 1 && Math.abs(box.width - item.width) < 1;
    }, label);
  await expect.poll(() => indicatorOver('KO')).toBe(true);
  await group.getByText('EN', { exact: true }).click();
  await expect(page).toHaveURL(/\/en\/about\/?$/);
  if (testInfo.project.name.startsWith('390')) await page.getByRole('button', { name: 'Menu' }).click();
  const after = page.locator('[data-segmented]:visible').first();
  await expect(after.locator('a[aria-current="true"]')).toHaveText('EN');
  await expect.poll(() => after.evaluate((g) => {
    const box = g.querySelector('.segmented-indicator')!.getBoundingClientRect();
    const item = g.querySelector('a[aria-current="true"]')!.getBoundingClientRect();
    return Math.abs(box.left - item.left) < 1;
  })).toBe(true);
});

test('the result view switch slides its indicator under the chosen view', async ({ page }) => {
  await page.goto('/en/tools/json-formatter/');
  await page.getByRole('button', { name: 'Load example' }).click();
  const toggle = page.locator('[data-jf-panel-toggle]');
  if (await toggle.isVisible()) await toggle.click();
  const group = page.locator('.jf-views');
  await group.getByRole('button', { name: 'Text', exact: true }).click();
  await expect.poll(() => group.evaluate((g) => {
    const box = g.querySelector('.segmented-indicator')!.getBoundingClientRect();
    const item = g.querySelector('[aria-pressed="true"]')!.getBoundingClientRect();
    return Math.abs(box.left - item.left) < 1 && Math.abs(box.width - item.width) < 1;
  })).toBe(true);
});
