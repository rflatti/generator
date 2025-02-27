// src/lib/api/customer-metafields.js

/**
 * API for managing customer metafields in Shopify
 * This extends the customer API to add metafield functionality
 */

// GraphQL fragments and queries
const METAFIELD_FRAGMENT = `#graphql
  fragment MetafieldFragment on Metafield {
    id
    namespace
    key
    value
    type
  }
`;

// Query to get customer metafields
const GET_CUSTOMER_METAFIELDS_QUERY = `#graphql
  query GetCustomerMetafields($customerAccessToken: String!, $identifiers: [HasMetafieldsIdentifier!]!) {
    customer(customerAccessToken: $customerAccessToken) {
      id
      metafields(identifiers: $identifiers) {
        ...MetafieldFragment
      }
    }
  }
  ${METAFIELD_FRAGMENT}
`;

// Mutation to set metafields
const SET_METAFIELD_MUTATION = `#graphql
  mutation SetMetafield($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields {
        ...MetafieldFragment
      }
      userErrors {
        field
        message
      }
    }
  }
  ${METAFIELD_FRAGMENT}
`;

// Mutation to delete metafields
const DELETE_METAFIELD_MUTATION = `#graphql
  mutation DeleteMetafield($input: MetafieldDeleteInput!) {
    metafieldDelete(input: $input) {
      deletedId
      userErrors {
        field
        message
      }
    }
  }
`;

/**
 * Create customer metafields API
 * @param {Object} customerAPI - Base customer API
 * @param {Object} storefront - Storefront API client
 * @returns {Object} Extended API with metafield methods
 */
export function createCustomerMetafieldsAPI(customerAPI, storefront) {
    /**
     * Get customer metafields
     * @param {Array} identifiers - Array of metafield identifiers {namespace, key}
     * @returns {Array} Array of metafields
     */
    async function getCustomerMetafields(identifiers) {
        if (!customerAPI.isLoggedIn()) {
            return [];
        }

        try {
            const token = customerAPI.getCustomerToken();

            const { customer } = await storefront.query(GET_CUSTOMER_METAFIELDS_QUERY, {
                variables: {
                    customerAccessToken: token,
                    identifiers: identifiers.map(id => ({
                        namespace: id.namespace,
                        key: id.key
                    }))
                },
                cache: { mode: 'no-store' }
            });

            if (!customer || !customer.metafields) {
                return [];
            }

            return customer.metafields;
        } catch (error) {
            console.error('Error fetching customer metafields:', error);
            return [];
        }
    }

    /**
     * Update a customer metafield
     * @param {Object} metafield - Metafield data {namespace, key, value, type}
     * @returns {Object} Result with success flag and errors
     */
    async function updateCustomerMetafield({ namespace, key, value, type = 'string' }) {
        if (!customerAPI.isLoggedIn()) {
            return { success: false, errors: [{ message: 'Customer not logged in' }] };
        }

        try {
            // First get the customer ID
            const customer = await customerAPI.getCustomer();

            if (!customer) {
                return { success: false, errors: [{ message: 'Could not retrieve customer data' }] };
            }

            // Now set the metafield
            const result = await storefront.query(SET_METAFIELD_MUTATION, {
                variables: {
                    metafields: [
                        {
                            ownerId: customer.id,
                            namespace,
                            key,
                            value,
                            type
                        }
                    ]
                },
                cache: { mode: 'no-store' }
            });

            const { metafieldsSet } = result;

            if (metafieldsSet.userErrors && metafieldsSet.userErrors.length > 0) {
                return {
                    success: false,
                    errors: metafieldsSet.userErrors
                };
            }

            return {
                success: true,
                metafield: metafieldsSet.metafields[0]
            };
        } catch (error) {
            console.error('Error updating customer metafield:', error);
            return {
                success: false,
                errors: [{ message: error.message || 'Unknown error updating metafield' }]
            };
        }
    }

    /**
     * Delete a customer metafield
     * @param {string} id - Metafield ID to delete
     * @returns {Object} Result with success flag and errors
     */
    async function deleteCustomerMetafield(id) {
        if (!customerAPI.isLoggedIn()) {
            return { success: false, errors: [{ message: 'Customer not logged in' }] };
        }

        try {
            const result = await storefront.query(DELETE_METAFIELD_MUTATION, {
                variables: {
                    input: {
                        id
                    }
                },
                cache: { mode: 'no-store' }
            });

            const { metafieldDelete } = result;

            if (metafieldDelete.userErrors && metafieldDelete.userErrors.length > 0) {
                return {
                    success: false,
                    errors: metafieldDelete.userErrors
                };
            }

            return {
                success: true,
                deletedId: metafieldDelete.deletedId
            };
        } catch (error) {
            console.error('Error deleting customer metafield:', error);
            return {
                success: false,
                errors: [{ message: error.message || 'Unknown error deleting metafield' }]
            };
        }
    }

    // Return the extended API
    return {
        ...customerAPI,
        getCustomerMetafields,
        updateCustomerMetafield,
        deleteCustomerMetafield
    };
}