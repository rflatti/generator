// src/routes/[locale=locale]/account/register/+page.server.js

/**
 * Server-side load function for register page
 */
export function load({ locals }) {
    return {
        locale: locals.locale
    };
}