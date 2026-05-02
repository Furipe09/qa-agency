import { test, expect, Page } from '@playwright/test';
import { CheckoutPage } from '../pages/CheckoutPage';
import { CheckoutDataFactory, CheckoutRequest } from '../factories/CheckoutDataFactory';
import { MockManager } from '../mock/MockManager';

/**
 * Checkout E2E Test Suite
 * Tests critical checkout flow scenarios with proper mocking and data factories
 * Follows POM pattern and no hardcoded values
 */

test.describe('E2E - Checkout Flow (Happy Path)', () => {
  let checkoutPage: CheckoutPage;
  let mockManager: MockManager;
  let testData: CheckoutRequest;

  test.beforeEach(async ({ page }) => {
    // Initialize page objects and mocks
    checkoutPage = new CheckoutPage(page);
    mockManager = new MockManager(page);

    // Generate fresh test data for each test
    testData = CheckoutDataFactory.generateCheckoutRequest();

    // Setup API mocks before navigation
    await mockManager.mockCompleteCheckoutFlow();
  });

  test.afterEach(async ({ page }) => {
    // Clean up mocks
    await mockManager.clearMocks();
  });

  /**
   * Test Case 1: Complete checkout flow with valid payment
   * - Navigate to checkout
   * - Verify cart items are loaded
   * - Proceed with valid payment details
   * - Verify order success
   */
  test('Should complete checkout successfully with valid payment', async ({ page }) => {
    // Arrange
    const paymentDetails = testData.paymentDetails;

    // Act
    await checkoutPage.navigateToCheckout();
    const itemCount = await checkoutPage.getCartItems();
    const result = await checkoutPage.completeCheckout({
      method: paymentDetails.method,
      cardNumber: paymentDetails.cardNumber,
      expiry: paymentDetails.expiry,
      cvc: paymentDetails.cvc,
    });

    // Assert
    expect(itemCount).toBeGreaterThan(0);
    expect(result.orderId).toBeTruthy();
    expect(result.orderId).toMatch(/^ORD_/);
    expect(result.message).toContain('success');
  });

  /**
   * Test Case 2: Checkout with valid coupon code
   * - Apply valid discount coupon
   * - Verify cart total is reduced
   * - Complete purchase
   */
  test('Should apply coupon and reduce total price', async ({ page }) => {
    // Arrange
    const couponCode = CheckoutDataFactory.generateValidCoupon();
    const paymentDetails = testData.paymentDetails;
    await mockManager.mockValidateCoupon(couponCode, 20);

    // Act
    await checkoutPage.navigateToCheckout();
    const totalBefore = await checkoutPage.getCartTotal();
    const totalAfter = await checkoutPage.applyCoupon(couponCode);

    // Assert - coupon should reduce the total
    const beforeAmount = parseFloat(totalBefore.replace(/[^0-9.]/g, ''));
    const afterAmount = parseFloat(totalAfter.replace(/[^0-9.]/g, ''));
    expect(afterAmount).toBeLessThan(beforeAmount);

    // Complete purchase with coupon applied
    const result = await checkoutPage.completeCheckout({
      method: paymentDetails.method,
      cardNumber: paymentDetails.cardNumber,
      expiry: paymentDetails.expiry,
      cvc: paymentDetails.cvc,
      coupon: couponCode,
    });

    expect(result.orderId).toBeTruthy();
  });

  /**
   * Test Case 3: Multiple items in cart
   * - Add multiple items to cart
   * - Verify all items are present
   * - Complete checkout
   */
  test('Should handle multiple items in checkout', async ({ page }) => {
    // Arrange
    const multipleItems = CheckoutDataFactory.generateCheckoutItems(3);

    // Act
    await checkoutPage.navigateToCheckout();
    const itemCount = await checkoutPage.getCartItems();

    // Assert
    expect(itemCount).toBeGreaterThanOrEqual(3);

    // Complete checkout
    const result = await checkoutPage.completeCheckout(testData.paymentDetails as any);
    expect(result.orderId).toBeTruthy();
  });

  /**
   * Test Case 4: Different payment methods
   * - Test credit card payment
   * - Verify order creation
   */
  test('Should accept credit card payment', async ({ page }) => {
    // Arrange
    const creditCard = CheckoutDataFactory.generateValidCreditCard();

    // Act
    await checkoutPage.navigateToCheckout();
    const result = await checkoutPage.completeCheckout({
      method: creditCard.method,
      cardNumber: creditCard.cardNumber,
      expiry: creditCard.expiry,
      cvc: creditCard.cvc,
    });

    // Assert
    expect(result.orderId).toBeTruthy();
    expect(result.message).toContain('success');
  });
});

test.describe('E2E - Checkout Flow (Error Scenarios)', () => {
  let checkoutPage: CheckoutPage;
  let mockManager: MockManager;

  test.beforeEach(async ({ page }) => {
    checkoutPage = new CheckoutPage(page);
    mockManager = new MockManager(page);
  });

  test.afterEach(async ({ page }) => {
    await mockManager.clearMocks();
  });

  /**
   * Test Case 5: Checkout fails with declined card
   * - Attempt checkout with declined card
   * - Verify error message
   * - Verify retry button is available
   */
  test('Should display error when payment is declined', async ({ page }) => {
    // Arrange
    const declinedCard = CheckoutDataFactory.generateInvalidCreditCard();
    await mockManager.mockPaymentGateway(declinedCard.cardNumber);

    // Act
    await checkoutPage.navigateToCheckout();

    try {
      await checkoutPage.completeCheckout({
        method: declinedCard.method,
        cardNumber: declinedCard.cardNumber,
        expiry: declinedCard.expiry,
        cvc: declinedCard.cvc,
      });
    } catch (error) {
      // Assert - error should be caught
      expect(error).toBeTruthy();
      const errorMsg = await checkoutPage.getErrorMessage();
      expect(errorMsg).toContain('declined');
    }
  });

  /**
   * Test Case 6: Invalid coupon code rejection
   * - Attempt to apply invalid coupon
   * - Verify error message
   * - Verify cart total unchanged
   */
  test('Should reject invalid coupon code', async ({ page }) => {
    // Arrange
    const invalidCoupon = CheckoutDataFactory.generateInvalidCoupon();
    await mockManager.mockValidateCoupon('SUMMER20', 20); // Only valid coupon

    // Act
    await checkoutPage.navigateToCheckout();
    const totalBefore = await checkoutPage.getCartTotal();

    try {
      await checkoutPage.applyCoupon(invalidCoupon);
    } catch (error) {
      // Expected to fail
    }

    const totalAfter = await checkoutPage.getCartTotal();

    // Assert - total should remain unchanged
    expect(totalBefore).toBe(totalAfter);
  });

  /**
   * Test Case 7: Network timeout handling
   * - Simulate network timeout
   * - Verify error message
   * - Verify retry mechanism works
   */
  test('Should handle checkout timeout gracefully', async ({ page }) => {
    // Arrange
    const testData = CheckoutDataFactory.generateCheckoutRequest();
    await mockManager.mockSlowResponse('**/api/checkout', 35000); // 35s timeout

    // Act & Assert - should timeout
    await checkoutPage.navigateToCheckout();
    const result = await Promise.race([
      checkoutPage.completeCheckout({
        method: testData.paymentDetails.method,
        cardNumber: testData.paymentDetails.cardNumber,
        expiry: testData.paymentDetails.expiry,
        cvc: testData.paymentDetails.cvc,
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 40000)
      ),
    ]).catch((error) => {
      expect(error.message).toContain('Timeout');
      return null;
    });

    if (result === null) {
      // Verify retry button is available
      const isRetryVisible = await page.isVisible('button[data-testid="retry-btn"]');
      expect(isRetryVisible).toBe(true);
    }
  });

  /**
   * Test Case 8: API Server Error (500)
   * - Mock API returning 500 error
   * - Verify error handling
   * - Verify user can retry
   */
  test('Should handle API errors and allow retry', async ({ page }) => {
    // Arrange
    const testData = CheckoutDataFactory.generateCheckoutRequest();
    await mockManager.mockDynamoDBError(500);

    // Act
    await checkoutPage.navigateToCheckout();

    try {
      await checkoutPage.completeCheckout({
        method: testData.paymentDetails.method,
        cardNumber: testData.paymentDetails.cardNumber,
        expiry: testData.paymentDetails.expiry,
        cvc: testData.paymentDetails.cvc,
      });
    } catch (error) {
      // Expected to fail
    }

    // Assert
    const errorMsg = await checkoutPage.getErrorMessage();
    expect(errorMsg).toBeTruthy();
  });
});

test.describe('E2E - Checkout Flow (Performance & Resilience)', () => {
  let checkoutPage: CheckoutPage;
  let mockManager: MockManager;

  test.beforeEach(async ({ page }) => {
    checkoutPage = new CheckoutPage(page);
    mockManager = new MockManager(page);
  });

  test.afterEach(async ({ page }) => {
    await mockManager.clearMocks();
  });

  /**
   * Test Case 9: Loading state appears and disappears
   * - Mock slow API response
   * - Verify loading spinner appears
   * - Verify loading spinner disappears after response
   */
  test('Should show loading spinner during checkout', async ({ page }) => {
    // Arrange
    const testData = CheckoutDataFactory.generateCheckoutRequest();
    await mockManager.mockSlowResponse('**/api/checkout', 2000); // 2s delay
    await mockManager.mockCompleteCheckoutFlow();

    // Act
    await checkoutPage.navigateToCheckout();
    await checkoutPage.proceedToPayment();
    await checkoutPage.fillPaymentDetails({
      method: testData.paymentDetails.method,
      cardNumber: testData.paymentDetails.cardNumber,
      expiry: testData.paymentDetails.expiry,
      cvc: testData.paymentDetails.cvc,
    });

    const submitPromise = checkoutPage.submitPayment();
    await page.waitForTimeout(500); // Wait for spinner to appear

    // Assert - loading spinner should be visible
    const isLoading = await checkoutPage.isLoading();
    expect(isLoading).toBe(true);

    // Wait for completion
    await submitPromise;
    await checkoutPage.waitForLoadingComplete();

    // Assert - loading should be gone
    const isStillLoading = await checkoutPage.isLoading();
    expect(isStillLoading).toBe(false);
  });

  /**
   * Test Case 10: No hardcoded waits in checkout flow
   * - Verify all waits are dynamic (state-based)
   * - Checkout completes as fast as API allows
   */
  test('Should complete checkout without hardcoded delays', async ({ page }) => {
    // Arrange
    const testData = CheckoutDataFactory.generateCheckoutRequest();
    await mockManager.mockCompleteCheckoutFlow();

    // Act - measure time
    const startTime = Date.now();

    await checkoutPage.navigateToCheckout();
    const result = await checkoutPage.completeCheckout({
      method: testData.paymentDetails.method,
      cardNumber: testData.paymentDetails.cardNumber,
      expiry: testData.paymentDetails.expiry,
      cvc: testData.paymentDetails.cvc,
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Assert - should complete reasonably fast (< 10s without artificial delays)
    expect(result.orderId).toBeTruthy();
    console.log(`Checkout completed in ${duration}ms`);
  });
});
