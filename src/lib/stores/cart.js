/**
 * Cart store for SvelteKit Shopify storefront
 */

import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

// Create the base cart store
export const cart = writable(null);

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

export const isCartOpen = writable(false);

/**
 * Open the cart drawer/modal
 */
export function openCart() {
    isCartOpen.set(true);
}

/**
 * Close the cart drawer/modal
 */
export function closeCart() {
    isCartOpen.set(false);
}

/**
 * Toggle the cart drawer/modal
 */
export function toggleCart() {
    isCartOpen.update(value => !value);
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
            cart.set($cart);
        });
    }

    async function addToCart(merchandiseId, quantity = 1, attributes = []) {
        const formattedAttributes = Array.isArray(attributes)
            ? attributes
            : Object.entries(attributes).map(([key, value]) => ({ key, value }));

        try {
            await api.addLines([
                {
                    merchandiseId,
                    quantity,
                    attributes: formattedAttributes
                }
            ]);

            // Open cart drawer after adding item
            openCart();

            return true;
        } catch (error) {
            console.error('Error adding to cart:', error);
            return false;
        }
    }

    async function updateLineQuantity(lineId, quantity) {
        try {
            await api.updateLines([
                {
                    id: lineId,
                    quantity
                }
            ]);

            return true;
        } catch (error) {
            console.error('Error updating cart line:', error);
            return false;
        }
    }

    async function removeLine(lineId) {
        try {
            await api.removeLines([lineId]);
            return true;
        } catch (error) {
            console.error('Error removing cart line:', error);
            return false;
        }
    }

    async function applyDiscount(discountCode) {
        try {
            const currentCart = await api.get();
            const currentCodes = currentCart?.discountCodes || [];
            const currentCodeValues = currentCodes.map(discount => discount.code);

            // Add the new discount code if it's not already there
            if (!currentCodeValues.includes(discountCode)) {
                await api.updateDiscountCodes([...currentCodeValues, discountCode]);
            }

            return true;
        } catch (error) {
            console.error('Error applying discount:', error);
            return false;
        }
    }

    async function removeDiscount(discountCode) {
        try {
            const currentCart = await api.get();
            const currentCodes = currentCart?.discountCodes || [];
            const updatedCodes = currentCodes
                .map(discount => discount.code)
                .filter(code => code !== discountCode);

            await api.updateDiscountCodes(updatedCodes);
            return true;
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
                await api.removeLines(lineIds);
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