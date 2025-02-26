/**
 * Customer store for SvelteKit Shopify storefront
 */

import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

// Create the base customer store
export const customer = writable(null);

// Derive helpful customer properties
export const isLoggedIn = derived(customer, ($customer) => {
    return !!$customer;
});

export const customerName = derived(customer, ($customer) => {
    if (!$customer) return '';

    const { firstName, lastName } = $customer;
    if (firstName && lastName) return `${firstName} ${lastName}`;
    if (firstName) return firstName;
    if (lastName) return lastName;

    return '';
});

export const customerEmail = derived(customer, ($customer) => {
    if (!$customer?.emailAddress?.emailAddress) return '';
    return $customer.emailAddress.emailAddress;
});

export const customerAddresses = derived(customer, ($customer) => {
    if (!$customer?.addresses?.edges) return [];
    return $customer.addresses.edges.map(edge => edge.node);
});

export const defaultAddress = derived(customer, ($customer) => {
    if (!$customer?.defaultAddress) return null;
    return $customer.defaultAddress;
});

/**
 * Format an address for display
 * @param {Object} address - Address from Shopify
 * @returns {Object} Formatted address
 */
export function formatAddress(address) {
    if (!address) return null;

    return {
        id: address.id,
        firstName: address.firstName || '',
        lastName: address.lastName || '',
        company: address.company || '',
        address1: address.address1 || '',
        address2: address.address2 || '',
        city: address.city || '',
        province: address.province || '',
        zip: address.zip || '',
        country: address.country || '',
        phone: address.phone || '',
        formatted: address.formatted || [],
        isDefault: false // Set this when mapping addresses
    };
}

/**
 * Format addresses with default flag
 * @param {Array} addresses - Addresses from Shopify
 * @param {string} defaultAddressId - ID of default address
 * @returns {Array} Formatted addresses
 */
export function formatAddresses(addresses, defaultAddressId) {
    if (!addresses || !Array.isArray(addresses)) return [];

    return addresses.map(address => {
        const formatted = formatAddress(address);
        formatted.isDefault = address.id === defaultAddressId;
        return formatted;
    });
}

/**
 * Create a customer helper for components
 * This is a more simplified interface for components to use
 * @param {Object} api - Customer API
 * @returns {Object} Customer helper
 */
export function createCustomerHelper(api) {
    // Subscribe to the API's customer store
    if (browser && api.customerStore) {
        const unsubscribe = api.customerStore.subscribe($customer => {
            customer.set($customer);
        });
    }

    async function login(email, password) {
        try {
            const result = await api.login(email, password);

            if (!result.success) {
                return {
                    success: false,
                    errors: result.errors || [{ message: 'Login failed' }]
                };
            }

            return { success: true };
        } catch (error) {
            console.error('Error during login:', error);
            return {
                success: false,
                errors: [{ message: error.message || 'An unexpected error occurred' }]
            };
        }
    }

    async function logout() {
        try {
            await api.logout();
            return true;
        } catch (error) {
            console.error('Error during logout:', error);
            return false;
        }
    }

    async function register(input) {
        try {
            const result = await api.register(input);

            if (!result.success) {
                return {
                    success: false,
                    errors: result.errors || [{ message: 'Registration failed' }]
                };
            }

            return { success: true };
        } catch (error) {
            console.error('Error during registration:', error);
            return {
                success: false,
                errors: [{ message: error.message || 'An unexpected error occurred' }]
            };
        }
    }

    async function updateProfile(data) {
        try {
            const result = await api.updateCustomer(data);

            if (!result.success) {
                return {
                    success: false,
                    errors: result.errors || [{ message: 'Update failed' }]
                };
            }

            return { success: true };
        } catch (error) {
            console.error('Error updating profile:', error);
            return {
                success: false,
                errors: [{ message: error.message || 'An unexpected error occurred' }]
            };
        }
    }

    async function addAddress(address) {
        try {
            const result = await api.createAddress(address);

            if (!result.success) {
                return {
                    success: false,
                    errors: result.errors || [{ message: 'Failed to add address' }]
                };
            }

            return {
                success: true,
                addressId: result.addressId
            };
        } catch (error) {
            console.error('Error adding address:', error);
            return {
                success: false,
                errors: [{ message: error.message || 'An unexpected error occurred' }]
            };
        }
    }

    async function updateAddress(id, address) {
        try {
            const result = await api.updateAddress(id, address);

            if (!result.success) {
                return {
                    success: false,
                    errors: result.errors || [{ message: 'Failed to update address' }]
                };
            }

            return { success: true };
        } catch (error) {
            console.error('Error updating address:', error);
            return {
                success: false,
                errors: [{ message: error.message || 'An unexpected error occurred' }]
            };
        }
    }

    async function removeAddress(id) {
        try {
            const result = await api.deleteAddress(id);

            if (!result.success) {
                return {
                    success: false,
                    errors: result.errors || [{ message: 'Failed to remove address' }]
                };
            }

            return { success: true };
        } catch (error) {
            console.error('Error removing address:', error);
            return {
                success: false,
                errors: [{ message: error.message || 'An unexpected error occurred' }]
            };
        }
    }

    async function setDefaultAddress(id) {
        try {
            const result = await api.setDefaultAddress(id);

            if (!result.success) {
                return {
                    success: false,
                    errors: result.errors || [{ message: 'Failed to set default address' }]
                };
            }

            return { success: true };
        } catch (error) {
            console.error('Error setting default address:', error);
            return {
                success: false,
                errors: [{ message: error.message || 'An unexpected error occurred' }]
            };
        }
    }

    async function recoverPassword(email) {
        try {
            const result = await api.recoverPassword(email);

            if (!result.success) {
                return {
                    success: false,
                    errors: result.errors || [{ message: 'Failed to send recovery email' }]
                };
            }

            return { success: true };
        } catch (error) {
            console.error('Error recovering password:', error);
            return {
                success: false,
                errors: [{ message: error.message || 'An unexpected error occurred' }]
            };
        }
    }

    async function resetPassword(id, password, resetToken) {
        try {
            const result = await api.resetPassword(id, password, resetToken);

            if (!result.success) {
                return {
                    success: false,
                    errors: result.errors || [{ message: 'Failed to reset password' }]
                };
            }

            return { success: true };
        } catch (error) {
            console.error('Error resetting password:', error);
            return {
                success: false,
                errors: [{ message: error.message || 'An unexpected error occurred' }]
            };
        }
    }

    async function getOrders(first = 10, after = null) {
        try {
            return await api.getOrders(first, after);
        } catch (error) {
            console.error('Error fetching orders:', error);
            return {
                orders: [],
                pageInfo: { hasNextPage: false }
            };
        }
    }

    return {
        customer,
        isLoggedIn,
        customerName,
        customerEmail,
        customerAddresses,
        defaultAddress,
        login,
        logout,
        register,
        updateProfile,
        addAddress,
        updateAddress,
        removeAddress,
        setDefaultAddress,
        recoverPassword,
        resetPassword,
        getOrders,
        formatAddress,
        formatAddresses
    };
}