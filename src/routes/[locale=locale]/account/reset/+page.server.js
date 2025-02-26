// src/routes/[locale=locale]/account/reset/+page.server.js

/**
 * Server-side load function for password reset page
 */
export function load({ locals }) {
    return {
        locale: locals.locale
    };
}