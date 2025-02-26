/**
 * Customer API for Shopify Storefront
 * Handles customer authentication and account operations
 */

import { browser } from '$app/environment';
import { writable, get } from 'svelte/store';
import { CacheNone } from './storefront';

// Create a Svelte store for the customer
export const customerStore = writable(null);

// Customer session cookie name
const CUSTOMER_TOKEN_COOKIE = 'shopify_customer_token';

// Customer fragments
const CUSTOMER_FRAGMENT = `#graphql
  fragment Customer on Customer {
    id
    firstName
    lastName
    displayName
    email
    phone
    defaultAddress {
      id
      formatted
      firstName
      lastName
      company
      address1
      address2
      country
      province
      city
      zip
      phone
    }
    addresses(first: 10) {
      edges {
        node {
          id
          formatted
          firstName
          lastName
          company
          address1
          address2
          country
          province
          city
          zip
          phone
        }
      }
    }
  }
`;

// Customer queries
const CUSTOMER_QUERY = `#graphql
  query CustomerDetails($customerAccessToken: String!) {
    customer(customerAccessToken: $customerAccessToken) {
      ...Customer
    }
  }
  ${CUSTOMER_FRAGMENT}
`;

// Customer login mutation
const CUSTOMER_LOGIN_MUTATION = `#graphql
  mutation CustomerAccessTokenCreate($input: CustomerAccessTokenCreateInput!) {
    customerAccessTokenCreate(input: $input) {
      customerAccessToken {
        accessToken
        expiresAt
      }
      customerUserErrors {
        code
        field
        message
      }
    }
  }
`;

// Customer logout mutation
const CUSTOMER_LOGOUT_MUTATION = `#graphql
  mutation CustomerAccessTokenDelete($customerAccessToken: String!) {
    customerAccessTokenDelete(customerAccessToken: $customerAccessToken) {
      deletedAccessToken
      deletedCustomerAccessTokenId
      userErrors {
        field
        message
      }
    }
  }
`;

// Customer register mutation
const CUSTOMER_REGISTER_MUTATION = `#graphql
  mutation CustomerCreate($input: CustomerCreateInput!) {
    customerCreate(input: $input) {
      customer {
        id
      }
      customerUserErrors {
        code
        field
        message
      }
    }
  }
`;

// Customer address mutations
const CREATE_ADDRESS_MUTATION = `#graphql
  mutation CustomerAddressCreate($customerAccessToken: String!, $address: MailingAddressInput!) {
    customerAddressCreate(customerAccessToken: $customerAccessToken, address: $address) {
      customerAddress {
        id
      }
      customerUserErrors {
        code
        field
        message
      }
    }
  }
`;

const UPDATE_ADDRESS_MUTATION = `#graphql
  mutation CustomerAddressUpdate($customerAccessToken: String!, $id: ID!, $address: MailingAddressInput!) {
    customerAddressUpdate(customerAccessToken: $customerAccessToken, id: $id, address: $address) {
      customerAddress {
        id
      }
      customerUserErrors {
        code
        field
        message
      }
    }
  }
`;

const DELETE_ADDRESS_MUTATION = `#graphql
  mutation CustomerAddressDelete($customerAccessToken: String!, $id: ID!) {
    customerAddressDelete(customerAccessToken: $customerAccessToken, id: $id) {
      deletedCustomerAddressId
      customerUserErrors {
        code
        field
        message
      }
    }
  }
`;

const UPDATE_DEFAULT_ADDRESS_MUTATION = `#graphql
  mutation CustomerDefaultAddressUpdate($customerAccessToken: String!, $addressId: ID!) {
    customerDefaultAddressUpdate(customerAccessToken: $customerAccessToken, addressId: $addressId) {
      customer {
        id
      }
      customerUserErrors {
        code
        field
        message
      }
    }
  }
`;

// Customer update mutation
const CUSTOMER_UPDATE_MUTATION = `#graphql
  mutation CustomerUpdate($customerAccessToken: String!, $customer: CustomerUpdateInput!) {
    customerUpdate(customerAccessToken: $customerAccessToken, customer: $customer) {
      customer {
        id
      }
      customerUserErrors {
        code
        field
        message
      }
    }
  }
`;

// Password reset mutations
const RECOVER_PASSWORD_MUTATION = `#graphql
  mutation CustomerRecover($email: String!) {
    customerRecover(email: $email) {
      customerUserErrors {
        code
        field
        message
      }
    }
  }
`;

const RESET_PASSWORD_MUTATION = `#graphql
  mutation CustomerReset($id: ID!, $input: CustomerResetInput!) {
    customerReset(id: $id, input: $input) {
      customerAccessToken {
        accessToken
        expiresAt
      }
      customerUserErrors {
        code
        field
        message
      }
    }
  }
`;

// Customer orders query
const CUSTOMER_ORDERS_QUERY = `#graphql
  query CustomerOrders($customerAccessToken: String!, $first: Int!, $after: String) {
    customer(customerAccessToken: $customerAccessToken) {
      orders(first: $first, after: $after, sortKey: PROCESSED_AT, reverse: true) {
        pageInfo {
          hasNextPage
          endCursor
        }
        edges {
          node {
            id
            orderNumber
            processedAt
            financialStatus
            fulfillmentStatus
            currentTotalPrice {
              amount
              currencyCode
            }
            lineItems(first: 2) {
              edges {
                node {
                  title
                  variant {
                    image {
                      url
                      altText
                      width
                      height
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

/**
 * Creates the customer account API
 */
export function createCustomerAPI({ storefront, getCustomerToken, setCustomerToken, removeCustomerToken }) {
    /**
     * Get the current customer
     */
    async function getCustomer() {
        const accessToken = getCustomerToken();

        if (!accessToken) {
            return null;
        }

        try {
            const { customer } = await storefront.query(CUSTOMER_QUERY, {
                variables: {
                    customerAccessToken: accessToken
                },
                cache: CacheNone()
            });

            if (!customer) {
                removeCustomerToken();
                updateCustomerStore(null);
                return null;
            }

            updateCustomerStore(customer);
            return customer;
        } catch (error) {
            console.error('Error fetching customer:', error);
            removeCustomerToken();
            updateCustomerStore(null);
            return null;
        }
    }

    /**
     * Login a customer
     */
    async function login(email, password) {
        try {
            const { customerAccessTokenCreate } = await storefront.query(CUSTOMER_LOGIN_MUTATION, {
                variables: {
                    input: {
                        email,
                        password
                    }
                },
                cache: CacheNone()
            });

            const errors = customerAccessTokenCreate?.customerUserErrors;

            if (errors && errors.length > 0) {
                return {
                    success: false,
                    errors
                };
            }

            const accessToken = customerAccessTokenCreate?.customerAccessToken?.accessToken;

            if (!accessToken) {
                return {
                    success: false,
                    errors: [{ message: 'Login failed' }]
                };
            }

            setCustomerToken(accessToken);

            // Fetch customer details
            await getCustomer();

            return {
                success: true
            };
        } catch (error) {
            console.error('Error during login:', error);
            return {
                success: false,
                errors: [{ message: error.message }]
            };
        }
    }

    /**
     * Logout a customer
     */
    async function logout() {
        const accessToken = getCustomerToken();

        if (!accessToken) {
            return { success: true };
        }

        try {
            await storefront.query(CUSTOMER_LOGOUT_MUTATION, {
                variables: {
                    customerAccessToken: accessToken
                },
                cache: CacheNone()
            });

            removeCustomerToken();
            updateCustomerStore(null);

            return { success: true };
        } catch (error) {
            console.error('Error during logout:', error);
            return {
                success: false,
                errors: [{ message: error.message }]
            };
        }
    }

    /**
     * Register a new customer
     */
    async function register(input) {
        try {
            const { customerCreate } = await storefront.query(CUSTOMER_REGISTER_MUTATION, {
                variables: {
                    input
                },
                cache: CacheNone()
            });

            const errors = customerCreate?.customerUserErrors;

            if (errors && errors.length > 0) {
                return {
                    success: false,
                    errors
                };
            }

            // Auto-login after registration
            return await login(input.email, input.password);
        } catch (error) {
            console.error('Error during registration:', error);
            return {
                success: false,
                errors: [{ message: error.message }]
            };
        }
    }

    /**
     * Update customer information
     */
    async function updateCustomer(customerInput) {
        const accessToken = getCustomerToken();

        if (!accessToken) {
            return {
                success: false,
                errors: [{ message: 'Customer not logged in' }]
            };
        }

        try {
            const { customerUpdate } = await storefront.query(CUSTOMER_UPDATE_MUTATION, {
                variables: {
                    customerAccessToken: accessToken,
                    customer: customerInput
                },
                cache: CacheNone()
            });

            const errors = customerUpdate?.customerUserErrors;

            if (errors && errors.length > 0) {
                return {
                    success: false,
                    errors
                };
            }

            // Refresh customer data
            await getCustomer();

            return {
                success: true
            };
        } catch (error) {
            console.error('Error updating customer:', error);
            return {
                success: false,
                errors: [{ message: error.message }]
            };
        }
    }

    /**
     * Create a new customer address
     */
    async function createAddress(address) {
        const accessToken = getCustomerToken();

        if (!accessToken) {
            return {
                success: false,
                errors: [{ message: 'Customer not logged in' }]
            };
        }

        try {
            const { customerAddressCreate } = await storefront.query(CREATE_ADDRESS_MUTATION, {
                variables: {
                    customerAccessToken: accessToken,
                    address
                },
                cache: CacheNone()
            });

            const errors = customerAddressCreate?.customerUserErrors;

            if (errors && errors.length > 0) {
                return {
                    success: false,
                    errors
                };
            }

            // Refresh customer data
            await getCustomer();

            return {
                success: true,
                addressId: customerAddressCreate?.customerAddress?.id
            };
        } catch (error) {
            console.error('Error creating address:', error);
            return {
                success: false,
                errors: [{ message: error.message }]
            };
        }
    }

    /**
     * Update a customer address
     */
    async function updateAddress(addressId, address) {
        const accessToken = getCustomerToken();

        if (!accessToken) {
            return {
                success: false,
                errors: [{ message: 'Customer not logged in' }]
            };
        }

        try {
            const { customerAddressUpdate } = await storefront.query(UPDATE_ADDRESS_MUTATION, {
                variables: {
                    customerAccessToken: accessToken,
                    id: addressId,
                    address
                },
                cache: CacheNone()
            });

            const errors = customerAddressUpdate?.customerUserErrors;

            if (errors && errors.length > 0) {
                return {
                    success: false,
                    errors
                };
            }

            // Refresh customer data
            await getCustomer();

            return {
                success: true
            };
        } catch (error) {
            console.error('Error updating address:', error);
            return {
                success: false,
                errors: [{ message: error.message }]
            };
        }
    }

    /**
     * Delete a customer address
     */
    async function deleteAddress(addressId) {
        const accessToken = getCustomerToken();

        if (!accessToken) {
            return {
                success: false,
                errors: [{ message: 'Customer not logged in' }]
            };
        }

        try {
            const { customerAddressDelete } = await storefront.query(DELETE_ADDRESS_MUTATION, {
                variables: {
                    customerAccessToken: accessToken,
                    id: addressId
                },
                cache: CacheNone()
            });

            const errors = customerAddressDelete?.customerUserErrors;

            if (errors && errors.length > 0) {
                return {
                    success: false,
                    errors
                };
            }

            // Refresh customer data
            await getCustomer();

            return {
                success: true
            };
        } catch (error) {
            console.error('Error deleting address:', error);
            return {
                success: false,
                errors: [{ message: error.message }]
            };
        }
    }

    /**
     * Set default address
     */
    async function setDefaultAddress(addressId) {
        const accessToken = getCustomerToken();

        if (!accessToken) {
            return {
                success: false,
                errors: [{ message: 'Customer not logged in' }]
            };
        }

        try {
            const { customerDefaultAddressUpdate } = await storefront.query(UPDATE_DEFAULT_ADDRESS_MUTATION, {
                variables: {
                    customerAccessToken: accessToken,
                    addressId
                },
                cache: CacheNone()
            });

            const errors = customerDefaultAddressUpdate?.customerUserErrors;

            if (errors && errors.length > 0) {
                return {
                    success: false,
                    errors
                };
            }

            // Refresh customer data
            await getCustomer();

            return {
                success: true
            };
        } catch (error) {
            console.error('Error setting default address:', error);
            return {
                success: false,
                errors: [{ message: error.message }]
            };
        }
    }

    /**
     * Recover customer password
     */
    async function recoverPassword(email) {
        try {
            const { customerRecover } = await storefront.query(RECOVER_PASSWORD_MUTATION, {
                variables: {
                    email
                },
                cache: CacheNone()
            });

            const errors = customerRecover?.customerUserErrors;

            if (errors && errors.length > 0) {
                return {
                    success: false,
                    errors
                };
            }

            return {
                success: true
            };
        } catch (error) {
            console.error('Error recovering password:', error);
            return {
                success: false,
                errors: [{ message: error.message }]
            };
        }
    }

    /**
     * Reset customer password
     */
    async function resetPassword(id, password, resetToken) {
        try {
            const { customerReset } = await storefront.query(RESET_PASSWORD_MUTATION, {
                variables: {
                    id,
                    input: {
                        password,
                        resetToken
                    }
                },
                cache: CacheNone()
            });

            const errors = customerReset?.customerUserErrors;

            if (errors && errors.length > 0) {
                return {
                    success: false,
                    errors
                };
            }

            const accessToken = customerReset?.customerAccessToken?.accessToken;

            if (!accessToken) {
                return {
                    success: false,
                    errors: [{ message: 'Password reset failed' }]
                };
            }

            setCustomerToken(accessToken);

            // Fetch customer details
            await getCustomer();

            return {
                success: true
            };
        } catch (error) {
            console.error('Error resetting password:', error);
            return {
                success: false,
                errors: [{ message: error.message }]
            };
        }
    }

    /**
     * Get customer orders
     */
    async function getOrders(first = 10, after = null) {
        const accessToken = getCustomerToken();

        if (!accessToken) {
            return {
                orders: [],
                pageInfo: { hasNextPage: false }
            };
        }

        try {
            const { customer } = await storefront.query(CUSTOMER_ORDERS_QUERY, {
                variables: {
                    customerAccessToken: accessToken,
                    first,
                    after
                },
                cache: CacheNone()
            });

            if (!customer?.orders) {
                return {
                    orders: [],
                    pageInfo: { hasNextPage: false }
                };
            }

            return {
                orders: customer.orders.edges.map(edge => edge.node),
                pageInfo: customer.orders.pageInfo
            };
        } catch (error) {
            console.error('Error fetching orders:', error);
            return {
                orders: [],
                pageInfo: { hasNextPage: false }
            };
        }
    }

    /**
     * Check if customer is logged in
     */
    function isLoggedIn() {
        return !!getCustomerToken();
    }

    /**
     * Update the customer store
     */
    function updateCustomerStore(customer) {
        if (browser) {
            customerStore.set(customer);
        }
    }

    // Initialize: try to load customer on initialization
    if (browser) {
        getCustomer();
    }

    return {
        getCustomer,
        login,
        logout,
        register,
        updateCustomer,
        createAddress,
        updateAddress,
        deleteAddress,
        setDefaultAddress,
        recoverPassword,
        resetPassword,
        getOrders,
        isLoggedIn,
        customerStore
    };
}

/**
 * Default function to get customer token from cookies
 */
export function customerTokenGetDefault(cookies) {
    if (browser) {
        return () => {
            return document.cookie.split('; ').find(row => row.startsWith(`${CUSTOMER_TOKEN_COOKIE}=`))?.split('=')[1];
        };
    }

    return () => {
        return cookies.get(CUSTOMER_TOKEN_COOKIE);
    };
}

/**
 * Default function to set customer token in cookies
 */
export function customerTokenSetDefault(cookies) {
    return (token) => {
        if (browser) {
            document.cookie = `${CUSTOMER_TOKEN_COOKIE}=${token}; path=/; max-age=${60 * 60 * 24 * 14}`; // 14 days
            return;
        }

        cookies.set(CUSTOMER_TOKEN_COOKIE, token, {
            path: '/',
            maxAge: 60 * 60 * 24 * 14, // 14 days
            httpOnly: true,
            secure: true,
            sameSite: 'lax'
        });
    };
}

/**
 * Default function to remove customer token from cookies
 */
export function customerTokenRemoveDefault(cookies) {
    return () => {
        if (browser) {
            document.cookie = `${CUSTOMER_TOKEN_COOKIE}=; path=/; max-age=0`;
            return;
        }

        cookies.delete(CUSTOMER_TOKEN_COOKIE, {
            path: '/'
        });
    };
}