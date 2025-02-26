<!-- src/routes/[locale=locale]/account/+page.svelte -->
<script>
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';
    import { i18n } from '$lib/i18n/translations';
    import { createClientStorefront } from '$lib/api/storefront.client';
    import { createCustomerAPI, customerTokenGetDefault, customerTokenSetDefault, customerTokenRemoveDefault } from '$lib/api/customer';
    import { createCustomerHelper, customer } from '$lib/stores/customer';
    import Link from '$lib/components/Link.svelte';

    export let data;

    // Get translations
    $: t = $i18n.t;

    // State
    let isLoading = true;
    let customerHelper;
    let recentOrders = [];
    let orderHistory = [];

    // Initialize customer API
    onMount(async () => {
        if (browser) {
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

            // We'll use the isLoggedIn value from the customer store instead of immediately redirecting
// This avoids the flickering between pages
            const unsubscribe = customerHelper.isLoggedIn.subscribe(value => {
                if (value === false) { // Only redirect if we know for sure the user is not logged in
                    goto(`/${data.locale.country}-${data.locale.language}/account/login`);
                    return;
                }
            });

            // Fetch customer data
            await customerAPI.getCustomer();

            // Fetch orders
            try {
                const { orders } = await customerHelper.getOrders(5);
                recentOrders = orders || [];
            } catch (error) {
                console.error('Error fetching orders:', error);
            }

            isLoading = false;
        }
    });

    // Handle logout
    async function handleLogout() {
        if (customerHelper) {
            await customerHelper.logout();
            goto(`/${data.locale.country}-${data.locale.language}/account/login`);
        }
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
    <title>{t('account.myAccount')} | {t('site.title')}</title>
</svelte:head>

<div class="account-page">
    <div class="account-header">
        <h1>{t('account.myAccount')}</h1>
        <button class="button outline" on:click={handleLogout}>
            {t('account.logout')}
        </button>
    </div>

    {#if isLoading}
        <div class="loading">
            <p>{t('message.loading')}</p>
        </div>
    {:else if $customer}
        <div class="account-container">
            <!-- Customer info section -->
            <div class="account-section">
                <div class="section-header">
                    <h2>{t('account.profile')}</h2>
                    <Link href="/account/profile" className="action-link">
                        {t('account.edit')}
                    </Link>
                </div>
                <div class="section-content">
                    <p><strong>{$customer.firstName} {$customer.lastName}</strong></p>
                    <p>{$customer.email}</p>
                    <p>{$customer.phone || t('account.noPhoneNumber')}</p>
                </div>
            </div>

            <!-- Default address section -->
            <div class="account-section">
                <div class="section-header">
                    <h2>{t('account.defaultAddress')}</h2>
                    <Link href="/account/addresses" className="action-link">
                        {t('account.manageAddresses')}
                    </Link>
                </div>
                <div class="section-content">
                    {#if $customer.defaultAddress}
                        <p>
                            {$customer.defaultAddress.firstName} {$customer.defaultAddress.lastName}<br>
                            {#if $customer.defaultAddress.company}
                                {$customer.defaultAddress.company}<br>
                            {/if}
                            {$customer.defaultAddress.address1}<br>
                            {#if $customer.defaultAddress.address2}
                                {$customer.defaultAddress.address2}<br>
                            {/if}
                            {$customer.defaultAddress.zip} {$customer.defaultAddress.city}<br>
                            {$customer.defaultAddress.province} {$customer.defaultAddress.country}<br>
                            {#if $customer.defaultAddress.phone}
                                {$customer.defaultAddress.phone}
                            {/if}
                        </p>
                    {:else}
                        <p>{t('account.noDefaultAddress')}</p>
                    {/if}
                </div>
            </div>

            <!-- Recent orders section -->
            <div class="account-section">
                <div class="section-header">
                    <h2>{t('account.recentOrders')}</h2>
                    <Link href="/account/orders" className="action-link">
                        {t('account.viewAllOrders')}
                    </Link>
                </div>
                <div class="section-content">
                    {#if recentOrders.length > 0}
                        <div class="orders-list">
                            {#each recentOrders as order}
                                <div class="order-item">
                                    <div class="order-header">
                                        <div>
                                            <span class="order-number">#{order.orderNumber}</span>
                                            <span class="order-date">{formatDate(order.processedAt)}</span>
                                        </div>
                                        <div class="order-status">
                                            <span class={`status ${order.fulfillmentStatus.toLowerCase()}`}>
                                                {order.fulfillmentStatus}
                                            </span>
                                        </div>
                                    </div>
                                    <div class="order-details">
                                        <div class="order-total">
                                            <span>{order.currentTotalPrice.amount} {order.currentTotalPrice.currencyCode}</span>
                                        </div>
                                        <Link href={`/account/orders/${order.id}`} className="button small">
                                            {t('account.viewOrder')}
                                        </Link>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    {:else}
                        <p>{t('account.noOrders')}</p>
                    {/if}
                </div>
            </div>
        </div>
    {:else}
        <div class="error-message">
            <p>{t('account.errorLoadingAccount')}</p>
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

    .account-container {
        display: grid;
        gap: 2rem;
    }

    .account-section {
        background-color: #f9f9f9;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        overflow: hidden;
    }

    .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 1.5rem;
        background-color: #eee;
    }

    .section-header h2 {
        margin: 0;
        font-size: 1.2rem;
    }

    .section-content {
        padding: 1.5rem;
    }

    .action-link {
        color: #4a4a4a;
        text-decoration: none;
        font-size: 0.9rem;
    }

    .action-link:hover {
        text-decoration: underline;
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
    }

    .button.outline {
        background-color: transparent;
        border: 1px solid #4a4a4a;
        color: #4a4a4a;
    }

    .button.outline:hover {
        background-color: #f5f5f5;
    }

    .button.small {
        padding: 0.25rem 0.75rem;
        font-size: 0.8rem;
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

    .orders-list {
        display: grid;
        gap: 1rem;
    }

    .order-item {
        border: 1px solid #eee;
        border-radius: 4px;
        overflow: hidden;
    }

    .order-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem;
        background-color: #f5f5f5;
        font-size: 0.9rem;
    }

    .order-number {
        font-weight: 500;
        margin-right: 0.5rem;
    }

    .order-date {
        color: #666;
    }

    .order-status .status {
        display: inline-block;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.8rem;
        text-transform: capitalize;
    }

    .status.fulfilled {
        background-color: #ecfdf5;
        color: #10b981;
    }

    .status.unfulfilled {
        background-color: #fef2f2;
        color: #ef4444;
    }

    .status.partially-fulfilled {
        background-color: #fef3c7;
        color: #f59e0b;
    }

    .order-details {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem;
    }

    .order-total {
        font-weight: 500;
    }
</style>