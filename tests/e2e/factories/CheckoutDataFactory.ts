/**
 * Data Factory for generating test data
 * Ensures no hardcoded values and supports variations
 */

export interface CheckoutItem {
  sku: string;
  quantity: number;
  price: number;
  name: string;
}

export interface ShippingAddress {
  city: string;
  state: string;
  zip: string;
  street: string;
  country: string;
}

export interface PaymentDetails {
  method: 'credit_card' | 'debit_card' | 'pix';
  cardNumber: string;
  expiry: string;
  cvc: string;
  cardholderName: string;
}

export interface CheckoutRequest {
  userId: string;
  items: CheckoutItem[];
  couponCode?: string;
  shippingAddress: ShippingAddress;
  paymentDetails: PaymentDetails;
}

export class CheckoutDataFactory {
  /**
   * Generate random order ID
   */
  static generateOrderId(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `ORD_${timestamp}_${random}`;
  }

  /**
   * Generate random user ID
   */
  static generateUserId(): string {
    return `user_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate valid credit card details (Test)
   * Uses Stripe test card numbers
   */
  static generateValidCreditCard(): PaymentDetails {
    return {
      method: 'credit_card',
      cardNumber: '4242424242424242', // Stripe test card
      expiry: '12/26',
      cvc: '123',
      cardholderName: 'Test User',
    };
  }

  /**
   * Generate invalid credit card (for negative testing)
   */
  static generateInvalidCreditCard(): PaymentDetails {
    return {
      method: 'credit_card',
      cardNumber: '4000000000000002', // Stripe declined card
      expiry: '12/26',
      cvc: '123',
      cardholderName: 'Test User',
    };
  }

  /**
   * Generate expired credit card (for negative testing)
   */
  static generateExpiredCreditCard(): PaymentDetails {
    return {
      method: 'credit_card',
      cardNumber: '4242424242424242',
      expiry: '01/20', // Expired date
      cvc: '123',
      cardholderName: 'Test User',
    };
  }

  /**
   * Generate valid shipping address
   */
  static generateShippingAddress(): ShippingAddress {
    const cities = ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Curitiba'];
    const states = ['SP', 'RJ', 'MG', 'PR'];
    const index = Math.floor(Math.random() * cities.length);

    return {
      city: cities[index],
      state: states[index],
      zip: `${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
      street: `Rua Test ${Math.floor(Math.random() * 1000)}`,
      country: 'BR',
    };
  }

  /**
   * Generate checkout items
   */
  static generateCheckoutItems(quantity: number = 1): CheckoutItem[] {
    const items: CheckoutItem[] = [];
    const products = [
      { sku: 'ITEM001', name: 'Laptop Pro', price: 1500.00 },
      { sku: 'ITEM002', name: 'Wireless Mouse', price: 45.99 },
      { sku: 'ITEM003', name: 'USB-C Cable', price: 15.99 },
      { sku: 'ITEM004', name: 'Monitor 4K', price: 799.99 },
      { sku: 'ITEM005', name: 'Keyboard Mechanical', price: 250.00 },
    ];

    for (let i = 0; i < quantity; i++) {
      const product = products[Math.floor(Math.random() * products.length)];
      items.push({
        ...product,
        quantity: Math.floor(Math.random() * 3) + 1, // 1-3 units
      });
    }

    return items;
  }

  /**
   * Generate valid coupon code
   */
  static generateValidCoupon(): string {
    return 'SUMMER20'; // 20% discount
  }

  /**
   * Generate invalid coupon code
   */
  static generateInvalidCoupon(): string {
    return `INVALID_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }

  /**
   * Generate expired coupon code
   */
  static generateExpiredCoupon(): string {
    return 'EXPIRED2020';
  }

  /**
   * Generate complete checkout request
   */
  static generateCheckoutRequest(options?: Partial<CheckoutRequest>): CheckoutRequest {
    return {
      userId: this.generateUserId(),
      items: this.generateCheckoutItems(1),
      shippingAddress: this.generateShippingAddress(),
      paymentDetails: this.generateValidCreditCard(),
      ...options,
    };
  }

  /**
   * Generate checkout request with specific items
   */
  static generateCheckoutRequestWithItems(
    items: CheckoutItem[],
    options?: Partial<CheckoutRequest>
  ): CheckoutRequest {
    return {
      userId: this.generateUserId(),
      items,
      shippingAddress: this.generateShippingAddress(),
      paymentDetails: this.generateValidCreditCard(),
      ...options,
    };
  }

  /**
   * Generate bulk checkout requests for stress testing
   */
  static generateBulkCheckoutRequests(count: number): CheckoutRequest[] {
    return Array.from({ length: count }, () => this.generateCheckoutRequest());
  }

  /**
   * Calculate expected total for items
   */
  static calculateTotal(items: CheckoutItem[], discountPercent: number = 0): number {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discount = (subtotal * discountPercent) / 100;
    const tax = (subtotal - discount) * 0.15; // 15% tax
    const shipping = subtotal > 100 ? 0 : 10; // Free shipping over 100
    
    return subtotal - discount + tax + shipping;
  }
}
