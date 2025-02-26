import { createCollectionAPI } from '$lib/api/collection';

/**
 * Load all collections data from Shopify
 */
export async function load({ locals, params, url }) {
    const { storefront } = locals;

    // Parse query params
    const cursor = url.searchParams.get('cursor');

    // Create API instance
    const collectionAPI = createCollectionAPI(storefront);

    try {
        // Get collections with pagination
        const collections = await collectionAPI.getAllCollections({
            first: 12,
            ...(cursor ? { after: cursor } : {})
        });

        return {
            collections,
            locale: locals.locale
        };
    } catch (err) {
        console.error('Error loading collections:', err);
        return {
            collections: { nodes: [], pageInfo: { hasNextPage: false } },
            locale: locals.locale
        };
    }
}