import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: 'wall-art-preview.spec.ts',
  timeout: 45000,
  workers: 1,
  reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:5173', headless: true },
  projects: [{ name: 'chrome', use: { ...devices['Desktop Chrome'], channel: 'chrome' } }],
  webServer: { command: 'npm run dev -- --port 5173', url: 'http://127.0.0.1:5173', reuseExistingServer: true, timeout: 30000 },
});
