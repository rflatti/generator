<!-- src/routes/[locale=locale]/account/reset/+page.svelte -->
<script>
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';
    import { page } from '$app/stores';
    import { i18n } from '$lib/i18n/translations';
    import { createClientStorefront } from '$lib/api/storefront.client';
    import { createCustomerAPI, customerTokenGetDefault, customerTokenSetDefault, customerTokenRemoveDefault } from '$lib/api/customer';
    import { createCustomerHelper } from '$lib/stores/customer';
    import Link from '$lib/components/Link.svelte';

    export let data;

    // Get translations
    $: t = $i18n.t;

    // State
    let password = '';
    let confirmPassword = '';
    let isLoading = false;
    let errorMessage = '';
    let successMessage = '';
    let customerHelper;

    // Get URL parameters
    $: resetToken = $page.url.searchParams.get('token');
    $: customerId = $page.url.searchParams.get('id');
    $: hasValidParams = !!resetToken && !!customerId;

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

                // Check if already logged in
                if (customerAPI.isLoggedIn()) {
                    try {
                        const customer = await customerAPI.getCustomer();
                        if (customer) {
                            goto(`/${data.locale.country}-${data.locale.language}/account`);
                            return;
                        }
                    } catch (error) {
                        // Invalid token, stay on page
                        customerHelper.logout();
                    }
                }
            } catch (error) {
                console.error('Error initializing API:', error);
            }
        }
    });

    // Validate the form
    function validateForm() {
        const errors = [];

        if (password !== confirmPassword) {
            errors.push(t('account.passwordsDoNotMatch'));
        }

        if (password.length < 8) {
            errors.push(t('account.passwordTooShort'));
        }

        return errors;
    }

    // Handle password reset
    async function handleResetPassword(e) {
        e.preventDefault();

        if (!customerHelper || !hasValidParams) return;

        // Validate form
        const errors = validateForm();
        if (errors.length > 0) {
            errorMessage = errors.join('. ');
            return;
        }

        isLoading = true;
        errorMessage = '';
        successMessage = '';

        try {
            const result = await customerHelper.resetPassword(customerId, password, resetToken);

            if (result.success) {
                successMessage = t('account.passwordResetSuccess');

                // Redirect to account page after successful reset
                setTimeout(() => {
                    goto(`/${data.locale.country}-${data.locale.language}/account`);
                }, 2000);
            } else {
                errorMessage = result.errors?.[0]?.message || t('account.passwordResetError');
            }
        } catch (error) {
            console.error('Reset error:', error);
            errorMessage = t('account.passwordResetError');
        } finally {
            isLoading = false;
        }
    }
</script>

<svelte:head>
    <title>{t('account.resetPassword')} | {t('site.title')}</title>
</svelte:head>

<div class="account-page">
    <div class="account-container">
        <h1>{t('account.resetPassword')}</h1>

        {#if !hasValidParams}
            <div class="message error">
                {t('account.invalidResetLink')}
                <div class="actions">
                    <Link href="/account/recover" className="button primary">
                        {t('account.requestNewLink')}
                    </Link>
                </div>
            </div>
        {:else}
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

            <form on:submit={handleResetPassword} class="account-form">
                <div class="form-group">
                    <label for="password">{t('form.newPassword')}</label>
                    <input
                            type="password"
                            id="password"
                            bind:value={password}
                            required
                            disabled={isLoading || successMessage}
                            placeholder={t('form.newPasswordPlaceholder')}
                    />
                    <small class="form-hint">{t('account.passwordRequirements')}</small>
                </div>

                <div class="form-group">
                    <label for="confirmPassword">{t('form.confirmPassword')}</label>
                    <input
                            type="password"
                            id="confirmPassword"
                            bind:value={confirmPassword}
                            required
                            disabled={isLoading || successMessage}
                            placeholder={t('form.confirmPasswordPlaceholder')}
                    />
                </div>

                <div class="form-actions">
                    <button type="submit" class="button primary" disabled={isLoading || successMessage}>
                        {#if isLoading}
                            {t('account.resetting')}
                        {:else}
                            {t('account.resetPassword')}
                        {/if}
                    </button>

                    <Link href="/account/login" className="button outline">
                        {t('account.backToLogin')}
                    </Link>
                </div>
            </form>
        {/if}
    </div>
</div>

<style>
    .account-page {
        display: flex;
        justify-content: center;
        padding: 2rem 1rem;
    }

    .account-container {
        max-width: 450px;
        width: 100%;
    }

    h1 {
        margin-bottom: 1.5rem;
        text-align: center;
    }

    .account-form {
        background-color: #f9f9f9;
        border-radius: 8px;
        padding: 2rem;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }

    .form-group {
        margin-bottom: 1.5rem;
    }

    label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
    }

    input {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 1rem;
    }

    input:focus {
        outline: none;
        border-color: #4a4a4a;
        box-shadow: 0 0 0 2px rgba(74, 74, 74, 0.2);
    }

    .form-hint {
        display: block;
        margin-top: 0.25rem;
        color: #666;
        font-size: 0.85rem;
    }

    .form-actions {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .button {
        padding: 0.75rem;
        border-radius: 4px;
        font-size: 1rem;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.2s;
        border: none;
        text-align: center;
        text-decoration: none;
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

    .message {
        padding: 1rem;
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

    .actions {
        margin-top: 1rem;
    }
</style>