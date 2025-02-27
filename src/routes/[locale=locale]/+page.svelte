<script>
    import { i18n } from '$lib/i18n/translations';
    import { createProductAPI } from '$lib/api/product';
    import { createCollectionAPI } from '$lib/api/collection';
    import CollectionCard from "$lib/components/CollectionCard.svelte";
    import ProductCard from "$lib/components/ProductCard.svelte";

    export let data;

    // Access translations through the i18n store
    $: t = $i18n.t;

    // Featured products and collections from the server
    $: featuredProducts = data.featuredProducts || [];
    $: featuredCollections = data.featuredCollections || [];
</script>

<svelte:head>
    <title>{t('site.title')}</title>
    <meta name="description" content={t('site.description')} />
</svelte:head>

<section class="hero">
    <div class="hero-content">
        <h1>{t('site.title')}</h1>
        <p>{t('site.description')}</p>
    </div>
</section>

<section class="featured-collections">
    <h2>{t('collections.featured')}</h2>

    <div class="collection-grid">
        {#each featuredCollections as collection}
            <CollectionCard collection={collection} data={data} />
        {/each}
    </div>
</section>

<section class="featured-products">
    <h2>{t('products.featured')}</h2>

    <div class="product-grid">
        {#each featuredProducts as product}
            <ProductCard product={product} data={data} />
        {/each}
    </div>
</section>

<style>
    .hero {
        background-color: #f7f7f7;
        padding: 4rem 2rem;
        text-align: center;
        margin-bottom: 2rem;
    }

    .hero-content h1 {
        font-size: 2.5rem;
        margin-bottom: 1rem;
    }

    .hero-content p {
        font-size: 1.2rem;
        max-width: 600px;
        margin: 0 auto;
    }

    .featured-collections,
    .featured-products {
        margin-bottom: 3rem;
    }

    h2 {
        font-size: 1.8rem;
        margin-bottom: 1.5rem;
        text-align: center;
    }

    .collection-grid,
    .product-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 2rem;
    }
</style>