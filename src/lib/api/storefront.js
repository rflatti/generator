/**
 * Core Shopify Storefront API client for SvelteKit
 * Inspired by Hydrogen's implementation but simplified for SvelteKit
 */

import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import { browser } from '$app/environment';

// Default cache times (in seconds)
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
            storeDomain = publicEnv.PUBLIC_STORE_DOMAIN || env.PRIVATE_STORE_DOMAIN,
            publicStorefrontToken = publicEnv.PUBLIC_STOREFRONT_API_TOKEN,
            privateStorefrontToken = env.PRIVATE_STOREFRONT_API_TOKEN,
            apiVersion = '2025-01', // Use the latest API version
            language = 'EN',
            country = 'US'
        } = options;

        // Ensure domain has protocol
        this.domain = storeDomain.includes('://')
            ? storeDomain
            : `https://${storeDomain}`;

        this.publicToken = publicStorefrontToken;
        this.privateToken = privateStorefrontToken;
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

        // Use the appropriate API token based on environment
        const token = browser ? this.publicToken : (this.privateToken || this.publicToken);

        return {
            method: 'POST',
            headers: {
                'X-Shopify-Storefront-Access-Token': token,
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

        const cacheKey = browser && cache.mode !== 'no-store' ?
            `${query}${JSON.stringify(variables)}` : null;

        // Return cached data if available (browser only)
        if (browser && cacheKey && this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

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
let storefrontInstance;

/**
 * Get or create the Storefront API client
 */
export function createStorefrontClient(options = {}) {
    if (!storefrontInstance || options.forceNew) {
        storefrontInstance = new StorefrontAPI(options);
    } else if (options.i18n) {
        storefrontInstance.setI18n(options.i18n.language, options.i18n.country);
    }

    return {
        storefront: storefrontInstance
    };
}