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
