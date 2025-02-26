<!-- src/routes/[locale=locale]/account/login/+page.svelte -->
<script>
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';
    import { i18n } from '$lib/i18n/translations';
    import { createClientStorefront } from '$lib/api/storefront.client';
    import { createCustomerAPI, customerTokenGetDefault, customerTokenSetDefault, customerTokenRemoveDefault } from '$lib/api/customer';
    import { createCustomerHelper } from '$lib/stores/customer';
    import Link from '$lib/components/Link.svelte';

    export let data;

    // Get translations
    $: t = $i18n.t;

    // State
    let email = '';
    let password = '';
    let isLoading = false;
    let errorMessage = '';
    let customerHelper;

    // Redirect URL (after login)
    let redirectUrl = $page.url.searchParams.get('redirect') || `/${data.locale.country}-${data.locale.language}/account`;

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

            // Subscribe to the isLoggedIn store to avoid flashing/flickering
            const unsubscribe = customerHelper.isLoggedIn.subscribe(value => {
                if (value === true) { // Only redirect if we know for sure the user is logged in
                    goto(redirectUrl);
                }
            });
        }
    });

    // Handle login
    async function handleLogin(e) {
        e.preventDefault();

        if (!customerHelper) return;

        isLoading = true;
        errorMessage = '';

        try {
            const result = await customerHelper.login(email, password);

            if (result.success) {
                goto(redirectUrl);
            } else {
                errorMessage = result.errors?.[0]?.message || t('account.loginFailed');
            }
        } catch (error) {
            console.error('Login error:', error);
            errorMessage = t('account.loginError');
        } finally {
            isLoading = false;
        }
    }
</script>

<svelte:head>
    <title>{t('account.login')} | {t('site.title')}</title>
</svelte:head>

<div class="account-page">
    <div class="account-container">
        <h1>{t('account.login')}</h1>

        {#if errorMessage}
            <div class="error-message">
                {errorMessage}
            </div>
        {/if}

        <form on:submit={handleLogin} class="account-form">
            <div class="form-group">
                <label for="email">{t('form.email')}</label>
                <input
                        type="email"
                        id="email"
                        bind:value={email}
                        required
                        disabled={isLoading}
                        placeholder={t('form.emailPlaceholder')}
                />
            </div>

            <div class="form-group">
                <label for="password">{t('form.password')}</label>
                <input
                        type="password"
                        id="password"
                        bind:value={password}
                        required
                        disabled={isLoading}
                        placeholder={t('form.passwordPlaceholder')}
                />
            </div>

            <div class="form-actions">
                <button type="submit" class="button primary" disabled={isLoading}>
                    {#if isLoading}
                        {t('account.loggingIn')}
                    {:else}
                        {t('account.login')}
                    {/if}
                </button>
            </div>

            <div class="form-links">
                <Link href="/account/recover" className="form-link">
                    {t('account.forgotPassword')}
                </Link>
                <Link href="/account/register" className="form-link">
                    {t('account.createAccount')}
                </Link>
            </div>
        </form>
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

    .form-actions {
        margin-bottom: 1rem;
    }

    .button {
        width: 100%;
        padding: 0.75rem;
        border-radius: 4px;
        font-size: 1rem;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.2s;
        border: none;
    }

    .button.primary {
        background-color: #4a4a4a;
        color: white;
    }

    .button.primary:hover {
        background-color: #333;
    }

    .button:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }

    .form-links {
        display: flex;
        justify-content: space-between;
        margin-top: 1.5rem;
        font-size: 0.9rem;
    }

    .form-link {
        color: #4a4a4a;
        text-decoration: none;
    }

    .form-link:hover {
        text-decoration: underline;
    }

    .error-message {
        background-color: #fee2e2;
        color: #ef4444;
        padding: 0.75rem;
        border-radius: 4px;
        margin-bottom: 1.5rem;
        font-size: 0.9rem;
    }
</style>