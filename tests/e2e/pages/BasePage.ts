import { Page, expect } from '@playwright/test';

/**
 * Base class for all Page Objects
 * Centralizes common interactions and wait strategies
 */
export class BasePage {
  constructor(protected page: Page) {}

  /**
   * Dynamic wait for element - no hardcoded sleeps
   * @param selector - CSS selector for element
   * @param timeout - max wait time in ms (default: 30s)
   */
  async waitForElement(selector: string, timeout = 30000) {
    await this.page.waitForSelector(selector, { timeout });
  }

  /**
   * Click element with resilience - waits for visible state
   */
  async click(selector: string) {
    await this.page.click(selector, { timeout: 30000 });
  }

  /**
   * Fill input with validation
   */
  async fill(selector: string, value: string) {
    await this.page.fill(selector, value);
    // Validate that value was entered
    const inputValue = await this.page.inputValue(selector);
    if (inputValue !== value) {
      throw new Error(`Failed to fill ${selector} with ${value}`);
    }
  }

  /**
   * Get element text content
   */
  async getText(selector: string): Promise<string> {
    await this.waitForElement(selector);
    return this.page.textContent(selector) || '';
  }

  /**
   * Verify element is visible on page
   */
  async isVisible(selector: string): Promise<boolean> {
    return this.page.isVisible(selector);
  }

  /**
   * Navigate to URL
   */
  async goto(path: string) {
    await this.page.goto(path, { waitUntil: 'networkidle' });
  }

  /**
   * Wait for API response with specific pattern
   */
  async waitForResponse(urlPattern: string | RegExp, action: () => Promise<void>) {
    const responsePromise = this.page.waitForResponse(
      response => {
        const url = response.url();
        return typeof urlPattern === 'string' 
          ? url.includes(urlPattern) 
          : urlPattern.test(url);
      },
      { timeout: 30000 }
    );
    
    await action();
    return responsePromise;
  }

  /**
   * Get current URL
   */
  async getCurrentUrl(): Promise<string> {
    return this.page.url();
  }
}
