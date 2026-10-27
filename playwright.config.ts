import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';
const installedChrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const chrome = process.env['CHROME_PATH'] ?? (existsSync(installedChrome) ? installedChrome : undefined);

export default defineConfig({
  testDir: './tests', fullyParallel: false, workers: 1, timeout: 30000,
  reporter: [['list'], ['json', { outputFile: '../网站示意图/.omo/evidence/e2e-results.json' }]],
  use: {
    baseURL: 'http://127.0.0.1:4174', viewport: { width: 390, height: 844 },
    headless: true, trace: 'retain-on-failure',
    launchOptions: chrome ? { executablePath: chrome } : { channel: 'chrome' },
  },
  webServer: [
    { command: 'npm run dev -- --port 4174 --strictPort', url: 'http://127.0.0.1:4174', reuseExistingServer: false, env: { VITE_CANONICAL_URL: '' } },
    { command: 'npm run dev -- --port 4175 --strictPort', url: 'http://127.0.0.1:4175', reuseExistingServer: false, env: { VITE_CANONICAL_URL: 'https://birthday.example/gift/?wish=must-be-removed#memory' } },
  ],
});
