import { MULTILINGUAL, getSupportedLocales, isLocaleSupported } from '$lib/i18n/config';

/**
 * Param matcher for locale in URL
 * Matches patterns like "us-en", "de-de", etc. based on supported locales
 * This will be used for dynamic routes like [locale=locale]
 */
export function match(param) {
    // If not multilingual, don't use locale parameter
    if (!MULTILINGUAL) return false;

    // Check if the parameter has the format country-language
    const [country, language] = param.split('-');

    // Verify if both parts exist and the locale is supported
    return country && language && isLocaleSupported(country, language);
}