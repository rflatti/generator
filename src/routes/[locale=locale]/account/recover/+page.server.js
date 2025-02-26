// src/routes/[locale=locale]/account/recover/+page.server.js

/**
 * Server-side load function for password recovery page
 */
export function load({ locals }) {
    return {
        locale: locals.locale
    };
}