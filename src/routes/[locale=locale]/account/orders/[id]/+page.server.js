// src/routes/[locale=locale]/account/orders/[id]/+page.server.js

/**
 * Server-side load function for order detail page
 */
export function load({ params, locals }) {
    return {
        params,
        locale: locals.locale
    };
}