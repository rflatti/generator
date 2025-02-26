/**
 * Translation system for the Shopify storefront
 */

import { writable, derived } from 'svelte/store';

// Initial translations state
export const locale = writable({
    country: 'us',
    language: 'en'
});

// Translation dictionaries
const translations = {
    en: {
        // General
        'site.title': 'Shopify Store',
        'site.description': 'Welcome to our Shopify Store',

        // Navigation
        'nav.home': 'Home',
        'nav.products': 'Products',
        'nav.collections': 'Collections',
        'nav.about': 'About',
        'nav.contact': 'Contact',
        'nav.search': 'Search',
        'nav.account': 'Account',
        'nav.cart': 'Cart',

        // Products
        'product.addToCart': 'Add to Cart',
        'product.outOfStock': 'Out of Stock',
        'product.sale': 'Sale',
        'product.quantity': 'Quantity',
        'product.description': 'Description',
        'product.related': 'You may also like',

        // Cart
        'cart.title': 'Your Cart',
        'cart.empty': 'Your cart is empty',
        'cart.continue': 'Continue Shopping',
        'cart.checkout': 'Checkout',
        'cart.remove': 'Remove',
        'cart.subtotal': 'Subtotal',
        'cart.total': 'Total',
        'cart.discount': 'Discount',
        'cart.tax': 'Tax',
        'cart.shipping': 'Shipping',
        'cart.estimatedTotal': 'Estimated Total',

        // Account
        'account.login': 'Login',
        'account.register': 'Register',
        'account.logout': 'Logout',
        'account.myAccount': 'My Account',
        'account.orders': 'Orders',
        'account.addresses': 'Addresses',
        'account.wishlist': 'Wishlist',

        // Forms
        'form.email': 'Email',
        'form.password': 'Password',
        'form.submit': 'Submit',
        'form.name': 'Name',
        'form.firstName': 'First Name',
        'form.lastName': 'Last Name',
        'form.address': 'Address',
        'form.city': 'City',
        'form.country': 'Country',
        'form.state': 'State/Province',
        'form.zipCode': 'Zip/Postal Code',
        'form.phone': 'Phone',

        // Messages
        'message.success': 'Success!',
        'message.error': 'Error',
        'message.loading': 'Loading...',
        'message.notFound': 'Not Found',
    },

    de: {
        // General
        'site.title': 'Shopify Shop',
        'site.description': 'Willkommen in unserem Shopify Shop',

        // Navigation
        'nav.home': 'Startseite',
        'nav.products': 'Produkte',
        'nav.collections': 'Kollektionen',
        'nav.about': 'Über uns',
        'nav.contact': 'Kontakt',
        'nav.search': 'Suche',
        'nav.account': 'Konto',
        'nav.cart': 'Warenkorb',

        // Products
        'product.addToCart': 'In den Warenkorb',
        'product.outOfStock': 'Nicht auf Lager',
        'product.sale': 'Angebot',
        'product.quantity': 'Menge',
        'product.description': 'Beschreibung',
        'product.related': 'Das könnte Ihnen auch gefallen',

        // Cart
        'cart.title': 'Ihr Warenkorb',
        'cart.empty': 'Ihr Warenkorb ist leer',
        'cart.continue': 'Weiter einkaufen',
        'cart.checkout': 'Zur Kasse',
        'cart.remove': 'Entfernen',
        'cart.subtotal': 'Zwischensumme',
        'cart.total': 'Gesamtsumme',
        'cart.discount': 'Rabatt',
        'cart.tax': 'Mehrwertsteuer',
        'cart.shipping': 'Versand',
        'cart.estimatedTotal': 'Geschätzte Gesamtsumme',

        // Account
        'account.login': 'Anmelden',
        'account.register': 'Registrieren',
        'account.logout': 'Abmelden',
        'account.myAccount': 'Mein Konto',
        'account.orders': 'Bestellungen',
        'account.addresses': 'Adressen',
        'account.wishlist': 'Wunschliste',

        // Forms
        'form.email': 'E-Mail',
        'form.password': 'Passwort',
        'form.submit': 'Absenden',
        'form.name': 'Name',
        'form.firstName': 'Vorname',
        'form.lastName': 'Nachname',
        'form.address': 'Adresse',
        'form.city': 'Stadt',
        'form.country': 'Land',
        'form.state': 'Bundesland',
        'form.zipCode': 'PLZ',
        'form.phone': 'Telefon',

        // Messages
        'message.success': 'Erfolg!',
        'message.error': 'Fehler',
        'message.loading': 'Wird geladen...',
        'message.notFound': 'Nicht gefunden',
    },

    // Add more languages as needed
};

/**
 * Create a derived store that provides translation functions
 */
export const i18n = derived(locale, ($locale) => {
    // Get the dictionary for the current language, fallback to English
    const dict = translations[$locale.language] || translations.en;

    // Main translation function
    const t = (key, vars = {}) => {
        // Get the translation string
        let text = dict[key] || translations.en[key] || key;

        // Replace variables in the string
        Object.keys(vars).forEach(k => {
            const regex = new RegExp(`{{${k}}}`, 'g');
            text = text.replace(regex, vars[k]);
        });

        return text;
    };

    // Format date according to locale
    const formatDate = (date, options = {}) => {
        return new Date(date).toLocaleDateString($locale.language, options);
    };

    // Format number according to locale
    const formatNumber = (number, options = {}) => {
        return new Intl.NumberFormat($locale.language, options).format(number);
    };

    return {
        t,
        formatDate,
        formatNumber,
        currentLocale: $locale
    };
});

/**
 * Update the locale
 */
export function setLocale(country, language) {
    locale.set({ country, language });
}