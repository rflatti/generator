/**
 * Re-export for backward compatibility
 * This file just re-exports the client version for browser code
 * Server-side code should import directly from storefront.server.js
 */

export {
    ClientStorefrontAPI,
    createClientStorefront as createStorefrontClient,
    CacheLong,
    CacheShort,
    CacheNone
} from './storefront.client.js';