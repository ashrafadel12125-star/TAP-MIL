// =============== API CONFIGURATION ===============
const CONFIG = {
    // Mail.gw API Settings - CORRECTED
    API: {
        BASE_URL: 'https://api.mail.gw', // ✅ CORRECT URL
        DOMAINS_ENDPOINT: '/domains',
        ACCOUNTS_ENDPOINT: '/accounts',
        MESSAGES_ENDPOINT: '/messages',
        TIMEOUT: 15000, // 15 seconds
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
        COMMON_DOMAINS: ['mail.gw', 'forwardemail.net', 'tempmail.com'],
    },

    // UI Settings
    UI: {
        TOAST_DURATION: 3000,
        MODAL_ANIMATION_DURATION: 300,
        EMAIL_PREVIEW_LENGTH: 100,
        EMAILS_PER_PAGE: 50,
        AUTO_REFRESH_DEFAULT: false,
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
        ERROR_RETRY: true,
        CORS_PROXY: false, // Set to true if CORS is blocking requests
    },

    // Storage Settings
    STORAGE: {
        ENABLED: true,
        PREFIX: 'tempmail_',
        KEYS: {
            LAST_EMAIL: 'email',
            EMAIL_ID: 'emailId',
            TOKEN: 'token',
            PASSWORD: 'password',
            AUTO_REFRESH_STATE: 'autoRefresh',
            THEME: 'theme',
            TIMESTAMP: 'timestamp',
        },
    },

    // CORS Proxy (if needed)
    CORS: {
        PROXY_URL: 'https://cors-anywhere.herokuapp.com/',
        ENABLED: false,
        FALLBACK_DOMAINS: [
            'https://api.mail.gw',
            'https://api.mailgw.com', // Alternative
        ],
    },

    // API Retry Configuration
    RETRY: {
        ENABLED: true,
        MAX_ATTEMPTS: 3,
        INITIAL_DELAY: 1000, // ms
        BACKOFF_MULTIPLIER: 2,
    },

    // Error Handling
    ERRORS: {
        TIMEOUT: 'انتهت مهلة الانتظار. يرجى المحاولة مرة أخرى.',
        NETWORK: 'خطأ في الاتصال بالشبكة. تحقق من الاتصال.',
        API_ERROR: 'حدث خطأ في الخادم. يرجى المحاولة لاحقاً.',
        INVALID_EMAIL: 'البريد غير صالح. يرجى المحاولة مرة أخرى.',
        NO_DOMAINS: 'لا توجد نطاقات متاحة حالياً.',
    },
};

// =============== EXPORT ===============
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}

// Make CONFIG globally available
if (typeof window !== 'undefined') {
    window.CONFIG = CONFIG;
}
