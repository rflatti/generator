/**
 * Client-side Shopify Storefront API client for SvelteKit
 * This is a simplified version that only uses PUBLIC environment variables
 */

import { env } from '$env/dynamic/public';
import { browser } from '$app/environment';

// Cache times
export const CacheNone = () => ({ mode: 'no-store' });
export const CacheShort = () => ({ mode: 'no-store' });
export const CacheLong = () => ({ mode: 'force-cache' });

export class ClientStorefrontAPI {
    constructor(options = {}) {
        const {
            storeDomain = env.PUBLIC_STORE_DOMAIN,
            publicStorefrontToken = env.PUBLIC_STOREFRONT_API_TOKEN,
            apiVersion = '2025-01',
            language = 'EN',
            country = 'US'
        } = options;

        // Ensure domain has protocol
        this.domain = storeDomain.includes('://')
            ? storeDomain
            : `https://${storeDomain}`;

        this.publicToken = publicStorefrontToken;
        this.apiVersion = apiVersion;

        // Internationalization defaults
        this.i18n = {
            language,
            country
        };

        // Cache for browser-side data
        this.cache = new Map();
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
                'X-Shopify-Storefront-Access-Token': this.publicToken,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                query,
                variables
            })
        };
    }

    /**
     * Execute a Storefront API query
     /**
     * Update the query method in src/lib/api/storefront.client.js to fix the cacheKey issue
     */
    async query(query, { variables = {}, cache = CacheLong() } = {}) {
        const url = `${this.domain}/api/${this.apiVersion}/graphql.json`;
        const options = this.createFetchOptions(query, { variables, cache });

        // Generate a cache key (this was missing)
        const cacheKey = browser && cache.mode !== 'no-store' ?
            `${query}${JSON.stringify(variables)}` : null;

        // Return cached data if available (browser only)
        if (browser && cacheKey && this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            console.log('Sending request to Shopify API...');
            const response = await fetch(url, options);

            if (!response.ok) {
                console.error('Shopify API error status:', response.status, response.statusText);
                throw new Error(`Shopify API error: ${response.statusText}`);
            }

            const json = await response.json();
            console.log('Received response from Shopify API', json);

            if (json.errors) {
                console.error('Shopify GraphQL errors:', json.errors);
                throw new Error(
                    `Shopify GraphQL error: ${json.errors.map(e => e.message).join(', ')}`
                );
            }

            // Cache the response if appropriate
            if (browser && cacheKey) {
                this.cache.set(cacheKey, json.data);
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

    /**
     * Clear the cache
     */
    clearCache() {
        this.cache.clear();
    }
}

// Singleton instance for use throughout the app
let clientStorefrontInstance;

/**
 * Get or create the Storefront API client
 */
export function createClientStorefront(options = {}) {
    if (!browser) {
        throw new Error('createClientStorefront should only be called in browser context');
    }

    if (!clientStorefrontInstance || options.forceNew) {
        clientStorefrontInstance = new ClientStorefrontAPI(options);
    } else if (options.i18n) {
        clientStorefrontInstance.setI18n(options.i18n.language, options.i18n.country);
    }

    return {
        storefront: clientStorefrontInstance
    };
}