<script>
    import { page } from '$app/stores';
    import { i18n } from '$lib/i18n/translations';

    // Get the error information
    $: error = $page.error;
    $: status = $page.status;

    // Get translation function
    $: t = $i18n.t;
</script>

<svelte:head>
    <title>{status} - {t('message.error')}</title>
</svelte:head>

<div class="error-container">
    <h1>{status}</h1>
    <p class="error-message">{error?.message || t('message.error')}</p>

    <div class="actions">
        <a href="javascript:history.back()" class="back-button">
            {t('navigation.back')}
        </a>

        <a href="/" class="home-button">
            {t('navigation.home')}
        </a>
    </div>
</div>

<style>
    .error-container {
        max-width: 600px;
        margin: 0 auto;
        padding: 2rem;
        text-align: center;
    }

    h1 {
        font-size: 6rem;
        margin: 0;
        color: #e63946;
    }

    .error-message {
        font-size: 1.2rem;
        margin: 1rem 0 2rem;
    }

    .actions {
        display: flex;
        justify-content: center;
        gap: 1rem;
        margin-top: 2rem;
    }

    .back-button,
    .home-button {
        display: inline-block;
        padding: 0.75rem 1.5rem;
        border-radius: 4px;
        text-decoration: none;
        font-weight: 500;
        transition: all 0.2s ease;
    }

    .back-button {
        background-color: #f1f1f1;
        color: #333;
    }

    .home-button {
        background-color: #0070f3;
        color: white;
    }

    .back-button:hover,
    .home-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }
</style>