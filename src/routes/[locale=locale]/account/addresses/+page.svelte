<!-- src/routes/[locale=locale]/account/addresses/+page.svelte -->
<script>
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';
    import { i18n } from '$lib/i18n/translations';
    import { createClientStorefront } from '$lib/api/storefront.client';
    import { createCustomerAPI, customerTokenGetDefault, customerTokenSetDefault, customerTokenRemoveDefault } from '$lib/api/customer';
    import { createCustomerHelper, customer, customerAddresses, defaultAddress } from '$lib/stores/customer';
    import Link from '$lib/components/Link.svelte';

    export let data;

    // Get translations
    $: t = $i18n.t;

    // State
    let isLoading = true;
    let customerHelper;
    let addresses = [];
    let showAddressForm = false;
    let isEditMode = false;
    let currentAddressId = null;
    let formIsSubmitting = false;
    let errorMessage = '';
    let successMessage = '';

    // Form fields
    let formData = {
        firstName: '',
        lastName: '',
        company: '',
        address1: '',
        address2: '',
        city: '',
        province: '',
        zip: '',
        country: '',
        phone: ''
    };

    // Country options (use your supported countries from config)
    const countryOptions = [
        { code: 'US', name: 'United States' },
        { code: 'CA', name: 'Canada' },
        { code: 'DE', name: 'Germany' },
        { code: 'GB', name: 'United Kingdom' },
        { code: 'FR', name: 'France' },
        { code: 'ES', name: 'Spain' },
        { code: 'IT', name: 'Italy' }
    ];

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

            // Check if logged in directly
            const hasToken = customerAPI.isLoggedIn();

            if (!hasToken) {
                // If no token, redirect to login
                goto(`/${data.locale.country}-${data.locale.language}/account/login?redirect=/account/addresses`);
                return;
            }

            // We have a token, try to get the customer data
            try {
                await customerAPI.getCustomer();
            } catch (error) {
                console.error('Invalid customer token:', error);
                // If token is invalid, redirect to login
                customerHelper.logout();
                goto(`/${data.locale.country}-${data.locale.language}/account/login?redirect=/account/addresses`);
                return;
            }

            // Fetch customer data if needed
            if (!$customer) {
                await customerAPI.getCustomer();
            }

            isLoading = false;
        }
    });

    // Watch for address changes
    $: {
        if ($customerAddresses) {
            addresses = $customerAddresses;
        }
    }

    // Open address form for adding
    function openAddAddressForm() {
        // Reset form
        formData = {
            firstName: $customer?.firstName || '',
            lastName: $customer?.lastName || '',
            company: '',
            address1: '',
            address2: '',
            city: '',
            province: '',
            zip: '',
            country: 'US', // Default country
            phone: $customer?.phone || ''
        };

        isEditMode = false;
        currentAddressId = null;
        showAddressForm = true;
        errorMessage = '';
        successMessage = '';

        // Scroll to form
        setTimeout(() => {
            document.getElementById('address-form')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    }

    // Open address form for editing
    function openEditAddressForm(address) {
        formData = {
            firstName: address.firstName || '',
            lastName: address.lastName || '',
            company: address.company || '',
            address1: address.address1 || '',
            address2: address.address2 || '',
            city: address.city || '',
            province: address.province || '',
            zip: address.zip || '',
            country: address.country || 'US',
            phone: address.phone || ''
        };

        isEditMode = true;
        currentAddressId = address.id;
        showAddressForm = true;
        errorMessage = '';
        successMessage = '';

        // Scroll to form
        setTimeout(() => {
            document.getElementById('address-form')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    }

    // Close address form
    function closeAddressForm() {
        showAddressForm = false;
    }

    // Handle form submission
    async function handleSubmit(e) {
        e.preventDefault();

        if (!customerHelper) return;

        formIsSubmitting = true;
        errorMessage = '';
        successMessage = '';

        try {
            let result;

            if (isEditMode && currentAddressId) {
                // Update existing address
                result = await customerHelper.updateAddress(currentAddressId, formData);

                if (result.success) {
                    successMessage = t('account.addressUpdated');
                }
            } else {
                // Add new address
                result = await customerHelper.addAddress(formData);

                if (result.success) {
                    successMessage = t('account.addressAdded');
                }
            }

            if (!result.success) {
                errorMessage = result.errors?.[0]?.message || t('account.addressError');
            } else {
                // Refresh customer data to get updated addresses
                await customerHelper.customer.getCustomer();

                // Close form after successful submission
                setTimeout(() => {
                    showAddressForm = false;
                }, 2000);
            }
        } catch (error) {
            console.error('Address form error:', error);
            errorMessage = t('account.addressError');
        } finally {
            formIsSubmitting = false;
        }
    }

    // Delete address
    async function deleteAddress(addressId) {
        if (!addressId || !customerHelper) return;

        // Confirm deletion
        if (!confirm(t('account.confirmDeleteAddress'))) return;

        isLoading = true;

        try {
            const result = await customerHelper.removeAddress(addressId);

            if (!result.success) {
                errorMessage = result.errors?.[0]?.message || t('account.deleteAddressError');
            }

            // Refresh customer data
            await customerHelper.customer.getCustomer();
        } catch (error) {
            console.error('Error deleting address:', error);
            errorMessage = t('account.deleteAddressError');
        } finally {
            isLoading = false;
        }
    }

    // Set as default address
    async function setAsDefault(addressId) {
        if (!addressId || !customerHelper) return;

        isLoading = true;

        try {
            const result = await customerHelper.setDefaultAddress(addressId);

            if (!result.success) {
                errorMessage = result.errors?.[0]?.message || t('account.defaultAddressError');
            }

            // Refresh customer data
            await customerHelper.customer.getCustomer();
        } catch (error) {
            console.error('Error setting default address:', error);
            errorMessage = t('account.defaultAddressError');
        } finally {
            isLoading = false;
        }
    }
</script>

<svelte:head>
    <title>{t('account.addresses')} | {t('site.title')}</title>
</svelte:head>

<div class="account-page">
    <div class="account-header">
        <h1>{t('account.addresses')}</h1>
        <Link href="/account" className="button outline">
            {t('account.backToAccount')}
        </Link>
    </div>

    {#if errorMessage}
        <div class="message error">
            {errorMessage}
        </div>
    {/if}

    {#if successMessage}
        <div class="message success">
            {successMessage}
        </div>
    {/if}

    {#if isLoading}
        <div class="loading">
            <p>{t('message.loading')}</p>
        </div>
    {:else}
        <div class="addresses-container">
            <div class="add-address">
                <button class="button primary" on:click={openAddAddressForm}>
                    {t('account.addNewAddress')}
                </button>
            </div>

            {#if showAddressForm}
                <div id="address-form" class="address-form-container">
                    <div class="form-header">
                        <h2>{isEditMode ? t('account.editAddress') : t('account.addAddress')}</h2>
                        <button class="close-button" on:click={closeAddressForm}>×</button>
                    </div>

                    <form on:submit={handleSubmit}>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="firstName">{t('form.firstName')}</label>
                                <input
                                        type="text"
                                        id="firstName"
                                        bind:value={formData.firstName}
                                        required
                                        disabled={formIsSubmitting}
                                />
                            </div>

                            <div class="form-group">
                                <label for="lastName">{t('form.lastName')}</label>
                                <input
                                        type="text"
                                        id="lastName"
                                        bind:value={formData.lastName}
                                        required
                                        disabled={formIsSubmitting}
                                />
                            </div>
                        </div>

                        <div class="form-group">
                            <label for="company">{t('form.company')}</label>
                            <input
                                    type="text"
                                    id="company"
                                    bind:value={formData.company}
                                    disabled={formIsSubmitting}
                            />
                        </div>

                        <div class="form-group">
                            <label for="address1">{t('form.address')}</label>
                            <input
                                    type="text"
                                    id="address1"
                                    bind:value={formData.address1}
                                    required
                                    disabled={formIsSubmitting}
                            />
                        </div>

                        <div class="form-group">
                            <label for="address2">{t('form.address2')}</label>
                            <input
                                    type="text"
                                    id="address2"
                                    bind:value={formData.address2}
                                    disabled={formIsSubmitting}
                            />
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="city">{t('form.city')}</label>
                                <input
                                        type="text"
                                        id="city"
                                        bind:value={formData.city}
                                        required
                                        disabled={formIsSubmitting}
                                />
                            </div>

                            <div class="form-group">
                                <label for="province">{t('form.state')}</label>
                                <input
                                        type="text"
                                        id="province"
                                        bind:value={formData.province}
                                        required
                                        disabled={formIsSubmitting}
                                />
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="zip">{t('form.zipCode')}</label>
                                <input
                                        type="text"
                                        id="zip"
                                        bind:value={formData.zip}
                                        required
                                        disabled={formIsSubmitting}
                                />
                            </div>

                            <div class="form-group">
                                <label for="country">{t('form.country')}</label>
                                <select
                                        id="country"
                                        bind:value={formData.country}
                                        required
                                        disabled={formIsSubmitting}
                                >
                                    {#each countryOptions as country}
                                        <option value={country.code}>{country.name}</option>
                                    {/each}
                                </select>
                            </div>
                        </div>

                        <div class="form-group">
                            <label for="phone">{t('form.phone')}</label>
                            <input
                                    type="tel"
                                    id="phone"
                                    bind:value={formData.phone}
                                    disabled={formIsSubmitting}
                            />
                        </div>

                        <div class="form-actions">
                            <button type="button" class="button outline" on:click={closeAddressForm} disabled={formIsSubmitting}>
                                {t('form.cancel')}
                            </button>
                            <button type="submit" class="button primary" disabled={formIsSubmitting}>
                                {formIsSubmitting ? t('form.saving') : t('form.save')}
                            </button>
                        </div>
                    </form>
                </div>
            {/if}

            {#if addresses.length > 0}
                <div class="addresses-grid">
                    {#each addresses as address}
                        {@const isDefault = address.id === $defaultAddress?.id}
                        <div class="address-card {isDefault ? 'default' : ''}">
                            {#if isDefault}
                                <div class="default-badge">{t('account.defaultAddress')}</div>
                            {/if}

                            <div class="address-details">
                                <p class="address-name">
                                    {address.firstName} {address.lastName}
                                </p>

                                {#if address.company}
                                    <p>{address.company}</p>
                                {/if}

                                <p>{address.address1}</p>

                                {#if address.address2}
                                    <p>{address.address2}</p>
                                {/if}

                                <p>{address.zip} {address.city}</p>
                                <p>{address.province} {address.country}</p>

                                {#if address.phone}
                                    <p>{address.phone}</p>
                                {/if}
                            </div>

                            <div class="address-actions">
                                <button class="button outline small" on:click={() => openEditAddressForm(address)}>
                                    {t('account.edit')}
                                </button>

                                <button class="button outline small" on:click={() => deleteAddress(address.id)}>
                                    {t('account.delete')}
                                </button>

                                {#if !isDefault}
                                    <button class="button primary small" on:click={() => setAsDefault(address.id)}>
                                        {t('account.setAsDefault')}
                                    </button>
                                {/if}
                            </div>
                        </div>
                    {/each}
                </div>
            {:else}
                <div class="no-addresses">
                    <p>{t('account.noAddresses')}</p>
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

    .addresses-container {
        display: grid;
        gap: 2rem;
    }

    .add-address {
        margin-bottom: 1rem;
    }

    .addresses-grid {
        display: grid;
        gap: 1.5rem;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    }

    .address-card {
        position: relative;
        background-color: #f9f9f9;
        border: 1px solid #eee;
        border-radius: 8px;
        padding: 1.5rem;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
    }

    .address-card.default {
        border-color: #4a4a4a;
    }

    .default-badge {
        position: absolute;
        top: 0;
        right: 0;
        background-color: #4a4a4a;
        color: white;
        font-size: 0.7rem;
        padding: 0.25rem 0.5rem;
        border-radius: 0 0.5rem 0 0.5rem;
    }

    .address-details {
        margin-bottom: 1.5rem;
    }

    .address-details p {
        margin: 0.25rem 0;
    }

    .address-name {
        font-weight: 500;
    }

    .address-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
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

    .button.small {
        padding: 0.25rem 0.75rem;
        font-size: 0.8rem;
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
        opacity: 0.7;
        cursor: not-allowed;
    }

    .loading, .no-addresses {
        text-align: center;
        padding: 3rem;
        background-color: #f9f9f9;
        border-radius: 8px;
    }

    .address-form-container {
        background-color: #f9f9f9;
        border-radius: 8px;
        padding: 1.5rem;
        margin-bottom: 2rem;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }

    .form-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
    }

    .form-header h2 {
        margin: 0;
        font-size: 1.2rem;
    }

    .close-button {
        background: none;
        border: none;
        font-size: 1.5rem;
        line-height: 1;
        cursor: pointer;
    }

    .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
    }

    @media (max-width: 600px) {
        .form-row {
            grid-template-columns: 1fr;
        }
    }

    .form-group {
        margin-bottom: 1rem;
    }

    label {
        display: block;
        margin-bottom: 0.25rem;
        font-size: 0.9rem;
    }

    input, select {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 1rem;
    }

    input:focus, select:focus {
        outline: none;
        border-color: #4a4a4a;
        box-shadow: 0 0 0 2px rgba(74, 74, 74, 0.2);
    }

    .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        margin-top: 1.5rem;
    }

    .message {
        padding: 0.75rem 1rem;
        border-radius: 4px;
        margin-bottom: 1.5rem;
    }

    .message.error {
        background-color: #fee2e2;
        color: #ef4444;
    }

    .message.success {
        background-color: #ecfdf5;
        color: #10b981;
    }
</style>