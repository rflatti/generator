<script>
    import { i18n } from '$lib/i18n/translations';
    import { formatMoney, isDiscounted } from '$lib/utils/money';
    import { generateCollectionSeo } from '$lib/utils/seo';
    import { page } from '$app/stores';

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

    // Handle sort change
    function handleSortChange(e) {
        const newSort = e.target.value;
        updateUrlParams({ sort: newSort });
    }

    // Handle filter change
    // Handle filter change
    function handleFilterChange(filterId, value, checked) {
        // Format: filter.{category}.{type} - e.g., filter.v.availability, filter.v.vendor
        let filterKey;

        // Log the filterId for debugging
        console.log(`Filter change: ${filterId} -> ${value} -> ${checked}`);

        // Create the appropriate filter key based on filter ID
        if (filterId === 'price') {
            filterKey = 'filter.v.price';
        } else if (filterId === 'availability') {
            filterKey = 'filter.v.availability';
        } else if (filterId === 'vendor') {
            filterKey = 'filter.v.vendor';
        } else if (filterId === 'product_type') {
            filterKey = 'filter.v.type';
        } else if (filterId === 'tag') {
            filterKey = 'filter.v.tag';
        } else if (filterId.includes('filter.')) {
            // If it already has the filter. prefix, use it as is
            filterKey = filterId;
        } else if (filterId.startsWith('p.m.')) {
            // Product metafield filter
            filterKey = `filter.${filterId}`;
        } else {
            // For any other filter types
            filterKey = `filter.${filterId}`;
        }

        let newFilters = { ...currentFilters };

        if (checked) {
            // Add filter
            try {
                let filterValues = [];

                // Try to parse existing filter if it exists
                if (newFilters[filterKey]) {
                    try {
                        filterValues = JSON.parse(newFilters[filterKey]);
                        if (!Array.isArray(filterValues)) {
                            filterValues = [filterValues];
                        }
                    } catch (e) {
                        filterValues = [];
                    }
                }

                // Create the correct filter value format based on the filter type
                let formattedValue;

                if (filterKey.includes('availability')) {
                    formattedValue = JSON.stringify({ available: value === 'true' });
                } else if (filterKey.includes('price')) {
                    // Parse price range value
                    try {
                        const priceRange = JSON.parse(value);
                        formattedValue = JSON.stringify({ price: priceRange });
                    } catch (e) {
                        formattedValue = value;
                    }
                } else if (filterKey.includes('vendor')) {
                    formattedValue = JSON.stringify({ productVendor: value });
                } else if (filterKey.includes('type')) {
                    formattedValue = JSON.stringify({ productType: value });
                } else if (filterKey.includes('tag')) {
                    formattedValue = JSON.stringify({ tag: value });
                } else if (filterKey.includes('p.m.')) {
                    // Product metafield filter
                    const parts = filterId.split('.');
                    if (parts.length >= 3) {
                        formattedValue = JSON.stringify({
                            productMetafield: {
                                namespace: parts[2],
                                key: parts[3] || '',
                                value: value
                            }
                        });
                    } else {
                        formattedValue = value;
                    }
                } else {
                    formattedValue = value;
                }

                // Add the new value if it's not already included
                if (!filterValues.includes(formattedValue)) {
                    filterValues.push(formattedValue);
                }

                newFilters[filterKey] = JSON.stringify(filterValues);
            } catch (e) {
                console.error('Error updating filter:', e);
            }
        } else {
            // Remove filter
            try {
                if (newFilters[filterKey]) {
                    const filterValues = JSON.parse(newFilters[filterKey]);

                    // Create the correct filter value format to match for removal
                    let formattedValue;

                    if (filterKey.includes('availability')) {
                        formattedValue = JSON.stringify({ available: value === 'true' });
                    } else if (filterKey.includes('price')) {
                        try {
                            const priceRange = JSON.parse(value);
                            formattedValue = JSON.stringify({ price: priceRange });
                        } catch (e) {
                            formattedValue = value;
                        }
                    } else if (filterKey.includes('vendor')) {
                        formattedValue = JSON.stringify({ productVendor: value });
                    } else if (filterKey.includes('type')) {
                        formattedValue = JSON.stringify({ productType: value });
                    } else if (filterKey.includes('tag')) {
                        formattedValue = JSON.stringify({ tag: value });
                    } else if (filterKey.includes('p.m.')) {
                        const parts = filterId.split('.');
                        if (parts.length >= 3) {
                            formattedValue = JSON.stringify({
                                productMetafield: {
                                    namespace: parts[2],
                                    key: parts[3] || '',
                                    value: value
                                }
                            });
                        } else {
                            formattedValue = value;
                        }
                    } else {
                        formattedValue = value;
                    }

                    const updatedValues = Array.isArray(filterValues)
                        ? filterValues.filter(v => v !== formattedValue)
                        : [];

                    if (updatedValues.length > 0) {
                        newFilters[filterKey] = JSON.stringify(updatedValues);
                    } else {
                        delete newFilters[filterKey];
                    }
                }
            } catch (e) {
                console.error('Error removing filter:', e);
            }
        }

        console.log("New filters:", newFilters);

        // Update URL
        updateUrlParams(newFilters);
    }

    // Clear all filters
    function clearFilters() {
        const params = new URLSearchParams($page.url.searchParams);

        // Keep sort but remove filters
        const newParams = new URLSearchParams();
        if (params.has('sort')) {
            newParams.set('sort', params.get('sort'));
        }

        window.location.href = `${$page.url.pathname}?${newParams}`;
    }

    // Update URL parameters and navigate
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

    // Load more products
    function loadMore() {
        if (pageInfo?.endCursor) {
            const params = new URLSearchParams($page.url.searchParams);
            params.set('cursor', pageInfo.endCursor);
            window.location.href = `${$page.url.pathname}?${params}`;
        }
    }

    // Get active filter values
    // Get active filter values
    function getActiveFilterValues(filterId) {
        // Map the filter ID to the correct URL parameter format
        let filterKey;

        // Create the appropriate filter key based on filter ID
        if (filterId === 'price') {
            filterKey = 'filter.v.price';
        } else if (filterId === 'availability') {
            filterKey = 'filter.v.availability';
        } else if (filterId === 'vendor') {
            filterKey = 'filter.v.vendor';
        } else if (filterId === 'product_type') {
            filterKey = 'filter.v.type';
        } else if (filterId === 'tag') {
            filterKey = 'filter.v.tag';
        } else if (filterId.includes('filter.')) {
            // If it already has the filter. prefix, use it as is
            filterKey = filterId;
        } else if (filterId.startsWith('p.m.')) {
            // Product metafield filter
            filterKey = `filter.${filterId}`;
        } else {
            // For any other filter types
            filterKey = `filter.${filterId}`;
        }

        // Check for active filters with this key
        const matchingFilters = Object.keys(currentFilters).filter(key =>
            key === filterKey ||
            key === `filter.${filterKey}` // Handle potential double prefixing
        );

        if (matchingFilters.length === 0) return [];

        const activeKey = matchingFilters[0];

        try {
            const filterValues = JSON.parse(currentFilters[activeKey]);

            if (!Array.isArray(filterValues)) {
                return [filterValues];
            }

            // Parse each value to extract the actual input value based on filter type
            return filterValues.map(value => {
                try {
                    const parsed = JSON.parse(value);

                    if (filterId === 'availability' && parsed.available !== undefined) {
                        return parsed.available.toString();
                    } else if (filterId === 'price' && parsed.price) {
                        return JSON.stringify(parsed.price);
                    } else if ((filterId === 'vendor' || filterId === 'productVendor') && parsed.productVendor) {
                        return parsed.productVendor;
                    } else if ((filterId === 'product_type' || filterId === 'productType') && parsed.productType) {
                        return parsed.productType;
                    } else if (filterId === 'tag' && parsed.tag) {
                        return parsed.tag;
                    } else if (filterId.startsWith('p.m.') && parsed.productMetafield) {
                        return parsed.productMetafield.value;
                    }

                    // If we couldn't extract a specific value, return the original
                    return value;
                } catch (e) {
                    // If parsing fails, return the raw value
                    return value;
                }
            });
        } catch (e) {
            console.error(`Error parsing filter values for ${activeKey}:`, e);
            return [];
        }
    }
</script>

<svelte:head>
    <title>{seo.title}</title>
    <meta name="description" content={seo.description}/>
    <meta property="og:title" content={seo.openGraph.title}/>
    <meta property="og:description" content={seo.openGraph.description}/>
    <meta property="og:type" content={seo.openGraph.type}/>
    <meta property="og:url" content={seo.openGraph.url}/>
    {#if seo.openGraph.images && seo.openGraph.images[0]}
        <meta property="og:image" content={seo.openGraph.images[0].url}/>
    {/if}
    <meta name="twitter:card" content={seo.twitter.card}/>
    <meta name="twitter:title" content={seo.twitter.title}/>
    <meta name="twitter:description" content={seo.twitter.description}/>
    {#if seo.twitter.image}
        <meta name="twitter:image" content={seo.twitter.image}/>
    {/if}
    <link rel="canonical" href={seo.canonical}/>
</svelte:head>

<div class="collection-page">
    <nav class="breadcrumbs">
        <a href={`/${data.locale.country}-${data.locale.language}`}>Home</a>
        <span>&rsaquo;</span>
        <a href={`/${data.locale.country}-${data.locale.language}/collections`}>Collections</a>
        <span>&rsaquo;</span>
        <span>{collection.title}</span>
    </nav>

    <header class="collection-header">
        {#if collection.image}
            <div class="collection-banner">
                <img
                        src={collection.image.url}
                        alt={collection.image.altText || collection.title}
                        width={collection.image.width}
                        height={collection.image.height}
                />
            </div>
        {/if}

        <h1>{collection.title}</h1>

        {#if collection.description}
            <div class="collection-description">
                <p>{collection.description}</p>
            </div>
        {/if}
    </header>

    <div class="collection-layout">
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
                                        <span class="filter-label">{value.label}</span>
                                        <span class="filter-count">({value.count})</span>
                                    </label>
                                {/each}
                            </div>
                        </div>
                    {/each}
                </div>
            {:else}
                <p class="no-filters">No filters available for this collection.</p>
            {/if}
        </aside>

        <!-- Products Grid -->
        <div class="product-grid-container">
            <div class="product-grid-header">
                <div class="product-count">
                    Showing {products.length} product{products.length === 1 ? '' : 's'}
                </div>

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
                <div class="product-grid">
                    {#each products as product}
                        {@const firstVariant = product.variants.nodes[0] || {}}
                        {@const hasDiscount = isDiscounted(firstVariant.price, firstVariant.compareAtPrice)}

                        <a
                                href={`/${data.locale.country}-${data.locale.language}/products/${product.handle}`}
                                class="product-card"
                        >
                            {#if firstVariant.image}
                                <div class="product-image">
                                    <img
                                            src={firstVariant.image.url}
                                            alt={firstVariant.image.altText || product.title}
                                            width={firstVariant.image.width}
                                            height={firstVariant.image.height}
                                            loading="lazy"
                                    />

                                    {#if hasDiscount}
                                        <div class="product-badge sale">
                                            Sale
                                        </div>
                                    {/if}

                                    {#if !firstVariant.availableForSale}
                                        <div class="product-badge sold-out">
                                            Sold Out
                                        </div>
                                    {/if}
                                </div>
                            {/if}

                            <div class="product-info">
                                <h2 class="product-title">{product.title}</h2>

                                {#if product.vendor}
                                    <div class="product-vendor">{product.vendor}</div>
                                {/if}

                                <div class="product-price">
                                    {#if hasDiscount}
                                        <span class="price sale">{formatMoney(firstVariant.price)}</span>
                                        <span class="compare-at">{formatMoney(firstVariant.compareAtPrice)}</span>
                                    {:else}
                                        <span class="price">{formatMoney(firstVariant.price)}</span>
                                    {/if}
                                </div>
                            </div>
                        </a>
                    {/each}
                </div>

                {#if pageInfo?.hasNextPage}
                    <div class="load-more">
                        <button on:click={loadMore}>Load more</button>
                    </div>
                {/if}
            {:else}
                <div class="no-products">
                    <p>No products found in this collection.</p>
                </div>
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

    .collection-header {
        margin-bottom: 2rem;
        text-align: center;
    }

    .collection-banner {
        width: 100%;
        max-height: 300px;
        overflow: hidden;
        margin-bottom: 1.5rem;
        border-radius: 4px;
    }

    .collection-banner img {
        width: 100%;
        height: auto;
        object-fit: cover;
    }

    .collection-header h1 {
        font-size: 2.25rem;
        margin: 0 0 1rem;
    }

    .collection-description {
        max-width: 800px;
        margin: 0 auto;
        color: #666;
        line-height: 1.6;
    }

    .collection-layout {
        display: grid;
        grid-template-columns: 250px 1fr;
        gap: 2rem;
    }

    @media (max-width: 768px) {
        .collection-layout {
            grid-template-columns: 1fr;
        }
    }

    .filters-sidebar {
        background-color: #f9f9f9;
        padding: 1.5rem;
        border-radius: 4px;
        align-self: start;
    }

    .filters-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
    }

    .filters-header h2 {
        font-size: 1.25rem;
        margin: 0;
    }

    .clear-filters {
        font-size: 0.875rem;
        color: #666;
        background: none;
        border: none;
        cursor: pointer;
        text-decoration: underline;
        padding: 0;
    }

    .clear-filters:hover {
        color: #333;
    }

    .filter-group {
        margin-bottom: 1.5rem;
        border-bottom: 1px solid #eee;
        padding-bottom: 1.5rem;
    }

    .filter-group:last-child {
        border-bottom: none;
        padding-bottom: 0;
        margin-bottom: 0;
    }

    .filter-group h3 {
        font-size: 1rem;
        margin: 0 0 1rem;
    }

    .filter-options {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .filter-option {
        display: flex;
        align-items: center;
        cursor: pointer;
    }

    .filter-option input {
        margin-right: 0.75rem;
    }

    .filter-label {
        flex: 1;
    }

    .filter-count {
        color: #666;
        font-size: 0.875rem;
    }

    .no-filters {
        color: #666;
        font-style: italic;
    }

    .product-grid-container {
        flex: 1;
    }

    .product-grid-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
    }

    .product-count {
        color: #666;
    }

    .sort-selector {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .sort-selector label {
        font-size: 0.875rem;
        color: #666;
    }

    .sort-selector select {
        padding: 0.5rem 1rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        background-color: white;
        font-size: 0.875rem;
    }

    .product-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 1.5rem;
        margin-bottom: 2rem;
    }

    .product-card {
        border: 1px solid #eee;
        border-radius: 4px;
        overflow: hidden;
        text-decoration: none;
        color: inherit;
        transition: transform 0.2s, box-shadow 0.2s;
    }

    .product-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    }

    .product-image {
        position: relative;
        aspect-ratio: 1;
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

    .product-badge {
        position: absolute;
        top: 10px;
        left: 10px;
        padding: 0.25rem 0.75rem;
        font-size: 0.75rem;
        font-weight: bold;
        border-radius: 2px;
        z-index: 2;
    }

    .product-badge.sale {
        background-color: #e53e3e;
        color: white;
    }

    .product-badge.sold-out {
        background-color: #718096;
        color: white;
    }

    .product-info {
        padding: 1rem;
    }

    .product-title {
        font-size: 1rem;
        margin: 0 0 0.5rem;
        font-weight: 500;
    }

    .product-vendor {
        font-size: 0.875rem;
        color: #666;
        margin-bottom: 0.5rem;
    }

    .product-price {
        font-weight: bold;
    }

    .price.sale {
        color: #e53e3e;
    }

    .compare-at {
        text-decoration: line-through;
        color: #666;
        font-size: 0.875rem;
        font-weight: normal;
        margin-left: 0.5rem;
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

    .no-products {
        text-align: center;
        padding: 3rem 0;
        color: #666;
    }
</style>