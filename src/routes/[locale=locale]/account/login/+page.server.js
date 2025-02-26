// src/routes/[locale=locale]/account/login/+page.server.js

/**
 * Server-side load function for login page
 */
export function load({ locals }) {
    return {
        locale: locals.locale
    };
}