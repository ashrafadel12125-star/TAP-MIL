// =============== CONFIGURATION ===============
const API_DOMAIN = 'https://api.mailgw.com';
const DOMAINS_ENDPOINT = `${API_DOMAIN}/domains`;
const ACCOUNTS_ENDPOINT = `${API_DOMAIN}/accounts`;
const MESSAGES_ENDPOINT = `${API_DOMAIN}/messages`;

// =============== GLOBAL VARIABLES ===============
let currentEmail = null;
let currentToken = null;
let currentAccountId = null;
let autoRefreshInterval = null;
let messageRefreshInterval = null;
let selectedEmailId = null;
let emailExpireTime = null;
let autoRefreshActive = false;

// =============== INITIALIZE APP ===============
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
});

async function initializeApp() {
    showLoading('جاري إنشاء بريد جديد...');
    try {
        await generateNewEmail();
        startMessageRefresh();
    } catch (error) {
        console.error('Error initializing app:', error);
        showToast('حدث خطأ في تهيئة التطبيق', 'error');
    } finally {
        hideLoading();
    }
}

// =============== EVENT LISTENERS ===============
function setupEventListeners() {
    // Buttons
    document.getElementById('copyBtn').addEventListener('click', copyEmail);
    document.getElementById('refreshBtn').addEventListener('click', () => generateNewEmail());
    document.getElementById('changeEmailBtn').addEventListener('click', () => generateNewEmail());
    document.getElementById('deleteEmailBtn').addEventListener('click', deleteCurrentEmail);
    document.getElementById('autoRefreshBtn').addEventListener('click', toggleAutoRefresh);
    document.getElementById('closeDetailsBtn').addEventListener('click', closeEmailDetails);

    // Email list click
    document.addEventListener('click', (e) => {
        const emailItem = e.target.closest('.email-item');
        if (emailItem) {
            const emailId = emailItem.dataset.messageId;
            viewEmailDetails(emailId);
        }
    });
}

// =============== EMAIL GENERATION ===============
async function generateNewEmail() {
    showLoading('جاري توليد بريد جديد...');
    try {
        // Get available domains
        const domainsResponse = await fetch(DOMAINS_ENDPOINT);
        if (!domainsResponse.ok) throw new Error('Failed to fetch domains');
        
        const domainsData = await domainsResponse.json();
        const domains = domainsData['hydra:member'];
        
        if (!domains || domains.length === 0) {
            throw new Error('لا توجد نطاقات متاحة');
        }

        // Select random domain
        const randomDomain = domains[Math.floor(Math.random() * domains.length)];
        const domainName = randomDomain.domain;

        // Generate random username
        const username = generateRandomUsername();
        const email = `${username}@${domainName}`;

        // Create account
        const accountResponse = await fetch(ACCOUNTS_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                address: email
            })
        });

        if (!accountResponse.ok) {
            throw new Error('Failed to create account');
        }

        const accountData = await accountResponse.json();
        currentEmail = email;
        currentToken = accountData.token;
        currentAccountId = accountData.id;
        
        // Set expiration time (usually 1 hour)
        emailExpireTime = new Date(Date.now() + 60 * 60 * 1000);

        // Update UI
        document.getElementById('emailInput').value = currentEmail;
        document.getElementById('emailsContainer').innerHTML = `
            <div class="text-center text-muted">
                <i class="fas fa-inbox fa-3x mb-3"></i>
                <p>انتظر استقبال الرسائل...</p>
            </div>
        `;
        document.getElementById('messageCount').textContent = '0';

        showToast(`✓ تم إنشاء البريد: ${currentEmail}`, 'success');
        
        // Clear message details
        closeEmailDetails();
        
        // Refresh messages
        await fetchMessages();
        updateTimeRemaining();

    } catch (error) {
        console.error('Error generating email:', error);
        showToast('فشل إنشاء البريد الإلكتروني', 'error');
    } finally {
        hideLoading();
    }
}

// =============== FETCH MESSAGES ===============
async function fetchMessages() {
    try {
        if (!currentAccountId || !currentToken) return;

        const response = await fetch(`${MESSAGES_ENDPOINT}?account=${currentAccountId}`, {
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });

        if (!response.ok) throw new Error('Failed to fetch messages');

        const data = await response.json();
        const messages = data['hydra:member'] || [];

        updateMessagesList(messages);
        document.getElementById('messageCount').textContent = messages.length;
        updateLastUpdate();

    } catch (error) {
        console.error('Error fetching messages:', error);
    }
}

// =============== UPDATE MESSAGES LIST ===============
function updateMessagesList(messages) {
    const container = document.getElementById('emailsContainer');

    if (messages.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted">
                <i class="fas fa-inbox fa-3x mb-3"></i>
                <p>لا توجد رسائل حتى الآن</p>
                <small>سيتم تحديث الرسائل تلقائياً كل 3 ثوان</small>
            </div>
        `;
        return;
    }

    container.innerHTML = messages.map(msg => `
        <div class="email-item ${msg.isRead ? '' : 'unread'}" data-message-id="${msg.id}">
            <div class="email-from">
                <i class="fas fa-user-circle"></i> ${msg.from || 'بدون مرسل'}
            </div>
            <div class="email-subject">
                ${msg.subject || '(بدون موضوع)'}
            </div>
            <div class="email-preview">
                ${msg.text ? msg.text.substring(0, 100) : msg.html ? msg.html.substring(0, 100) : 'بدون محتوى'}...
            </div>
            <div class="email-time">
                <i class="fas fa-clock"></i> ${formatDate(msg.createdAt)}
            </div>
        </div>
    `).join('');
}

// =============== VIEW EMAIL DETAILS ===============
async function viewEmailDetails(messageId) {
    try {
        const response = await fetch(`${MESSAGES_ENDPOINT}/${messageId}`, {
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });

        if (!response.ok) throw new Error('Failed to fetch message details');

        const message = await response.json();
        selectedEmailId = messageId;

        // Populate details
        document.getElementById('emailFrom').textContent = message.from || 'بدون مرسل';
        document.getElementById('emailSubject').textContent = message.subject || '(بدون موضوع)';
        document.getElementById('emailDate').textContent = formatDate(message.createdAt);

        // Handle body content
        if (message.html) {
            document.getElementById('emailBody').innerHTML = message.html;
        } else if (message.text) {
            document.getElementById('emailBody').innerHTML = `<pre style="white-space: pre-wrap; word-wrap: break-word;">${message.text}</pre>`;
        } else {
            document.getElementById('emailBody').innerHTML = '<p class="text-muted">لا يوجد محتوى</p>';
        }

        // Show details section
        document.querySelector('.email-details').style.display = 'block';
        document.querySelector('.email-details').scrollIntoView({ behavior: 'smooth' });

        // Mark as read
        const emailItem = document.querySelector(`[data-message-id="${messageId}"]`);
        if (emailItem) {
            emailItem.classList.remove('unread');
        }

    } catch (error) {
        console.error('Error fetching message details:', error);
        showToast('فشل تحميل تفاصيل الرسالة', 'error');
    }
}

// =============== CLOSE EMAIL DETAILS ===============
function closeEmailDetails() {
    document.querySelector('.email-details').style.display = 'none';
    selectedEmailId = null;
}

// =============== COPY EMAIL ===============
async function copyEmail() {
    if (!currentEmail) return;

    try {
        await navigator.clipboard.writeText(currentEmail);
        showToast('✓ تم نسخ البريد بنجاح', 'success');
    } catch (error) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = currentEmail;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showToast('✓ تم نسخ البريد بنجاح', 'success');
    }
}

// =============== DELETE EMAIL ===============
async function deleteCurrentEmail() {
    if (!confirm('هل أنت متأكد من رغبتك في حذف هذا البريد؟')) return;

    showLoading('جاري حذف البريد...');
    try {
        if (currentAccountId && currentToken) {
            const response = await fetch(`${ACCOUNTS_ENDPOINT}/${currentAccountId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${currentToken}`
                }
            });

            if (!response.ok) throw new Error('Failed to delete account');
        }

        // Generate new email
        await generateNewEmail();
        showToast('✓ تم حذف البريد بنجاح', 'success');

    } catch (error) {
        console.error('Error deleting email:', error);
        showToast('فشل حذف البريد', 'error');
    } finally {
        hideLoading();
    }
}

// =============== AUTO REFRESH TOGGLE ===============
function toggleAutoRefresh() {
    autoRefreshActive = !autoRefreshActive;
    const btn = document.getElementById('autoRefreshBtn');

    if (autoRefreshActive) {
        btn.classList.add('active');
        btn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
        autoRefreshInterval = setInterval(() => {
            fetchMessages();
        }, 3000);
        showToast('✓ تم تفعيل التحديث التلقائي', 'success');
    } else {
        btn.classList.remove('active');
        btn.style.background = '';
        clearInterval(autoRefreshInterval);
        showToast('✓ تم إيقاف التحديث التلقائي', 'info');
    }
}

// =============== START MESSAGE REFRESH ===============
function startMessageRefresh() {
    // Refresh every 3 seconds by default
    messageRefreshInterval = setInterval(() => {
        fetchMessages();
    }, 3000);
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

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;

    // Less than a minute
    if (diff < 60000) return 'الآن';

    // Less than an hour
    if (diff < 3600000) {
        const minutes = Math.floor(diff / 60000);
        return `قبل ${minutes} دقيقة`;
    }

    // Less than a day
    if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000);
        return `قبل ${hours} ساعة`;
    }

    // Format as date
    return date.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function updateTimeRemaining() {
    const interval = setInterval(() => {
        if (!emailExpireTime || !currentEmail) {
            clearInterval(interval);
            return;
        }

        const now = new Date();
        const remaining = emailExpireTime - now;

        if (remaining <= 0) {
            document.getElementById('timeRemaining').textContent = 'انتهت الصلاحية';
            clearInterval(interval);
            return;
        }

        const hours = Math.floor(remaining / 3600000);
        const minutes = Math.floor((remaining % 3600000) / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);

        document.getElementById('timeRemaining').innerHTML = 
            `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
}

function updateLastUpdate() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('ar-EG');
    document.getElementById('lastUpdate').textContent = `آخر تحديث: ${timeString}`;
}

// =============== NOTIFICATION SYSTEM ===============
function showToast(message, type = 'info') {
    const toast = document.getElementById('toastNotification');
    const toastBody = document.getElementById('toastBody');

    toastBody.innerHTML = message;

    // Change color based on type
    toast.classList.remove('bg-success', 'bg-danger', 'bg-warning', 'bg-info');
    switch (type) {
        case 'success':
            toast.classList.add('bg-success');
            break;
        case 'error':
            toast.classList.add('bg-danger');
            break;
        case 'warning':
            toast.classList.add('bg-warning');
            break;
        default:
            toast.classList.add('bg-info');
    }

    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
}

function showLoading(message = 'جاري التحميل...') {
    document.getElementById('loadingText').textContent = message;
    const modal = new bootstrap.Modal(document.getElementById('loadingModal'), { backdrop: 'static' });
    modal.show();
}

function hideLoading() {
    const modal = bootstrap.Modal.getInstance(document.getElementById('loadingModal'));
    if (modal) modal.hide();
}

// =============== CLEANUP ===============
window.addEventListener('beforeunload', () => {
    if (autoRefreshInterval) clearInterval(autoRefreshInterval);
    if (messageRefreshInterval) clearInterval(messageRefreshInterval);
});