<!-- src/routes/[locale=locale]/account/wishlist/+page.svelte -->
<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';
    import { i18n } from '$lib/i18n/translations.js';
    import { formatMoney } from '$lib/utils/money.js';
    import { createClientStorefront } from '$lib/api/storefront.client.js';
    import { createCustomerAPI, customerTokenGetDefault, customerTokenSetDefault, customerTokenRemoveDefault } from '$lib/api/customer.js';
    import { createCustomerMetafieldsAPI } from '$lib/api/customer-metafields.js';
    import { createCustomerHelper } from '$lib/stores/customer.js';
    import {
        wishlistItems,
        wishlistLoading,
        wishlistError,
        wishlistMessage,
        initWishlist,
        removeFromWishlist,
        clearWishlist,
        addToWishlist
    } from '$lib/stores/wishlist.js';
    import Link from '$lib/components/Link.svelte';
    import AddToCartButton from '$lib/components/AddToCartButton.svelte';

    export let data;

    // Get translations
    $: t = $i18n.t;

    // State
    let isInitialized = false;
    let shopifyAPI = null;
    let isLoggedIn = false;

    // Initialize API and wishlist
    onMount(async () => {
        if (browser) {
            try {
                // Create client-side storefront
                const { storefront } = createClientStorefront({
                    i18n: data.locale ? {
                        country: data.locale.country,
                        language: data.locale.language
                    } : undefined
                });

                // Create customer API
                const customerAPI = createCustomerAPI({
                    storefront,
                    getCustomerToken: customerTokenGetDefault(),
                    setCustomerToken: customerTokenSetDefault(),
                    removeCustomerToken: customerTokenRemoveDefault()
                });

                // Extend with metafields API
                shopifyAPI = createCustomerMetafieldsAPI(customerAPI, storefront);

                // Create customer helper
                const customerHelper = createCustomerHelper(customerAPI);

                // Check login status
                isLoggedIn = customerAPI.isLoggedIn();

                // Initialize wishlist
                await initWishlist(shopifyAPI);

                isInitialized = true;
            } catch (error) {
                console.error('Error initializing wishlist page:', error);
            }
        }
    });

    // Handle remove from wishlist
    async function handleRemove(variantId) {
        if (!browser) return;
        await removeFromWishlist(variantId, shopifyAPI);
    }

    // Handle clear wishlist
    async function handleClearWishlist() {
        if (!browser || !confirm(t('wishlist.confirmClear') || 'Are you sure you want to clear your wishlist?')) return;
        await clearWishlist(shopifyAPI);
    }

    // Format date
    function formatDate(dateString) {
        return new Date(dateString).toLocaleDateString(
            data.locale ? `${data.locale.language}-${data.locale.country}` : undefined,
            { year: 'numeric', month: 'long', day: 'numeric' }
        );
    }
</script>

<svelte:head>
    <title>{t('wishlist.title', { default: 'My Wishlist' })} | {t('site.title')}</title>
    <meta name="description" content={t('wishlist.description', { default: 'View and manage your saved items' })} />
</svelte:head>

<div class="wishlist-page">
    <header class="wishlist-header">
        <h1>{t('wishlist.title', { default: 'My Wishlist' })}</h1>
        <Link href="/account" className="button outline">
            {isLoggedIn ? t('account.backToAccount') : t('wishlist.continueShopping', { default: 'Continue Shopping' })}
        </Link>
    </header>

    {#if !isInitialized}
        <div class="loading">
            <p>{t('message.loading')}</p>
        </div>
    {:else}
        {#if $wishlistMessage.visible}
            <div class="message {$wishlistMessage.type}">
                {$wishlistMessage.message}
            </div>
        {/if}

        {#if $wishlistError}
            <div class="message error">
                {$wishlistError}
            </div>
        {/if}

        {#if $wishlistItems.length === 0}
            <div class="empty-wishlist">
                <p>{t('wishlist.empty', { default: 'Your wishlist is empty' })}</p>
                <Link href="/static" className="button primary">
                    {t('wishlist.browseProducts', { default: 'Browse Products' })}
                </Link>
            </div>
        {:else}
            <div class="wishlist-actions">
                <button class="button outline" on:click={handleClearWishlist} disabled={$wishlistLoading}>
                    {t('wishlist.clearAll', { default: 'Clear All' })}
                </button>
            </div>

            <div class="wishlist-grid">
                {#each $wishlistItems as item}
                    <div class="wishlist-item" class:loading={$wishlistLoading}>
                        <div class="item-image">
                            {#if item.variantImage}
                                <Link href="/products/{item.productHandle}" className="item-link">
                                    <img
                                            src={item.variantImage.url}
                                            alt={item.variantImage.altText || item.productTitle}
                                            width="120"
                                            height="120"
                                    />
                                </Link>
                            {:else}
                                <div class="placeholder-image"></div>
                            {/if}
                        </div>

                        <div class="item-info">
                            <Link href="/products/{item.productHandle}" className="item-link">
                                <h3>{item.productTitle}</h3>
                                {#if item.variantTitle && item.variantTitle !== 'Default Title'}
                                    <p class="variant-title">{item.variantTitle}</p>
                                {/if}
                            </Link>

                            <div class="item-price">
                                {#if item.price}
                                    <span class="price">{formatMoney(item.price)}</span>

                                    {#if item.compareAtPrice && parseFloat(item.compareAtPrice.amount) > parseFloat(item.price.amount)}
                                        <span class="compare-price">{formatMoney(item.compareAtPrice)}</span>
                                    {/if}
                                {/if}
                            </div>

                            <div class="item-meta">
                                <span class="added-date">
                                    {t('wishlist.addedOn', { default: 'Added on' })}: {formatDate(item.addedAt)}
                                </span>
                            </div>
                        </div>

                        <div class="item-actions">
                            <AddToCartButton
                                    variantId={item.variantId}
                                    quantity={1}
                                    locale={data.locale}
                                    buttonText={t('wishlist.addToCart', { default: 'Add to Cart' })}
                            />

                            <button
                                    class="remove-button"
                                    on:click={() => handleRemove(item.variantId)}
                                    disabled={$wishlistLoading}
                            >
                                {t('wishlist.remove', { default: 'Remove' })}
                            </button>
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    {/if}
</div>

<style>
    .wishlist-page {
        max-width: 1000px;
        margin: 0 auto;
        padding: 2rem 1rem;
    }

    .wishlist-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
    }

    .wishlist-header h1 {
        margin: 0;
    }

    .button {
        padding: 0.5rem 1rem;
        border-radius: 4px;
        font-size: 0.9rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: none;
    }

    .button.primary {
        background-color: #4a4a4a;
        color: white;
    }

    .button.primary:hover {
        background-color: #333;
    }

    .button.outline {
        background-color: transparent;
        border: 1px solid #4a4a4a;
        color: #4a4a4a;
    }

    .button.outline:hover {
        background-color: #f5f5f5;
    }

    .button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .loading, .empty-wishlist {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 200px;
        text-align: center;
    }

    .empty-wishlist p {
        margin-bottom: 1rem;
        color: #666;
    }

    .message {
        padding: 0.75rem 1rem;
        border-radius: 4px;
        margin-bottom: 1.5rem;
    }

    .message.success {
        background-color: #ecfdf5;
        color: #10b981;
    }

    .message.error {
        background-color: #fee2e2;
        color: #ef4444;
    }

    .message.info {
        background-color: #eff6ff;
        color: #3b82f6;
    }

    .message.warning {
        background-color: #fffbeb;
        color: #f59e0b;
    }

    .wishlist-actions {
        display: flex;
        justify-content: flex-end;
        margin-bottom: 1.5rem;
    }

    .wishlist-grid {
        display: grid;
        gap: 1.5rem;
    }

    .wishlist-item {
        display: grid;
        grid-template-columns: 120px 1fr auto;
        gap: 1.5rem;
        padding: 1.5rem;
        background-color: #f9f9f9;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        position: relative;
    }

    .wishlist-item.loading {
        opacity: 0.7;
        pointer-events: none;
    }

    .item-image {
        width: 120px;
        height: 120px;
        border-radius: 4px;
        overflow: hidden;
        border: 1px solid #eee;
    }

    .item-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .placeholder-image {
        width: 100%;
        height: 100%;
        background-color: #eee;
    }

    .item-info {
        display: flex;
        flex-direction: column;
        justify-content: center;
    }

    .item-link {
        text-decoration: none;
        color: inherit;
    }

    .item-info h3 {
        margin: 0 0 0.25rem;
        font-size: 1.1rem;
    }

    .variant-title {
        margin: 0 0 0.5rem;
        color: #666;
        font-size: 0.9rem;
    }

    .item-price {
        margin-bottom: 0.5rem;
    }

    .price {
        font-weight: bold;
    }

    .compare-price {
        text-decoration: line-through;
        color: #888;
        margin-left: 0.5rem;
    }

    .item-meta {
        color: #666;
        font-size: 0.85rem;
    }

    .item-actions {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        align-items: flex-end;
        justify-content: center;
    }

    .remove-button {
        background: none;
        border: none;
        color: #666;
        text-decoration: underline;
        cursor: pointer;
        font-size: 0.9rem;
    }

    .remove-button:hover {
        color: #ef4444;
    }

    .remove-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    @media (max-width: 768px) {
        .wishlist-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
        }

        .wishlist-item {
            grid-template-columns: 1fr;
        }

        .item-image {
            width: 100%;
            height: 200px;
        }

        .item-actions {
            flex-direction: row;
            justify-content: space-between;
            width: 100%;
        }
    }

    </style>