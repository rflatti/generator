/**
 * Server-side load function for layout
 * Passes locale data from hooks to components
 */
export function load({ locals }) {
    return {
        locale: locals.locale
    };
}