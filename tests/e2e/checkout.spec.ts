import { test, expect } from '@playwright/test';

test.describe('Checkout E2E Tests', () => {
  test('should show insufficient balance error on checkout', async ({ page }) => {
    // Navigate to checkout page
    await page.goto('/checkout');

    // Intercept API call and mock error response
    await page.route('**/api/checkout**', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Saldo Insuficiente' }),
      });
    });

    // Fill email and amount fields
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="amount"]', '100');

    // Click finalize purchase button
    await page.click('[data-testid="finalize-purchase"]');

    // Validate error message appears in UI
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Saldo Insuficiente');
  });
});