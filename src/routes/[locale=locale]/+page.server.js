import { createProductAPI } from '$lib/api/product';
import { createCollectionAPI } from '$lib/api/collection';

/**
 * Load homepage data from Shopify
 */
export async function load({ locals, params }) {
    const { storefront } = locals;

    // Create API instances
    const productAPI = createProductAPI(storefront);
    const collectionAPI = createCollectionAPI(storefront);

    // Fetch featured products and collections
    const featuredProductsPromise = productAPI.getFeaturedProducts(8);
    const featuredCollectionsPromise = collectionAPI.getFeaturedCollections(4);

    // Wait for all promises to resolve
    const [featuredProducts, featuredCollections] = await Promise.all([
        featuredProductsPromise,
        featuredCollectionsPromise,
    ]);

    return {
        featuredProducts,
        featuredCollections,
        locale: locals.locale
    };
}