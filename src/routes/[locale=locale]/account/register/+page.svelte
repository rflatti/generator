<!-- src/routes/[locale=locale]/account/register/+page.svelte -->
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

    // Form state
    let firstName = '';
    let lastName = '';
    let email = '';
    let password = '';
    let confirmPassword = '';
    let acceptsMarketing = false;
    let isLoading = false;
    let errorMessages = [];
    let customerHelper;

    // Redirect URL (after registration)
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

    // Handle registration
    async function handleRegister(e) {
        e.preventDefault();

        if (!customerHelper) return;

        // Validate form
        errorMessages = validateForm();
        if (errorMessages.length > 0) return;

        isLoading = true;

        try {
            const result = await customerHelper.register({
                firstName,
                lastName,
                email,
                password,
                acceptsMarketing
            });

            if (result.success) {
                goto(redirectUrl);
            } else {
                errorMessages = result.errors.map(err => err.message);
            }
        } catch (error) {
            console.error('Registration error:', error);
            errorMessages = [t('account.registrationError')];
        } finally {
            isLoading = false;
        }
    }
</script>

<svelte:head>
    <title>{t('account.register')} | {t('site.title')}</title>
</svelte:head>

<div class="account-page">
    <div class="account-container">
        <h1>{t('account.createAccount')}</h1>

        {#if errorMessages.length > 0}
            <div class="error-message">
                <ul>
                    {#each errorMessages as error}
                        <li>{error}</li>
                    {/each}
                </ul>
            </div>
        {/if}

        <form on:submit={handleRegister} class="account-form">
            <div class="form-row">
                <div class="form-group">
                    <label for="firstName">{t('form.firstName')}</label>
                    <input
                            type="text"
                            id="firstName"
                            bind:value={firstName}
                            required
                            disabled={isLoading}
                    />
                </div>

                <div class="form-group">
                    <label for="lastName">{t('form.lastName')}</label>
                    <input
                            type="text"
                            id="lastName"
                            bind:value={lastName}
                            required
                            disabled={isLoading}
                    />
                </div>
            </div>

            <div class="form-group">
                <label for="email">{t('form.email')}</label>
                <input
                        type="email"
                        id="email"
                        bind:value={email}
                        required
                        disabled={isLoading}
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
                        disabled={isLoading}
                />
            </div>

            <div class="form-group checkbox">
                <input
                        type="checkbox"
                        id="acceptsMarketing"
                        bind:checked={acceptsMarketing}
                        disabled={isLoading}
                />
                <label for="acceptsMarketing">{t('account.acceptMarketing')}</label>
            </div>

            <div class="form-actions">
                <button type="submit" class="button primary" disabled={isLoading}>
                    {#if isLoading}
                        {t('account.creatingAccount')}
                    {:else}
                        {t('account.createAccount')}
                    {/if}
                </button>
            </div>

            <div class="form-links">
                <span>{t('account.alreadyHaveAccount')}</span>
                <Link href="/account/login" className="form-link">
                    {t('account.login')}
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
        max-width: 550px;
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
        margin-bottom: 1.5rem;
    }

    .form-group.checkbox {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .form-group.checkbox input {
        width: auto;
    }

    .form-group.checkbox label {
        margin-bottom: 0;
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
        margin-top: 0.5rem;
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
        justify-content: center;
        align-items: center;
        gap: 0.5rem;
        margin-top: 1.5rem;
        font-size: 0.9rem;
    }

    .form-link {
        color: #4a4a4a;
        text-decoration: none;
        font-weight: 500;
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

    .error-message ul {
        margin: 0;
        padding-left: 1.25rem;
    }

    .error-message li + li {
        margin-top: 0.5rem;
    }
</style>