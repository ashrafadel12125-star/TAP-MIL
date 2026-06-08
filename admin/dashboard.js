// =============== ADMIN DASHBOARD LOGIC ===============

const ADMIN_CREDENTIALS = {
    email: 'admin@tempmail.pro',
    password: 'TempMail@2026'
};

let isLoggedIn = false;
let currentUser = null;

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Check if already logged in
    const storedAuth = StorageManager.get('admin_auth');
    if (storedAuth && storedAuth.loggedIn) {
        isLoggedIn = true;
        showDashboard();
    }
    
    loadDashboardData();
});

// =============== AUTHENTICATION ===============
function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;
    
    if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
        isLoggedIn = true;
        currentUser = { email, name: 'المسؤول' };
        
        StorageManager.set('admin_auth', {
            loggedIn: true,
            user: currentUser,
            loginTime: new Date().toISOString()
        });
        
        showDashboard();
    } else {
        alert('بيانات الدخول غير صحيحة!');
    }
}

function handleLogout() {
    isLoggedIn = false;
    currentUser = null;
    StorageManager.remove('admin_auth');
    
    document.getElementById('loginSection').style.display = 'flex';
    document.getElementById('dashboardSection').style.display = 'none';
    document.getElementById('loginForm').reset();
}

function showDashboard() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('dashboardSection').style.display = 'block';
}

// =============== SECTION NAVIGATION ===============
function showSection(sectionId, e) {
    e.preventDefault();
    
    // Hide all sections
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => section.classList.remove('active'));
    
    // Remove active class from nav links
    const navLinks = document.querySelectorAll('.sidebar-nav .nav-link');
    navLinks.forEach(link => link.classList.remove('active'));
    
    // Show selected section
    const section = document.getElementById(sectionId);
    if (section) {
        section.classList.add('active');
    }
    
    // Add active class to clicked link
    event.target.closest('.nav-link').classList.add('active');
}

// =============== ARTICLES MANAGEMENT ===============
function saveArticle() {
    const title = document.getElementById('articleTitle').value;
    const summary = document.getElementById('articleSummary').value;
    const content = document.getElementById('articleContent').value;
    
    if (!title || !summary || !content) {
        alert('يرجى ملء جميع الحقول');
        return;
    }
    
    const article = {
        id: Date.now(),
        title,
        summary,
        content,
        author: 'المسؤول',
        createdAt: new Date().toISOString(),
        slug: title.replace(/\s+/g, '-').toLowerCase()
    };
    
    // Get existing articles
    let articles = StorageManager.get('articles') || [];
    articles.push(article);
    StorageManager.set('articles', articles);
    
    // Clear form
    document.getElementById('articleTitle').value = '';
    document.getElementById('articleSummary').value = '';
    document.getElementById('articleContent').value = '';
    
    loadArticles();
    alert('تم حفظ المقالة بن��اح!');
}

function loadArticles() {
    const articles = StorageManager.get('articles') || [];
    const articlesList = document.getElementById('articlesList');
    
    if (articles.length === 0) {
        articlesList.innerHTML = '<p class="text-muted">لا توجد مقالات</p>';
        document.getElementById('totalArticles').textContent = '0';
        return;
    }
    
    articlesList.innerHTML = articles.map(article => `
        <div class="article-item">
            <div class="d-flex justify-content-between align-items-start">
                <div>
                    <h6>${article.title}</h6>
                    <small class="text-muted">${DateUtils.formatTime(article.createdAt)}</small>
                </div>
                <button class="btn btn-sm btn-danger" onclick="deleteArticle(${article.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
    
    document.getElementById('totalArticles').textContent = articles.length;
}

function deleteArticle(id) {
    if (!confirm('هل أنت متأكد من حذف هذه المقالة؟')) return;
    
    let articles = StorageManager.get('articles') || [];
    articles = articles.filter(a => a.id !== id);
    StorageManager.set('articles', articles);
    loadArticles();
    alert('تم حذف المقالة بنجاح!');
}

// =============== PAGES MANAGEMENT ===============
function addNewPage() {
    const pageName = prompt('أدخل اسم الصفحة');
    if (!pageName) return;
    
    const page = {
        id: Date.now(),
        name: pageName,
        slug: pageName.replace(/\s+/g, '-').toLowerCase(),
        content: '',
        createdAt: new Date().toISOString()
    };
    
    let pages = StorageManager.get('pages') || [];
    pages.push(page);
    StorageManager.set('pages', pages);
    
    loadPages();
    alert('تم إنشاء الصفحة بنجاح!');
}

function loadPages() {
    const pages = StorageManager.get('pages') || [];
    const pagesList = document.getElementById('pagesList');
    
    if (pages.length === 0) {
        pagesList.innerHTML = '<p class="text-muted">لا توجد صفحات</p>';
        document.getElementById('totalPages').textContent = '0';
        return;
    }
    
    pagesList.innerHTML = pages.map(page => `
        <div class="card p-3 mb-3">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <h6>${page.name}</h6>
                    <small class="text-muted">${page.slug}</small>
                </div>
                <div>
                    <button class="btn btn-sm btn-warning" onclick="editPage(${page.id})">تعديل</button>
                    <button class="btn btn-sm btn-danger" onclick="deletePage(${page.id})">حذف</button>
                </div>
            </div>
        </div>
    `).join('');
    
    document.getElementById('totalPages').textContent = pages.length;
}

function editPage(id) {
    const pages = StorageManager.get('pages') || [];
    const page = pages.find(p => p.id === id);
    if (!page) return;
    
    const newContent = prompt(`تحرير: ${page.name}`, page.content);
    if (newContent !== null) {
        page.content = newContent;
        StorageManager.set('pages', pages);
        loadPages();
    }
}

function deletePage(id) {
    if (!confirm('هل أنت متأكد من حذف هذه الصفحة؟')) return;
    
    let pages = StorageManager.get('pages') || [];
    pages = pages.filter(p => p.id !== id);
    StorageManager.set('pages', pages);
    loadPages();
}

// =============== SECTIONS MANAGEMENT ===============
function addNewSection() {
    const name = document.getElementById('sectionName').value;
    const slug = document.getElementById('sectionSlug').value;
    
    if (!name || !slug) {
        alert('يرجى ملء جميع ��لحقول');
        return;
    }
    
    const section = {
        id: Date.now(),
        name,
        slug,
        createdAt: new Date().toISOString()
    };
    
    let sections = StorageManager.get('sections') || [];
    sections.push(section);
    StorageManager.set('sections', sections);
    
    document.getElementById('sectionName').value = '';
    document.getElementById('sectionSlug').value = '';
    
    loadSections();
    alert('تم إضافة القسم بنجاح!');
}

function loadSections() {
    const sections = StorageManager.get('sections') || [];
    const sectionsList = document.getElementById('sectionsList');
    
    if (sections.length === 0) {
        sectionsList.innerHTML = '<p class="text-muted">لا توجد أقسام</p>';
        return;
    }
    
    sectionsList.innerHTML = sections.map(section => `
        <div class="card p-3 mb-2">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <strong>${section.name}</strong>
                    <small class="text-muted d-block">${section.slug}</small>
                </div>
                <button class="btn btn-sm btn-danger" onclick="deleteSection(${section.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function deleteSection(id) {
    if (!confirm('هل أنت متأكد من حذف هذا القسم؟')) return;
    
    let sections = StorageManager.get('sections') || [];
    sections = sections.filter(s => s.id !== id);
    StorageManager.set('sections', sections);
    loadSections();
}

// =============== SETTINGS ===============
function saveSettings() {
    const settings = {
        siteName: document.getElementById('siteName').value,
        siteDescription: document.getElementById('siteDescription').value,
        adSenseCode: document.getElementById('adSenseCode').value
    };
    
    StorageManager.set('site_settings', settings);
    alert('تم حفظ الإعدادات بنجاح!');
}

// =============== LOAD DASHBOARD DATA ===============
function loadDashboardData() {
    const articles = StorageManager.get('articles') || [];
    const pages = StorageManager.get('pages') || [];
    const sections = StorageManager.get('sections') || [];
    
    loadArticles();
    loadPages();
    loadSections();
    
    // Load settings if exist
    const settings = StorageManager.get('site_settings');
    if (settings) {
        document.getElementById('siteName').value = settings.siteName || '';
        document.getElementById('siteDescription').value = settings.siteDescription || '';
        document.getElementById('adSenseCode').value = settings.adSenseCode || '';
    }
}