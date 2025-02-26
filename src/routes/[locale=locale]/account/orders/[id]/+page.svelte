<!-- src/routes/[locale=locale]/account/orders/[id]/+page.svelte -->
<script>
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';
    import { i18n } from '$lib/i18n/translations';
    import { formatMoney } from '$lib/utils/money';
    import { createClientStorefront } from '$lib/api/storefront.client';
    import { createCustomerAPI, customerTokenGetDefault, customerTokenSetDefault, customerTokenRemoveDefault } from '$lib/api/customer';
    import { createCustomerHelper } from '$lib/stores/customer';
    import Link from '$lib/components/Link.svelte';

    export let data;

    // Get translations
    $: t = $i18n.t;

    // State
    let isLoading = true;
    let customerHelper;
    let order = null;
    let errorMessage = '';

    // Initialize customer API and fetch order
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

                // Create customer helper
                customerHelper = createCustomerHelper(customerAPI);

                // Check if logged in
                const hasToken = customerAPI.isLoggedIn();

                if (!hasToken) {
                    // If no token, redirect to login
                    goto(`/${data.locale.country}-${data.locale.language}/account/login?redirect=/account/orders`);
                    return;
                }

                // We have a token, try to get the customer data
                try {
                    await customerAPI.getCustomer();
                } catch (error) {
                    console.error('Invalid customer token:', error);
                    // If token is invalid, redirect to login
                    customerHelper.logout();
                    goto(`/${data.locale.country}-${data.locale.language}/account/login?redirect=/account/orders`);
                    return;
                }

                // Fetch order details
                order = await fetchOrderDetails(data.params.id);
            } catch (error) {
                console.error('Error initializing API:', error);
                errorMessage = t('account.orderLoadError');
            } finally {
                isLoading = false;
            }
        }
    });

    // Fetch order details
    async function fetchOrderDetails(orderId) {
        if (!customerHelper) return null;

        try {
            // Note: This is mocked for now as we don't have a direct getOrder method
            // In a real application, you'd implement a getOrder method in the customer API
            // For now, we'll use a simulated order for the UI

            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 500));

            // Create a sample order for display purposes
            return {
                id: orderId,
                orderNumber: Math.floor(1000 + Math.random() * 9000),
                processedAt: new Date().toISOString(),
                fulfillmentStatus: 'Unfulfilled',
                financialStatus: 'Paid',
                currentTotalPrice: {
                    amount: (99.99 + 4.99).toFixed(2),
                    currencyCode: 'USD'
                },
                subtotalPrice: {
                    amount: '99.99',
                    currencyCode: 'USD'
                },
                totalShippingPrice: {
                    amount: '4.99',
                    currencyCode: 'USD'
                },
                totalTax: {
                    amount: '0.00',
                    currencyCode: 'USD'
                },
                shippingAddress: {
                    firstName: 'John',
                    lastName: 'Doe',
                    address1: '123 Main St',
                    address2: 'Apt 4B',
                    city: 'New York',
                    province: 'NY',
                    zip: '10001',
                    country: 'United States',
                    phone: '555-123-4567'
                },
                lineItems: {
                    edges: [
                        {
                            node: {
                                title: 'Classic T-Shirt',
                                quantity: 2,
                                variant: {
                                    title: 'Black / L',
                                    price: {
                                        amount: '29.99',
                                        currencyCode: 'USD'
                                    },
                                    image: {
                                        url: 'https://via.placeholder.com/150',
                                        altText: 'Black t-shirt'
                                    }
                                },
                                originalTotalPrice: {
                                    amount: '59.98',
                                    currencyCode: 'USD'
                                }
                            }
                        },
                        {
                            node: {
                                title: 'Denim Jeans',
                                quantity: 1,
                                variant: {
                                    title: 'Blue / 32',
                                    price: {
                                        amount: '39.99',
                                        currencyCode: 'USD'
                                    },
                                    image: {
                                        url: 'https://via.placeholder.com/150',
                                        altText: 'Blue jeans'
                                    }
                                },
                                originalTotalPrice: {
                                    amount: '39.99',
                                    currencyCode: 'USD'
                                }
                            }
                        }
                    ]
                }
            };
        } catch (error) {
            console.error('Error fetching order:', error);
            return null;
        }
    }

    // Format date
    function formatDate(dateString) {
        return new Date(dateString).toLocaleDateString(
            data.locale ? `${data.locale.language}-${data.locale.country}` : undefined,
            { year: 'numeric', month: 'long', day: 'numeric' }
        );
    }

    // Format time
    function formatTime(dateString) {
        return new Date(dateString).toLocaleTimeString(
            data.locale ? `${data.locale.language}-${data.locale.country}` : undefined,
            { hour: 'numeric', minute: 'numeric' }
        );
    }
</script>

<svelte:head>
    <title>{order ? `${t('account.order')} #${order.orderNumber}` : t('account.orderDetails')} | {t('site.title')}</title>
</svelte:head>

<div class="account-page">
    <div class="account-header">
        <h1>{order ? `${t('account.order')} #${order.orderNumber}` : t('account.orderDetails')}</h1>
        <Link href="/account/orders" className="button outline">
            {t('account.backToOrders')}
        </Link>
    </div>

    {#if isLoading}
        <div class="loading">
            <p>{t('message.loading')}</p>
        </div>
    {:else if errorMessage}
        <div class="error-message">
            <p>{errorMessage}</p>
            <div class="action">
                <Link href="/account/orders" className="button outline">
                    {t('account.backToOrders')}
                </Link>
            </div>
        </div>
    {:else if order}
        <div class="order-container">
            <!-- Order Summary -->
            <section class="order-section">
                <h2>{t('account.orderSummary')}</h2>
                <div class="order-summary">
                    <div class="summary-row">
                        <div class="summary-label">{t('account.orderNumber')}</div>
                        <div class="summary-value">#{order.orderNumber}</div>
                    </div>
                    <div class="summary-row">
                        <div class="summary-label">{t('account.orderDate')}</div>
                        <div class="summary-value">{formatDate(order.processedAt)} at {formatTime(order.processedAt)}</div>
                    </div>
                    <div class="summary-row">
                        <div class="summary-label">{t('account.paymentStatus')}</div>
                        <div class="summary-value">
                            <span class={`status ${order.financialStatus.toLowerCase()}`}>{order.financialStatus}</span>
                        </div>
                    </div>
                    <div class="summary-row">
                        <div class="summary-label">{t('account.fulfillmentStatus')}</div>
                        <div class="summary-value">
                            <span class={`status ${order.fulfillmentStatus.toLowerCase()}`}>{order.fulfillmentStatus}</span>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Order Items -->
            <section class="order-section">
                <h2>{t('account.orderItems')}</h2>
                <div class="order-items">
                    {#each order.lineItems.edges as { node }}
                        <div class="order-item">
                            <div class="item-image">
                                {#if node.variant?.image}
                                    <img
                                            src={node.variant.image.url}
                                            alt={node.variant.image.altText || node.title}
                                            width="80"
                                            height="80"
                                    />
                                {:else}
                                    <div class="placeholder-image"></div>
                                {/if}
                            </div>
                            <div class="item-details">
                                <div class="item-name">{node.title}</div>
                                {#if node.variant?.title && node.variant.title !== 'Default Title'}
                                    <div class="item-variant">{node.variant.title}</div>
                                {/if}
                                <div class="item-price">
                                    {formatMoney(node.variant?.price)} × {node.quantity}
                                </div>
                            </div>
                            <div class="item-total">
                                {formatMoney(node.originalTotalPrice)}
                            </div>
                        </div>
                    {/each}
                </div>
            </section>

            <!-- Order Totals -->
            <section class="order-section">
                <h2>{t('account.orderTotals')}</h2>
                <div class="order-totals">
                    <div class="total-row">
                        <div class="total-label">{t('cart.subtotal')}</div>
                        <div class="total-value">{formatMoney(order.subtotalPrice)}</div>
                    </div>
                    <div class="total-row">
                        <div class="total-label">{t('cart.shipping')}</div>
                        <div class="total-value">{formatMoney(order.totalShippingPrice)}</div>
                    </div>
                    {#if parseFloat(order.totalTax.amount) > 0}
                        <div class="total-row">
                            <div class="total-label">{t('cart.tax')}</div>
                            <div class="total-value">{formatMoney(order.totalTax)}</div>
                        </div>
                    {/if}
                    <div class="total-row grand-total">
                        <div class="total-label">{t('cart.total')}</div>
                        <div class="total-value">{formatMoney(order.currentTotalPrice)}</div>
                    </div>
                </div>
            </section>

            <!-- Shipping Information -->
            {#if order.shippingAddress}
                <section class="order-section">
                    <h2>{t('account.shippingInformation')}</h2>
                    <div class="shipping-address">
                        <p class="address-name">
                            {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                        </p>
                        <p>{order.shippingAddress.address1}</p>
                        {#if order.shippingAddress.address2}
                            <p>{order.shippingAddress.address2}</p>
                        {/if}
                        <p>
                            {order.shippingAddress.city}, {order.shippingAddress.province} {order.shippingAddress.zip}
                        </p>
                        <p>{order.shippingAddress.country}</p>
                        {#if order.shippingAddress.phone}
                            <p>{order.shippingAddress.phone}</p>
                        {/if}
                    </div>
                </section>
            {/if}

            <!-- Need Help Section -->
            <section class="order-section help-section">
                <h2>{t('account.needHelp')}</h2>
                <p>{t('account.orderHelpText')}</p>
                <a href="/contact" class="button primary">
                    {t('account.contactUs')}
                </a>
            </section>
        </div>
    {/if}
</div>

<style>
    .account-page {
        max-width: 800px;
        margin: 0 auto;
        padding: 2rem 1rem;
    }

    .account-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
    }

    .account-header h1 {
        margin: 0;
    }

    .loading, .error-message {
        text-align: center;
        padding: 3rem;
        background-color: #f9f9f9;
        border-radius: 8px;
    }

    .error-message {
        color: #ef4444;
    }

    .action {
        margin-top: 1.5rem;
    }

    .order-container {
        display: grid;
        gap: 2rem;
    }

    .order-section {
        background-color: #f9f9f9;
        border-radius: 8px;
        padding: 1.5rem;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
    }

    .order-section h2 {
        margin-top: 0;
        margin-bottom: 1.25rem;
        font-size: 1.2rem;
        padding-bottom: 0.5rem;
        border-bottom: 1px solid #eee;
    }

    /* Order Summary Styles */
    .summary-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.75rem;
    }

    .summary-label {
        color: #666;
    }

    .summary-value {
        font-weight: 500;
    }

    /* Status Styles */
    .status {
        display: inline-block;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.8rem;
        text-transform: capitalize;
    }

    .status.fulfilled, .status.paid {
        background-color: #ecfdf5;
        color: #10b981;
    }

    .status.unfulfilled, .status.refunded {
        background-color: #fef2f2;
        color: #ef4444;
    }

    .status.partially-fulfilled, .status.partially-paid {
        background-color: #fef3c7;
        color: #f59e0b;
    }

    /* Order Items Styles */
    .order-items {
        display: grid;
        gap: 1rem;
    }

    .order-item {
        display: grid;
        grid-template-columns: 80px 1fr auto;
        gap: 1rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid #eee;
    }

    .order-item:last-child {
        padding-bottom: 0;
        border-bottom: none;
    }

    .item-image {
        width: 80px;
        height: 80px;
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

    .item-details {
        display: flex;
        flex-direction: column;
        justify-content: center;
    }

    .item-name {
        font-weight: 500;
        margin-bottom: 0.25rem;
    }

    .item-variant {
        color: #666;
        font-size: 0.9rem;
        margin-bottom: 0.25rem;
    }

    .item-price {
        font-size: 0.9rem;
        color: #666;
    }

    .item-total {
        font-weight: 500;
        display: flex;
        align-items: center;
    }

    /* Order Totals Styles */
    .total-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.75rem;
    }

    .total-label {
        color: #666;
    }

    .total-value {
        font-weight: 500;
    }

    .grand-total {
        margin-top: 0.5rem;
        padding-top: 0.75rem;
        border-top: 1px solid #ddd;
        font-size: 1.1rem;
    }

    .grand-total .total-label,
    .grand-total .total-value {
        font-weight: 600;
    }

    /* Shipping Address Styles */
    .shipping-address p {
        margin: 0.25rem 0;
    }

    .address-name {
        font-weight: 500;
    }

    /* Help Section Styles */
    .help-section p {
        margin-bottom: 1.25rem;
        color: #666;
    }

    /* Button Styles */
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

    @media (max-width: 600px) {
        .order-item {
            grid-template-columns: 60px 1fr;
            grid-template-rows: auto auto;
        }

        .item-image {
            width: 60px;
            height: 60px;
            grid-row: span 2;
        }

        .item-total {
            grid-column: 2;
            justify-content: flex-start;
            margin-top: 0.5rem;
        }
    }
</style>