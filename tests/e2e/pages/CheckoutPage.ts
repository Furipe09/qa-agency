import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object for Checkout Flow
 * Encapsulates all checkout-related interactions
 */
export class CheckoutPage extends BasePage {
  // Selectors
  private readonly checkoutButton = 'button[data-testid="checkout-btn"]';
  private readonly itemsContainer = '[data-testid="items-container"]';
  private readonly cartTotal = '[data-testid="cart-total"]';
  private readonly couponInput = 'input[data-testid="coupon-code"]';
  private readonly applyCouponBtn = 'button[data-testid="apply-coupon"]';
  private readonly proceedPaymentBtn = 'button[data-testid="proceed-payment"]';
  private readonly paymentMethod = 'select[data-testid="payment-method"]';
  private readonly cardNumber = 'input[data-testid="card-number"]';
  private readonly cardExpiry = 'input[data-testid="card-expiry"]';
  private readonly cardCVC = 'input[data-testid="card-cvc"]';
  private readonly submitPaymentBtn = 'button[data-testid="submit-payment"]';
  private readonly successMessage = '[data-testid="success-message"]';
  private readonly errorMessage = '[data-testid="error-message"]';
  private readonly orderId = '[data-testid="order-id"]';
  private readonly loadingSpinner = '[data-testid="loading"]';
  private readonly retryButton = 'button[data-testid="retry-btn"]';

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to checkout page
   */
  async navigateToCheckout() {
    await this.goto('/checkout');
    await this.waitForElement(this.checkoutButton);
  }

  /**
   * Retrieve cart items with resilient waiting
   */
  async getCartItems() {
    await this.waitForElement(this.itemsContainer);
    return this.page.locator(this.itemsContainer).count();
  }

  /**
   * Get current cart total
   */
  async getCartTotal(): Promise<string> {
    return this.getText(this.cartTotal);
  }

  /**
   * Apply coupon code
   */
  async applyCoupon(couponCode: string) {
    await this.fill(this.couponInput, couponCode);
    await this.click(this.applyCouponBtn);
    
    // Wait for total to update after coupon application
    const previousTotal = await this.getCartTotal();
    await this.page.waitForTimeout(500); // Small wait for UI update
    
    return this.getCartTotal();
  }

  /**
   * Select payment method and fill card details
   */
  async fillPaymentDetails(paymentDetails: {
    method: string;
    cardNumber: string;
    expiry: string;
    cvc: string;
  }) {
    // Select payment method
    await this.page.selectOption(this.paymentMethod, paymentDetails.method);
    
    // Fill card details
    await this.fill(this.cardNumber, paymentDetails.cardNumber);
    await this.fill(this.cardExpiry, paymentDetails.expiry);
    await this.fill(this.cardCVC, paymentDetails.cvc);
  }

  /**
   * Proceed to payment stage
   */
  async proceedToPayment() {
    await this.click(this.proceedPaymentBtn);
    // Wait for payment form to be visible
    await this.waitForElement(this.paymentMethod);
  }

  /**
   * Submit payment with explicit waiting for response
   */
  async submitPayment() {
    const response = await this.waitForResponse(/\/api\/checkout/, async () => {
      await this.click(this.submitPaymentBtn);
    });
    
    return response;
  }

  /**
   * Get success message after checkout
   */
  async getSuccessMessage(): Promise<string> {
    await this.waitForElement(this.successMessage);
    return this.getText(this.successMessage);
  }

  /**
   * Get error message if checkout fails
   */
  async getErrorMessage(): Promise<string> {
    await this.waitForElement(this.errorMessage);
    return this.getText(this.errorMessage);
  }

  /**
   * Get order ID from success page
   */
  async getOrderId(): Promise<string> {
    await this.waitForElement(this.orderId);
    return this.getText(this.orderId);
  }

  /**
   * Check if loading spinner is visible
   */
  async isLoading(): Promise<boolean> {
    return this.isVisible(this.loadingSpinner);
  }

  /**
   * Wait for loading to complete
   */
  async waitForLoadingComplete() {
    try {
      await this.page.waitForSelector(this.loadingSpinner, { timeout: 2000 });
      // If spinner appears, wait for it to disappear
      await this.page.waitForSelector(this.loadingSpinner, { state: 'hidden', timeout: 30000 });
    } catch {
      // Spinner might not appear, which is fine
    }
  }

  /**
   * Click retry button after failure
   */
  async clickRetry() {
    await this.click(this.retryButton);
    await this.waitForLoadingComplete();
  }

  /**
   * Complete full checkout flow
   */
  async completeCheckout(paymentDetails: {
    method: string;
    cardNumber: string;
    expiry: string;
    cvc: string;
    coupon?: string;
  }) {
    // Navigate to checkout
    await this.navigateToCheckout();

    // Apply coupon if provided
    if (paymentDetails.coupon) {
      await this.applyCoupon(paymentDetails.coupon);
    }

    // Proceed to payment
    await this.proceedToPayment();

    // Fill payment details
    await this.fillPaymentDetails(paymentDetails);

    // Submit payment
    await this.submitPayment();

    // Wait for completion
    await this.waitForLoadingComplete();

    // Verify success
    const success = await this.isVisible(this.successMessage);
    if (!success) {
      const error = await this.getErrorMessage();
      throw new Error(`Checkout failed: ${error}`);
    }

    return {
      orderId: await this.getOrderId(),
      message: await this.getSuccessMessage(),
    };
  }
}
