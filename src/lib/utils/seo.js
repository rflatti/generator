/**
 * SEO utilities for Shopify storefront
 */

/**
 * Truncate a string to a given length, adding an ellipsis if it was truncated
 * @param {string} str - The string to truncate
 * @param {number} [num=155] - The maximum length of the string
 * @returns {string} The truncated string
 */
function truncate(str, num = 155) {
    if (typeof str !== 'string') return '';
    if (str.length <= num) return str;
    return str.slice(0, num - 3) + '...';
}

/**
 * Generate basic SEO metadata
 * @param {Object} options - SEO options
 * @param {string} options.title - Page title
 * @param {string} [options.description] - Page description
 * @param {string} [options.url] - Page URL
 * @param {Object} [options.image] - Image data
 * @param {string} [options.siteName] - Site name
 * @param {string} [options.handle] - Resource handle
 * @returns {Object} SEO metadata
 */
export function generateSeoMetadata({
                                        title,
                                        description = '',
                                        url = '',
                                        image = null,
                                        siteName = '',
                                        handle = '',
                                    }) {
    // Basic SEO
    const seo = {
        title: title || siteName || '',
        description: truncate(description),
        url,
    };

    // OpenGraph data
    const openGraph = {
        title: seo.title,
        description: seo.description,
        type: 'website',
        url: seo.url,
        site_name: siteName,
    };

    // Twitter data
    const twitter = {
        card: image ? 'summary_large_image' : 'summary',
        title: seo.title,
        description: seo.description,
    };

    // Add image data if available
    if (image) {
        openGraph.images = [{
            url: image.url,
            width: image.width,
            height: image.height,
            alt: image.altText || seo.title,
        }];

        twitter.image = image.url;
        twitter.image_alt = image.altText || seo.title;
    }

    return {
        title: seo.title,
        description: seo.description,
        canonical: seo.url,
        openGraph,
        twitter,
    };
}

/**
 * Generate product SEO metadata
 * @param {Object} options - Product SEO options
 * @param {Object} options.product - Product data
 * @param {Object} [options.selectedVariant] - Selected variant data
 * @param {string} [options.url] - Page URL
 * @param {string} [options.siteName] - Site name
 * @returns {Object} Product SEO metadata
 */
export function generateProductSeo({ product, selectedVariant, url = '', siteName = '' }) {
    if (!product) return {};

    const title = product.seo?.title || product.title;
    const description = product.seo?.description || product.description;

    // Get image from selected variant or first product image
    const variantImage = selectedVariant?.image;
    const firstProductImage = product.media?.nodes?.[0]?.image;
    const image = variantImage || firstProductImage;

    return generateSeoMetadata({
        title,
        description,
        handle: product.handle,
        url,
        image,
        siteName,
    });
}

/**
 * Generate collection SEO metadata
 * @param {Object} options - Collection SEO options
 * @param {Object} options.collection - Collection data
 * @param {string} [options.url] - Page URL
 * @param {string} [options.siteName] - Site name
 * @returns {Object} Collection SEO metadata
 */
export function generateCollectionSeo({ collection, url = '', siteName = '' }) {
    if (!collection) return {};

    const title = collection.seo?.title || collection.title;
    const description = collection.seo?.description || collection.description;

    return generateSeoMetadata({
        title,
        description,
        handle: collection.handle,
        url,
        image: collection.image,
        siteName,
    });
}

/**
 * Generate page SEO metadata
 * @param {Object} options - Page SEO options
 * @param {Object} options.page - Page data
 * @param {string} [options.url] - Page URL
 * @param {string} [options.siteName] - Site name
 * @returns {Object} Page SEO metadata
 */
export function generatePageSeo({ page, url = '', siteName = '' }) {
    if (!page) return {};

    const title = page.seo?.title || page.title;
    const description = page.seo?.description;

    return generateSeoMetadata({
        title,
        description,
        handle: page.handle,
        url,
        siteName,
    });
}

/**
 * Generate article SEO metadata
 * @param {Object} options - Article SEO options
 * @param {Object} options.article - Article data
 * @param {string} [options.url] - Page URL
 * @param {string} [options.siteName] - Site name
 * @returns {Object} Article SEO metadata
 */
export function generateArticleSeo({ article, url = '', siteName = '' }) {
    if (!article) return {};

    const title = article.seo?.title || article.title;
    const description = article.seo?.description || article.excerpt;

    return generateSeoMetadata({
        title,
        description,
        handle: article.handle,
        url,
        image: article.image,
        siteName,
    });
}

/**
 * Generate search SEO metadata
 * @param {Object} options - Search SEO options
 * @param {string} options.term - Search term
 * @param {string} [options.url] - Page URL
 * @param {string} [options.siteName] - Site name
 * @returns {Object} Search SEO metadata
 */
export function generateSearchSeo({ term, url = '', siteName = '' }) {
    const title = term ? `Search results for "${term}"` : 'Search';
    const description = term
        ? `Search results for "${term}" at ${siteName}`
        : `Search for products at ${siteName}`;

    return generateSeoMetadata({
        title,
        description,
        url,
        siteName,
    });
}

/**
 * Generate home page SEO metadata
 * @param {Object} options - Home SEO options
 * @param {Object} options.shop - Shop data
 * @param {string} [options.url] - Page URL
 * @returns {Object} Home SEO metadata
 */
export function generateHomeSeo({ shop, url = '' }) {
    if (!shop) return {};

    return generateSeoMetadata({
        title: shop.name,
        description: shop.description,
        url,
        siteName: shop.name,
    });
}