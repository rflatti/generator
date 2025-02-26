<script>
    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import { setLocale } from '$lib/i18n/translations';
    import { MULTILINGUAL, parseLocaleFromUrl, DEFAULT_LOCALE } from '$lib/i18n/config';
    import { createClientStorefront } from '$lib/api/storefront.client';
    import LocaleSwitcher from '$lib/components/LocaleSwitcher.svelte';
    import { browser } from '$app/environment';

    export let data;

    // Initialize client-side storefront (only in browser)
    onMount(() => {
        if (browser) {
            try {
                const { storefront } = createClientStorefront({
                    i18n: data.locale ? {
                        country: data.locale.country,
                        language: data.locale.language
                    } : undefined
                });

                // You could store this in a writable store if needed elsewhere
            } catch (err) {
                console.error('Error initializing client storefront:', err);
            }
        }
    });

    // Set locale based on URL
    onMount(() => {
        if (MULTILINGUAL) {
            const path = $page.url.pathname;
            const firstPathPart = path.split('/')[1] || '';
            const hasLocalePrefix = firstPathPart.includes('-');

            if (hasLocalePrefix) {
                const locale = parseLocaleFromUrl(firstPathPart);
                setLocale(locale.country, locale.language);
            } else {
                // Default locale
                setLocale(DEFAULT_LOCALE.country, DEFAULT_LOCALE.language);
            }
        } else {
            // Single language mode
            setLocale(DEFAULT_LOCALE.country, DEFAULT_LOCALE.language);
        }
    });
</script>

<div class="app">
    <header>
        <nav>
            <div class="logo">
                <a href={MULTILINGUAL ? `/${data.locale.country}-${data.locale.language}` : '/'}>
                    Shopify Store
                </a>
            </div>

            <ul class="menu">
                <li>
                    <a href={MULTILINGUAL ? `/${data.locale.country}-${data.locale.language}/products` : '/products'}>
                        Products
                    </a>
                </li>
                <li>
                    <a href={MULTILINGUAL ? `/${data.locale.country}-${data.locale.language}/collections` : '/collections'}>
                        Collections
                    </a>
                </li>
            </ul>

            <div class="right-menu">
                {#if MULTILINGUAL}
                    <LocaleSwitcher />
                {/if}

                <!-- Account and Cart links would go here -->
            </div>
        </nav>
    </header>

    <main>
        <slot />
    </main>

    <footer>
        <p>&copy; {new Date().getFullYear()} Shopify Store. All rights reserved.</p>
    </footer>
</div>

<style>
    .app {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
    }

    header {
        padding: 1rem;
        background-color: #f9f9f9;
        border-bottom: 1px solid #eaeaea;
    }

    nav {
        display: flex;
        justify-content: space-between;
        align-items: center;
        max-width: 1200px;
        margin: 0 auto;
        width: 100%;
    }

    .logo a {
        font-size: 1.5rem;
        font-weight: bold;
        text-decoration: none;
        color: #333;
    }

    .menu {
        display: flex;
        list-style: none;
        margin: 0;
        padding: 0;
    }

    .menu li {
        margin: 0 1rem;
    }

    .menu a {
        text-decoration: none;
        color: #333;
    }

    .right-menu {
        display: flex;
        align-items: center;
    }

    main {
        flex: 1;
        padding: 2rem;
        max-width: 1200px;
        margin: 0 auto;
        width: 100%;
    }

    footer {
        padding: 2rem;
        background-color: #f9f9f9;
        border-top: 1px solid #eaeaea;
        text-align: center;
    }
</style>