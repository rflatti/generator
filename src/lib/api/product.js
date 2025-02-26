/**
 * Product API for Shopify Storefront
 * Handles product queries and operations
 */

import { CacheLong, CacheShort } from './storefront';

// Product card fragment for consistent product data
export const PRODUCT_CARD_FRAGMENT = `#graphql
  fragment ProductCard on Product {
    id
    title
    publishedAt
    handle
    vendor
    variants(first: 1) {
      nodes {
        id
        availableForSale
        image {
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
        selectedOptions {
          name
          value
        }
        product {
          handle
          title
        }
      }
    }
  }
`;

// Media fragment for product media
export const MEDIA_FRAGMENT = `#graphql
  fragment Media on Media {
    __typename
    mediaContentType
    alt
    previewImage {
      url
    }
    ... on MediaImage {
      id
      image {
        id
        url
        width
        height
      }
    }
    ... on Video {
      id
      sources {
        mimeType
        url
      }
    }
    ... on Model3d {
      id
      sources {
        mimeType
        url
      }
    }
    ... on ExternalVideo {
      id
      embedUrl
      host
    }
  }
`;

// Product fragment for detailed product info
export const PRODUCT_FRAGMENT = `#graphql
  fragment Product on Product {
    id
    title
    vendor
    handle
    descriptionHtml
    description
    options {
      name
      values
    }
    selectedVariant: variantBySelectedOptions(selectedOptions: $selectedOptions) {
      id
      availableForSale
      selectedOptions {
        name
        value
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
      sku
      title
      unitPrice {
        amount
        currencyCode
      }
      product {
        title
        handle
      }
    }
    variants(first: 250) {
      nodes {
        id
        availableForSale
        selectedOptions {
          name
          value
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
        sku
        title
        unitPrice {
          amount
          currencyCode
        }
        product {
          title
          handle
        }
      }
    }
    seo {
      description
      title
    }
    media(first: 7) {
      nodes {
        ...Media
      }
    }
  }
  ${MEDIA_FRAGMENT}
`;

// Product query to get a specific product by handle
const PRODUCT_QUERY = `#graphql
  query Product(
    $country: CountryCode
    $language: LanguageCode
    $handle: String!
    $selectedOptions: [SelectedOptionInput!]!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      ...Product
    }
    shop {
      name
      primaryDomain {
        url
      }
      shippingPolicy {
        body
        handle
      }
      refundPolicy {
        body
        handle
      }
    }
  }
  ${PRODUCT_FRAGMENT}
`;

// Query to get all products
const ALL_PRODUCTS_QUERY = `#graphql
  query AllProducts(
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(country: $country, language: $language) {
    products(first: $first, last: $last, before: $startCursor, after: $endCursor) {
      nodes {
        ...ProductCard
      }
      pageInfo {
        hasPreviousPage
        hasNextPage
        startCursor
        endCursor
      }
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
`;

// Query for product recommendations
const PRODUCT_RECOMMENDATIONS_QUERY = `#graphql
  query ProductRecommendations(
    $productId: ID!
    $count: Int
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    recommended: productRecommendations(productId: $productId) {
      ...ProductCard
    }
    additional: products(first: $count, sortKey: BEST_SELLING) {
      nodes {
        ...ProductCard
      }
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
`;

// Query for featured products
const FEATURED_PRODUCTS_QUERY = `#graphql
  query FeaturedProducts(
    $country: CountryCode
    $language: LanguageCode
    $first: Int
  ) @inContext(country: $country, language: $language) {
    products(first: $first, sortKey: BEST_SELLING) {
      nodes {
        ...ProductCard
      }
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
`;

// Search products query
const SEARCH_PRODUCTS_QUERY = `#graphql
  query SearchProducts(
    $searchTerm: String!
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(country: $country, language: $language) {
    products(
      first: $first,
      last: $last,
      before: $startCursor,
      after: $endCursor,
      sortKey: RELEVANCE,
      query: $searchTerm
    ) {
      nodes {
        ...ProductCard
      }
      pageInfo {
        startCursor
        endCursor
        hasNextPage
        hasPreviousPage
      }
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
`;

/**
 * Product API methods
 */
export function createProductAPI(storefront) {
    /**
     * Get a product by handle with selected options
     */
    async function getProduct(handle, selectedOptions = []) {
        if (!handle) {
            throw new Error('Product handle is required');
        }

        try {
            const { product, shop } = await storefront.query(PRODUCT_QUERY, {
                variables: {
                    handle,
                    selectedOptions,
                },
                cache: CacheShort()
            });

            return { product, shop };
        } catch (error) {
            console.error('Error fetching product:', error);
            throw error;
        }
    }

    /**
     * Get product recommendations
     */
    async function getProductRecommendations(productId, count = a12) {
        if (!productId) {
            throw new Error('Product ID is required');
        }

        try {
            const data = await storefront.query(PRODUCT_RECOMMENDATIONS_QUERY, {
                variables: {
                    productId,
                    count
                },
                cache: CacheLong()
            });

            return data;
        } catch (error) {
            console.error('Error fetching product recommendations:', error);
            return { recommended: [], additional: { nodes: [] } };
        }
    }

    /**
     * Get featured products
     */
    async function getFeaturedProducts(count = 12) {
        try {
            const { products } = await storefront.query(FEATURED_PRODUCTS_QUERY, {
                variables: {
                    first: count
                },
                cache: CacheLong()
            });

            return products.nodes;
        } catch (error) {
            console.error('Error fetching featured products:', error);
            return [];
        }
    }

    /**
     * Get all products with pagination
     */
    async function getAllProducts({ first = 20, last, startCursor, endCursor } = {}) {
        try {
            const { products } = await storefront.query(ALL_PRODUCTS_QUERY, {
                variables: {
                    first,
                    last,
                    startCursor,
                    endCursor
                },
                cache: CacheShort()
            });

            return products;
        } catch (error) {
            console.error('Error fetching all products:', error);
            throw error;
        }
    }

    /**
     * Search products
     */
    async function searchProducts(searchTerm, { first = 20, last, startCursor, endCursor } = {}) {
        if (!searchTerm) {
            return { nodes: [], pageInfo: { hasNextPage: false, hasPreviousPage: false } };
        }

        try {
            const { products } = await storefront.query(SEARCH_PRODUCTS_QUERY, {
                variables: {
                    searchTerm,
                    first,
                    last,
                    startCursor,
                    endCursor
                },
                cache: CacheShort()
            });

            return products;
        } catch (error) {
            console.error('Error searching products:', error);
            throw error;
        }
    }

    /**
     * Helper function to flatten connection data format from Shopify
     */
    function flattenConnection(connection) {
        if (!connection) return [];
        return connection.edges.map(edge => edge.node);
    }

    return {
        getProduct,
        getProductRecommendations,
        getFeaturedProducts,
        getAllProducts,
        searchProducts,
        flattenConnection
    };
}