// src/routes/[locale=locale]/account/orders/+page.server.js

/**
 * Server-side load function for orders page
 */
export function load({ locals }) {
    return {
        locale: locals.locale
    };
}