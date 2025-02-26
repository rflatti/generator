<!-- src/routes/[locale=locale]/account/orders/+page.svelte -->
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
    let orders = [];
    let hasNextPage = false;
    let nextCursor = null;
    let loadingMore = false;

    // Initialize customer API
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

                // Check if logged in directly
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

                // Fetch orders
                await loadOrders();

                isLoading = false;
            } catch (error) {
                console.error('Error initializing API:', error);
                isLoading = false;
            }
        }
    });

    // Load orders
    async function loadOrders(cursor = null) {
        if (!customerHelper) return;

        try {
            const result = await customerHelper.getOrders(10, cursor);

            if (cursor) {
                orders = [...orders, ...result.orders];
            } else {
                orders = result.orders;
            }

            hasNextPage = result.pageInfo.hasNextPage;
            nextCursor = result.pageInfo.endCursor;
        } catch (error) {
            console.error('Error fetching orders:', error);
        }
    }

    // Load more orders
    async function loadMoreOrders() {
        if (!hasNextPage || !nextCursor || loadingMore) return;

        loadingMore = true;
        await loadOrders(nextCursor);
        loadingMore = false;
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
    <title>{t('account.orders')} | {t('site.title')}</title>
</svelte:head>

<div class="account-page">
    <div class="account-header">
        <h1>{t('account.orders')}</h1>
        <Link href="/account" className="button outline">
            {t('account.backToAccount')}
        </Link>
    </div>

    {#if isLoading}
        <div class="loading">
            <p>{t('message.loading')}</p>
        </div>
    {:else if orders.length === 0}
        <div class="no-orders">
            <p>{t('account.noOrders')}</p>
            <div class="action">
                <Link href="/" className="button primary">
                    {t('account.continueShopping')}
                </Link>
            </div>
        </div>
    {:else}
        <div class="orders-container">
            {#each orders as order}
                <div class="order-card">
                    <div class="order-header">
                        <div class="order-info">
                            <div class="order-title">
                                <span class="order-number">#{order.orderNumber}</span>
                                <span class="order-date">{formatDate(order.processedAt)}</span>
                            </div>
                            <div class="order-statuses">
                                <span class={`status ${order.fulfillmentStatus.toLowerCase()}`}>
                                    {order.fulfillmentStatus}
                                </span>
                                <span class={`status ${order.financialStatus.toLowerCase()}`}>
                                    {order.financialStatus}
                                </span>
                            </div>
                        </div>
                        <div class="order-total">
                            {formatMoney(order.currentTotalPrice)}
                        </div>
                    </div>

                    <div class="order-preview">
                        {#if order.lineItems?.edges?.length > 0}
                            <div class="order-items-preview">
                                {#each order.lineItems.edges.slice(0, 4) as { node }}
                                    <div class="item-preview">
                                        {#if node.variant?.image}
                                            <img
                                                    src={node.variant.image.url}
                                                    alt={node.title}
                                                    width="60"
                                                    height="60"
                                            />
                                        {:else}
                                            <div class="placeholder-image"></div>
                                        {/if}
                                    </div>
                                {/each}

                                {#if order.lineItems.edges.length > 4}
                                    <div class="item-preview more">
                                        +{order.lineItems.edges.length - 4}
                                    </div>
                                {/if}
                            </div>
                        {/if}

                        <Link href={`/account/orders/${order.id.split('/').pop()}`} className="button secondary">
                            {t('account.viewOrderDetails')}
                        </Link>
                    </div>
                </div>
            {/each}

            {#if hasNextPage}
                <div class="load-more">
                    <button class="button outline" on:click={loadMoreOrders} disabled={loadingMore}>
                        {loadingMore ? t('message.loading') : t('account.loadMoreOrders')}
                    </button>
                </div>
            {/if}
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

    .loading, .no-orders {
        text-align: center;
        padding: 3rem;
        background-color: #f9f9f9;
        border-radius: 8px;
    }

    .no-orders .action {
        margin-top: 1.5rem;
    }

    .orders-container {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .order-card {
        background-color: #f9f9f9;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
    }

    .order-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding: 1.25rem;
        background-color: #eee;
        gap: 1rem;
    }

    .order-info {
        flex: 1;
    }

    .order-title {
        margin-bottom: 0.5rem;
    }

    .order-number {
        font-weight: 600;
        font-size: 1.1rem;
        margin-right: 0.5rem;
    }

    .order-date {
        color: #666;
        font-size: 0.9rem;
    }

    .order-statuses {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
    }

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

    .order-total {
        font-weight: 600;
        font-size: 1.1rem;
    }

    .order-preview {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.25rem;
        gap: 1rem;
    }

    .order-items-preview {
        display: flex;
        gap: 0.5rem;
    }

    .item-preview {
        width: 60px;
        height: 60px;
        border-radius: 4px;
        overflow: hidden;
        background-color: #fff;
        border: 1px solid #eee;
    }

    .item-preview img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .placeholder-image {
        width: 100%;
        height: 100%;
        background-color: #eee;
    }

    .item-preview.more {
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #eee;
        color: #666;
        font-weight: 500;
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

    .button.secondary {
        background-color: #e5e5e5;
        color: #333;
    }

    .button.secondary:hover {
        background-color: #d5d5d5;
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
        opacity: 0.7;
        cursor: not-allowed;
    }

    .load-more {
        display: flex;
        justify-content: center;
        margin-top: 1rem;
    }

    @media (max-width: 600px) {
        .order-header {
            flex-direction: column;
        }

        .order-total {
            align-self: flex-start;
        }
    }
    </style>