// =============== API CONFIGURATION ===============
const CONFIG = {
    // Mail.gw API Settings
    API: {
        BASE_URL: 'https://api.mailgw.com',
        DOMAINS_ENDPOINT: '/domains',
        ACCOUNTS_ENDPOINT: '/accounts',
        MESSAGES_ENDPOINT: '/messages',
        TIMEOUT: 10000, // 10 seconds
    },

    // Refresh Settings
    REFRESH: {
        MESSAGE_INTERVAL: 3000, // Check for messages every 3 seconds
        AUTO_REFRESH_INTERVAL: 5000, // Alternative auto-refresh interval
        INITIAL_LOAD_DELAY: 1000, // Delay before initial message load
    },

    // Email Settings
    EMAIL: {
        EXPIRE_TIME: 60 * 60 * 1000, // 1 hour in milliseconds
        MAX_USERNAME_LENGTH: 20,
        MIN_USERNAME_LENGTH: 5,
    },

    // UI Settings
    UI: {
        TOAST_DURATION: 3000,
        MODAL_ANIMATION_DURATION: 300,
        EMAIL_PREVIEW_LENGTH: 100,
        EMAILS_PER_PAGE: 50,
    },

    // Google AdSense Configuration
    ADSENSE: {
        ENABLED: true,
        CLIENT_ID: 'ca-pub-xxxxxxxxxxxxxxxx', // Replace with your AdSense client ID
        SLOTS: {
            SIDEBAR: '1234567890',
            BOTTOM: '0987654321',
        },
        RESPONSIVE: true,
        AUTO_LOAD: true,
    },

    // Feature Flags
    FEATURES: {
        AUTO_REFRESH: true,
        COPY_TO_CLIPBOARD: true,
        EMAIL_DETAILS_VIEW: true,
        TOAST_NOTIFICATIONS: true,
        LOCAL_STORAGE: true,
    },

    // Storage Settings
    STORAGE: {
        ENABLED: true,
        PREFIX: 'tempmail_pro_',
        KEYS: {
            LAST_EMAIL: 'last_email',
            AUTO_REFRESH_STATE: 'auto_refresh',
            THEME: 'theme',
        },
    },
};

// =============== EXPORT ===============
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}