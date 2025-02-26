import { StorefrontAPI } from '$lib/api/storefront.server.js';
import { MULTILINGUAL, DEFAULT_LOCALE, parseLocaleFromUrl, isLocaleSupported, getShopifyLocale } from '$lib/i18n/config';
import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

/**
 * Handle locale in URL and redirect if necessary
 */
export async function handle({ event, resolve }) {
    // Get the path from the URL
    const path = event.url.pathname;

    // Check if path starts with a locale
    const firstPathPart = path.split('/')[1] || '';
    const hasLocalePrefix = firstPathPart.includes('-');

    if (MULTILINGUAL) {
        // If no locale in URL, redirect to default locale
        if (!hasLocalePrefix && path !== '/') {
            throw redirect(307, `/${DEFAULT_LOCALE.country}-${DEFAULT_LOCALE.language}${path}`);
        }

        // If on root path, redirect to default locale
        if (path === '/') {
            throw redirect(307, `/${DEFAULT_LOCALE.country}-${DEFAULT_LOCALE.language}`);
        }

        // Parse locale from URL
        const locale = hasLocalePrefix ? parseLocaleFromUrl(firstPathPart) : DEFAULT_LOCALE;

        // Set locale in event.locals for use in routes
        event.locals.locale = locale;

        // Set up Storefront API client with the correct locale
        const shopifyLocale = getShopifyLocale(locale);

        // Create a server-side only instance of the Storefront API
        event.locals.storefront = new StorefrontAPI({
            storeDomain: env.PRIVATE_STORE_DOMAIN,
            privateStorefrontToken: env.PRIVATE_STOREFRONT_API_TOKEN,
            language: shopifyLocale.language,
            country: shopifyLocale.country
        });
    } else {
        // If not multilingual, redirect locale paths to non-locale paths
        if (hasLocalePrefix) {
            const redirectPath = '/' + path.split('/').slice(2).join('/');
            throw redirect(307, redirectPath);
        }

        // Set default locale in event.locals
        event.locals.locale = DEFAULT_LOCALE;

        // Set up Storefront API client with the default locale
        const shopifyLocale = getShopifyLocale(DEFAULT_LOCALE);

        // Create a server-side only instance of the Storefront API
        event.locals.storefront = new StorefrontAPI({
            storeDomain: env.PRIVATE_STORE_DOMAIN,
            privateStorefrontToken: env.PRIVATE_STOREFRONT_API_TOKEN,
            language: shopifyLocale.language,
            country: shopifyLocale.country
        });
    }

    return resolve(event);
}