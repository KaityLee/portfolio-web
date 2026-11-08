import { mkdirSync } from 'node:fs';

import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { pages } from './pages.mjs';

const SHOTS_DIR = 'shots';
const TARGET = 44; // DESIGN.md §6 --target

mkdirSync(SHOTS_DIR, { recursive: true });

for (const page of pages) {
  test.describe(page.id, () => {
    test.beforeEach(async ({ page: p }, testInfo) => {
      // The site stores the theme choice; align it with the emulated color scheme so dark runs are dark.
      const scheme = testInfo.project.name.endsWith('dark') ? 'dark' : 'light';
      await p.addInitScript((value) => {
        try {
          localStorage.setItem('theme', value);
        } catch {
          /* storage unavailable: the OS preference (emulated) applies */
        }
      }, scheme);
      await p.goto(page.path, { waitUntil: 'networkidle' });
    });

    test('no horizontal overflow', async ({ page: p }) => {
      const { scrollWidth, clientWidth } = await p.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(scrollWidth, `${page.path} overflows horizontally`).toBeLessThanOrEqual(clientWidth);
    });

    test('touch targets in chrome are at least 44px', async ({ page: p }, testInfo) => {
      test.skip(!testInfo.project.name.startsWith('3'), 'checked on phone widths only');
      const small = await p.evaluate((min) => {
        const els = document.querySelectorAll<HTMLElement>('header a, header button, footer a, .post-list a');
        return [...els]
          .filter((el) => el.offsetParent !== null)
          .map((el) => {
            const r = el.getBoundingClientRect();
            return { text: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 30), w: Math.round(r.width), h: Math.round(r.height) };
          })
          .filter((t) => t.h < min && t.text !== '');
      }, TARGET);
      expect(small, `targets under ${TARGET}px: ${JSON.stringify(small)}`).toEqual([]);
    });

    test('no serious or critical accessibility violations', async ({ page: p }) => {
      const results = await new AxeBuilder({ page: p }).withTags(['wcag2a', 'wcag2aa', 'wcag22aa']).analyze();
      const bad = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      const report = bad.map(
        (v) => `${v.id}: ${v.help} — ${v.nodes.slice(0, 4).map((n) => `${n.target.join(' ')} [${n.failureSummary?.split('\n')[1]?.trim() ?? ''}]`).join('; ')}${v.nodes.length > 4 ? ` … +${v.nodes.length - 4}` : ''}`,
      );
      expect(report).toEqual([]);
    });

    test('screenshot', async ({ page: p }, testInfo) => {
      const file = `${SHOTS_DIR}/${page.id}-${testInfo.project.name}.png`;
      await p.screenshot({ path: file, fullPage: true, animations: 'disabled' });
      if (process.env.VISUAL_BASELINE) {
        await expect(p).toHaveScreenshot(`${page.id}.png`, { fullPage: true, animations: 'disabled', maxDiffPixelRatio: 0.01 });
      }
    });
  });
}
