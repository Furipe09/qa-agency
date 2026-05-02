import { test as base, expect } from '@playwright/test';
import { CheckoutPage } from './pages/CheckoutPage';
import { MockManager } from './mock/MockManager';

/**
 * Extended test fixture providing reusable page objects and mocks
 * Simplifies test setup and reduces boilerplate
 */
export const test = base.extend<{
  checkoutPage: CheckoutPage;
  mockManager: MockManager;
}>({
  checkoutPage: async ({ page }, use) => {
    const checkoutPage = new CheckoutPage(page);
    await use(checkoutPage);
  },

  mockManager: async ({ page }, use) => {
    const mockManager = new MockManager(page);
    await use(mockManager);
    // Cleanup
    await mockManager.clearMocks();
  },
});

export { expect };
