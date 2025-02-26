/**
 * Collection API for Shopify Storefront
 * Handles collection queries and operations
 */

import { CacheLong, CacheShort } from './storefront';
import { PRODUCT_CARD_FRAGMENT } from './product';

// Collection fragment
export const COLLECTION_FRAGMENT = `#graphql
  fragment Collection on Collection {
    id
    title
    handle
    description
    seo {
      description
      title
    }
    image {
      id
      url
      width
      height
      altText
    }
  }
`;

// Collection with products fragment
export const COLLECTION_WITH_PRODUCTS_FRAGMENT = `#graphql
  fragment CollectionWithProducts on Collection {
    id
    title
    handle
    description
    seo {
      description
      title
    }
    image {
      id
      url
      width
      height
      altText
    }
    products(
      first: $first,
      last: $last,
      before: $startCursor,
      after: $endCursor,
      filters: $filters,
      sortKey: $sortKey,
      reverse: $reverse
    ) {
      filters {
        id
        label
        type
        values {
          id
          label
          count
          input
        }
      }
      nodes {
        ...ProductCard
      }
      pageInfo {
        hasPreviousPage
        hasNextPage
        endCursor
        startCursor
      }
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
`;

// Query to get a collection by handle
const COLLECTION_QUERY = `#graphql
  query Collection(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
    $filters: [ProductFilter!]
    $sortKey: ProductCollectionSortKeys!
    $reverse: Boolean
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      ...CollectionWithProducts
    }
  }
  ${COLLECTION_WITH_PRODUCTS_FRAGMENT}
`;

// Query to get all collections
const ALL_COLLECTIONS_QUERY = `#graphql
  query Collections(
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(country: $country, language: $language) {
    collections(first: $first, last: $last, before: $startCursor, after: $endCursor) {
      nodes {
        ...Collection
      }
      pageInfo {
        hasPreviousPage
        hasNextPage
        startCursor
        endCursor
      }
    }
  }
  ${COLLECTION_FRAGMENT}
`;

// Query to get featured collections
const FEATURED_COLLECTIONS_QUERY = `#graphql
  query FeaturedCollections(
    $country: CountryCode
    $language: LanguageCode
    $first: Int
  ) @inContext(country: $country, language: $language) {
    collections(
      first: $first,
      sortKey: UPDATED_AT
    ) {
      nodes {
        id
        title
        handle
        image {
          altText
          width
          height
          url
        }
      }
    }
  }
`;

/**
 * Collection API methods
 */
export function createCollectionAPI(storefront) {
    /**
     * Get a collection by handle with its products
     */
    async function getCollection(handle, {
        filters = [],
        sortKey = 'RELEVANCE',
        reverse = false,
        first = 20,
        last,
        startCursor,
        endCursor
    } = {}) {
        if (!handle) {
            throw new Error('Collection handle is required');
        }

        try {
            const { collection } = await storefront.query(COLLECTION_QUERY, {
                variables: {
                    handle,
                    filters,
                    sortKey,
                    reverse,
                    first,
                    last,
                    startCursor,
                    endCursor
                },
                cache: CacheShort()
            });

            return collection;
        } catch (error) {
            console.error('Error fetching collection:', error);
            throw error;
        }
    }

    /**
     * Get all collections with pagination
     */
    async function getAllCollections({ first = 20, last, startCursor, endCursor } = {}) {
        try {
            const { collections } = await storefront.query(ALL_COLLECTIONS_QUERY, {
                variables: {
                    first,
                    last,
                    startCursor,
                    endCursor
                },
                cache: CacheLong()
            });

            return collections;
        } catch (error) {
            console.error('Error fetching all collections:', error);
            throw error;
        }
    }

    /**
     * Get featured collections
     */
    async function getFeaturedCollections(count = 4) {
        try {
            const { collections } = await storefront.query(FEATURED_COLLECTIONS_QUERY, {
                variables: {
                    first: count
                },
                cache: CacheLong()
            });

            return collections.nodes;
        } catch (error) {
            console.error('Error fetching featured collections:', error);
            return [];
        }
    }

    /**
     * Helper method to parse filter parameters
     */
    function parseFilters(params = {}) {
        const filters = [];

        for (const [key, value] of Object.entries(params)) {
            if (key.startsWith('filter.')) {
                const filterKey = key.replace('filter.', '');

                try {
                    if (filterKey === 'price') {
                        // Handle price range filter
                        const priceFilter = JSON.parse(value);
                        filters.push({
                            price: {
                                min: priceFilter.min,
                                max: priceFilter.max
                            }
                        });
                    } else {
                        // Handle other filters
                        filters.push({
                            [filterKey]: JSON.parse(value)
                        });
                    }
                } catch (e) {
                    console.error(`Error parsing filter ${key}:`, e);
                }
            }
        }

        return filters;
    }

    /**
     * Parse sort parameter to Shopify's expected format
     */
    function parseSortKey(sort) {
        const sortMap = {
            'price-low-high': { sortKey: 'PRICE', reverse: false },
            'price-high-low': { sortKey: 'PRICE', reverse: true },
            'best-selling': { sortKey: 'BEST_SELLING', reverse: false },
            'newest': { sortKey: 'CREATED', reverse: true },
            'featured': { sortKey: 'MANUAL', reverse: false },
        };

        return sortMap[sort] || { sortKey: 'RELEVANCE', reverse: false };
    }

    return {
        getCollection,
        getAllCollections,
        getFeaturedCollections,
        parseFilters,
        parseSortKey
    };
}