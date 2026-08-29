import { test, expect } from '@playwright/test';

test.skip(!process.env.BASE_URL, 'Staging smoke requires BASE_URL and a Freighter-enabled browser environment');

test('@staging connects Freighter on the live asset purchase page', async ({ page }) => {
  const assetId = process.env.STAGING_ASSET_ID ?? 'staging-prompt';
  await page.goto(`/assets/${assetId}`);
  await expect(page.getByRole('button', { name: 'Connect wallet' })).toBeVisible();
  await page.getByRole('button', { name: 'Connect wallet' }).click();
  await expect(page.getByRole('button', { name: /G[A-Z0-9]+/ })).toBeVisible();
});
