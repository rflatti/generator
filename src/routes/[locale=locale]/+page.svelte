<script>
    import { i18n } from '$lib/i18n/translations';
    import { createProductAPI } from '$lib/api/product';
    import { createCollectionAPI } from '$lib/api/collection';

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
                    <h3>{collection.title}</h3>
                    <a href="{data.locale ? `/${data.locale.country}-${data.locale.language}` : ''}/collections/{collection.handle}">
                        {t('collections.viewCollection')}
                    </a>
                </div>
            </div>
        {/each}
    </div>
</section>

<section class="featured-products">
    <h2>{t('products.featured')}</h2>

    <div class="product-grid">
        {#each featuredProducts as product}
            <div class="product-card">
                {#if product.variants.nodes[0]?.image}
                    <div class="product-image">
                        <img
                                src={product.variants.nodes[0].image.url}
                                alt={product.variants.nodes[0].image.altText || product.title}
                                width={product.variants.nodes[0].image.width}
                                height={product.variants.nodes[0].image.height}
                                loading="lazy"
                        />
                    </div>
                {/if}

                <div class="product-info">
                    <h3>{product.title}</h3>
                    <p class="product-price">
                        {product.variants.nodes[0]?.price?.amount} {product.variants.nodes[0]?.price?.currencyCode}
                    </p>
                    <a href="{data.locale ? `/${data.locale.country}-${data.locale.language}` : ''}/products/{product.handle}">
                        {t('products.viewProduct')}
                    </a>
                </div>
            </div>
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

    .collection-card,
    .product-card {
        border: 1px solid #eaeaea;
        border-radius: 8px;
        overflow: hidden;
        transition: transform 0.2s, box-shadow 0.2s;
    }

    .collection-card:hover,
    .product-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
    }

    .collection-image,
    .product-image {
        aspect-ratio: 16 / 9;
        overflow: hidden;
    }

    .collection-image img,
    .product-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.3s;
    }

    .collection-card:hover .collection-image img,
    .product-card:hover .product-image img {
        transform: scale(1.05);
    }

    .collection-info,
    .product-info {
        padding: 1rem;
    }

    .collection-info h3,
    .product-info h3 {
        font-size: 1.2rem;
        margin-bottom: 0.5rem;
    }

    .product-price {
        font-weight: bold;
        margin-bottom: 0.5rem;
    }

    a {
        display: inline-block;
        margin-top: 0.5rem;
        color: #0070f3;
        text-decoration: none;
    }

    a:hover {
        text-decoration: underline;
    }
</style>