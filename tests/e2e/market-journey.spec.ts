import { test, expect } from '@playwright/test';

const featured = {
  id: 'asset-1', title: 'Fixture Prompt', slug: 'fixture-prompt', category: 'Prompt',
  creator: 'Fixture Labs', creatorPublicKey: 'GABC', rating: '5.0', price: '10 Credits',
  priceValue: 10, currency: 'CR', tag: 'PROMPT', gradient: '', description: 'Deterministic prompt', imageUrl: '', executions: 3,
};

test('browse, search, and reach the deterministic asset journey', async ({ page }) => {
  await page.route('**/api/marketplace/featured**', (route) => route.fulfill({ json: { data: [featured] } }));
  await page.route('**/api/marketplace/trending**', (route) => route.fulfill({ json: { data: [featured] } }));
  await page.route('**/api/marketplace/categories', (route) => route.fulfill({ json: { data: [{ label: 'Prompts', icon: 'terminal', type: 'PROMPT' }] } }));
  await page.route('**/api/marketplace/assets**', (route) => route.fulfill({ json: { data: { items: [featured], total: 1 } } }));

  await page.goto('/marketplace');
  await expect(page.getByText('Fixture Prompt').first()).toBeVisible();
  await page.getByPlaceholder(/Search agents/).fill('fixture');
  await expect(page.getByText('Fixture Prompt').first()).toBeVisible();
});

test('market API failure shows an error without demo data', async ({ page }) => {
  await page.route('**/api/marketplace/**', (route) => route.fulfill({ status: 503, body: 'staging unavailable' }));

  await page.goto('/marketplace');
  await expect(page.locator('p[role="alert"]')).toHaveText('Unable to load marketplace data.');
  await expect(page.getByText('Nova-7 Strategist')).not.toBeVisible();
});
