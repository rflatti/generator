# Developer Documentation: Shopify Multilingual Storefront

This documentation will guide you through the process of installing, configuring, and extending the Shopify Multilingual Storefront. This SvelteKit-based solution provides robust multilingual e-commerce capabilities that integrate seamlessly with Shopify's Storefront API.

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [Connecting to Shopify](#connecting-to-shopify)
5. [Extending the Storefront](#extending-the-storefront)
6. [Maintaining and Updating](#maintaining-and-updating)
7. [Contributing](#contributing)
8. [Advanced Customization](#advanced-customization)

## System Requirements

- Node.js (version 18 or higher)
- npm or pnpm (package manager)
- A Shopify store with Storefront API access
- Git for version control

## Installation

```bash
# Clone the repository
git clone https://github.com/rflatti/generator ./my-shopify-storefront

# Navigate to the project directory
cd my-shopify-storefront

# Install dependencies
npm install
# or if you prefer pnpm
pnpm install
```

## Configuration

### Environment Variables

1. Copy the example environment file:

```bash
cp .env.example .env
```

2. Edit the `.env` file and provide your Shopify credentials:

```
# Public variables (available in browser)
PUBLIC_STORE_DOMAIN=your-store.myshopify.com
PUBLIC_STOREFRONT_API_TOKEN=your-storefront-api-token

# Private variables (server-side only)
PRIVATE_STORE_DOMAIN=your-store.myshopify.com
PRIVATE_STOREFRONT_API_TOKEN=your-storefront-api-token
```

### Internationalization Setup

The internationalization settings are in `src/lib/i18n/config.js`. Modify this file to add or remove supported languages and countries:

```javascript
// Format: { code: 'Language name' }
export const SUPPORTED_LANGUAGES = {
    'en': 'English',
    'de': 'Deutsch',
    'fr': 'Français',
    // Add more languages as needed
};

// Format: { code: 'Country name' }
export const SUPPORTED_COUNTRIES = {
    'us': 'United States',
    'ca': 'Canada',
    'de': 'Germany',
    // Add more countries as needed
};
```

You can also specify a default locale:

```javascript
export const DEFAULT_LOCALE = {
    country: 'us',
    language: 'en'
};
```

If you want to disable multilingual support, set:

```javascript
export const MULTILINGUAL = false;
```

## Connecting to Shopify

### Obtaining API Credentials

1. Log in to your Shopify admin panel
2. Navigate to Apps → Develop apps
3. Create a new app or select an existing one
4. Under "API credentials", select "Configure Storefront API scopes"
5. Enable the necessary scopes (typically: read_products, read_content, read_customers, write_customers, read_orders, write_checkouts, etc.)
6. Save the changes and copy your Storefront API access token
7. Add these credentials to your `.env` file

### Testing the Connection

After configuring your environment variables, run the development server:

```bash
npm run dev
```

Visit http://localhost:5173 to verify the application is working and connected to your Shopify store.

## Extending the Storefront

### Adding New Components

Create new Svelte components in the `src/lib/components` directory:

```svelte
<!-- src/lib/components/NewComponent.svelte -->
<script>
    // Your component logic
</script>

<div class="new-component">
    <!-- Your component markup -->
</div>

<style>
    /* Your component styles */
</style>
```

### Creating New Routes

Add new pages by creating files in the appropriate route directory:

```
src/routes/[locale=locale]/new-page/+page.svelte
src/routes/[locale=locale]/new-page/+page.server.js
```

Example server-side load function:

```javascript
// src/routes/[locale=locale]/new-page/+page.server.js
export async function load({ locals }) {
    const { storefront } = locals;

    // Your data fetching logic here
    
    return {
        locale: locals.locale,
        // Return other data
    };
}
```

### Adding Translations

Update the translation files in `src/lib/i18n/translations.js` to add new keys:

```javascript
const translations = {
    en: {
        // Existing translations
        'new.key': 'New translation text',
    },
    de: {
        // Existing translations
        'new.key': 'Neuer Übersetzungstext',
    },
    // Other languages
};
```

Use translations in your components:

```svelte
<script>
    import { i18n } from '$lib/i18n/translations';
    
    // Get translations function
    $: t = $i18n.t;
</script>

<div>
    {t('new.key')}
</div>
```

## Maintaining and Updating

### Keeping the Project Up-to-date

To receive updates from the original repository:

1. Add the upstream remote:

```bash
git remote add upstream https://github.com/rflatti/generator
```

2. Fetch updates from the upstream repository:

```bash
git fetch upstream
```

3. Merge the changes into your local branch:

```bash
git merge upstream/main
```

### Handling Conflicts

When merging updates, you might encounter conflicts, especially if you've modified core files. To resolve conflicts:

1. Use a tool like VS Code to view conflicting files
2. Choose which changes to keep
3. Test thoroughly after resolving conflicts
4. If possible, avoid modifying core files directly; instead, use the extension patterns described below

## Contributing

### Creating a Pull Request

If you've made improvements that might benefit other users:

1. Fork the repository
2. Create a new branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Code Standards

- Follow the existing code style and patterns
- Write clear comments and documentation
- Include internationalization support for any user-facing text
- Test your changes thoroughly in multiple browsers

## Advanced Customization

### Custom Storefront API Extensions

To extend the API functionality:

1. Create a new file in `src/lib/api/` directory:

```javascript
// src/lib/api/custom-functionality.js
export function createCustomAPI(storefront) {
    async function myCustomFunction() {
        // Your custom API logic here
        const result = await storefront.query(MY_GRAPHQL_QUERY, {
            variables: {...},
            cache: CacheShort()
        });
        
        return result;
    }
    
    return {
        myCustomFunction
    };
}
```

2. Import and use your extension in a component or route:

```javascript
import { createCustomAPI } from '$lib/api/custom-functionality';

// In your load function or component
const customAPI = createCustomAPI(storefront);
const result = await customAPI.myCustomFunction();
```

### Custom Themes

For theme customization:

1. Global styles: Modify the styles in `src/app.html` or add a global stylesheet
2. Component-specific styles: Update individual component `.svelte` files
3. Create theme variables in a separate CSS file and import where needed

### Integration with External Services

To integrate with other services (payment providers, analytics, etc.):

1. Create a dedicated service in `src/lib/services/`
2. Import and use the service in your components
3. Configure any necessary environment variables

---

This documentation should help you get started with installing, configuring, and extending the Shopify Multilingual Storefront. If you have any questions or run into issues, please consult the GitHub repository's issues section or reach out to the maintainers.