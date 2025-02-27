<script>
    import { i18n } from '$lib/i18n/translations';
    import { formatMoney, isDiscounted, calculateDiscountPercentage } from '$lib/utils/money';
    import { generateProductSeo } from '$lib/utils/seo';
    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import AddToCartButton from "$lib/components/AddToCartButton.svelte";
    import WishlistButton from "$lib/components/WishlistButton.svelte";
    import { createClientStorefront } from '$lib/api/storefront.client';
    import { createCustomerAPI, customerTokenGetDefault, customerTokenSetDefault, customerTokenRemoveDefault } from '$lib/api/customer';
    import { createCustomerMetafieldsAPI } from '$lib/api/customer-metafields';

    export let data;

    // Get translation function
    $: t = $i18n.t;

    // Extract product data
    $: product = data.product;
    $: variants = product?.variants?.nodes || [];
    $: options = product?.options || [];
    $: selectedVariant = product?.selectedVariant || variants[0];
    $: media = product?.media?.nodes || [];
    $: recommendations = data.recommendations || [];

    // Selected options state
    let selectedOptions = {};

    // Quantity state
    let quantity = 1;

    // Active image state
    let activeImageIndex = 0;
    let shopifyAPI = null;

    // Generate SEO data
    $: seo = generateProductSeo({
        product,
        selectedVariant,
        url: $page.url.href,
        siteName: data.shop?.name || 'Shopify Store'
    });

    // Initialize selected options from URL or default to first values
    onMount(() => {
        if (options.length > 0) {
            // Initialize with the selected variant's options if available
            if (selectedVariant) {
                selectedVariant.selectedOptions.forEach(opt => {
                    selectedOptions[opt.name] = opt.value;
                });
            } else {
                // Otherwise use first options
                options.forEach(option => {
                    selectedOptions[option.name] = option.values[0];
                });
            }
        }

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

        shopifyAPI = createCustomerMetafieldsAPI(customerAPI, storefront);
    });

    // Update quantity
    function updateQuantity(val) {
        quantity = Math.max(1, val);
    }

    // Handle option change
    function handleOptionChange(optionName, value) {
        selectedOptions = {
            ...selectedOptions,
            [optionName]: value
        };

        // Update URL with new selected options
        const params = new URLSearchParams($page.url.searchParams);
        Object.entries(selectedOptions).forEach(([name, value]) => {
            params.set(name.toLowerCase(), value);
        });

        const newUrl = `${$page.url.pathname}?${params}`;
        history.replaceState(null, '', newUrl);
    }

    // Find variant by selected options
    $: currentVariant = selectedOptions
        ? variants.find(variant =>
        variant.selectedOptions.every(
            opt => selectedOptions[opt.name] === opt.value
        )
    ) || selectedVariant
        : selectedVariant;

    // Price display
    $: price = currentVariant?.price;
    $: compareAtPrice = currentVariant?.compareAtPrice;
    $: hasDiscount = isDiscounted(price, compareAtPrice);
    $: discountPercentage = hasDiscount
        ? calculateDiscountPercentage(compareAtPrice, price)
        : 0;

    // Handle add to cart
    async function addToCart() {
        if (!currentVariant || !currentVariant.availableForSale) {
            return;
        }

        // In a real implementation, you would call your cart API here
        console.log('Adding to cart:', {
            variantId: currentVariant.id,
            quantity
        });

        // Show some feedback to the user
        alert(t('product.addedToCart'));
    }
</script>

<svelte:head>
    <title>{seo.title}</title>
    <meta name="description" content={seo.description} />
    <meta property="og:title" content={seo.openGraph.title} />
    <meta property="og:description" content={seo.openGraph.description} />
    <meta property="og:type" content={seo.openGraph.type} />
    <meta property="og:url" content={seo.openGraph.url} />
    {#if seo.openGraph.images && seo.openGraph.images[0]}
        <meta property="og:image" content={seo.openGraph.images[0].url} />
    {/if}
    <meta name="twitter:card" content={seo.twitter.card} />
    <meta name="twitter:title" content={seo.twitter.title} />
    <meta name="twitter:description" content={seo.twitter.description} />
    {#if seo.twitter.image}
        <meta name="twitter:image" content={seo.twitter.image} />
    {/if}
    <link rel="canonical" href={seo.canonical} />
</svelte:head>

<div class="product-page">
    <nav class="breadcrumbs">
        <a href={`/${data.locale.country}-${data.locale.language}`}>{t('nav.home')}</a>
        <span>&rsaquo;</span>
        <a href={`/${data.locale.country}-${data.locale.language}/products`}>{t('nav.products')}</a>
        <span>&rsaquo;</span>
        <span>{product.title}</span>
    </nav>

    <div class="product-container">
        <!-- Product Images -->
        <div class="product-images">
            <div class="main-image">
                {#if media.length > 0}
                    {#if media[activeImageIndex].__typename === 'MediaImage'}
                        <img
                                src={media[activeImageIndex].image.url}
                                alt={media[activeImageIndex].alt || product.title}
                                width={media[activeImageIndex].image.width}
                                height={media[activeImageIndex].image.height}
                        />
                    {/if}
                {:else if currentVariant?.image}
                    <img
                            src={currentVariant.image.url}
                            alt={currentVariant.image.altText || product.title}
                            width={currentVariant.image.width}
                            height={currentVariant.image.height}
                    />
                {/if}
            </div>

            {#if media.length > 1}
                <div class="thumbnail-gallery">
                    {#each media as item, index}
                        {#if item.__typename === 'MediaImage'}
                            <button
                                    class="thumbnail {activeImageIndex === index ? 'active' : ''}"
                                    on:click={() => activeImageIndex = index}
                            >
                                <img
                                        src={item.image.url}
                                        alt={item.alt || product.title}
                                        width="80"
                                        height="80"
                                />
                            </button>
                        {/if}
                    {/each}
                </div>
            {/if}
        </div>

        <!-- Product Info -->
        <div class="product-info">
            <h1>{product.title}</h1>

            {#if product.vendor}
                <div class="vendor">{product.vendor}</div>
            {/if}

            <div class="price-container">
                {#if hasDiscount}
                    <div class="price sale">
                        {formatMoney(price)}
                        <span class="compare-at">{formatMoney(compareAtPrice)}</span>
                        <span class="discount-badge">-{discountPercentage}%</span>
                    </div>
                {:else}
                    <div class="price">{formatMoney(price)}</div>
                {/if}
            </div>

            <!-- Product Options -->
            {#if options.length > 0}
                <div class="product-options">
                    {#each options as option}
                        <div class="option-group">
                            <label for={option.name}>{option.name}</label>
                            <div class="option-values">
                                {#each option.values as value}
                                    <button
                                            class="option-value {selectedOptions[option.name] === value ? 'selected' : ''}"
                                            on:click={() => handleOptionChange(option.name, value)}
                                    >
                                        {value}
                                    </button>
                                {/each}
                            </div>
                        </div>
                    {/each}
                </div>
            {/if}

            <!-- Quantity Selector -->
            <div class="quantity-selector">
                <label for="quantity">{t('product.quantity')}</label>
                <div class="quantity-controls">
                    <button on:click={() => updateQuantity(quantity - 1)} aria-label="Decrease quantity">-</button>
                    <input
                            id="quantity"
                            type="number"
                            min="1"
                            bind:value={quantity}
                            on:input={(e) => updateQuantity(parseInt(e.target.value))}
                    />
                    <button on:click={() => updateQuantity(quantity + 1)} aria-label="Increase quantity">+</button>
                </div>
            </div>

            <!-- Add to Cart Button -->
            <AddToCartButton
                    variantId={currentVariant?.id}
                    quantity={quantity}
                    disabled={!currentVariant || !currentVariant.availableForSale}
                    showQuantity={false}
                    locale={data.locale}
                    fullWidth={true}
            />
            <WishlistButton
                    variantId={currentVariant?.id}
                    productTitle={product.title}
                    productHandle={product.handle}
                    variantTitle={currentVariant?.title}
                    variantImage={currentVariant?.image}
                    price={currentVariant?.price}
                    compareAtPrice={currentVariant?.compareAtPrice}
                    shopifyAPI={shopifyAPI}
                    buttonOnly={true}
            />

            <!-- Product Description -->
            {#if product.descriptionHtml}
                <div class="product-description">
                    <h2>{t('product.description')}</h2>
                    {@html product.descriptionHtml}
                </div>
            {/if}
        </div>
    </div>

    <!-- Recommendations -->
    {#if recommendations.length > 0}
        <div class="recommendations">
            <h2>{t('product.related')}</h2>
            <div class="recommendations-grid">
                {#each recommendations as rec}
                    <a
                            href={`/${data.locale.country}-${data.locale.language}/products/${rec.handle}`}
                            class="recommendation-card"
                    >
                        {#if rec.variants?.nodes[0]?.image}
                            <div class="recommendation-image">
                                <img
                                        src={rec.variants.nodes[0].image.url}
                                        alt={rec.variants.nodes[0].image.altText || rec.title}
                                        width="150"
                                        height="150"
                                        loading="lazy"
                                />
                            </div>
                        {/if}
                        <div class="recommendation-info">
                            <h3>{rec.title}</h3>
                            {#if rec.variants?.nodes[0]?.price}
                                <div class="recommendation-price">
                                    {formatMoney(rec.variants.nodes[0].price)}
                                </div>
                            {/if}
                        </div>
                    </a>
                {/each}
            </div>
        </div>
    {/if}
</div>

<style>
    .product-page {
        max-width: 1200px;
        margin: 0 auto;
        padding: 1rem;
    }

    .breadcrumbs {
        margin-bottom: 2rem;
        font-size: 0.9rem;
    }

    .breadcrumbs a {
        color: #666;
        text-decoration: none;
    }

    .breadcrumbs a:hover {
        text-decoration: underline;
    }

    .breadcrumbs span {
        margin: 0 0.5rem;
        color: #666;
    }

    .product-container {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
        margin-bottom: 3rem;
    }

    @media (max-width: 768px) {
        .product-container {
            grid-template-columns: 1fr;
        }
    }

    .product-images {
        display: flex;
        flex-direction: column;
    }

    .main-image {
        width: 100%;
        aspect-ratio: 1 / 1;
        border: 1px solid #eee;
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 1rem;
    }

    .main-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .thumbnail-gallery {
        display: flex;
        gap: 0.5rem;
        overflow-x: auto;
        padding-bottom: 0.5rem;
    }

    .thumbnail {
        width: 80px;
        height: 80px;
        border: 1px solid #eee;
        border-radius: 4px;
        overflow: hidden;
        padding: 0;
        cursor: pointer;
        background: none;
    }

    .thumbnail.active {
        border-color: #333;
    }

    .thumbnail img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .product-info {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .product-info h1 {
        font-size: 2rem;
        margin: 0;
    }

    .vendor {
        color: #666;
        font-size: 1rem;
    }

    .price-container {
        margin-bottom: 0.5rem;
    }

    .price {
        font-size: 1.5rem;
        font-weight: bold;
    }

    .price.sale {
        color: #e53e3e;
    }

    .compare-at {
        text-decoration: line-through;
        color: #666;
        font-size: 1rem;
        margin-left: 0.5rem;
    }

    .discount-badge {
        background-color: #e53e3e;
        color: white;
        padding: 0.25rem 0.5rem;
        border-radius: 2px;
        font-size: 0.875rem;
        margin-left: 0.5rem;
    }

    .product-options {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .option-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .option-group label {
        font-weight: bold;
    }

    .option-values {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
    }

    .option-value {
        padding: 0.5rem 1rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        background: white;
        cursor: pointer;
        font-size: 0.875rem;
    }

    .option-value.selected {
        border-color: #333;
        background-color: #333;
        color: white;
    }

    .quantity-selector {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .quantity-selector label {
        font-weight: bold;
    }

    .quantity-controls {
        display: flex;
        border: 1px solid #ddd;
        border-radius: 4px;
        overflow: hidden;
        width: fit-content;
    }

    .quantity-controls button {
        background: #f5f5f5;
        border: none;
        padding: 0.5rem 1rem;
        cursor: pointer;
        font-size: 1rem;
    }

    .quantity-controls button:hover {
        background: #e5e5e5;
    }

    .quantity-controls input {
        width: 50px;
        border: none;
        text-align: center;
        font-size: 1rem;
        padding: 0.5rem;
        -moz-appearance: textfield;
    }

    .quantity-controls input::-webkit-outer-spin-button,
    .quantity-controls input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }

    .add-to-cart {
        padding: 1rem 2rem;
        background-color: #4a4a4a;
        color: white;
        border: none;
        border-radius: 4px;
        font-size: 1rem;
        font-weight: bold;
        cursor: pointer;
        transition: background-color 0.2s;
    }

    .add-to-cart:hover {
        background-color: #333;
    }

    .add-to-cart.disabled {
        background-color: #ccc;
        cursor: not-allowed;
    }

    .product-description {
        margin-top: 2rem;
        font-size: 0.95rem;
        line-height: 1.6;
    }

    .product-description h2 {
        font-size: 1.25rem;
        margin-bottom: 1rem;
    }

    .recommendations {
        margin-top: 3rem;
    }

    .recommendations h2 {
        font-size: 1.5rem;
        margin-bottom: 1.5rem;
        text-align: center;
    }

    .recommendations-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 1.5rem;
    }

    .recommendation-card {
        border: 1px solid #eee;
        border-radius: 4px;
        overflow: hidden;
        text-decoration: none;
        color: inherit;
        transition: transform 0.2s, box-shadow 0.2s;
    }

    .recommendation-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    }

    .recommendation-image {
        aspect-ratio: 1;
        overflow: hidden;
    }

    .recommendation-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .recommendation-info {
        padding: 1rem;
    }

    .recommendation-info h3 {
        margin: 0 0 0.5rem;
        font-size: 1rem;
    }

    .recommendation-price {
        font-weight: bold;
    }
</style>