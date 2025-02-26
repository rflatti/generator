/**
 * Server-side Shopify Storefront API client for SvelteKit
 * This file should only be imported in server-side code
 */

// Cache times (in seconds)
export const CacheNone = () => ({ mode: 'no-store' });
export const CacheShort = () => ({ mode: 'no-store' });
export const CacheLong = () => ({ mode: 'force-cache' });

// Cache control header generator
export function generateCacheControlHeader(cacheStrategy) {
    if (cacheStrategy.mode === 'no-store') {
        return 'no-store, no-cache, must-revalidate';
    } else if (cacheStrategy.mode === 'force-cache') {
        return `public, max-age=${60 * 60 * 24}, s-maxage=${60 * 60 * 24}`;
    }
    return '';
}

export class StorefrontAPI {
    constructor(options = {}) {
        const {
            storeDomain,
            privateStorefrontToken,
            apiVersion = '2025-01', // Use the latest API version
            language = 'EN',
            country = 'US'
        } = options;

        // Ensure domain has protocol
        this.domain = storeDomain.includes('://')
            ? storeDomain
            : `https://${storeDomain}`;

        this.privateToken = privateStorefrontToken;
        this.apiVersion = apiVersion;

        // Internationalization
        this.i18n = {
            language,
            country
        };
    }

    /**
     * Creates the fetch options for the Storefront API request
     */
    createFetchOptions(query, { variables = {}, cache = CacheLong() } = {}) {
        // Always inject i18n context
        if (variables) {
            variables = {
                ...variables,
                country: this.i18n.country,
                language: this.i18n.language,
            };
        }

        return {
            method: 'POST',
            headers: {
                'X-Shopify-Storefront-Access-Token': this.privateToken,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...(cache ? { 'Cache-Control': generateCacheControlHeader(cache) } : {})
            },
            body: JSON.stringify({
                query,
                variables
            })
        };
    }

    /**
     * Execute a Storefront API query
     */
    async query(query, { variables = {}, cache = CacheLong() } = {}) {
        const url = `${this.domain}/api/${this.apiVersion}/graphql.json`;
        const options = this.createFetchOptions(query, { variables, cache });

        try {
            const response = await fetch(url, options);

            if (!response.ok) {
                throw new Error(`Shopify API error: ${response.statusText}`);
            }

            const json = await response.json();

            if (json.errors) {
                throw new Error(
                    `Shopify GraphQL error: ${json.errors.map(e => e.message).join(', ')}`
                );
            }

            return json.data;
        } catch (error) {
            console.error('Storefront API error:', error);
            throw error;
        }
    }

    /**
     * Set internationalization context
     */
    setI18n(language, country) {
        this.i18n = { language, country };
        return this;
    }
}

/**
 * Create a Storefront API instance for server-side use
 */
export function createServerStorefront(options = {}) {
    return new StorefrontAPI(options);
}