<!-- src/lib/components/Cart.svelte -->
<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';
    import { page } from '$app/stores';
    import { i18n } from '$lib/i18n/translations';
    import { formatMoney } from '$lib/utils/money';
    import { createClientStorefront } from '$lib/api/storefront.client';
    import { createCartHandler, cartGetIdDefault, cartSetIdDefault } from '$lib/api/cart';
    import { createCartHelper, isCartOpen, cartQuantity, cart, closeCart } from '$lib/stores/cart';

    // Props
    export let locale = undefined;

    // Get translations
    $: t = $i18n.t;

    // Cart state
    let cartHandler;
    let cartHelper;
    let isLoading = true;
    let discountCode = '';
    let discountError = '';

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

            // Fetch cart data
            await cartHandler.get();
            isLoading = false;
        }
    });

    // Handle remove item
    async function removeItem(lineId) {
        if (cartHelper) {
            isLoading = true;
            try {
                const result = await cartHelper.removeLine(lineId);
                if (!result) {
                    console.error('Failed to remove item', result);
                }
                // Get fresh cart data to ensure UI is in sync
                await cartHandler.get();
            } catch (error) {
                console.error('Error removing item:', error);
            } finally {
                isLoading = false;
            }
        }
    }

    // Handle quantity change
    async function updateQuantity(lineId, newQuantity) {
        if (newQuantity < 1) {
            return removeItem(lineId);
        }

        if (cartHelper) {
            isLoading = true;
            try {
                const result = await cartHelper.updateLineQuantity(lineId, newQuantity);
                if (!result) {
                    console.error('Failed to update quantity', result);
                }
                // Get fresh cart data to ensure UI is in sync
                await cartHandler.get();
            } catch (error) {
                console.error('Error updating quantity:', error);
            } finally {
                isLoading = false;
            }
        }
    }

    // Apply discount code
    async function applyDiscount() {
        if (!discountCode || !cartHelper) return;

        isLoading = true;
        discountError = '';

        try {
            const success = await cartHelper.applyDiscount(discountCode);
            if (!success) {
                discountError = t('cart.discountError');
            } else {
                discountCode = '';
                // Get fresh cart data to ensure UI is in sync
                await cartHandler.get();
            }
        } catch (error) {
            console.error('Error applying discount:', error);
            discountError = t('cart.discountError');
        } finally {
            isLoading = false;
        }
    }

    // Remove discount code
    async function removeDiscount(code) {
        if (!cartHelper) return;

        isLoading = true;
        try {
            await cartHelper.removeDiscount(code);
        } catch (error) {
            console.error('Error removing discount:', error);
        } finally {
            isLoading = false;
        }
    }

    // Format cart line
    function formatLine(line) {
        if (!line) return null;
        return cartHelper ? cartHelper.formatCartLine(line) : null;
    }

    // Get checkout URL
    $: checkoutUrl = $cart?.checkoutUrl;

    // Go to checkout
    function goToCheckout() {
        if (checkoutUrl) {
            window.location.href = checkoutUrl;
        }
    }

    // Get cart lines, subtotal, discounts
    $: lines = $cart?.lines?.edges || [];
    $: subtotal = $cart?.cost?.subtotalAmount;
    $: total = $cart?.cost?.totalAmount;
    $: discounts = $cart?.discountCodes || [];
    $: appliedDiscounts = discounts.filter(d => d.applicable);

    // Handle close cart
    function handleClose() {
        closeCart();
    }
</script>

<div class="cart-overlay" class:active={$isCartOpen} on:click={handleClose}>
    <div class="cart-drawer" on:click|stopPropagation>
        <div class="cart-header">
            <h2>{t('cart.title')}</h2>
            <button class="close-button" on:click={handleClose}>×</button>
        </div>

        <div class="cart-content">
            {#if isLoading}
                <div class="loading">
                    <p>{t('message.loading')}</p>
                </div>
            {:else if $cartQuantity === 0}
                <div class="empty-cart">
                    <p>{t('cart.empty')}</p>
                    <button class="continue-shopping" on:click={handleClose}>
                        {t('cart.continue')}
                    </button>
                </div>
            {:else}
                <div class="cart-items">
                    {#each lines as { node }}
                        {@const item = formatLine(node)}
                        {#if item}
                            <div class="cart-item">
                                <div class="item-image">
                                    {#if item.variant.image}
                                        <img
                                                src={item.variant.image.url}
                                                alt={item.variant.image.altText || item.product.title}
                                                width="80"
                                                height="80"
                                        />
                                    {:else}
                                        <div class="placeholder-image"></div>
                                    {/if}
                                </div>

                                <div class="item-details">
                                    <div class="item-title">
                                        <h3>{item.product.title}</h3>
                                        {#if item.variant.title !== 'Default Title'}
                                            <p class="variant-title">{item.variant.title}</p>
                                        {/if}
                                    </div>

                                    <div class="item-price">
                                        {formatMoney(item.variant.price)}
                                    </div>

                                    <div class="item-controls">
                                        <div class="quantity-controls">
                                            <button on:click={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
                                            <span>{item.quantity}</span>
                                            <button on:click={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                                        </div>
                                        <button class="remove-item" on:click={() => removeItem(item.id)}>
                                            {t('cart.remove')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        {/if}
                    {/each}
                </div>

                <!-- Cart Summary -->
                <div class="cart-summary">
                    <!-- Discount Code -->
                    <div class="discount-section">
                        <h3>{t('cart.discount')}</h3>
                        <div class="discount-form">
                            <input
                                    type="text"
                                    bind:value={discountCode}
                                    placeholder={t('cart.discountPlaceholder')}
                                    on:keydown={(e) => e.key === 'Enter' && applyDiscount()}
                            />
                            <button on:click={applyDiscount}>
                                {t('cart.applyDiscount')}
                            </button>
                        </div>
                        {#if discountError}
                            <p class="discount-error">{discountError}</p>
                        {/if}

                        {#if appliedDiscounts.length > 0}
                            <div class="applied-discounts">
                                {#each appliedDiscounts as discount}
                                    <div class="discount-tag">
                                        <span>{discount.code}</span>
                                        <button on:click={() => removeDiscount(discount.code)}>×</button>
                                    </div>
                                {/each}
                            </div>
                        {/if}
                    </div>

                    <!-- Summary -->
                    <div class="summary-item">
                        <span>{t('cart.subtotal')}</span>
                        <span>{formatMoney(subtotal)}</span>
                    </div>

                    <div class="summary-item total">
                        <span>{t('cart.total')}</span>
                        <span>{formatMoney(total)}</span>
                    </div>

                    <!-- Checkout Button -->
                    <button class="checkout-button" on:click={goToCheckout}>
                        {t('cart.checkout')}
                    </button>
                </div>
            {/if}
        </div>
    </div>
</div>

<style>
    .cart-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 1000;
        display: none;
    }

    .cart-overlay.active {
        display: block;
    }

    .cart-drawer {
        position: fixed;
        top: 0;
        right: 0;
        width: 400px;
        max-width: 100%;
        height: 100%;
        background: white;
        z-index: 1001;
        display: flex;
        flex-direction: column;
        box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
    }

    .cart-header {
        padding: 1rem;
        border-bottom: 1px solid #eee;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .cart-header h2 {
        margin: 0;
        font-size: 1.5rem;
    }

    .close-button {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
    }

    .cart-content {
        flex: 1;
        overflow-y: auto;
        padding: 1rem;
        display: flex;
        flex-direction: column;
    }

    .loading, .empty-cart {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        flex: 1;
        text-align: center;
        padding: 2rem;
    }

    .continue-shopping {
        margin-top: 1rem;
        padding: 0.5rem 1rem;
        background: #f5f5f5;
        border: 1px solid #ddd;
        border-radius: 4px;
        cursor: pointer;
    }

    .cart-items {
        flex: 1;
        overflow-y: auto;
    }

    .cart-item {
        display: flex;
        padding: 1rem 0;
        border-bottom: 1px solid #eee;
    }

    .item-image {
        width: 80px;
        height: 80px;
        margin-right: 1rem;
        border: 1px solid #eee;
        border-radius: 4px;
        overflow: hidden;
    }

    .item-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .placeholder-image {
        width: 100%;
        height: 100%;
        background-color: #f5f5f5;
    }

    .item-details {
        flex: 1;
        display: flex;
        flex-direction: column;
    }

    .item-title h3 {
        margin: 0;
        font-size: 1rem;
    }

    .variant-title {
        margin: 0.25rem 0 0;
        font-size: 0.875rem;
        color: #666;
    }

    .item-price {
        margin: 0.5rem 0;
        font-weight: bold;
    }

    .item-controls {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .quantity-controls {
        display: flex;
        align-items: center;
        border: 1px solid #ddd;
        border-radius: 4px;
    }

    .quantity-controls button {
        background: #f5f5f5;
        border: none;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
    }

    .quantity-controls span {
        padding: 0 0.5rem;
    }

    .remove-item {
        background: none;
        border: none;
        color: #666;
        text-decoration: underline;
        cursor: pointer;
        font-size: 0.875rem;
    }

    .cart-summary {
        margin-top: auto;
        padding-top: 1rem;
        border-top: 1px solid #eee;
    }

    .discount-section {
        margin-bottom: 1rem;
    }

    .discount-section h3 {
        font-size: 1rem;
        margin: 0 0 0.5rem;
    }

    .discount-form {
        display: flex;
        gap: 0.5rem;
    }

    .discount-form input {
        flex: 1;
        padding: 0.5rem;
        border: 1px solid #ddd;
        border-radius: 4px;
    }

    .discount-form button {
        padding: 0.5rem;
        background: #f5f5f5;
        border: 1px solid #ddd;
        border-radius: 4px;
        cursor: pointer;
    }

    .discount-error {
        color: #e53e3e;
        font-size: 0.875rem;
        margin: 0.5rem 0 0;
    }

    .applied-discounts {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-top: 0.5rem;
    }

    .discount-tag {
        display: flex;
        align-items: center;
        background: #f5f5f5;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.875rem;
    }

    .discount-tag button {
        background: none;
        border: none;
        margin-left: 0.25rem;
        cursor: pointer;
        font-size: 1rem;
        line-height: 1;
    }

    .summary-item {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.5rem;
    }

    .summary-item.total {
        font-weight: bold;
        font-size: 1.1rem;
        margin: 0.5rem 0 1rem;
    }

    .checkout-button {
        width: 100%;
        padding: 0.75rem;
        background: #4a4a4a;
        color: white;
        border: none;
        border-radius: 4px;
        font-size: 1rem;
        font-weight: bold;
        cursor: pointer;
        transition: background-color 0.2s;
    }

    .checkout-button:hover {
        background: #333;
    }

    @media (max-width: 480px) {
        .cart-drawer {
            width: 100%;
        }
    }
</style>