/**
 * Cart handler for Shopify Storefront API
 * Handles cart operations and state management
 */

import { browser } from '$app/environment';
import { writable, get } from 'svelte/store';
import { CacheNone } from './storefront';

// Create a Svelte store for the cart
export const cartStore = writable(null);

// Cart ID cookie name
const CART_COOKIE = 'shopify_cart_id';

// Fragments for cart queries
const CART_FRAGMENT = `#graphql
  fragment CartFragment on Cart {
    id
    checkoutUrl
    totalQuantity
    buyerIdentity {
      countryCode
      customer {
        id
        email
        firstName
        lastName
        displayName
      }
      email
      phone
    }
    lines(first: 100) {
      edges {
        node {
          id
          quantity
          attributes {
            key
            value
          }
          cost {
            totalAmount {
              amount
              currencyCode
            }
            subtotalAmount {
              amount
              currencyCode
            }
            amountPerQuantity {
              amount
              currencyCode
            }
          }
          merchandise {
            ... on ProductVariant {
              id
              title
              selectedOptions {
                name
                value
              }
              product {
                id
                title
                handle
                vendor
              }
              image {
                id
                url
                altText
                width
                height
              }
              price {
                amount
                currencyCode
              }
              compareAtPrice {
                amount
                currencyCode
              }
            }
          }
        }
      }
    }
    cost {
      subtotalAmount {
        amount
        currencyCode
      }
      totalAmount {
        amount
        currencyCode
      }
      totalDutyAmount {
        amount
        currencyCode
      }
      totalTaxAmount {
        amount
        currencyCode
      }
    }
    attributes {
      key
      value
    }
    discountCodes {
      code
      applicable
    }
  }
`;

// Cart queries
const CREATE_CART_MUTATION = `#graphql
  mutation createCart($input: CartInput!) {
    cartCreate(input: $input) {
      cart {
        ...CartFragment
      }
      userErrors {
        field
        message
      }
    }
  }
  ${CART_FRAGMENT}
`;

const ADD_LINES_MUTATION = `#graphql
  mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart {
        ...CartFragment
      }
      userErrors {
        field
        message
      }
    }
  }
  ${CART_FRAGMENT}
`;

const UPDATE_LINES_MUTATION = `#graphql
  mutation cartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart {
        ...CartFragment
      }
      userErrors {
        field
        message
      }
    }
  }
  ${CART_FRAGMENT}
`;

const REMOVE_LINES_MUTATION = `#graphql
  mutation cartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart {
        ...CartFragment
      }
      userErrors {
        field
        message
      }
    }
  }
  ${CART_FRAGMENT}
`;

const UPDATE_DISCOUNT_MUTATION = `#graphql
  mutation cartDiscountCodesUpdate($cartId: ID!, $discountCodes: [String!]!) {
    cartDiscountCodesUpdate(cartId: $cartId, discountCodes: $discountCodes) {
      cart {
        ...CartFragment
      }
      userErrors {
        field
        message
      }
    }
  }
  ${CART_FRAGMENT}
`;

const UPDATE_BUYER_IDENTITY_MUTATION = `#graphql
  mutation cartBuyerIdentityUpdate($cartId: ID!, $buyerIdentity: CartBuyerIdentityInput!) {
    cartBuyerIdentityUpdate(cartId: $cartId, buyerIdentity: $buyerIdentity) {
      cart {
        ...CartFragment
      }
      userErrors {
        field
        message
      }
    }
  }
  ${CART_FRAGMENT}
`;

const GET_CART_QUERY = `#graphql
  query getCart($cartId: ID!) {
    cart(id: $cartId) {
      ...CartFragment
    }
  }
  ${CART_FRAGMENT}
`;

/**
 * Create a cart handler to manage cart operations
 */
export function createCartHandler({ storefront, getCartId, setCartId }) {
    /**
     * Retrieves the current cart
     */
    async function get() {
        const cartId = getCartId();

        if (!cartId) {
            return null;
        }

        try {
            const { cart } = await storefront.query(GET_CART_QUERY, {
                variables: { cartId },
                cache: CacheNone()
            });

            if (!cart) {
                return null;
            }

            updateCartStore(cart);
            return cart;
        } catch (error) {
            console.error('Error fetching cart:', error);
            return null;
        }
    }

    /**
     * Creates a new cart
     */
    async function create({ lines = [], discountCodes = [], buyerIdentity = {} } = {}) {
        try {
            const { cartCreate } = await storefront.query(CREATE_CART_MUTATION, {
                variables: {
                    input: {
                        lines,
                        discountCodes,
                        buyerIdentity
                    }
                },
                cache: CacheNone()
            });

            if (!cartCreate?.cart) {
                throw new Error('Failed to create cart');
            }

            const cart = cartCreate.cart;
            const cartId = cart.id;

            setCartId(cartId);
            updateCartStore(cart);

            return {
                cart,
                errors: cartCreate.userErrors
            };
        } catch (error) {
            console.error('Error creating cart:', error);
            throw error;
        }
    }

    /**
     * Adds lines to the cart
     */
    async function addLines(lines) {
        let cartId = getCartId();

        if (!cartId) {
            const result = await create({ lines });
            return result;
        }

        try {
            const { cartLinesAdd } = await storefront.query(ADD_LINES_MUTATION, {
                variables: {
                    cartId,
                    lines
                },
                cache: CacheNone()
            });

            const cart = cartLinesAdd?.cart;

            if (!cart) {
                throw new Error('Failed to add lines to cart');
            }

            updateCartStore(cart);

            return {
                cart,
                errors: cartLinesAdd.userErrors
            };
        } catch (error) {
            console.error('Error adding lines to cart:', error);
            throw error;
        }
    }

    /**
     * Updates lines in the cart
     */
    async function updateLines(lines) {
        const cartId = getCartId();

        if (!cartId) {
            throw new Error('No cart ID available');
        }

        try {
            const { cartLinesUpdate } = await storefront.query(UPDATE_LINES_MUTATION, {
                variables: {
                    cartId,
                    lines
                },
                cache: CacheNone()
            });

            const cart = cartLinesUpdate?.cart;

            if (!cart) {
                throw new Error('Failed to update cart lines');
            }

            updateCartStore(cart);

            return {
                cart,
                errors: cartLinesUpdate.userErrors
            };
        } catch (error) {
            console.error('Error updating cart lines:', error);
            throw error;
        }
    }

    /**
     * Removes lines from the cart
     */
    async function removeLines(lineIds) {
        const cartId = getCartId();

        if (!cartId) {
            throw new Error('No cart ID available');
        }

        try {
            const { cartLinesRemove } = await storefront.query(REMOVE_LINES_MUTATION, {
                variables: {
                    cartId,
                    lineIds
                },
                cache: CacheNone()
            });

            const cart = cartLinesRemove?.cart;

            if (!cart) {
                throw new Error('Failed to remove cart lines');
            }

            updateCartStore(cart);

            return {
                cart,
                errors: cartLinesRemove.userErrors
            };
        } catch (error) {
            console.error('Error removing cart lines:', error);
            throw error;
        }
    }

    /**
     * Updates discount codes
     */
    async function updateDiscountCodes(discountCodes) {
        const cartId = getCartId();

        if (!cartId) {
            throw new Error('No cart ID available');
        }

        try {
            const { cartDiscountCodesUpdate } = await storefront.query(UPDATE_DISCOUNT_MUTATION, {
                variables: {
                    cartId,
                    discountCodes
                },
                cache: CacheNone()
            });

            const cart = cartDiscountCodesUpdate?.cart;

            if (!cart) {
                throw new Error('Failed to update discount codes');
            }

            updateCartStore(cart);

            return {
                cart,
                errors: cartDiscountCodesUpdate.userErrors
            };
        } catch (error) {
            console.error('Error updating discount codes:', error);
            throw error;
        }
    }

    /**
     * Updates buyer identity
     */
    async function updateBuyerIdentity(buyerIdentity) {
        const cartId = getCartId();

        if (!cartId) {
            throw new Error('No cart ID available');
        }

        try {
            const { cartBuyerIdentityUpdate } = await storefront.query(UPDATE_BUYER_IDENTITY_MUTATION, {
                variables: {
                    cartId,
                    buyerIdentity
                },
                cache: CacheNone()
            });

            const cart = cartBuyerIdentityUpdate?.cart;

            if (!cart) {
                throw new Error('Failed to update buyer identity');
            }

            updateCartStore(cart);

            return {
                cart,
                errors: cartBuyerIdentityUpdate.userErrors
            };
        } catch (error) {
            console.error('Error updating buyer identity:', error);
            throw error;
        }
    }

    /**
     * Update the cart store
     */
    function updateCartStore(cart) {
        if (browser) {
            cartStore.set(cart);
        }
    }

    return {
        get,
        create,
        addLines,
        updateLines,
        removeLines,
        updateDiscountCodes,
        updateBuyerIdentity,
        cartStore
    };
}

/**
 * Default function to get cart ID from cookies
 */
export function cartGetIdDefault(cookies) {
    if (browser) {
        return () => {
            return document.cookie.split('; ').find(row => row.startsWith(`${CART_COOKIE}=`))?.split('=')[1];
        };
    }

    return () => {
        return cookies.get(CART_COOKIE);
    };
}

/**
 * Default function to set cart ID in cookies
 */
export function cartSetIdDefault(cookies) {
    return (cartId) => {
        if (browser) {
            document.cookie = `${CART_COOKIE}=${cartId}; path=/; max-age=${60 * 60 * 24 * 14}`; // 14 days
            return;
        }

        cookies.set(CART_COOKIE, cartId, {
            path: '/',
            maxAge: 60 * 60 * 24 * 14, // 14 days
            httpOnly: true,
            secure: true,
            sameSite: 'lax'
        });
    };
}