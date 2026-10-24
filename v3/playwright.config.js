import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 90000,
  expect: { timeout: 12000 },
  use: { baseURL: 'http://127.0.0.1:5187', browserName: 'chromium', viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' },
  webServer: { command: 'node ./node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5187 --strictPort', url: 'http://127.0.0.1:5187', reuseExistingServer: !process.env.CI, timeout: 30000 },
});
