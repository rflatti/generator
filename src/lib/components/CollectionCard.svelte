<script>
    import { i18n } from '$lib/i18n/translations';
    $: t = $i18n.t;
    export let collection;
    export let data;
</script>
<div class="collection-card">
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
    {/if}

    <div class="collection-info">
        <h3>{collection?.title}</h3>
        <a href="{data.locale ? `/${data.locale.country}-${data.locale.language}` : ''}/collections/{collection.handle}">
            {t('collections.viewCollection')}
        </a>
    </div>
</div>
<style>
    .collection-card {
        max-width: 300px;
        margin: 0 auto;
        background-color: #ffffff;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        overflow: hidden;
        transition: all 0.3s ease;
    }

    .collection-card:hover {
        box-shadow: 0 6px 8px rgba(0, 0, 0, 0.1);
    }

    .collection-image {
        position: relative;
        width: 100%;
        padding-top: 100%; /* 1:1 aspect ratio */
        overflow: hidden;
    }

    .collection-image img {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.3s ease;
    }

    .collection-card:hover .collection-image img {
        transform: scale(1.05);
    }

    .collection-info {
        padding: 16px;
        text-align: left;
    }

    .collection-info h3 {
        margin: 0 0 12px 0;
        font-size: 1.1rem;
        color: #333;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .view-collection {
        display: inline-block;
        padding: 8px 16px;
        background-color: #333;
        color: #fff;
        text-decoration: none;
        border-radius: 20px;
        font-size: 0.8rem;
        transition: background-color 0.3s ease;
    }

    .view-collection:hover {
        background-color: #555;
    }
</style>