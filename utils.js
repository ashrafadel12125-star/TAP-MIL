// =============== UTILITY FUNCTIONS LIBRARY ===============

// Storage Manager
const StorageManager = {
    set: (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.warn('Storage quota exceeded or disabled');
        }
    },
    
    get: (key) => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (e) {
            console.warn('Failed to retrieve from storage');
            return null;
        }
    },
    
    remove: (key) => {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.warn('Failed to remove from storage');
        }
    },
    
    clear: () => {
        try {
            localStorage.clear();
        } catch (e) {
            console.warn('Failed to clear storage');
        }
    }
};

// String Utilities
const StringUtils = {
    generateRandom: (length = 10) => {
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    },
    
    truncate: (str, length = 100) => {
        return str.length > length ? str.substring(0, length) + '...' : str;
    },
    
    capitalizeFirst: (str) => {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
};

// Date & Time Utilities
const DateUtils = {
    formatTime: (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'الآن';
        if (diff < 3600000) return `قبل ${Math.floor(diff / 60000)} دقيقة`;
        if (diff < 86400000) return `قبل ${Math.floor(diff / 3600000)} ساعة`;
        
        return date.toLocaleDateString('ar-EG', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },
    
    formatCountdown: (ms) => {
        const hours = Math.floor(ms / 3600000);
        const minutes = Math.floor((ms % 3600000) / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
};

// DOM Utilities
const DOMUtils = {
    byId: (id) => document.getElementById(id),
    
    create: (tag, options = {}) => {
        const element = document.createElement(tag);
        if (options.class) element.className = options.class;
        if (options.id) element.id = options.id;
        if (options.html) element.innerHTML = options.html;
        if (options.text) element.textContent = options.text;
        return element;
    },
    
    hide: (element) => {
        if (element) element.style.display = 'none';
    },
    
    show: (element, display = 'block') => {
        if (element) element.style.display = display;
    }
};

// Clipboard Utilities
const ClipboardUtils = {
    async copy(text) {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
                return { success: true };
            } else {
                const textArea = document.createElement('textarea');
                textArea.value = text;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                return { success: true };
            }
        } catch (error) {
            return { success: false, error };
        }
    }
};