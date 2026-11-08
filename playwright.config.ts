import { defineConfig } from '@playwright/test';

// Design QA matrix (DESIGN.md §7, docs/design/quality-gates.md): four widths × two color schemes.
// Uses the installed Google Chrome (channel) so no browser download is needed.
const widths = [320, 390, 768, 1280] as const;
const schemes = ['light', 'dark'] as const;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  snapshotPathTemplate: '{testDir}/__screenshots__/{projectName}/{arg}{ext}',
  use: {
    baseURL: 'http://localhost:4322',
    channel: 'chrome',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npx astro preview --port 4322 --ignore-lock',
    url: 'http://localhost:4322',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  projects: widths.flatMap((width) =>
    schemes.map((scheme) => ({
      name: `${width}-${scheme}`,
      use: {
        viewport: { width, height: width < 768 ? 844 : 900 },
        colorScheme: scheme,
        isMobile: width < 768,
        hasTouch: width < 768,
      },
    })),
  ),
});
