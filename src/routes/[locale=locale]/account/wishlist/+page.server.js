// src/routes/[locale=locale]/account/wishlist/+page.server.js

/**
 * Server-side load function for wishlist page
 */
export function load({ locals }) {
    return {
        locale: locals.locale
    };
}