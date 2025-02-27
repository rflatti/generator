
<script>
    import { page } from '$app/stores';
    import { i18n } from '$lib/i18n/translations';
    import { formatMoney, isDiscounted } from '$lib/utils/money';
    import { generateCollectionSeo } from '$lib/utils/seo';
    import { onMount } from 'svelte';
    import ProductCard from "$lib/components/ProductCard.svelte";

    export let data;

    // Get translation function
    $: t = $i18n.t;

    // Extract collection data
    $: collection = data.collection;
    $: products = collection?.products?.nodes || [];
    $: filters = collection?.products?.filters || [];
    $: pageInfo = collection?.products?.pageInfo;
    $: currentSort = data.sortOption || 'featured';
    $: currentFilters = data.filters || {};

    // Local state for price range filter
    let priceRange = { min: 0, max: 1000 };
    let currentMinPrice = priceRange.min;
    let currentMaxPrice = priceRange.max;
    let filtersVisible = false;

    // Generate SEO data
    $: seo = generateCollectionSeo({
        collection,
        url: $page.url.href,
        siteName: 'Shopify Store'
    });

    // Sort options
    const sortOptions = [
        { value: 'featured', label: 'Featured' },
        { value: 'price-low-high', label: 'Price: Low to High' },
        { value: 'price-high-low', label: 'Price: High to Low' },
        { value: 'best-selling', label: 'Best Selling' },
        { value: 'newest', label: 'Newest' }
    ];

    // Initialize price range from filters
    onMount(() => {
        // Find price filter if it exists
        const priceFilter = filters.find(filter => filter.id === 'filter.v.price');

        if (priceFilter) {
            // Find min and max prices from filter options
            let min = Number.MAX_SAFE_INTEGER;
            let max = 0;

            priceFilter.values.forEach(value => {
                try {
                    const input = JSON.parse(value.input);
                    if (input.price) {
                        min = Math.min(min, input.price.min);
                        max = Math.max(max, input.price.max);
                    }
                } catch (e) {
                    console.error('Error parsing price filter value:', e);
                }
            });

            if (min !== Number.MAX_SAFE_INTEGER && max > 0) {
                priceRange = { min, max };

                // Check if there's a price filter applied
                const priceFilterKey = 'filter.v.price';
                if (currentFilters[priceFilterKey]) {
                    try {
                        const appliedPriceFilters = JSON.parse(currentFilters[priceFilterKey]);
                        if (appliedPriceFilters.length > 0) {
                            const parsedPrice = JSON.parse(appliedPriceFilters[0]);
                            if (parsedPrice.price) {
                                currentMinPrice = parsedPrice.price.min;
                                currentMaxPrice = parsedPrice.price.max;
                            }
                        }
                    } catch (e) {
                        console.error('Error parsing applied price filter:', e);
                    }
                } else {
                    // Initialize with full range
                    currentMinPrice = priceRange.min;
                    currentMaxPrice = priceRange.max;
                }
            }
        }
    });

    // Update URL parameters
    function updateUrlParams(newParams = {}) {
        const params = new URLSearchParams($page.url.searchParams);

        // Remove cursor when applying new filters
        if (Object.keys(newParams).some(key => key.startsWith('filter.'))) {
            params.delete('cursor');
        }

        Object.entries(newParams).forEach(([key, value]) => {
            if (value === null || value === undefined) {
                params.delete(key);
            } else {
                params.set(key, value);
            }
        });

        return `${$page.url.pathname}?${params}`;
    }

    // Handle sort change
    function handleSortChange(e) {
        const newSort = e.target.value;
        window.location.href = updateUrlParams({ sort: newSort });
    }

    // Apply price filter
    function applyPriceFilter() {
        if (currentMinPrice === priceRange.min && currentMaxPrice === priceRange.max) {
            // If using full range, remove the filter
            const newFilters = { ...currentFilters };
            delete newFilters['filter.v.price'];
            window.location.href = updateUrlParams(newFilters);
        } else {
            // Create price filter
            const priceFilter = JSON.stringify([
                JSON.stringify({
                    price: {
                        min: currentMinPrice,
                        max: currentMaxPrice
                    }
                })
            ]);

            window.location.href = updateUrlParams({
                'filter.v.price': priceFilter
            });
        }
    }

    // Handle checkbox filter change
    function handleFilterChange(filterId, value, checked) {
        const filterKey = `filter.${filterId}`;
        const newFilters = { ...currentFilters };

        if (checked) {
            // Add filter
            const existingValues = newFilters[filterKey]
                ? JSON.parse(newFilters[filterKey])
                : [];

            if (!existingValues.includes(value)) {
                existingValues.push(value);
            }

            newFilters[filterKey] = JSON.stringify(existingValues);
        } else {
            // Remove filter
            if (newFilters[filterKey]) {
                const filterValues = JSON.parse(newFilters[filterKey]);
                const updatedValues = filterValues.filter(v => v !== value);

                if (updatedValues.length > 0) {
                    newFilters[filterKey] = JSON.stringify(updatedValues);
                } else {
                    delete newFilters[filterKey];
                }
            }
        }

        window.location.href = updateUrlParams(newFilters);
    }

    // Clear all filters
    function clearFilters() {
        const params = new URLSearchParams();

        if ($page.url.searchParams.has('sort')) {
            params.set('sort', $page.url.searchParams.get('sort'));
        }

        window.location.href = `${$page.url.pathname}?${params}`;
    }

    // Load more products
    function loadMore() {
        if (pageInfo?.hasNextPage && pageInfo?.endCursor) {
            const params = new URLSearchParams($page.url.searchParams);
            params.set('cursor', pageInfo.endCursor);
            window.location.href = `${$page.url.pathname}?${params}`;
        }
    }

    // Get active filter values
    function getActiveFilterValues(filterId) {
        const filterKey = `filter.${filterId}`;
        const filterValue = currentFilters[filterKey];

        if (!filterValue) return [];

        try {
            return JSON.parse(filterValue);
        } catch (e) {
            console.error('Error parsing filter values:', e);
            return [];
        }
    }

    // Toggle mobile filters
    function toggleFilters() {
        filtersVisible = !filtersVisible;
    }
</script>

<svelte:head>
    <title>{seo.title}</title>
    <meta name="description" content={seo.description} />
</svelte:head>

<div class="collection-page">
    <header class="collection-header">
        <h1>{collection.title}</h1>
        {#if collection.description}
            <p class="collection-description">{collection.description}</p>
        {/if}
    </header>

    <div class="mobile-filters-toggle">
        <button on:click={toggleFilters}>
            {filtersVisible ? 'Hide Filters' : 'Show Filters'} ({Object.keys(currentFilters).length} active)
        </button>
    </div>

    <div class="collection-content">
        <!-- Filters Sidebar -->
        <aside class="filters-sidebar" class:visible={filtersVisible}>
            <div class="filters-header">
                <h2>Filters</h2>
                {#if Object.keys(currentFilters).length > 0}
                    <button class="clear-filters" on:click={clearFilters}>
                        Clear all
                    </button>
                {/if}
            </div>

            {#if filters.length > 0}
                <div class="filters-list">
                    <!-- Price Range Filter -->
                    {#if filters.find(filter => filter.id === 'filter.v.price')}
                        <div class="filter-group price-filter">
                            <h3>Price</h3>
                            <div class="price-range-inputs">
                                <div class="price-input">
                                    <label for="min-price">Min:</label>
                                    <input
                                            type="number"
                                            id="min-price"
                                            bind:value={currentMinPrice}
                                            min={priceRange.min}
                                            max={currentMaxPrice}
                                    />
                                </div>
                                <div class="price-input">
                                    <label for="max-price">Max:</label>
                                    <input
                                            type="number"
                                            id="max-price"
                                            bind:value={currentMaxPrice}
                                            min={currentMinPrice}
                                            max={priceRange.max}
                                    />
                                </div>
                            </div>
                            <div class="price-slider">
                                <input
                                        type="range"
                                        min={priceRange.min}
                                        max={priceRange.max}
                                        bind:value={currentMinPrice}
                                        class="min-price-slider"
                                />
                                <input
                                        type="range"
                                        min={priceRange.min}
                                        max={priceRange.max}
                                        bind:value={currentMaxPrice}
                                        class="max-price-slider"
                                />
                            </div>
                            <button class="apply-price-filter" on:click={applyPriceFilter}>
                                Apply Price Filter
                            </button>
                        </div>
                    {/if}

                    <!-- Other Filters -->
                    {#each filters as filter}
                        {#if filter.id !== 'filter.v.price'}
                            <div class="filter-group">
                                <h3>{filter.label}</h3>
                                <div class="filter-options">
                                    {#each filter.values as value}
                                        {@const activeValues = getActiveFilterValues(filter.id)}
                                        {@const isChecked = activeValues.includes(value.input)}
                                        <label class="filter-option">
                                            <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    on:change={(e) => handleFilterChange(filter.id, value.input, e.target.checked)}
                                            />
                                            <span class="filter-label">
                                                {value.label} ({value.count})
                                            </span>
                                        </label>
                                    {/each}
                                </div>
                            </div>
                        {/if}
                    {/each}
                </div>
            {:else}
                <p>No filters available</p>
            {/if}
        </aside>

        <!-- Products Grid -->
        <div class="products-container">
            <div class="products-header">
                <div class="sort-selector">
                    <label for="sort">Sort by:</label>
                    <select id="sort" value={currentSort} on:change={handleSortChange}>
                        {#each sortOptions as option}
                            <option value={option.value}>{option.label}</option>
                        {/each}
                    </select>
                </div>
            </div>

            {#if products.length > 0}
                <div class="products-grid">
                    {#each products as product}
                        {@const variant = product.variants.nodes[0] || {}}
                        {@const hasDiscount = isDiscounted(variant.price, variant.compareAtPrice)}
                        
                        <a
                                href={`/${data.locale.country}-${data.locale.language}/products/${product.handle}`}
                                class="product-card"
                        >
                            {#if variant.image}
                                <div class="product-image">
                                    <img
                                            src={variant.image.url}
                                            alt={variant.image.altText || product.title}
                                            width={variant.image.width}
                                            height={variant.image.height}
                                            loading="lazy"
                                    />
                                    {#if hasDiscount}
                                        <div class="product-badge sale">Sale</div>
                                    {/if}
                                </div>
                            {/if}

                            <div class="product-details">
                                <h3>{product.title}</h3>
                                <div class="product-price">
                                    {#if hasDiscount}
                                        <span class="price sale">{formatMoney(variant.price)}</span>
                                        <span class="compare-price">{formatMoney(variant.compareAtPrice)}</span>
                                    {:else}
                                        <span class="price">{formatMoney(variant.price)}</span>
                                    {/if}
                                </div>
                            </div>
                        </a>
                    {/each}
                </div>

                {#if pageInfo?.hasNextPage}
                    <div class="load-more">
                        <button on:click={loadMore}>Load More</button>
                    </div>
                {/if}
            {:else}
                <p>No products found in this collection</p>
            {/if}
        </div>
    </div>
</div>

<style>
    .collection-page {
        max-width: 1200px;
        margin: 0 auto;
        padding: 1rem;
    }

    .collection-header {
        text-align: center;
        margin-bottom: 2rem;
    }

    .collection-header h1 {
        font-size: 2.5rem;
        margin-bottom: 1rem;
    }

    .collection-description {
        max-width: 800px;
        margin: 0 auto;
        color: #666;
    }

    .mobile-filters-toggle {
        display: none;
        margin-bottom: 1rem;
    }

    .mobile-filters-toggle button {
        width: 100%;
        padding: 0.75rem;
        background-color: #f5f5f5;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 0.9rem;
        text-align: center;
    }

    .collection-content {
        display: grid;
        grid-template-columns: 250px 1fr;
        gap: 2rem;
    }

    .filters-sidebar {
        background-color: #f9f9f9;
        padding: 1.5rem;
        border-radius: 8px;
        align-self: start;
    }

    .filters-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }

    .clear-filters {
        background: none;
        border: none;
        color: #666;
        text-decoration: underline;
        cursor: pointer;
    }

    .filter-group {
        margin-bottom: 1.5rem;
    }

    .filter-group h3 {
        margin-bottom: 0.5rem;
        font-size: 1rem;
    }

    /* Price Filter Styles */
    .price-filter {
        padding-bottom: 1rem;
        border-bottom: 1px solid #eee;
    }

    .price-range-inputs {
        display: flex;
        gap: 1rem;
        margin-bottom: 1rem;
    }

    .price-input {
        flex: 1;
    }

    .price-input label {
        display: block;
        font-size: 0.875rem;
        margin-bottom: 0.25rem;
    }

    .price-input input {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #ddd;
        border-radius: 4px;
    }

    .price-slider {
        position: relative;
        height: 1.5rem;
        margin-bottom: 1rem;
    }

    .price-slider input[type="range"] {
        position: absolute;
        width: 100%;
        height: 5px;
        background: none;
        pointer-events: none;
    }

    .min-price-slider {
        z-index: 2;
    }

    .max-price-slider {
        z-index: 1;
    }

    .price-slider input[type="range"]::-webkit-slider-thumb {
        pointer-events: auto;
    }

    .apply-price-filter {
        width: 100%;
        padding: 0.5rem;
        background-color: #f0f0f0;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 0.875rem;
        cursor: pointer;
        transition: background-color 0.2s;
    }

    .apply-price-filter:hover {
        background-color: #e5e5e5;
    }

    /* Other Filter Styles */
    .filter-option {
        display: flex;
        align-items: center;
        margin-bottom: 0.5rem;
        cursor: pointer;
    }

    .filter-option input {
        margin-right: 0.5rem;
    }

    .products-header {
        display: flex;
        justify-content: flex-end;
        margin-bottom: 1.5rem;
    }

    .sort-selector {
        display: flex;
        align-items: center;
    }

    .sort-selector label {
        margin-right: 0.5rem;
    }

    .products-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 1.5rem;
    }

    .product-card {
        text-decoration: none;
        color: inherit;
        border: 1px solid #eee;
        border-radius: 8px;
        overflow: hidden;
        transition: transform 0.2s, box-shadow 0.2s;
    }

    .product-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 5px 15px rgba(0,0,0,0.1);
    }

    .product-image {
        position: relative;
        aspect-ratio: 1 / 1;
        overflow: hidden;
    }

    .product-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.3s;
    }

    .product-card:hover .product-image img {
        transform: scale(1.05);
    }

    .product-badge.sale {
        position: absolute;
        top: 10px;
        left: 10px;
        background-color: #ff6b6b;
        color: white;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.75rem;
    }

    .product-details {
        padding: 1rem;
    }

    .product-details h3 {
        margin: 0 0 0.5rem;
        font-size: 1rem;
    }

    .product-price {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .price {
        font-weight: bold;
    }

    .price.sale {
        color: #ff6b6b;
    }

    .compare-price {
        text-decoration: line-through;
        color: #888;
        font-size: 0.875rem;
    }

    .load-more {
        text-align: center;
        margin-top: 2rem;
    }

    .load-more button {
        padding: 0.75rem 2rem;
        background-color: #f4f4f4;
        border: 1px solid #ddd;
        border-radius: 4px;
        cursor: pointer;
        transition: background-color 0.2s;
    }

    .load-more button:hover {
        background-color: #e8e8e8;
    }

    @media (max-width: 768px) {
        .collection-content {
            grid-template-columns: 1fr;
        }

        .mobile-filters-toggle {
            display: block;
        }

        .filters-sidebar {
            display: none;
            margin-bottom: 1.5rem;
        }

        .filters-sidebar.visible {
            display: block;
        }
    }
</style>