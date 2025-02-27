// Updated src/lib/stores/cart.js for accurate feedback

/**
 * Updated cart store for SvelteKit Shopify storefront
 *
 * This version includes improved feedback about operation results
 */

import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

// Create the base cart store
export const cart = writable(null);

// Create cart drawer state
export const isCartOpen = writable(false);

// Import error store from cart.js
import { cartErrorStore } from '$lib/api/cart';
export const cartError = cartErrorStore;

// Add a store for operation results
export const cartOperationResult = writable({
    success: false,
    message: '',
    type: '' // 'success' | 'error' | 'warning' | ''
});

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
 * Set a result message
 */
function setResult(success, message, type = success ? 'success' : 'error') {
    if (browser) {
        cartOperationResult.set({ success, message, type });

        // Clear after 5 seconds
        setTimeout(() => {
            cartOperationResult.set({ success: false, message: '', type: '' });
        }, 5000);
    }
}

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
                cart.set($cart);
            }
        });

        // Ensure we have the latest cart data
        api.get().catch(err => {
            console.error('Error fetching initial cart:', err);
        });
    }

    /**
     * Add item to cart, fixing the variant replacement issue
     * This version will add a new line instead of updating existing quantities
     * when adding different variants of the same product
     */
    async function addToCart(merchandiseId, quantity = 1, attributes = []) {
        if (!merchandiseId) {
            console.error('Error adding to cart: No merchandiseId provided');
            setResult(false, 'Could not add to cart: Invalid product variant.');
            return false;
        }

        const formattedAttributes = Array.isArray(attributes)
            ? attributes
            : Object.entries(attributes).map(([key, value]) => ({ key, value }));

        try {
            // Add a new line - this ensures different variants are added separately
            const result = await api.addLines([
                {
                    merchandiseId,
                    quantity,
                    attributes: formattedAttributes
                }
            ]);

            // Check for errors
            if (result.errors && result.errors.length > 0) {
                const errorMessage = result.errors[0].message || 'Failed to add item to cart.';
                setResult(false, errorMessage);
                return false;
            }

            if (result && result.cart) {
                // Compare quantities to verify the item was added correctly
                let success = true;
                let message = `Added to cart.`;

                // Find the line that should contain our new item
                const addedLine = result.cart.lines.edges.find(
                    edge => edge.node.merchandise.id === merchandiseId
                );

                // If it wasn't added at all
                if (!addedLine) {
                    success = false;
                    message = 'Item could not be added to cart.';
                }
                // If it wasn't added with the full requested quantity
                else if (addedLine.node.quantity < quantity) {
                    success = true;
                    message = `Added ${addedLine.node.quantity} item(s) to cart. Some items may be out of stock.`;
                    // This is a partial success
                }

                // Directly update the cart store with the returned cart data
                cart.set(result.cart);
                setResult(success, message, success ? 'success' : 'error');

                return success;
            } else {
                // Fallback to getting the cart if the result doesn't include it
                await api.get();
                setResult(false, 'Unable to confirm if item was added to cart.');
                return false;
            }
        } catch (error) {
            console.error('Error adding to cart:', error);
            setResult(false, 'Error adding to cart. Please try again.');
            return false;
        }
    }

    /**
     * Update line quantity with better error handling
     */
    async function updateLineQuantity(lineId, quantity) {
        if (!lineId) {
            console.error('Error updating line: No lineId provided');
            setResult(false, 'Could not update quantity: Missing item ID.');
            return false;
        }

        if (quantity < 1) {
            return removeLine(lineId);
        }

        // Get current quantity to compare after update
        const currentCart = await api.get();
        const currentLine = currentCart?.lines?.edges?.find(edge => edge.node.id === lineId);
        const currentQuantity = currentLine?.node?.quantity || 0;

        try {
            const result = await api.updateLines([
                {
                    id: lineId,
                    quantity
                }
            ]);

            // Check for errors in the response
            if (result.errors && result.errors.length > 0) {
                const errorMessage = result.errors[0].message || 'Could not update quantity.';
                setResult(false, errorMessage);
                return false;
            }

            // Make sure we have a valid cart response
            if (result && result.cart) {
                // Check if the quantity was actually updated
                const updatedLine = result.cart.lines.edges.find(edge => edge.node.id === lineId);

                if (!updatedLine) {
                    setResult(false, 'Item no longer exists in cart.');
                    cart.set(result.cart);
                    return false;
                }

                const updatedQuantity = updatedLine.node.quantity;

                // Check if we got the quantity we wanted
                if (updatedQuantity === quantity) {
                    setResult(true, 'Quantity updated successfully.');
                    cart.set(result.cart);
                    return true;
                }
                else if (updatedQuantity !== currentQuantity) {
                    // Something changed, but not what we wanted
                    setResult(true, `Quantity updated to ${updatedQuantity}. Some items may be out of stock.`, 'warning');
                    cart.set(result.cart);
                    return true;
                }
                else {
                    // Quantity didn't change
                    setResult(false, 'Could not update to requested quantity. Item may be out of stock.');
                    cart.set(result.cart);
                    return false;
                }
            }

            // If no cart returned but there are errors, try to refresh the cart
            await api.get();
            setResult(false, 'Unable to confirm quantity update.');
            return false;
        } catch (error) {
            console.error('Error updating cart line:', error);
            setResult(false, 'Error updating quantity. Please try again.');

            // Try to refresh the cart
            try {
                await api.get();
            } catch (e) {
                console.error('Failed to refresh cart after error:', e);
            }

            return false;
        }
    }

    /**
     * Remove line with better error handling
     */
    async function removeLine(lineId) {
        if (!lineId) {
            console.error('Error removing line: No lineId provided');
            setResult(false, 'Could not remove item: Missing item ID.');
            return false;
        }

        try {
            const result = await api.removeLines([lineId]);

            // Check for errors in the response
            if (result.errors && result.errors.length > 0) {
                const errorMessage = result.errors[0].message || 'Could not remove item.';
                setResult(false, errorMessage);
                return false;
            }

            // Make sure we have a valid cart response
            if (result && result.cart) {
                // Check if the line was actually removed
                const lineStillExists = result.cart.lines.edges.some(edge => edge.node.id === lineId);

                if (lineStillExists) {
                    setResult(false, 'Failed to remove item from cart.');
                    cart.set(result.cart);
                    return false;
                } else {
                    setResult(true, 'Item removed from cart.');
                    cart.set(result.cart);
                    return true;
                }
            }

            // If no cart returned, try to refresh the cart
            await api.get();
            setResult(false, 'Unable to confirm item removal.');
            return false;
        } catch (error) {
            console.error('Error removing cart line:', error);
            setResult(false, 'Error removing item. Please try again.');

            // Try to refresh the cart
            try {
                await api.get();
            } catch (e) {
                console.error('Failed to refresh cart after error:', e);
            }

            return false;
        }
    }

    async function applyDiscount(discountCode) {
        if (!discountCode) {
            console.error('Error applying discount: No code provided');
            setResult(false, 'Please enter a discount code.');
            return false;
        }

        try {
            const currentCart = await api.get();
            const currentCodes = currentCart?.discountCodes || [];
            const currentCodeValues = currentCodes.map(discount => discount.code);

            // Add the new discount code if it's not already there
            if (!currentCodeValues.includes(discountCode)) {
                const result = await api.updateDiscountCodes([...currentCodeValues, discountCode]);

                // Check for errors in the response
                if (result.errors && result.errors.length > 0) {
                    const errorMessage = result.errors[0].message || 'Could not apply discount code.';
                    setResult(false, errorMessage);
                    return false;
                }

                // Check if the discount was actually applied
                if (result.cart?.discountCodes) {
                    const appliedDiscount = result.cart.discountCodes.find(
                        d => d.code === discountCode && d.applicable
                    );

                    if (appliedDiscount) {
                        setResult(true, 'Discount code applied successfully.');
                        return true;
                    } else if (result.cart.discountCodes.some(d => d.code === discountCode)) {
                        // Code was added but is not applicable
                        setResult(false, 'This discount code cannot be applied to your cart.', 'warning');
                        return false;
                    }
                }

                setResult(false, 'Failed to apply discount code.');
                return false;
            }

            setResult(false, 'This discount code is already applied.');
            return false;
        } catch (error) {
            console.error('Error applying discount:', error);
            setResult(false, 'Error applying discount code. Please try again.');
            return false;
        }
    }

    async function removeDiscount(discountCode) {
        if (!discountCode) {
            console.error('Error removing discount: No code provided');
            setResult(false, 'Invalid discount code.');
            return false;
        }

        try {
            const currentCart = await api.get();
            const currentCodes = currentCart?.discountCodes || [];
            const updatedCodes = currentCodes
                .map(discount => discount.code)
                .filter(code => code !== discountCode);

            // Only make the API call if the code exists
            if (currentCodes.some(d => d.code === discountCode)) {
                const result = await api.updateDiscountCodes(updatedCodes);

                // Check for errors in the response
                if (result.errors && result.errors.length > 0) {
                    const errorMessage = result.errors[0].message || 'Could not remove discount code.';
                    setResult(false, errorMessage);
                    return false;
                }

                // Check if the discount was actually removed
                if (result.cart?.discountCodes) {
                    const codeStillExists = result.cart.discountCodes.some(d => d.code === discountCode);

                    if (!codeStillExists) {
                        setResult(true, 'Discount code removed.');
                        return true;
                    }
                }

                setResult(false, 'Failed to remove discount code.');
                return false;
            }

            setResult(false, 'This discount code is not applied to your cart.');
            return false;
        } catch (error) {
            console.error('Error removing discount:', error);
            setResult(false, 'Error removing discount code. Please try again.');
            return false;
        }
    }

    async function clearCart() {
        try {
            const currentCart = await api.get();
            if (!currentCart) {
                setResult(true, 'Cart is already empty.');
                return true;
            }

            const lines = currentCart.lines?.edges || [];
            const lineIds = lines.map(edge => edge.node.id);

            if (lineIds.length > 0) {
                const result = await api.removeLines(lineIds);

                // Check for errors in the response
                if (result.errors && result.errors.length > 0) {
                    const errorMessage = result.errors[0].message || 'Could not clear cart.';
                    setResult(false, errorMessage);
                    return false;
                }

                // Check if all items were removed
                if (result.cart?.lines?.edges?.length === 0) {
                    setResult(true, 'Your cart has been cleared.');
                    return true;
                } else {
                    setResult(false, 'Some items could not be removed from your cart.');
                    return false;
                }
            }

            setResult(true, 'Cart is already empty.');
            return true;
        } catch (error) {
            console.error('Error clearing cart:', error);
            setResult(false, 'Error clearing cart. Please try again.');
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
        cartError,
        cartOperationResult,
        setResult,
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