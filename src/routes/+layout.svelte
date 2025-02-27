<!-- Update to src/routes/+layout.svelte -->
<script>
    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import { setLocale } from '$lib/i18n/translations';
    import { MULTILINGUAL, parseLocaleFromUrl, DEFAULT_LOCALE } from '$lib/i18n/config';
    import { createClientStorefront } from '$lib/api/storefront.client';
    import { createCustomerAPI, customerTokenGetDefault, customerTokenSetDefault, customerTokenRemoveDefault } from '$lib/api/customer';
    import { createCustomerMetafieldsAPI } from '$lib/api/customer-metafields';
    import { createCustomerHelper, isLoggedIn } from '$lib/stores/customer';
    import LocaleSwitcher from '$lib/components/LocaleSwitcher.svelte';
    import Cart from '$lib/components/Cart.svelte';
    import { cartQuantity, openCart } from '$lib/stores/cart';
    import { browser } from '$app/environment';

    export let data;

    // Initialize client-side storefront and customer API
    let customerHelper;
    let shopifyAPI;

    onMount(() => {
        if (browser) {
            try {
                const { storefront } = createClientStorefront({
                    i18n: data.locale ? {
                        country: data.locale.country,
                        language: data.locale.language
                    } : undefined
                });

                // Initialize customer API
                const customerAPI = createCustomerAPI({
                    storefront,
                    getCustomerToken: customerTokenGetDefault(),
                    setCustomerToken: customerTokenSetDefault(),
                    removeCustomerToken: customerTokenRemoveDefault()
                });

                // Add metafields API
                shopifyAPI = createCustomerMetafieldsAPI(customerAPI, storefront);

                // Create customer helper and get customer data if logged in
                customerHelper = createCustomerHelper(customerAPI);
                if (customerAPI.isLoggedIn()) {
                    customerAPI.getCustomer().catch(err => {
                        console.error('Error fetching customer data:', err);
                    });
                }

                // Initialize wishlist
                initWishlist(shopifyAPI);
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

    // Handle cart icon click
    function handleCartClick() {
        openCart();
    }
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

                <!-- Account links -->
                <div class="account-menu">
                    {#if $isLoggedIn}
                        <a href={MULTILINGUAL ? `/${data.locale.country}-${data.locale.language}/account` : '/account'} class="account-link">
                            My Account
                        </a>
                    {:else}
                        <a href={MULTILINGUAL ? `/${data.locale.country}-${data.locale.language}/account/login` : '/account/login'} class="account-link">
                            Login
                        </a>
                    {/if}
                </div>

                <!-- Cart button -->
                <button class="cart-button" on:click={handleCartClick}>
                    <span class="cart-icon">🛒</span>
                    {#if $cartQuantity > 0}
                        <span class="cart-count">{$cartQuantity}</span>
                    {/if}
                </button>
            </div>
        </nav>
    </header>

    <main>
        <slot />
    </main>

    <footer>
        <p>&copy; {new Date().getFullYear()} Shopify Store. All rights reserved.</p>
    </footer>

    <!-- Cart component -->
    <Cart locale={data.locale} />
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
        gap: 1rem;
    }

    .account-menu {
        margin-right: 0.5rem;
    }

    .account-link {
        text-decoration: none;
        color: #333;
    }

    .cart-button {
        background: none;
        border: none;
        cursor: pointer;
        position: relative;
        padding: 0.5rem;
        font-size: 1.25rem;
    }

    .cart-count {
        position: absolute;
        top: 0;
        right: 0;
        background-color: #e53e3e;
        color: white;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        font-size: 0.75rem;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .cart-link {
        text-decoration: none;
        color: #333;
        display: none;
    }

    @media (min-width: 768px) {
        .cart-link {
            display: block;
        }
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