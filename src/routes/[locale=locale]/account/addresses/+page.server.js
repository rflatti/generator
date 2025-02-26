// src/routes/[locale=locale]/account/addresses/+page.server.js

/**
 * Server-side load function for addresses page
 */
export function load({ locals }) {
    return {
        locale: locals.locale
    };
}