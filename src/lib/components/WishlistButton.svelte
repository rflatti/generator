<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';
    import { i18n } from '$lib/i18n/translations';
    import { addToWishlist, removeFromWishlist, isInWishlist, wishlistLoading } from '$lib/stores/wishlist';

    // Props
    export let variantId = '';
    export let productTitle = '';
    export let productHandle = '';
    export let variantTitle = '';
    export let variantImage = null;
    export let price = null;
    export let compareAtPrice = null;
    export let shopifyAPI = null;
    export let buttonOnly = false;
    export let iconOnly = false;
    export let small = false;

    // State
    let inWishlist = false;
    let loading = false;

    // Get translations
    $: t = $i18n.t;

    // Computed properties
    $: item = {
        variantId,
        productTitle,
        productHandle,
        variantTitle,
        variantImage,
        price,
        compareAtPrice
    };

    // Update inWishlist when variantId changes
    $: if (browser && variantId) {
        inWishlist = isInWishlist(variantId);
    }

    // Track wishlist loading state
    $: loading = $wishlistLoading;

    // Handle toggle wishlist
    async function toggleWishlist() {
        if (loading) return;

        if (inWishlist) {
            await removeFromWishlist(variantId, shopifyAPI);
        } else {
            await addToWishlist(item, shopifyAPI);
        }

        // Update state (should happen automatically via store subscription)
        inWishlist = isInWishlist(variantId);
    }
</script>

<button
        class="wishlist-button {buttonOnly ? 'button-style' : ''} {iconOnly ? 'icon-only' : ''} {small ? 'small' : ''} {inWishlist ? 'in-wishlist' : ''}"
        on:click|preventDefault|stopPropagation={toggleWishlist}
        aria-label={inWishlist ? t('wishlist.remove') : t('wishlist.add')}
        disabled={loading || !variantId}
        title={inWishlist ? t('wishlist.remove') : t('wishlist.add')}
>
    <span class="icon">
        {#if inWishlist}
            <!-- Filled Heart Icon -->
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
        {:else}
            <!-- Outline Heart Icon -->
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
        {/if}

        {#if loading}
            <span class="loading-spinner"></span>
        {/if}
    </span>

    {#if !iconOnly}
        <span class="text">
            {inWishlist ? t('wishlist.remove') : t('wishlist.add')}
        </span>
    {/if}
</button>

<style>
    .wishlist-button {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        background: none;
        border: none;
        cursor: pointer;
        color: #666;
        transition: all 0.2s ease;
        padding: 0.5rem;
        border-radius: 4px;
    }

    .wishlist-button:hover {
        color: #e53e3e;
    }

    .wishlist-button.in-wishlist {
        color: #e53e3e;
    }

    .wishlist-button.icon-only {
        padding: 0.25rem;
    }

    .wishlist-button.small {
        transform: scale(0.85);
    }

    .wishlist-button.button-style {
        border: 1px solid #ddd;
        background-color: #f9f9f9;
        padding: 0.5rem 1rem;
    }

    .wishlist-button.button-style:hover {
        background-color: #f1f1f1;
    }

    .wishlist-button.button-style.in-wishlist {
        background-color: #fef2f2;
        border-color: #fee2e2;
    }

    .wishlist-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .icon {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .icon svg {
        width: 1.25rem;
        height: 1.25rem;
    }

    .loading-spinner {
        position: absolute;
        width: 100%;
        height: 100%;
        border: 2px solid rgba(0, 0, 0, 0.1);
        border-top-color: currentColor;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }
</style>