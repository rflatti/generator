import { MULTILINGUAL } from '$lib/i18n/config';

/**
 * This function runs on both server and client
 * It's used to pass the locale data to layout.svelte
 */
export function load({ data }) {
    return {
        multilingual: MULTILINGUAL,
        locale: data.locale
    };
}

// Make sure to prerender all routes if dynamic URLs are used
export const prerender = false;