/**
 * Money formatting utilities for Shopify storefront
 */

/**
 * Format a price as a currency string
 * @param {Object|number|string} priceOrAmount - Price object from Shopify or amount as number/string
 * @param {string} [currencyCode] - Currency code (required if amount is number/string)
 * @param {string} [locale] - Locale to use for formatting
 * @returns {string} Formatted price
 */
export function formatMoney(priceOrAmount, currencyCode, locale = 'en-US') {
    let amount, currency;

    if (typeof priceOrAmount === 'object' && priceOrAmount !== null) {
        // Handle Shopify price object
        amount = priceOrAmount.amount;
        currency = priceOrAmount.currencyCode;
    } else {
        // Handle raw amount
        amount = priceOrAmount;
        currency = currencyCode;
    }

    if (!amount || !currency) {
        return '';
    }

    // Convert string to number if needed
    if (typeof amount === 'string') {
        amount = parseFloat(amount);
    }

    try {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    } catch (error) {
        console.error('Error formatting money:', error);
        return `${currency} ${amount}`;
    }
}

/**
 * Format a price without trailing zeros
 * @param {Object|number|string} priceOrAmount - Price object from Shopify or amount as number/string
 * @param {string} [currencyCode] - Currency code (required if amount is number/string)
 * @param {string} [locale] - Locale to use for formatting
 * @returns {string} Formatted price without trailing zeros
 */
export function formatMoneyWithoutTrailingZeros(priceOrAmount, currencyCode, locale = 'en-US') {
    const formatted = formatMoney(priceOrAmount, currencyCode, locale);

    // Remove trailing zeros
    return formatted.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
}

/**
 * Convert cents to dollars
 * @param {number|string} cents - Amount in cents
 * @returns {number} Amount in dollars
 */
export function centsToAmount(cents) {
    if (!cents) return 0;
    return typeof cents === 'string' ? parseFloat(cents) / 100 : cents / 100;
}

/**
 * Convert dollars to cents
 * @param {number|string} amount - Amount in dollars
 * @returns {number} Amount in cents
 */
export function amountToCents(amount) {
    if (!amount) return 0;
    return typeof amount === 'string' ? Math.round(parseFloat(amount) * 100) : Math.round(amount * 100);
}

/**
 * Calculate the discount percentage between original and discounted price
 * @param {Object|number} originalPrice - Original price object or amount
 * @param {Object|number} discountedPrice - Discounted price object or amount
 * @returns {number} Discount percentage
 */
export function calculateDiscountPercentage(originalPrice, discountedPrice) {
    let originalAmount, discountedAmount;

    if (typeof originalPrice === 'object' && originalPrice !== null) {
        originalAmount = parseFloat(originalPrice.amount);
    } else {
        originalAmount = parseFloat(originalPrice);
    }

    if (typeof discountedPrice === 'object' && discountedPrice !== null) {
        discountedAmount = parseFloat(discountedPrice.amount);
    } else {
        discountedAmount = parseFloat(discountedPrice);
    }

    if (!originalAmount || !discountedAmount || originalAmount <= discountedAmount) {
        return 0;
    }

    return Math.round(((originalAmount - discountedAmount) / originalAmount) * 100);
}

/**
 * Check if a product has a discount
 * @param {Object} price - Product price object
 * @param {Object} compareAtPrice - Product compareAtPrice object
 * @returns {boolean} Whether the product has a discount
 */
export function isDiscounted(price, compareAtPrice) {
    if (!price || !compareAtPrice) return false;

    const priceAmount = parseFloat(price.amount);
    const compareAtPriceAmount = parseFloat(compareAtPrice.amount);

    return compareAtPriceAmount > priceAmount;
}