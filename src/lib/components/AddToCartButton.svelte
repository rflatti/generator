<!-- src/lib/components/AddToCartButton.svelte - Updated with better error handling -->
<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';
    import { i18n } from '$lib/i18n/translations';
    import { createClientStorefront } from '$lib/api/storefront.client';
    import { createCartHandler, cartGetIdDefault, cartSetIdDefault } from '$lib/api/cart';
    import { createCartHelper, openCart, cartError } from '$lib/stores/cart';

    // Props
    export let variantId = ''; // The product variant ID to add to cart
    export let quantity = 1; // Quantity to add
    export let attributes = []; // Any additional attributes
    export let disabled = false; // Disable button (e.g. if out of stock)
    export let fullWidth = false; // Make button full width
    export let showQuantity = false; // Show quantity selector
    export let locale = undefined; // Current locale
    export let buttonText = ''; // Override button text

    // State
    let isLoading = false;
    let localQuantity = quantity;
    let cartHandler;
    let cartHelper;
    let addSuccess = false;
    let successTimeout;

    // Get translations
    $: t = $i18n.t;
    $: buttonLabel = buttonText || (disabled ? t('product.outOfStock') : (
        addSuccess ? t('product.addedToCart') : t('product.addToCart')
    ));

    // Initialize cart
    onMount(async () => {
        if (browser) {
            // Create client-side storefront
            const { storefront } = createClientStorefront({
                i18n: locale ? {
                    country: locale.country,
                    language: locale.language
                } : undefined
            });

            // Create cart handler
            cartHandler = createCartHandler({
                storefront,
                getCartId: cartGetIdDefault(),
                setCartId: cartSetIdDefault()
            });

            // Create cart helper
            cartHelper = createCartHelper(cartHandler);
        }

        return () => {
            // Clear any pending timeouts on unmount
            if (successTimeout) clearTimeout(successTimeout);
        };
    });

    // Keep local quantity in sync with prop
    $: {
        if (quantity !== localQuantity) {
            localQuantity = quantity;
        }
    }

    // Handle quantity update
    function updateQuantity(value) {
        localQuantity = Math.max(1, value);
    }

    // Add to cart
    async function addToCart() {
        if (disabled || !variantId || !cartHelper || isLoading) return;

        isLoading = true;

        try {
            // Format attributes if needed
            const formattedAttributes = Array.isArray(attributes)
                ? attributes
                : Object.entries(attributes).map(([key, value]) => ({ key, value }));

            // Add item to cart
            const success = await cartHelper.addToCart(variantId, localQuantity, formattedAttributes);

            if (success) {
                // Show success feedback
                addSuccess = true;

                // Clear previous timeout if exists
                if (successTimeout) clearTimeout(successTimeout);

                // Reset after 2 seconds
                successTimeout = setTimeout(() => {
                    addSuccess = false;
                }, 2000);

                // Open cart drawer
                openCart();
            }
        } catch (error) {
            console.error('Error adding to cart:', error);
        } finally {
            isLoading = false;
        }
    }
</script>

<div class="add-to-cart-container" class:full-width={fullWidth}>
    {#if showQuantity}
        <div class="quantity-controls">
            <button
                    class="quantity-button"
                    on:click={() => updateQuantity(localQuantity - 1)}
                    disabled={disabled || isLoading}
                    aria-label={t('product.decreaseQuantity')}
            >
                -
            </button>
            <input
                    type="number"
                    bind:value={localQuantity}
                    on:input={(e) => updateQuantity(parseInt(e.target.value) || 1)}
                    min="1"
                    disabled={disabled || isLoading}
                    aria-label={t('product.quantity')}
            />
            <button
                    class="quantity-button"
                    on:click={() => updateQuantity(localQuantity + 1)}
                    disabled={disabled || isLoading}
                    aria-label={t('product.increaseQuantity')}
            >
                +
            </button>
        </div>
    {/if}

    {#if $cartError}
        <div class="error-message">
            {$cartError}
        </div>
    {/if}

    <button
            class="add-to-cart-button"
            class:loading={isLoading}
            class:disabled={disabled}
            class:success={addSuccess}
            on:click={addToCart}
            disabled={disabled || isLoading}
    >
        {#if isLoading}
            <span class="loading-spinner"></span>
            <span>{t('product.adding')}</span>
        {:else}
            <span>{buttonLabel}</span>
        {/if}
    </button>
</div>

<style>
    .add-to-cart-container {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .full-width {
        width: 100%;
    }

    .quantity-controls {
        display: flex;
        border: 1px solid #ddd;
        border-radius: 4px;
        overflow: hidden;
        width: fit-content;
    }

    .quantity-button {
        background: #f5f5f5;
        border: none;
        padding: 0.5rem 1rem;
        cursor: pointer;
        font-size: 1rem;
    }

    .quantity-button:hover:not(:disabled) {
        background: #e5e5e5;
    }

    .quantity-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .quantity-controls input {
        width: 50px;
        border: none;
        text-align: center;
        font-size: 1rem;
        padding: 0.5rem;
        -moz-appearance: textfield;
    }

    .quantity-controls input::-webkit-outer-spin-button,
    .quantity-controls input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }

    .quantity-controls input:disabled {
        background-color: #f5f5f5;
        color: #999;
    }

    .error-message {
        background-color: #fee2e2;
        color: #ef4444;
        padding: 0.5rem;
        border-radius: 4px;
        font-size: 0.875rem;
        text-align: center;
    }

    .add-to-cart-button {
        padding: 0.75rem 1.5rem;
        background-color: #4a4a4a;
        color: white;
        border: none;
        border-radius: 4px;
        font-size: 1rem;
        font-weight: bold;
        cursor: pointer;
        transition: background-color 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
    }

    .add-to-cart-button:hover:not(:disabled) {
        background-color: #333;
    }

    .add-to-cart-button.disabled {
        background-color: #ccc;
        cursor: not-allowed;
    }

    .add-to-cart-button.success {
        background-color: #10b981;
    }

    .loading-spinner {
        width: 1rem;
        height: 1rem;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        border-top-color: white;
        animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }

    .full-width .add-to-cart-button {
        width: 100%;
    }
</style>