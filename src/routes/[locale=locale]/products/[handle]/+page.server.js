import { error } from '@sveltejs/kit';
import { createProductAPI } from '$lib/api/product';

/**
 * Load product data from Shopify
 */
export async function load({ locals, params }) {
    const { storefront } = locals;
    const { handle } = params;

    // Create API instance
    const productAPI = createProductAPI(storefront);

    try {
        // Get product data
        const { product, shop } = await productAPI.getProduct(handle);

        if (!product) {
            throw error(404, 'Product not found');
        }

        // Get product recommendations
        const recommendations = await productAPI.getProductRecommendations(product.id, 4);

        return {
            product,
            shop,
            recommendations: recommendations.recommended || [],
            locale: locals.locale
        };
    } catch (err) {
        console.error('Error loading product:', err);
        throw error(404, 'Product not found');
    }
}