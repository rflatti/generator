<script>
    import { i18n } from '$lib/i18n/translations.js';
    import { page } from '$app/stores';

    export let data;

    // Get translation function
    $: t = $i18n.t;

    // Extract collections data
    $: collections = data.collections?.nodes || [];
    $: pageInfo = data.collections?.pageInfo;

    // Load more collections
    function loadMore() {
        if (pageInfo?.endCursor) {
            const params = new URLSearchParams($page.url.searchParams);
            params.set('cursor', pageInfo.endCursor);
            window.location.href = `${$page.url.pathname}?${params}`;
        }
    }
</script>

<svelte:head>
    <title>{t('collections.title')}</title>
    <meta name="description" content={t('collections.description')} />
</svelte:head>

<div class="collections-page">
    <header class="collections-header">
        <h1>{t('collections.title')}</h1>
        <p class="collections-intro">{t('collections.intro')}</p>
    </header>

    {#if collections.length > 0}
        <div class="collections-grid">
            {#each collections as collection}
                <a
                        href={`/${data.locale.country}-${data.locale.language}/collections/${collection.handle}`}
                        class="collection-card"
                >
                    {#if collection.image}
                        <div class="collection-image">
                            <img
                                    src={collection.image.url}
                                    alt={collection.image.altText || collection.title}
                                    width={collection.image.width}
                                    height={collection.image.height}
                                    loading="lazy"
                            />
                        </div>
                    {:else}
                        <div class="collection-image placeholder">
                            <div class="placeholder-text">{collection.title}</div>
                        </div>
                    {/if}

                    <div class="collection-info">
                        <h2>{collection.title}</h2>
                        {#if collection.description}
                            <p class="collection-description">{collection.description}</p>
                        {/if}
                    </div>
                </a>
            {/each}
        </div>

        {#if pageInfo?.hasNextPage}
            <div class="load-more">
                <button on:click={loadMore}>{t('collections.loadMore')}</button>
            </div>
        {/if}
    {:else}
        <div class="no-collections">
            <p>{t('collections.noCollections')}</p>
        </div>
    {/if}
</div>

<style>
    .collections-page {
        max-width: 1200px;
        margin: 0 auto;
        padding: 1rem;
    }

    .collections-header {
        text-align: center;
        margin-bottom: 3rem;
    }

    .collections-header h1 {
        font-size: 2.25rem;
        margin: 0 0 1rem;
    }

    .collections-intro {
        max-width: 800px;
        margin: 0 auto;
        color: #666;
        line-height: 1.6;
    }

    .collections-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 2rem;
        margin-bottom: 2rem;
    }

    .collection-card {
        border: 1px solid #eee;
        border-radius: 4px;
        overflow: hidden;
        text-decoration: none;
        color: inherit;
        transition: transform 0.2s, box-shadow 0.2s;
    }

    .collection-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    }

    .collection-image {
        height: 200px;
        overflow: hidden;
    }

    .collection-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.3s;
    }

    .collection-card:hover .collection-image img {
        transform: scale(1.05);
    }

    .collection-image.placeholder {
        background-color: #f5f5f5;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .placeholder-text {
        font-size: 1.5rem;
        color: #999;
        font-weight: 300;
    }

    .collection-info {
        padding: 1.5rem;
    }

    .collection-info h2 {
        font-size: 1.25rem;
        margin: 0 0 0.5rem;
    }

    .collection-description {
        color: #666;
        font-size: 0.9rem;
        margin: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
    }

    .load-more {
        text-align: center;
        margin-top: 2rem;
    }

    .load-more button {
        padding: 0.75rem 2rem;
        background-color: #f5f5f5;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 0.875rem;
        cursor: pointer;
        transition: background-color 0.2s;
    }

    .load-more button:hover {
        background-color: #eee;
    }

    .no-collections {
        text-align: center;
        padding: 3rem 0;
        color: #666;
    }
</style>