/**
 * i18n configuration for the Shopify storefront
 * Defines supported locales, countries, and utility functions
 */

// Format: { code: 'Language name' }
export const SUPPORTED_LANGUAGES = {
    'en': 'English',
    'de': 'Deutsch',
    'fr': 'Français',
    'es': 'Español',
    'it': 'Italiano'
};

// Format: { code: 'Country name' }
export const SUPPORTED_COUNTRIES = {
    'us': 'United States',
    'ca': 'Canada',
    'de': 'Germany',
    'at': 'Austria',
    'ch': 'Switzerland',
    'fr': 'France',
    'es': 'Spain',
    'it': 'Italy',
    'gb': 'United Kingdom'
};

// Map language code to Shopify language code
export const LANGUAGE_MAP = {
    'en': 'EN',
    'de': 'DE',
    'fr': 'FR',
    'es': 'ES',
    'it': 'IT'
};

// Map country code to Shopify country code
export const COUNTRY_MAP = {
    'us': 'US',
    'ca': 'CA',
    'de': 'DE',
    'at': 'AT',
    'ch': 'CH',
    'fr': 'FR',
    'es': 'ES',
    'it': 'IT',
    'gb': 'GB'
};

// Default locale used when no locale is specified
export const DEFAULT_LOCALE = {
    country: 'us',
    language: 'en'
};

// Whether the store supports multiple languages and countries
export const MULTILINGUAL = true;

/**
 * Returns all supported locales as country-language combinations
 * Used for generating static routes
 */
export function getSupportedLocales() {
    const locales = [];

    Object.keys(SUPPORTED_COUNTRIES).forEach(country => {
        Object.keys(SUPPORTED_LANGUAGES).forEach(language => {
            locales.push({ country, language });
        });
    });

    return locales;
}

/**
 * Get a display name for a locale
 */
export function getLocaleDisplayName(country, language) {
    const countryName = SUPPORTED_COUNTRIES[country] || '';
    const languageName = SUPPORTED_LANGUAGES[language] || '';

    return `${countryName} (${languageName})`;
}

/**
 * Check if a locale is supported
 */
export function isLocaleSupported(country, language) {
    return SUPPORTED_COUNTRIES[country] && SUPPORTED_LANGUAGES[language];
}

/**
 * Format a locale for URLs (country-language)
 */
export function formatLocaleForUrl(locale) {
    return `${locale.country}-${locale.language}`;
}

/**
 * Parse a locale string from URL (country-language)
 */
export function parseLocaleFromUrl(localeStr) {
    const [country, language] = localeStr.split('-');

    if (isLocaleSupported(country, language)) {
        return { country, language };
    }

    return DEFAULT_LOCALE;
}

/**
 * Get Shopify API format locale
 */
export function getShopifyLocale(locale) {
    return {
        country: COUNTRY_MAP[locale.country] || COUNTRY_MAP[DEFAULT_LOCALE.country],
        language: LANGUAGE_MAP[locale.language] || LANGUAGE_MAP[DEFAULT_LOCALE.language]
    };
}