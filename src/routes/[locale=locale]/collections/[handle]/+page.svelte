<script>
    import { page } from '$app/stores';
    import { i18n } from '$lib/i18n/translations';
    import { formatMoney, isDiscounted } from '$lib/utils/money';
    import { generateCollectionSeo } from '$lib/utils/seo';

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

    // Update URL parameters
    function updateUrlParams(newParams = {}) {
        const params = new URLSearchParams($page.url.searchParams);

        Object.entries(newParams).forEach(([key, value]) => {
            if (value === null || value === undefined) {
                params.delete(key);
            } else {
                params.set(key, value);
            }
        });

        window.location.href = `${$page.url.pathname}?${params}`;
    }

    // Handle sort change
    function handleSortChange(e) {
        const newSort = e.target.value;
        updateUrlParams({ sort: newSort });
    }

    // Handle filter change
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

        updateUrlParams(newFilters);
    }

    // Clear all filters
    function clearFilters() {
        const params = new URLSearchParams($page.url.searchParams);
        const newParams = new URLSearchParams();

        if (params.has('sort')) {
            newParams.set('sort', params.get('sort'));
        }

        window.location.href = `${$page.url.pathname}?${newParams}`;
    }

    // Load more products
    function loadMore() {
        if (pageInfo?.hasNextPage && pageInfo?.endCursor) {
            updateUrlParams({ cursor: pageInfo.endCursor });
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

    <div class="collection-content">
        <!-- Filters Sidebar -->
        <aside class="filters-sidebar">
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
                    {#each filters as filter}
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

    .collection-content {
        display: grid;
        grid-template-columns: 250px 1fr;
        gap: 2rem;
    }

    @media (max-width: 768px) {
        .collection-content {
            grid-template-columns: 1fr;
        }
    }

    .filters-sidebar {
        background-color: #f9f9f9;
        padding: 1.5rem;
        border-radius: 8px;
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
        transition: background-color;
    }
    </style>