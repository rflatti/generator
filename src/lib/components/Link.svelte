<script>
    import { page } from '$app/stores';
    import { MULTILINGUAL } from '$lib/i18n/config';
    import { locale } from '$lib/i18n/translations';

    /**
     * A component for creating localized links
     * Automatically adds the locale prefix to URLs when multilingual is enabled
     */
    export let href = '';
    export let className = '';
    export let activeClass = 'active';
    export let exact = false;

    // Determine if the link is active
    $: isActive = exact
        ? $page.url.pathname === href
        : $page.url.pathname.startsWith(href);

    // Build the full href with locale prefix if needed
    $: fullHref = MULTILINGUAL && !href.startsWith('/')
        ? `/${$locale.country}-${$locale.language}/${href}`
        : MULTILINGUAL && !href.includes('-') && href !== '/'
            ? `/${$locale.country}-${$locale.language}${href}`
            : href;

    // Combine classes
    $: classes = `${className} ${isActive ? activeClass : ''}`.trim();
</script>

<a href={fullHref} class={classes}>
    <slot />
</a>