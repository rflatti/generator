/**
 * Updated cart store for SvelteKit Shopify storefront
 *
 * This is an update to src/lib/stores/cart.js to ensure it properly integrates
 * with the Shopify Storefront API cart functionality.
 */

import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

// Create the base cart store
export const cart = writable(null);

// Create cart drawer state
export const isCartOpen = writable(false);

// Derive helpful cart properties
export const cartQuantity = derived(cart, ($cart) => {
    if (!$cart) return 0;
    return $cart.totalQuantity || 0;
});

export const cartLines = derived(cart, ($cart) => {
    if (!$cart?.lines?.edges) return [];
    return $cart.lines.edges.map(edge => edge.node);
});

export const cartSubtotal = derived(cart, ($cart) => {
    if (!$cart?.cost?.subtotalAmount) return null;
    return $cart.cost.subtotalAmount;
});

export const cartTotal = derived(cart, ($cart) => {
    if (!$cart?.cost?.totalAmount) return null;
    return $cart.cost.totalAmount;
});

export const cartTax = derived(cart, ($cart) => {
    if (!$cart?.cost?.totalTaxAmount) return null;
    return $cart.cost.totalTaxAmount;
});

export const cartDiscounts = derived(cart, ($cart) => {
    if (!$cart?.discountCodes) return [];
    return $cart.discountCodes.filter(discount => discount.applicable);
});

export const isCartEmpty = derived(cartQuantity, ($quantity) => $quantity === 0);

/**
 * Open the cart drawer/modal
 */
export function openCart() {
    isCartOpen.set(true);

    // Add body class to prevent scrolling
    if (browser) {
        document.body.classList.add('cart-open');
    }
}

/**
 * Close the cart drawer/modal
 */
export function closeCart() {
    isCartOpen.set(false);

    // Remove body class to re-enable scrolling
    if (browser) {
        document.body.classList.remove('cart-open');
    }
}

/**
 * Toggle the cart drawer/modal
 */
export function toggleCart() {
    isCartOpen.update(value => {
        const newValue = !value;

        if (browser) {
            if (newValue) {
                document.body.classList.add('cart-open');
            } else {
                document.body.classList.remove('cart-open');
            }
        }

        return newValue;
    });
}

/**
 * Format the cart line for display
 * @param {Object} line - Cart line from Shopify
 * @returns {Object} Formatted cart line
 */
export function formatCartLine(line) {
    if (!line) return null;

    const { id, quantity, merchandise, attributes = [], cost } = line;

    // Get product and variant info
    const product = merchandise?.product || {};
    const variant = {
        id: merchandise?.id,
        title: merchandise?.title,
        image: merchandise?.image,
        price: merchandise?.price,
        compareAtPrice: merchandise?.compareAtPrice,
        selectedOptions: merchandise?.selectedOptions || [],
    };

    // Parse attributes
    const parsedAttributes = {};
    attributes.forEach(attr => {
        parsedAttributes[attr.key] = attr.value;
    });

    return {
        id,
        quantity,
        product: {
            id: product.id,
            title: product.title,
            handle: product.handle,
            vendor: product.vendor,
        },
        variant,
        attributes: parsedAttributes,
        cost: {
            total: cost?.totalAmount,
            subtotal: cost?.subtotalAmount,
            perItem: cost?.amountPerQuantity
        }
    };
}

/**
 * Create a cart handler helper for components
 * This is a more simplified interface for components to use
 * @param {Object} api - Cart API from the cart handler
 * @returns {Object} Cart handler helper
 */
export function createCartHelper(api) {
    // Subscribe to the API's cart store
    if (browser && api.cartStore) {
        const unsubscribe = api.cartStore.subscribe($cart => {
            // Only update the store if we have a valid cart
            if ($cart) {
                console.log('Updated cart store:', $cart);
                cart.set($cart);
            }
        });

        // Ensure we have the latest cart data
        api.get().catch(err => {
            console.error('Error fetching initial cart:', err);
        });
    }

    async function addToCart(merchandiseId, quantity = 1, attributes = []) {
        if (!merchandiseId) {
            console.error('Error adding to cart: No merchandiseId provided');
            return false;
        }

        const formattedAttributes = Array.isArray(attributes)
            ? attributes
            : Object.entries(attributes).map(([key, value]) => ({ key, value }));

        try {
            const result = await api.addLines([
                {
                    merchandiseId,
                    quantity,
                    attributes: formattedAttributes
                }
            ]);

            if (result && result.cart) {
                // Directly update the cart store with the returned cart data
                cart.set(result.cart);
            } else {
                // Fallback to getting the cart if the result doesn't include it
                await api.get();
            }

            return !result.errors || result.errors.length === 0;
        } catch (error) {
            console.error('Error adding to cart:', error);
            return false;
        }
    }

    async function updateLineQuantity(lineId, quantity) {
        if (!lineId) {
            console.error('Error updating line: No lineId provided');
            return false;
        }

        try {
            const result = await api.updateLines([
                {
                    id: lineId,
                    quantity
                }
            ]);

            if (result && result.cart) {
                // Directly update the cart store with the returned cart data
                console.log('Update line result:', result);
                cart.set(result.cart);
            }

            return !result.errors || result.errors.length === 0;
        } catch (error) {
            console.error('Error updating cart line:', error);
            return false;
        }
    }

    async function removeLine(lineId) {
        if (!lineId) {
            console.error('Error removing line: No lineId provided');
            return false;
        }

        try {
            const result = await api.removeLines([lineId]);
            console.log('Remove line result:', result);
            if (result && result.cart) {
                // Directly update the cart store with the returned cart data
                cart.set(result.cart);
            }

            return !result.errors || result.errors.length === 0;
        } catch (error) {
            console.error('Error removing cart line:', error);
            return false;
        }
    }

    async function applyDiscount(discountCode) {
        if (!discountCode) {
            console.error('Error applying discount: No code provided');
            return false;
        }

        try {
            const currentCart = await api.get();
            const currentCodes = currentCart?.discountCodes || [];
            const currentCodeValues = currentCodes.map(discount => discount.code);

            // Add the new discount code if it's not already there
            if (!currentCodeValues.includes(discountCode)) {
                const result = await api.updateDiscountCodes([...currentCodeValues, discountCode]);
                return !result.errors || result.errors.length === 0;
            }

            return true;
        } catch (error) {
            console.error('Error applying discount:', error);
            return false;
        }
    }

    async function removeDiscount(discountCode) {
        if (!discountCode) {
            console.error('Error removing discount: No code provided');
            return false;
        }

        try {
            const currentCart = await api.get();
            const currentCodes = currentCart?.discountCodes || [];
            const updatedCodes = currentCodes
                .map(discount => discount.code)
                .filter(code => code !== discountCode);

            const result = await api.updateDiscountCodes(updatedCodes);
            return !result.errors || result.errors.length === 0;
        } catch (error) {
            console.error('Error removing discount:', error);
            return false;
        }
    }

    async function clearCart() {
        try {
            const currentCart = await api.get();
            if (!currentCart) return true;

            const lines = currentCart.lines?.edges || [];
            const lineIds = lines.map(edge => edge.node.id);

            if (lineIds.length > 0) {
                const result = await api.removeLines(lineIds);
                return !result.errors || result.errors.length === 0;
            }

            return true;
        } catch (error) {
            console.error('Error clearing cart:', error);
            return false;
        }
    }

    return {
        cart,
        cartLines,
        cartQuantity,
        cartSubtotal,
        cartTotal,
        cartTax,
        cartDiscounts,
        isCartEmpty,
        isCartOpen,
        openCart,
        closeCart,
        toggleCart,
        addToCart,
        updateLineQuantity,
        removeLine,
        applyDiscount,
        removeDiscount,
        clearCart,
        formatCartLine
    };
}