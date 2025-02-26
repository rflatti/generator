import { redirect } from '@sveltejs/kit';
import { MULTILINGUAL, DEFAULT_LOCALE } from '$lib/i18n/config';

/**
 * Redirect from the root route to the appropriate localized route
 */
export function load() {
    if (MULTILINGUAL) {
        throw redirect(307, `/${DEFAULT_LOCALE.country}-${DEFAULT_LOCALE.language}`);
    }

    // If not multilingual, the root route will be handled by the +page.svelte
    return {};
}