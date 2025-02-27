// src/lib/stores/wishlist.js
import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';
import { customerStore } from '$lib/api/customer';

// Local storage key for guest wishlists
const WISHLIST_STORAGE_KEY = 'shopify_wishlist';

// Create the base wishlist store
export const wishlistItems = writable([]);
export const wishlistLoading = writable(false);
export const wishlistError = writable(null);

// Success message store for wishlist operations
export const wishlistMessage = writable({ type: '', message: '', visible: false });

// Derive the count of wishlist items
export const wishlistCount = derived(wishlistItems, ($items) => $items.length);

/**
 * Show a message to the user
 * @param {string} type - 'success', 'error', or 'warning'
 * @param {string} message - The message to display
 * @param {number} duration - How long to show the message (ms)
 */
function showMessage(type, message, duration = 3000) {
    wishlistMessage.set({ type, message, visible: true });

    setTimeout(() => {
        wishlistMessage.update(msg => ({ ...msg, visible: false }));
    }, duration);
}

/**
 * Save the wishlist to local storage (for guests)
 * @param {Array} items - Array of wishlist items
 */
function saveToLocalStorage(items) {
    if (browser) {
        try {
            localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
        } catch (error) {
            console.error('Error saving wishlist to local storage:', error);
        }
    }
}

/**
 * Load wishlist from local storage (for guests)
 * @returns {Array} Array of wishlist items
 */
function loadFromLocalStorage() {
    if (browser) {
        try {
            const saved = localStorage.getItem(WISHLIST_STORAGE_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error loading wishlist from local storage:', error);
            return [];
        }
    }
    return [];
}

/**
 * Save wishlist to Shopify customer metafields (for logged-in users)
 * @param {Array} items - Array of wishlist items
 * @param {Object} shopifyAPI - Shopify API instance
 */
async function saveToCustomerMetafields(items, shopifyAPI) {
    if (!shopifyAPI) return;

    wishlistLoading.set(true);
    wishlistError.set(null);

    try {
        // Convert items to format suitable for metafields
        const wishlistData = JSON.stringify(items);

        // Update the customer metafield
        const result = await shopifyAPI.updateCustomerMetafield({
            namespace: 'wishlist',
            key: 'items',
            value: wishlistData,
            type: 'json_string'
        });

        if (!result.success) {
            throw new Error('Failed to save wishlist to customer account');
        }
    } catch (error) {
        console.error('Error saving wishlist to customer metafields:', error);
        wishlistError.set('Failed to save your wishlist. Changes will be lost when you log out.');
    } finally {
        wishlistLoading.set(false);
    }
}

/**
 * Load wishlist from Shopify customer metafields (for logged-in users)
 * @param {Object} shopifyAPI - Shopify API instance
 * @returns {Array} Array of wishlist items
 */
async function loadFromCustomerMetafields(shopifyAPI) {
    if (!shopifyAPI) return [];

    wishlistLoading.set(true);
    wishlistError.set(null);

    try {
        // Fetch customer metafields
        const metafields = await shopifyAPI.getCustomerMetafields([
            { namespace: 'wishlist', key: 'items' }
        ]);

        const wishlistMetafield = metafields.find(
            mf => mf.namespace === 'wishlist' && mf.key === 'items'
        );

        if (wishlistMetafield && wishlistMetafield.value) {
            try {
                return JSON.parse(wishlistMetafield.value);
            } catch (e) {
                console.error('Error parsing wishlist metafield:', e);
                return [];
            }
        }

        return [];
    } catch (error) {
        console.error('Error loading wishlist from customer metafields:', error);
        wishlistError.set('Failed to load your wishlist. Please refresh the page.');
        return [];
    } finally {
        wishlistLoading.set(false);
    }
}

/**
 * Initialize the wishlist
 * @param {Object} shopifyAPI - Optional Shopify API for customer operations
 */
export async function initWishlist(shopifyAPI = null) {
    if (!browser) return;

    wishlistLoading.set(true);

    // Check if there's a logged in customer
    const isLoggedIn = !!get(customerStore);

    try {
        let items = [];

        if (isLoggedIn && shopifyAPI) {
            // Load from customer metafields
            items = await loadFromCustomerMetafields(shopifyAPI);

            // Check if there's a guest wishlist to merge
            const guestItems = loadFromLocalStorage();

            if (guestItems.length > 0) {
                // Merge guest and customer wishlists (avoiding duplicates)
                const mergedItems = [...items];
                let itemsAdded = 0;

                for (const guestItem of guestItems) {
                    // Check if item already exists
                    const exists = mergedItems.some(item => item.variantId === guestItem.variantId);

                    if (!exists) {
                        mergedItems.push(guestItem);
                        itemsAdded++;
                    }
                }

                if (itemsAdded > 0) {
                    // Save merged wishlist to customer metafields
                    await saveToCustomerMetafields(mergedItems, shopifyAPI);

                    // Clear guest wishlist
                    localStorage.removeItem(WISHLIST_STORAGE_KEY);

                    showMessage('success', `${itemsAdded} items from your guest wishlist were added to your account`);
                }

                items = mergedItems;
            }
        } else {
            // Load from local storage for guests
            items = loadFromLocalStorage();
        }

        wishlistItems.set(items);
    } catch (error) {
        console.error('Error initializing wishlist:', error);
        wishlistError.set('Failed to initialize wishlist');
    } finally {
        wishlistLoading.set(false);
    }
}

/**
 * Add an item to the wishlist
 * @param {Object} item - The product to add to the wishlist
 * @param {Object} shopifyAPI - Optional Shopify API for customer operations
 */
export async function addToWishlist(item, shopifyAPI = null) {
    if (!browser || !item?.variantId) return;

    const currentItems = get(wishlistItems);

    // Check if item already exists in wishlist
    const exists = currentItems.some(i => i.variantId === item.variantId);

    if (exists) {
        showMessage('info', 'This item is already in your wishlist');
        return;
    }

    // Add timestamp to know when it was added
    const newItem = {
        ...item,
        addedAt: new Date().toISOString()
    };

    const updatedItems = [...currentItems, newItem];
    wishlistItems.set(updatedItems);

    // Check if user is logged in
    const isLoggedIn = !!get(customerStore);

    if (isLoggedIn && shopifyAPI) {
        // Save to customer metafields
        await saveToCustomerMetafields(updatedItems, shopifyAPI);
    } else {
        // Save to local storage for guests
        saveToLocalStorage(updatedItems);
    }

    showMessage('success', 'Item added to your wishlist');
}

/**
 * Remove an item from the wishlist
 * @param {string} variantId - The variant ID to remove
 * @param {Object} shopifyAPI - Optional Shopify API for customer operations
 */
export async function removeFromWishlist(variantId, shopifyAPI = null) {
    if (!browser || !variantId) return;

    const currentItems = get(wishlistItems);
    const updatedItems = currentItems.filter(item => item.variantId !== variantId);

    wishlistItems.set(updatedItems);

    // Check if user is logged in
    const isLoggedIn = !!get(customerStore);

    if (isLoggedIn && shopifyAPI) {
        // Save to customer metafields
        await saveToCustomerMetafields(updatedItems, shopifyAPI);
    } else {
        // Save to local storage for guests
        saveToLocalStorage(updatedItems);
    }

    showMessage('success', 'Item removed from your wishlist');
}

/**
 * Clear the entire wishlist
 * @param {Object} shopifyAPI - Optional Shopify API for customer operations
 */
export async function clearWishlist(shopifyAPI = null) {
    if (!browser) return;

    wishlistItems.set([]);

    // Check if user is logged in
    const isLoggedIn = !!get(customerStore);

    if (isLoggedIn && shopifyAPI) {
        // Save empty array to customer metafields
        await saveToCustomerMetafields([], shopifyAPI);
    } else {
        // Clear local storage for guests
        localStorage.removeItem(WISHLIST_STORAGE_KEY);
    }

    showMessage('success', 'Your wishlist has been cleared');
}

/**
 * Check if an item is in the wishlist
 * @param {string} variantId - The variant ID to check
 * @returns {boolean} True if item is in wishlist
 */
export function isInWishlist(variantId) {
    if (!browser || !variantId) return false;

    const currentItems = get(wishlistItems);
    return currentItems.some(item => item.variantId === variantId);
}

// Subscribe to customer store to detect login/logout
if (browser) {
    customerStore.subscribe($customer => {
        // Re-initialize wishlist when customer state changes
        if ($customer) {
            // User logged in
            console.log('Customer logged in, reinitializing wishlist');
            // Delay initialization to ensure API is ready
            setTimeout(() => initWishlist(), 100);
        } else {
            // User logged out, switch to local storage
            console.log('Customer logged out, switching to local storage wishlist');
            const items = loadFromLocalStorage();
            wishlistItems.set(items);
        }
    });
}