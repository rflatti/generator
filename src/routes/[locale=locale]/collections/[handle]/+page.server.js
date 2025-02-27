// src/routes/[locale=locale]/collections/[handle]/+page.server.js

import { error } from '@sveltejs/kit';
import { createCollectionAPI } from '$lib/api/collection';

/**
 * Load collection data from Shopify
 */
export async function load({ locals, params, url }) {
    const { storefront } = locals;
    const { handle } = params;

    // Create API instance
    const collectionAPI = createCollectionAPI(storefront);

    // Parse query parameters
    const searchParams = url.searchParams;
    const sortParam = searchParams.get('sort')?.toLowerCase() || 'featured';
    const cursor = searchParams.get('cursor');
    const filterParams = {};

    // Extract filter parameters from URL
    for (const [key, value] of searchParams.entries()) {
        if (key.startsWith('filter.')) {
            filterParams[key] = value;
        }
    }

    // Log the cursor value to debug pagination issues
    console.log('Pagination cursor:', cursor);

    // Parse sorting and filters
    const { sortKey, reverse } = collectionAPI.parseSortKey(sortParam);
    const filters = collectionAPI.parseFilters(filterParams);

    try {
        // Get collection data with products
        const collection = await collectionAPI.getCollection(handle, {
            sortKey,
            reverse,
            filters,
            first: 12,
            ...(cursor ? { after: cursor } : {})
        });

        if (!collection) {
            throw error(404, 'Collection not found');
        }

        // Log the returned pageInfo for debugging
        console.log('Page Info:', collection.products?.pageInfo);

        return {
            collection,
            sortOption: sortParam,
            filters: filterParams,
            locale: locals.locale
        };
    } catch (err) {
        console.error('Error loading collection:', err);
        throw error(404, 'Collection not found');
    }
}