<script>
    import { i18n } from '$lib/i18n/translations';
    $: t = $i18n.t;
    export let data;
    export let product;
</script>

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
<style>
    .product-card {
        width: 100%;
        margin: 0 auto;
        background-color: #ffffff;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        overflow: hidden;
        transition: all 0.3s ease;
    }

    .product-card:hover {
        box-shadow: 0 6px 8px rgba(0, 0, 0, 0.1);
    }

    .product-image {
        position: relative;
        width: 100%;
        padding-top: 100%; /* 1:1 aspect ratio */
        overflow: hidden;
    }

    .product-image img {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.3s ease;
    }

    .product-card:hover .product-image img {
        transform: scale(1.05);
    }

    .product-info {
        padding: 16px;
        text-align: left;
    }

    .product-info h3 {
        margin: 0 0 8px 0;
        font-size: 1.1rem;
        color: #333;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .product-price {
        margin: 0 0 12px 0;
        font-size: 0.9rem;
        color: #666;
    }

    .view-product {
        display: inline-block;
        padding: 8px 16px;
        background-color: #333;
        color: #fff;
        text-decoration: none;
        border-radius: 20px;
        font-size: 0.8rem;
        transition: background-color 0.3s ease;
    }

    .view-product:hover {
        background-color: #555;
    }
</style>