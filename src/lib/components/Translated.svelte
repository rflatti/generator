<script>
    import { i18n } from '$lib/i18n/translations';

    /**
     * A simple component that translates a given key
     * Useful for components that need to display translated text
     */
    export let key = '';
    export let vars = {};

    // Get the translation function from the i18n store
    $: t = $i18n.t;
</script>

{#if key}
    {t(key, vars)}
{/if}