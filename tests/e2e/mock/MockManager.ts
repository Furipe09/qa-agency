import { Page, expect } from '@playwright/test';

/**
 * API Mock Manager for Playwright
 * Intercepts and mocks API responses to simulate various scenarios
 */
export class MockManager {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Mock successful checkout response
   */
  async mockCheckoutSuccess(orderId: string, total: number) {
    await this.page.route('**/api/checkout', (route) => {
      route.abort('blockedbyclient');
    });

    // Intercept and respond
    await this.page.route('**/api/checkout', (route) => {
      route.continue();
    });

    // Mock response with waitForResponse pattern
    return this.page.on('response', (response) => {
      if (response.url().includes('/api/checkout')) {
        response.status();
      }
    });
  }

  /**
   * Mock checkout failure (payment declined)
   */
  async mockCheckoutFailure(errorMessage: string = 'Payment declined') {
    await this.page.route('**/api/checkout', (route) => {
      route.abort('failed');
    });
  }

  /**
   * Mock timeout scenario (30s+)
   */
  async mockCheckoutTimeout() {
    await this.page.route('**/api/checkout', (route) => {
      route.abort('timedout');
    });
  }

  /**
   * Mock DynamoDB unavailable (500 error)
   */
  async mockDynamoDBError(statusCode: number = 500) {
    await this.page.route('**/api/checkout', (route) => {
      route.abort('failed');
    });
  }

  /**
   * Mock coupon validation success
   */
  async mockValidateCoupon(couponCode: string, discountPercent: number) {
    await this.page.route('**/api/validate-coupon', (route) => {
      const request = route.request();
      const postData = request.postDataJSON();

      if (postData.coupon === couponCode) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            valid: true,
            discount: discountPercent,
            message: `Coupon applied: ${discountPercent}% off`,
          }),
        });
      } else {
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            valid: false,
            error: 'Invalid coupon code',
          }),
        });
      }
    });
  }

  /**
   * Mock inventory check
   */
  async mockInventoryCheck(itemsInStock: Record<string, boolean>) {
    await this.page.route('**/api/inventory', (route) => {
      const request = route.request();
      const postData = request.postDataJSON();

      const sku = postData.sku;
      const inStock = itemsInStock[sku] !== false;

      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          sku,
          inStock,
          quantity: inStock ? Math.floor(Math.random() * 100) : 0,
        }),
      });
    });
  }

  /**
   * Mock payment gateway (Stripe/similar)
   */
  async mockPaymentGateway(declineCard?: string) {
    await this.page.route('**/api/payment', (route) => {
      const request = route.request();
      const postData = request.postDataJSON();
      const cardNumber = postData.cardNumber;

      if (declineCard && cardNumber === declineCard) {
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Card declined',
            code: 'CARD_DECLINED',
          }),
        });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            transactionId: `TXN_${Date.now()}`,
            message: 'Payment processed successfully',
          }),
        });
      }
    });
  }

  /**
   * Mock shipping calculation
   */
  async mockShippingCalculation() {
    await this.page.route('**/api/shipping', (route) => {
      const request = route.request();
      const postData = request.postDataJSON();

      const zip = postData.zip;
      const totalCost = postData.cartTotal;

      // Free shipping for orders > 100
      const shippingCost = totalCost > 100 ? 0 : 10;

      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          shippingCost,
          estimatedDays: 3,
          method: 'Express',
          zip,
        }),
      });
    });
  }

  /**
   * Mock order creation in DynamoDB
   */
  async mockOrderCreation() {
    await this.page.route('**/api/orders', (route) => {
      const request = route.request();
      if (request.method() === 'POST') {
        const postData = request.postDataJSON();

        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            orderId: `ORD_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            status: 'CREATED',
            userId: postData.userId,
            totalAmount: postData.total,
            createdAt: new Date().toISOString(),
          }),
        });
      } else {
        route.continue();
      }
    });
  }

  /**
   * Mock all checkout-related APIs
   */
  async mockCompleteCheckoutFlow(options?: {
    declineCard?: string;
    inventoryStatus?: Record<string, boolean>;
    validCoupons?: string[];
  }) {
    // Mock all necessary endpoints
    await this.mockOrderCreation();
    await this.mockPaymentGateway(options?.declineCard);
    await this.mockShippingCalculation();
    await this.mockInventoryCheck(options?.inventoryStatus || {});
  }

  /**
   * Intercept and log all network requests
   * Useful for debugging and test monitoring
   */
  async logNetworkRequests() {
    this.page.on('request', (request) => {
      console.log('>> Request:', request.method(), request.url());
    });

    this.page.on('response', (response) => {
      console.log('<<', response.status(), response.url());
    });
  }

  /**
   * Mock network error for resilience testing
   */
  async mockNetworkError(urlPattern: string | RegExp) {
    await this.page.route(urlPattern, (route) => {
      route.abort('failed');
    });
  }

  /**
   * Mock slow network response
   */
  async mockSlowResponse(urlPattern: string | RegExp, delayMs: number = 5000) {
    await this.page.route(urlPattern, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      await route.continue();
    });
  }

  /**
   * Clear all mocks
   */
  async clearMocks() {
    await this.page.unroute('**/*');
  }
}
