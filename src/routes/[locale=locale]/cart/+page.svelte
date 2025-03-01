<!-- src/routes/[locale=locale]/cart/+page.svelte - Updated with accurate feedback -->
<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';
    import { page } from '$app/stores';
    import { i18n } from '$lib/i18n/translations';
    import { formatMoney } from '$lib/utils/money';
    import { createClientStorefront } from '$lib/api/storefront.client';
    import { createCartHandler, cartGetIdDefault, cartSetIdDefault } from '$lib/api/cart';
    import { createCartHelper, cart, cartError, cartOperationResult } from '$lib/stores/cart';
    import Link from '$lib/components/Link.svelte';

    export let data;

    // Get translations
    $: t = $i18n.t;

    // Cart state
    let cartHandler;
    let cartHelper;
    let isLoading = true;
    let updateInProgress = false;
    let discountCode = '';

    // Initialize cart
    onMount(async () => {
        if (browser) {
            // Create client-side storefront
            const { storefront } = createClientStorefront({
                i18n: data.locale ? {
                    country: data.locale.country,
                    language: data.locale.language
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
            try {
                await cartHandler.get();
            } catch (error) {
                if (cartHelper) {
                    cartHelper.setResult(false, t('cart.errorLoading'));
                }
            } finally {
                isLoading = false;
            }
        }
    });

    // Handle remove item
    async function removeItem(lineId) {
        if (!cartHelper || updateInProgress) return;

        updateInProgress = true;
        isLoading = true;

        try {
            await cartHelper.removeLine(lineId);
        } catch (error) {
            console.error('Error removing item:', error);
        } finally {
            updateInProgress = false;
            isLoading = false;
        }
    }

    // Handle quantity change
    async function updateQuantity(lineId, newQuantity) {
        if (!cartHelper || updateInProgress) return;

        if (newQuantity < 1) {
            return removeItem(lineId);
        }

        updateInProgress = true;
        isLoading = true;

        try {
            await cartHelper.updateLineQuantity(lineId, newQuantity);
        } catch (error) {
            console.error('Error updating quantity:', error);
        } finally {
            updateInProgress = false;
            isLoading = false;
        }
    }

    // Apply discount code
    async function applyDiscount() {
        if (!discountCode || !cartHelper || updateInProgress) return;

        updateInProgress = true;
        isLoading = true;

        try {
            const success = await cartHelper.applyDiscount(discountCode);
            if (success) {
                discountCode = ''; // Clear input only on success
            }
        } catch (error) {
            console.error('Error applying discount:', error);
        } finally {
            updateInProgress = false;
            isLoading = false;
        }
    }

    // Remove discount code
    async function removeDiscount(code) {
        if (!cartHelper || updateInProgress) return;

        updateInProgress = true;
        isLoading = true;

        try {
            await cartHelper.removeDiscount(code);
        } catch (error) {
            console.error('Error removing discount:', error);
        } finally {
            updateInProgress = false;
            isLoading = false;
        }
    }

    // Clear cart
    async function clearCart() {
        if (!cartHelper || updateInProgress) return;

        updateInProgress = true;
        isLoading = true;

        try {
            await cartHelper.clearCart();
        } catch (error) {
            console.error('Error clearing cart:', error);
        } finally {
            updateInProgress = false;
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
        } else if (cartHelper) {
            cartHelper.setResult(false, t('cart.checkoutUnavailable'));
        }
    }

    // Get cart lines, subtotal, discounts
    $: lines = $cart?.lines?.edges || [];
    $: subtotal = $cart?.cost?.subtotalAmount;
    $: total = $cart?.cost?.totalAmount;
    $: tax = $cart?.cost?.totalTaxAmount;
    $: discounts = $cart?.discountCodes || [];
    $: appliedDiscounts = discounts.filter(d => d.applicable);
    $: isEmpty = lines.length === 0;
</script>

<svelte:head>
    <title>{t('cart.title')} | {t('site.title')}</title>
</svelte:head>

<div class="cart-page">
    <h1>{t('cart.title')}</h1>

    {#if $cartOperationResult.message}
        <div class="feedback-message {$cartOperationResult.type}">
            {$cartOperationResult.message}
        </div>
    {/if}

    {#if $cartError}
        <div class="feedback-message error">
            {$cartError}
        </div>
    {/if}

    {#if isLoading || updateInProgress}
        <div class="loading">
            <p>{t('message.loading')}</p>
        </div>
    {:else if isEmpty}
        <div class="empty-cart">
            <p>{t('cart.empty')}</p>
            <div class="cart-actions">
                <Link href="/" className="button secondary">{t('cart.continue')}</Link>
            </div>
        </div>
    {:else}
        <div class="cart-container">
            <div class="cart-items">
                <table class="cart-table">
                    <thead>
                    <tr>
                        <th>{t('cart.product')}</th>
                        <th>{t('cart.price')}</th>
                        <th>{t('cart.quantity')}</th>
                        <th>{t('cart.total')}</th>
                        <th></th>
                    </tr>
                    </thead>
                    <tbody>
                    {#each lines as { node }}
                        {@const item = formatLine(node)}
                        {#if item}
                            <tr class="cart-item">
                                <td class="product-cell">
                                    <Link href="/products/{item.product.handle}" className="product-link">
                                        <div class="product-image">
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
                                        <div class="product-info">
                                            <h3>{item.product.title}</h3>
                                            {#if item.variant.title !== 'Default Title'}
                                                <p class="variant-title">{item.variant.title}</p>
                                            {/if}
                                        </div>
                                    </Link>
                                </td>
                                <td class="price-cell">
                                    {formatMoney(item.variant.price)}
                                </td>
                                <td class="quantity-cell">
                                    <div class="quantity-controls">
                                        <button
                                                on:click={() => updateQuantity(item.id, item.quantity - 1)}
                                                aria-label="Decrease quantity"
                                                disabled={updateInProgress}
                                        >
                                            -
                                        </button>
                                        <input
                                                type="number"
                                                min="1"
                                                value={item.quantity}
                                                on:input={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                                                aria-label="Quantity"
                                                disabled={updateInProgress}
                                        />
                                        <button
                                                on:click={() => updateQuantity(item.id, item.quantity + 1)}
                                                aria-label="Increase quantity"
                                                disabled={updateInProgress}
                                        >
                                            +
                                        </button>
                                    </div>
                                </td>
                                <td class="total-cell">
                                    {formatMoney(item.cost.total)}
                                </td>
                                <td class="action-cell">
                                    <button
                                            class="remove-button"
                                            on:click={() => removeItem(item.id)}
                                            disabled={updateInProgress}
                                    >
                                        {t('cart.remove')}
                                    </button>
                                </td>
                            </tr>
                        {/if}
                    {/each}
                    </tbody>
                </table>

                <div class="cart-actions">
                    <button
                            class="button secondary"
                            on:click={clearCart}
                            disabled={updateInProgress}
                    >
                        {t('cart.clear')}
                    </button>
                    <Link href="/" className="button secondary">
                        {t('cart.continue')}
                    </Link>
                </div>
            </div>

            <div class="cart-sidebar">
                <div class="cart-summary">
                    <h2>{t('cart.summary')}</h2>

                    <!-- Discount Code -->
                    <div class="discount-section">
                        <h3>{t('cart.discount')}</h3>
                        <div class="discount-form">
                            <input
                                    type="text"
                                    bind:value={discountCode}
                                    placeholder={t('cart.discountPlaceholder') || "Enter discount code"}
                                    on:keydown={(e) => e.key === 'Enter' && applyDiscount()}
                                    disabled={updateInProgress}
                            />
                            <button
                                    class="button secondary"
                                    on:click={applyDiscount}
                                    disabled={updateInProgress || !discountCode}
                            >
                                {t('cart.applyDiscount') || "Apply"}
                            </button>
                        </div>

                        {#if appliedDiscounts.length > 0}
                            <div class="applied-discounts">
                                {#each appliedDiscounts as discount}
                                    <div class="discount-tag">
                                        <span>{discount.code}</span>
                                        <button
                                                on:click={() => removeDiscount(discount.code)}
                                                disabled={updateInProgress}
                                        >×</button>
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

                    {#if tax}
                        <div class="summary-item">
                            <span>{t('cart.tax')}</span>
                            <span>{formatMoney(tax)}</span>
                        </div>
                    {/if}

                    <div class="summary-item total">
                        <span>{t('cart.total')}</span>
                        <span>{formatMoney(total)}</span>
                    </div>

                    <!-- Checkout Button -->
                    <button
                            class="checkout-button"
                            on:click={goToCheckout}
                            disabled={updateInProgress || isEmpty}
                    >
                        {t('cart.checkout')}
                    </button>
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    .cart-page {
        max-width: 1200px;
        margin: 0 auto;
        padding: 1rem;
    }

    h1 {
        margin-bottom: 2rem;
        font-size: 2rem;
    }

    .feedback-message {
        padding: 1rem;
        margin-bottom: 1rem;
        border-radius: 4px;
        text-align: center;
    }

    .feedback-message.success {
        background-color: #ecfdf5;
        color: #10b981;
        border: 1px solid #10b981;
    }

    .feedback-message.error {
        background-color: #fee2e2;
        color: #ef4444;
        border: 1px solid #ef4444;
    }

    .feedback-message.warning {
        background-color: #fffbeb;
        color: #f59e0b;
        border: 1px solid #f59e0b;
    }

    .loading, .empty-cart {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 3rem 0;
        text-align: center;
    }

    .empty-cart p {
        margin-bottom: 1.5rem;
        font-size: 1.1rem;
        color: #666;
    }

    .cart-container {
        display: grid;
        grid-template-columns: 1fr 350px;
        gap: 2rem;
    }

    @media (max-width: 768px) {
        .cart-container {
            grid-template-columns: 1fr;
        }
    }

    .cart-table {
        width: 100%;
        border-collapse: collapse;
    }

    .cart-table th {
        text-align: left;
        padding: 1rem 0.5rem;
        border-bottom: 2px solid #eee;
        font-weight: bold;
    }

    .cart-table td {
        padding: 1rem 0.5rem;
        border-bottom: 1px solid #eee;
        vertical-align: middle;
    }

    .product-cell {
        width: 50%;
    }

    .product-link {
        display: flex;
        text-decoration: none;
        color: inherit;
    }

    .product-image {
        width: 80px;
        height: 80px;
        margin-right: 1rem;
        border: 1px solid #eee;
        border-radius: 4px;
        overflow: hidden;
        flex-shrink: 0;
    }

    .product-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .placeholder-image {
        width: 100%;
        height: 100%;
        background-color: #f5f5f5;
    }

    .product-info h3 {
        margin: 0 0 0.25rem;
        font-size: 1rem;
    }

    .variant-title {
        margin: 0;
        font-size: 0.875rem;
        color: #666;
    }

    .quantity-controls {
        display: flex;
        align-items: center;
        border: 1px solid #ddd;
        border-radius: 4px;
        width: fit-content;
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

    .quantity-controls button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .quantity-controls input {
        width: 40px;
        border: none;
        text-align: center;
        -moz-appearance: textfield;
    }

    .quantity-controls input::-webkit-outer-spin-button,
    .quantity-controls input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }

    .quantity-controls input:disabled {
        background-color: #f9f9f9;
    }

    .remove-button {
        background: none;
        border: none;
        color: #666;
        text-decoration: underline;
        cursor: pointer;
    }

    .remove-button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .cart-actions {
        display: flex;
        gap: 1rem;
        margin-top: 1.5rem;
    }

    .button {
        padding: 0.75rem 1.5rem;
        border-radius: 4px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
    }

    .button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .button.secondary {
        background-color: #f5f5f5;
        color: #333;
        border: 1px solid #ddd;
    }

    .button.secondary:hover:not(:disabled) {
        background-color: #eee;
    }

    .cart-sidebar {
        position: sticky;
        top: 2rem;
        align-self: start;
    }

    .cart-summary {
        background-color: #f9f9f9;
        border-radius: 8px;
        padding: 1.5rem;
    }

    .cart-summary h2 {
        margin: 0 0 1.5rem;
        font-size: 1.25rem;
    }

    .discount-section {
        margin-bottom: 1.5rem;
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

    .discount-form input:disabled {
        background-color: #f5f5f5;
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
        background: #eee;
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

    .discount-tag button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .summary-item {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.5rem;
        padding: 0.5rem 0;
    }

    .summary-item.total {
        font-weight: bold;
        font-size: 1.1rem;
        border-top: 1px solid #ddd;
        margin-top: 1rem;
        padding-top: 1rem;
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
        margin-top: 1rem;
    }

    .checkout-button:hover:not(:disabled) {
        background: #333;
    }

    .checkout-button:disabled {
        background: #999;
        cursor: not-allowed;
    }
</style>