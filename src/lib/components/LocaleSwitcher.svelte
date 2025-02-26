<script>
    import { page } from '$app/stores';
    import {
        SUPPORTED_COUNTRIES,
        SUPPORTED_LANGUAGES,
        formatLocaleForUrl,
        getLocaleDisplayName
    } from '$lib/i18n/config';
    import { locale } from '$lib/i18n/translations';

    // Destructure the stores
    $: currentLocale = $locale;
    $: currentPath = $page.url.pathname;

    // Generate the list of available locales
    const availableLocales = [];

    Object.keys(SUPPORTED_COUNTRIES).forEach(country => {
        Object.keys(SUPPORTED_LANGUAGES).forEach(language => {
            availableLocales.push({
                country,
                language,
                displayName: getLocaleDisplayName(country, language)
            });
        });
    });

    // Sort locales by display name
    availableLocales.sort((a, b) => a.displayName.localeCompare(b.displayName));

    // Create a URL for a specific locale
    function getLocaleUrl(country, language) {
        const localePrefix = formatLocaleForUrl({ country, language });

        // If current path already has a locale prefix, replace it
        if (currentPath.includes('-')) {
            const pathParts = currentPath.split('/');
            pathParts[1] = localePrefix;
            return pathParts.join('/');
        }

        // Otherwise, add the locale prefix
        return `/${localePrefix}${currentPath === '/' ? '' : currentPath}`;
    }
</script>

<div class="locale-switcher">
    <select
            aria-label="Change locale"
            value={`${currentLocale.country}-${currentLocale.language}`}
            on:change={(e) => {
      const [country, language] = e.target.value.split('-');
      window.location.href = getLocaleUrl(country, language);
    }}
    >
        {#each availableLocales as locale}
            <option value={`${locale.country}-${locale.language}`}>
                {locale.displayName}
            </option>
        {/each}
    </select>
</div>

<style>
    .locale-switcher {
        position: relative;
        display: inline-block;
    }

    select {
        padding: 0.5rem 1rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        background-color: white;
        font-size: 0.875rem;
        cursor: pointer;
        min-width: 180px;
    }

    select:focus {
        outline: none;
        border-color: #0070f3;
        box-shadow: 0 0 0 3px rgba(0, 112, 243, 0.2);
    }
</style>