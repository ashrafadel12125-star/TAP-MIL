// =============== CONFIGURATION ===============
const API_DOMAIN = 'https://api.mail.gw';
const CORS_PROXY = 'https://cors-anywhere.herokuapp.com/';
const DOMAINS_ENDPOINT = `${API_DOMAIN}/domains`;
const ACCOUNTS_ENDPOINT = `${API_DOMAIN}/accounts`;
const MESSAGES_ENDPOINT = `${API_DOMAIN}/messages`;

// =============== GLOBAL VARIABLES ===============
let currentEmail = '';
let currentEmailId = '';
let currentToken = '';
let currentPassword = '';
let messageRefreshInterval = null;
let autoRefreshEnabled = false;
let availableDomains = [];

// =============== INITIALIZATION ===============
document.addEventListener('DOMContentLoaded', async function() {
    console.log('تحميل الصفحة...');
    
    // Load UI elements
    setupEventListeners();
    loadEmailFromStorage();
    
    // Try to fetch available domains
    try {
        await fetchAvailableDomains();
    } catch (error) {
        console.warn('تحذير: لم تتمكن من جلب النطاقات المتاحة', error);
        // Use default domain as fallback
        availableDomains = [{ domain: 'mail.gw', id: '1' }];
    }
    
    // If no email saved, create a new one
    if (!currentEmail) {
        await createNewEmail();
    } else {
        document.getElementById('emailInput').value = currentEmail;
        loadMessages();
    }
});

// =============== EVENT LISTENERS ===============
function setupEventListeners() {
    document.getElementById('refreshBtn').addEventListener('click', createNewEmail);
    document.getElementById('copyBtn').addEventListener('click', copyEmailToClipboard);
    
    const autoRefreshCheckbox = document.getElementById('autoRefreshCheckbox');
    if (autoRefreshCheckbox) {
        autoRefreshCheckbox.addEventListener('change', toggleAutoRefresh);
    }
}

// =============== CREATE EMAIL ===============
async function createNewEmail() {
    try {
        showLoading('جاري إنشاء بريد جديد...');
        
        // Fetch domains if not already loaded
        if (availableDomains.length === 0) {
            await fetchAvailableDomains();
        }
        
        if (availableDomains.length === 0) {
            throw new Error('لا توجد نطاقات متاحة');
        }
        
        // Select random domain
        const domain = availableDomains[Math.floor(Math.random() * availableDomains.length)];
        
        // Generate random username
        const username = generateRandomUsername();
        const password = generateRandomPassword();
        
        // Create account
        const accountData = {
            address: `${username}@${domain.domain}`,
            password: password
        };
        
        console.log('محاولة إنشاء حساب:', accountData.address);
        
        const response = await fetch(`${ACCOUNTS_ENDPOINT}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(accountData),
            mode: 'cors',
            credentials: 'omit'
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`خطأ API: ${response.status} - ${errorData.message || response.statusText}`);
        }
        
        const data = await response.json();
        
        // Store email info
        currentEmail = data.address || accountData.address;
        currentEmailId = data.id;
        currentToken = data.token;
        currentPassword = password;
        
        // Save to storage
        saveEmailToStorage();
        
        // Update UI
        document.getElementById('emailInput').value = currentEmail;
        
        // Load messages after a small delay
        setTimeout(() => {
            loadMessages();
        }, 1000);
        
        showToast(`✅ تم إنشاء البريد: ${currentEmail}`, 'success');
        hideLoading();
        
    } catch (error) {
        console.error('خطأ في إنشاء البريد:', error);
        showToast(`❌ فشل إنشاء البريد: ${error.message}`, 'error');
        hideLoading();
        
        // Retry option
        setTimeout(() => {
            const retry = confirm('هل تريد إعادة المحاولة؟');
            if (retry) createNewEmail();
        }, 2000);
    }
}

// =============== FETCH AVAILABLE DOMAINS ===============
async function fetchAvailableDomains() {
    try {
        console.log('جلب النطاقات المتاحة...');
        
        const response = await fetch(DOMAINS_ENDPOINT, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            },
            mode: 'cors',
            credentials: 'omit'
        });
        
        if (!response.ok) {
            throw new Error(`خطأ في جلب النطاقات: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Extract domains from response
        if (data.hydra && data.hydra['member']) {
            availableDomains = data.hydra['member'].filter(d => d.isActive);
        } else if (Array.isArray(data)) {
            availableDomains = data.filter(d => d.isActive || !d.isActive === undefined);
        } else {
            availableDomains = [];
        }
        
        console.log('النطاقات المتاحة:', availableDomains);
        
        if (availableDomains.length === 0) {
            console.warn('لم يتم العثور على نطاقات نشطة');
        }
        
        return availableDomains;
        
    } catch (error) {
        console.error('خطأ في جلب النطاقات:', error);
        // Default fallback domains
        availableDomains = [
            { domain: 'mail.gw', id: '1', isActive: true }
        ];
        return availableDomains;
    }
}

// =============== LOAD MESSAGES ===============
async function loadMessages() {
    try {
        if (!currentEmail || !currentEmailId) {
            console.log('لا يوجد بريد حالي');
            return;
        }
        
        console.log('جلب الرسائل للبريد:', currentEmail);
        
        const url = `${MESSAGES_ENDPOINT}?query={"to":"${currentEmail}"}`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${currentToken}` // If token needed
            },
            mode: 'cors',
            credentials: 'omit'
        });
        
        if (!response.ok) {
            if (response.status === 404) {
                console.log('لا توجد رسائل حتى الآن');
                displayMessages([]);
                return;
            }
            throw new Error(`خطأ: ${response.status}`);
        }
        
        const data = await response.json();
        
        let messages = [];
        if (data.hydra && data.hydra['member']) {
            messages = data.hydra['member'];
        } else if (Array.isArray(data)) {
            messages = data;
        }
        
        console.log('عدد الرسائل:', messages.length);
        displayMessages(messages);
        updateLastUpdate();
        
    } catch (error) {
        console.error('خطأ في جلب الرسائل:', error);
    }
}

// =============== DISPLAY MESSAGES ===============
function displayMessages(messages) {
    const emailsList = document.getElementById('emailsList');
    
    if (!emailsList) {
        console.warn('عنصر emailsList غير موجود');
        return;
    }
    
    if (messages.length === 0) {
        emailsList.innerHTML = `
            <div class="alert alert-info text-center">
                <i class="fas fa-inbox"></i> لا توجد رسائل حتى الآن
            </div>
        `;
        return;
    }
    
    let html = '';
    messages.forEach((msg, index) => {
        const subject = msg.subject || '(بدون موضوع)';
        const from = msg.from?.address || 'Unknown';
        const preview = msg.text ? msg.text.substring(0, 50) + '...' : 'No preview';
        const time = new Date(msg.createdAt).toLocaleString('ar-EG');
        
        html += `
            <div class="email-item" onclick="viewEmailDetails('${index}')">
                <div class="email-sender">
                    <strong>${from}</strong>
                    <small class="email-time">${time}</small>
                </div>
                <div class="email-subject">${subject}</div>
                <div class="email-preview">${preview}</div>
            </div>
        `;
    });
    
    emailsList.innerHTML = html;
}

// =============== UTILITY FUNCTIONS ===============
function generateRandomUsername() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let username = '';
    for (let i = 0; i < 10; i++) {
        username += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return username;
}

function generateRandomPassword() {
    const length = 12;
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
}

function copyEmailToClipboard() {
    if (!currentEmail) {
        showToast('لا يوجد بريد للنسخ', 'warning');
        return;
    }
    
    navigator.clipboard.writeText(currentEmail).then(() => {
        showToast('✅ تم نسخ البريد', 'success');
        document.getElementById('copyBtn').innerHTML = '<i class="fas fa-check"></i>';
        setTimeout(() => {
            document.getElementById('copyBtn').innerHTML = '<i class="fas fa-copy"></i>';
        }, 2000);
    }).catch(() => {
        showToast('❌ فشل النسخ', 'error');
    });
}

function toggleAutoRefresh(e) {
    autoRefreshEnabled = e.target.checked;
    
    if (autoRefreshEnabled) {
        showToast('✅ تم تفعيل التحديث التلقائي', 'success');
        messageRefreshInterval = setInterval(() => {
            loadMessages();
        }, 3000);
    } else {
        showToast('⏸️ تم إيقاف التحديث التلقائي', 'info');
        if (messageRefreshInterval) {
            clearInterval(messageRefreshInterval);
        }
    }
    
    localStorage.setItem('autoRefresh', autoRefreshEnabled);
}

function saveEmailToStorage() {
    if (localStorage) {
        localStorage.setItem('tempmail_email', currentEmail);
        localStorage.setItem('tempmail_emailId', currentEmailId);
        localStorage.setItem('tempmail_token', currentToken);
        localStorage.setItem('tempmail_password', currentPassword);
        localStorage.setItem('tempmail_timestamp', Date.now());
    }
}

function loadEmailFromStorage() {
    if (localStorage) {
        const savedEmail = localStorage.getItem('tempmail_email');
        const timestamp = localStorage.getItem('tempmail_timestamp');
        const now = Date.now();
        
        // Email expires after 1 hour
        if (savedEmail && timestamp && (now - parseInt(timestamp)) < 3600000) {
            currentEmail = savedEmail;
            currentEmailId = localStorage.getItem('tempmail_emailId');
            currentToken = localStorage.getItem('tempmail_token');
            currentPassword = localStorage.getItem('tempmail_password');
            console.log('تم استرجاع البريد المحفوظ:', currentEmail);
        }
    }
}

function updateLastUpdate() {
    const now = new Date().toLocaleTimeString('ar-EG');
    const element = document.getElementById('lastUpdate');
    if (element) {
        element.textContent = `آخر تحديث: ${now}`;
    }
}

function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    
    if (!toastContainer) {
        console.warn('عنصر toastContainer غير موجود');
        alert(message);
        return;
    }
    
    const toastId = 'toast-' + Date.now();
    const toastHTML = `
        <div id="${toastId}" class="toast-message toast-${type}">
            <span>${message}</span>
            <button class="toast-close" onclick="this.parentElement.remove();">&times;</button>
        </div>
    `;
    
    toastContainer.insertAdjacentHTML('beforeend', toastHTML);
    
    setTimeout(() => {
        const toast = document.getElementById(toastId);
        if (toast) toast.remove();
    }, 4000);
}

function showLoading(message = 'جاري التحميل...') {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.display = 'flex';
        const loaderText = loader.querySelector('.loader-text');
        if (loaderText) loaderText.textContent = message;
    }
}

function hideLoading() {
    const loader = document.getElementById('loader');
    if (loader) loader.style.display = 'none';
}

function viewEmailDetails(index) {
    console.log('عرض تفاصيل البريد:', index);
    showToast('تم النقر على البريد رقم ' + (index + 1), 'info');
}

// =============== EXPORTS ===============
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        createNewEmail,
        loadMessages,
        copyEmailToClipboard,
        generateRandomUsername,
        generateRandomPassword
    };
}
