'use strict';

/* ═══════════════════════════════════════════════════════
   LAZY CLOUD — ADMIN & STOREFRONT ENGINE
   Dark Glassmorphism / Cyberpunk Minimalist
═══════════════════════════════════════════════════════ */

// ── STATE ────────────────────────────────────────────────
const state = {
  currentTab: 'overview',
  buyerView: false,
  notifications: [
    { id: 1, icon: 'shopping-cart', text: 'New order #ORD-1042 — Nexus Toolkit Pro by dev.chen', time: '2 min ago', unread: true, type: 'order' },
    { id: 2, icon: 'hard-drive', text: 'Storage at 78% — upgrade recommended soon', time: '1 hr ago', unread: true, type: 'warning' },
    { id: 3, icon: 'zap', text: 'Product "Pixel Dreams Icons" reached 500 downloads', time: '3 hrs ago', unread: false, type: 'success' },
    { id: 4, icon: 'user-plus', text: 'New customer registration: maria@studio9.design', time: 'Yesterday', unread: false, type: 'user' },
  ],
  files: [
    { id: 'f1', name: 'nexus-toolkit-pro.zip', folder: '/', size: 142.4, sizeBytes: 149438720, mimeType: 'application/zip', uploaded: '2024-03-08T10:23:00', public: true, price: 79, downloads: 342, status: 'active', featured: true, category: 'Source Code' },
    { id: 'f2', name: 'pixel-dreams-icons-pack.zip', folder: '/', size: 89.7, sizeBytes: 94054372, mimeType: 'application/zip', uploaded: '2024-03-02T14:10:00', public: true, price: 24, downloads: 501, status: 'active', featured: false, category: 'Design Assets' },
    { id: 'f3', name: 'the-ai-operator-ebook.pdf', folder: '/', size: 12.1, sizeBytes: 12697600, mimeType: 'application/pdf', uploaded: '2024-02-20T09:05:00', public: true, price: 19, downloads: 216, status: 'active', featured: true, category: 'Ebook' },
    { id: 'f4', name: 'defend-the-stack-course-v3.mp4', folder: '/', size: 1200.5, sizeBytes: 1258291200, mimeType: 'video/mp4', uploaded: '2024-02-14T16:44:00', public: false, price: 149, downloads: 89, status: 'active', featured: false, category: 'Video Course' },
    { id: 'f5', name: 'cloudcraft-cli-v2.3.1.dmg', folder: '/tools', size: 45.3, sizeBytes: 47494144, mimeType: 'application/x-dmg', uploaded: '2024-03-01T11:30:00', public: false, price: 29, downloads: 67, status: 'draft', featured: false, category: 'Software' },
    { id: 'f6', name: 'motion-design-templates-psd.zip', folder: '/templates', size: 210.8, sizeBytes: 220952003, mimeType: 'application/zip', uploaded: '2024-01-28T12:00:00', public: true, price: 39, downloads: 178, status: 'active', featured: false, category: 'Design Templates' },
    { id: 'f7', name: 'saas-license-keys-backup.json', folder: '/private', size: 0.8, sizeBytes: 839680, mimeType: 'application/json', uploaded: '2024-03-05T08:00:00', public: false, price: 0, downloads: 0, status: 'private', featured: false, category: 'Private' },
    { id: 'f8', name: 'before-after-showreel.mp4', folder: '/', size: 87.2, sizeBytes: 91418368, mimeType: 'video/mp4', uploaded: '2024-03-07T15:22:00', public: true, price: 0, downloads: 1024, status: 'active', featured: true, category: 'Demo' },
  ],
  products: [
    { id: 'p1', fileId: 'f1', title: 'Nexus Toolkit Pro', description: 'Complete full-stack web dev toolkit with React, Node, and DevOps templates. Lifetime updates included.', price: 79, compareAt: 129, category: 'Source Code', maxDownloads: 5, expiryDays: 30, featured: true, unlisted: false, sales: 342, icon: 'code' },
    { id: 'p2', fileId: 'f2', title: 'Pixel Dreams Icon Pack', description: '4,200+ handcrafted vector icons for UI design. Includes all formats, dark/light variants, and Figma source.', price: 24, compareAt: 39, category: 'Design Assets', maxDownloads: 3, expiryDays: 90, featured: false, unlisted: false, sales: 501, icon: 'palette' },
    { id: 'p3', fileId: 'f3', title: 'The AI Operator', description: 'The field guide to AI-assisted software development. 340 pages of workflows, prompts, and case studies.', price: 19, compareAt: 29, category: 'Ebook', maxDownloads: 2, expiryDays: 365, featured: true, unlisted: false, sales: 216, icon: 'book-open' },
    { id: 'p4', fileId: 'f4', title: 'Defend the Stack', description: 'Security patterns for modern web apps. 12 hours of video + lab exercises + certificate.', price: 149, compareAt: 199, category: 'Video Course', maxDownloads: 1, expiryDays:7, featured: false, unlisted: false, sales: 89, icon: 'shield' },
    { id: 'p5', fileId: 'f6', title: 'Motion Design Templates', description: '240 After Effects + Figma motion templates for product demos and marketing.', price: 39, compareAt: 59, category: 'Templates', maxDownloads: 3, expiryDays:14, featured: false, unlisted: false, sales: 178, icon: 'film' },
    { id: 'p6', fileId: 'f8', title: 'Showreel Demo', description: 'Free demo reel to preview the quality of production work.', price: 0, compareAt:0, category: 'Demo', maxDownloads: 999, expiryDays: 365, featured: true, unlisted: false, sales: 1024, icon: 'play' },
  ],
  orders: [
    { id: 'ORD-1042', email: 'dev.chen@fastmail.io', product: 'Nexus Toolkit Pro', amount: 79, method: 'card', status: 'completed', date: '2 min ago', linkActive: true, ip: '185.92.24.10', country: 'US' },
    { id: 'ORD-1041', email: 'maria@studio9.design', product: 'Pixel Dreams Icon Pack', amount: 24, method: 'paypal', status: 'completed', date: '47 min ago', linkActive: true, ip: '82.101.44.2', country: 'DE' },
    { id: 'ORD-1040', email: 'j.wong@techcore.dev', product: 'Defend the Stack', amount: 149, method: 'stripe', status: 'completed', date: '2 hrs ago', linkActive: true, ip: '203.118.9.15', country: 'SG' },
    { id: 'ORD-1039', email: 'alex@built-bridge.io', product: 'Nexus Toolkit Pro', amount: 79, method: 'crypto', status: 'completed', date: 'Yesterday', linkActive: true, ip: '91.205.62.32', country: 'GB' },
    { id: 'ORD-1038', email: 'sara@fourthwall.app', product: 'The AI Operator', amount: 19, method: 'bkash', status: 'completed', date: 'Yesterday', linkActive: true, ip: '103.42.77.203', country: 'BD' },
    { id: 'ORD-1037', email: 't.hartmann@bytemine.de', product: 'Motion Design Templates', amount: 39, method: 'stripe', status: 'refunded', date: 'Mar 5', linkActive: false, ip: '77.21.93.111', country: 'DE' },
    { id: 'ORD-1036', email: 'lucas@paperplane.io', product: 'Pixel Dreams Icon Pack', amount: 24, method: 'card', status: 'expired', date: 'Mar 4', linkActive: false, ip: '189.45.22.67', country: 'BR' },
    { id: 'ORD-1035', email: 'nina@codewitch.app', product: 'Nexus Toolkit Pro', amount: 79, method: 'card', status: 'completed', date: 'Mar 3', linkActive: true, ip: '45.148.22.95', country: 'NL' },
  ],
  accessKeys: [
    { id: 'ak1', key: 'LC-ENV-9X42-KM3P-QW7R-ZZ2T', product: 'Nexus Toolkit Pro', email: 'dev.chen@fastmail.io', created: '2 min ago', expires: 'Apr 8, 2025', revoked: false, maxUses: 5, used: 1 },
    { id: 'ak2', key: 'LC-ICON-1B8F-XX2N-VQ5K-PL4M', product: 'Pixel Dreams Icon Pack', email: 'maria@studio9.design', created: '47 min ago', expires: 'Jun 2, 2025', revoked: false, maxUses: 3, used: 1 },
    { id: 'ak3', key: 'LC-DEF-7P3Q-RN9T-WX2Z-JF8V', product: 'Defend the Stack', email: 'j.wong@techcore.dev', created: '2 hrs ago', expires: 'Mar 14, 2025', revoked: false, maxUses: 1, used: 1 },
    { id: 'ak4', key: 'LC-VOID-4M2N-SQ8P-BT6Y-KD9L', product: 'Nexus Toolkit Pro', email: 'nina@codewitch.app', created: 'Mar 3', expires: 'Apr 1, 2025', revoked: true, maxUses: 5, used: 5 },
  ],
  settings: {
    provider: 'r2',
    stripeKey: '',
    paypalClientId: '',
    bkashKey: '',
    ipBinding: false,
    speedLimit: true,
    speedLimitKbps: 2048,
    passwordProtectLinks: true,
    linkExpiryHours: 24,
    storeName: 'Lazy Cloud Store',
    storeUrl: 'lazycloud.vercel.app',
  },
  uploadQueue: [],
  revenue: { week: 2840, month: 12840, total: 48240, growth: null },
  searchQuery: '',
  draggedFile: null,
};

// ── UTILITIES ────────────────────────────────────────────
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const fmt$ = (n) => '$' + n.toLocaleString();
const fmtSize = (n) => { const u = ['B','KB','MB','GB','TB']; let i = 0; while (n >= 1024 && i < u.length-1) { n /= 1024; i++; } return n.toFixed(i > 0 ? 1 : 0) + ' ' + u[i]; };
const fmtNum = (n) => n >= 1000000 ? (n/1000000).toFixed(1) + 'M' : n >= 1000 ? (n/1000).toFixed(1) + 'K' : String(n);
const uid = () => Math.random().toString(36).slice(2, 10);

// ── TOAST ────────────────────────────────────────────────
function showToast(msg, type = 'info') {
  const colors = {
    info: { icon: 'info', bg: 'bg-sky-500/20 border-sky-500/40 text-sky-300' },
    success: { icon: 'check-circle', bg: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' },
    error: { icon: 'x-circle', bg: 'bg-red-500/20 border-red-500/40 text-red-300' },
    warning: { icon: 'alert-triangle', bg: 'bg-amber-500/20 border-amber-500/40 text-amber-300' },
  };
  const { icon, bg } = colors[type] || colors.info;
  const t = document.createElement('div');
  t.className = `flex items-center gap-2 glass-strong rounded-xl px-4 py-3 text-sm max-w-xs shadow-xl border ${bg} fade-in`;
  t.innerHTML = `<i data-lucide="${icon}" class="w-4 h-4 shrink-0"></i><span>${msg}</span>`;
  $('#toastContainer').appendChild(t);
  if (typeof lucide !== 'undefined') lucide.createIcons();
  setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity 0.3s'; setTimeout(() => t.remove(), 300); }, 3500);
}

// ── STATE → DOM HELPERS ──────────────────────────────────
function updateSidebarStorage() {
  const used = state.files.reduce((s, f) => s + f.sizeBytes, 0);
  const total = 2147483648; // 2 TB
  const pct = Math.min(100, (used / total) * 100);
  const usedGB = (used / 1024 / 1024 / 1024).toFixed(1);
  const totalTB = (total / 1024 / 1024 / 1024).toFixed(0);
  $('#sidebarStorageText').textContent = `${usedGB} GB / ${totalTB} TB`;
  $('#sidebarStorageBar').style.width = pct + '%';
  $('#sidebarStoragePct').textContent = pct.toFixed(1) + '% used';
}

function updateHeaderRevenue() {
  const total = state.orders.filter(o => o.status === 'completed').reduce((s, o) => s + o.amount, 0);
  const week = state.orders.filter(o => o.status === 'completed' && ['2 min ago','47 min ago','2 hrs ago'].includes(o.date)).reduce((s,o) => s + o.amount, 0);
  state.revenue.total = total;
  state.revenue.week = week;
  $('#headerRevenue').textContent = fmt$(total);
}

// ── SIDEBAR NAV ──────────────────────────────────────────
const NAV = [
  { id: 'overview', label: 'Overview', icon: 'layout-dashboard', section: 'Analytics' },
  { id: 'storage', label: 'Cloud Storage', icon: 'hard-drive', section: 'Storage' },
  { id: 'store', label: 'File Store', icon: 'shopping-bag', section: 'Store' },
  { id: 'orders', label: 'Orders & Revenue', icon: 'receipt', section: 'Sales' },
  { id: 'access', label: 'Access Keys & Links', icon: 'key-round', section: 'Store' },
  { id: 'settings', label: 'Store Settings', icon: 'settings-2', section: 'Config' },
];
const SECTIONS_ORDER = ['Analytics', 'Storage', 'Store', 'Sales', 'Config'];
const SECTION_LABELS = {
  Analytics: 'Analytics', Storage: 'Storage', Store: 'Store', Sales: 'Sales', Config: 'Config'
};

function renderSidebar() {
  const el = $('#sidebarNav');
  el.innerHTML = '';
  let lastSection = null;
  for (const item of NAV) {
    if (item.section !== lastSection) {
      if (lastSection !== null) el.innerHTML += '<div class="py-2"></div>';
      el.innerHTML += `<div class="px-2 pb-1 text-[10px] font-mono font-semibold uppercase tracking-widest text-slate-600">${item.section}</div>`;
      lastSection = item.section;
    }
    const active = state.currentTab === item.id;
    el.innerHTML += `
      <button onclick="switchTab('${item.id}')" 
        class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${active 
          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 glow-emerald' 
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}"
        aria-current="${active ? 'page' : false}">
        <i data-lucide="${item.icon}" class="w-4 h-4 shrink-0 ${active ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-400'}"></i>
        <span>${item.label}</span>
        ${active ? '<div class="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400"></div>' : ''}
      </button>`;
  }
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function switchTab(tab) {
  state.currentTab = tab;
  state.buyerView = false;
  renderSidebar();
  renderMain();
  $('#storePreviewRoot').innerHTML = '';
}

// ── NOTIFICATIONS ─────────────────────────────────────────
function toggleNotifications() {
  const d = $('#notifDrawer');
  const isOpen = !d.classList.contains('hidden');
  if (isOpen) {
    d.classList.add('hidden');
    $('#notifBtn').setAttribute('aria-expanded', 'false');
    $('#notifSidebarBtn').setAttribute('aria-expanded', 'false');
  } else {
    renderNotifications();
    d.classList.remove('hidden');
    $('#notifBtn').setAttribute('aria-expanded', 'true');
    $('#notifSidebarBtn').setAttribute('aria-expanded', 'true');
  }
  // Close profile menu if open
  $('#profileMenu').classList.add('hidden');
}

function toggleProfileMenu() {
  const d = $('#profileMenu');
  const isOpen = !d.classList.contains('hidden');
  if (isOpen) d.classList.add('hidden'); else d.classList.remove('hidden');
  // Close notif if open
  $('#notifDrawer').classList.add('hidden');
}

function renderNotifications() {
  const list = $('#notifList');
  if (state.notifications.length === 0) {
    list.innerHTML = '<div class="px-4 py-8 text-center text-sm text-slate-500">No notifications</div>';
    return;
  }
  list.innerHTML = state.notifications.map(n => `
    <div class="px-4 py-3 border-b border-slate-800/60 flex gap-3 hover:bg-slate-800/30 transition-colors ${n.unread ? 'border-l-2 border-l-emerald-500' : ''}">
      <div class="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center ${
        n.type === 'order' ? 'bg-emerald-500/15 text-emerald-400' :
        n.type === 'warning' ? 'bg-amber-500/15 text-amber-400' :
        n.type === 'success' ? 'bg-sky-500/15 text-sky-400' : 'bg-slate-700/30 text-slate-400'
      }"><i data-lucide="${n.icon}" class="w-4 h-4"></i></div>
      <div class="flex-1 min-w-0">
        <p class="text-xs text-slate-300 leading-snug">${n.text}</p>
        <p class="text-[10px] text-slate-600 mt-1 font-mono">${n.time}</p>
      </div>
      ${n.unread ? '<div class="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1 shrink-0"></div>' : ''}
    </div>
  `).join('');
  if (typeof lucide !== 'undefined') lucide.createIcons();
  state.notifications.forEach(n => n.unread = false);
}

function clearNotifications() {
  state.notifications = [];
  renderNotifications();
  showToast('Notifications cleared', 'success');
}

document.addEventListener('click', (e) => {
  if (!e.target.closest('#notifBtn') && !e.target.closest('#notifDrawer') && !e.target.closest('#notifSidebarBtn')) {
    $('#notifDrawer').classList.add('hidden');
  }
  if (!e.target.closest('#profileBtn') && !e.target.closest('#profileMenu')) {
    $('#profileMenu').classList.add('hidden');
  }
});

// ── MAIN CONTENT RENDERER ─────────────────────────────
function renderMain() {
  const el = $('#mainContent');
  const tab = state.currentTab;
  switch (tab) {
    case 'overview': renderOverview(el); break;
    case 'storage': renderStorage(el); break;
    case 'store': renderStore(el); break;
    case 'orders': renderOrders(el); break;
    case 'access': renderAccess(el); break;
    case 'settings': renderSettings(el); break;
    default: renderOverview(el);
  }
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

// ══ 1. OVERVIEW DASHBOARD ════════════════════════════
function renderOverview(el) {
  const totalRevenue = state.orders.filter(o => o.status === 'completed').reduce((s,o)=>s+o.amount,0);
  const completedFiles = state.files.filter(f => f.status === 'active').length;
  const totalDownloads = state.files.reduce((s,f) => s + f.downloads, 0);
  const totalSales = state.products.reduce((s,p) => s + p.sales, 0);
  const activeSales = state.orders.filter(o => o.status === 'completed').length;
  const refundRate = Math.round((state.orders.filter(o=>o.status==='refunded').length / state.orders.length) * 100);
  
  const used = state.files.reduce((s,f) => s + f.sizeBytes, 0);
  const pct = Math.min(100, (used / 2147483648) * 100);
  const usedGB = (used / 1024 / 1024 / 1024).toFixed(1);

  el.innerHTML = `
    <!-- Header -->
    <div class="flex items-start justify-between mb-6 slide-in">
      <div>
        <h1 class="text-xl font-bold text-white tracking-tight">Overview</h1>
        <p class="text-sm text-slate-500 mt-1">Cloud storage & digital storefront at a glance</p>
      </div>
      <div class="flex gap-2">
        <button onclick="showToast('Exporting report…'); setTimeout(()=>showToast('Report ready (simulated)', 'success'), 1200)" class="flex items-center gap-2 bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">
          <i data-lucide="download" class="w-4 h-4"></i> Export
        </button>
        <button onclick="switchTab('storage')" class="flex items-center gap-2 bg-emerald-500 text-slate-950 rounded-xl px-4 py-2 text-sm font-semibold hover:bg-emerald-400 transition-colors glow-emerald">
          <i data-lucide="plus" class="w-4 h-4"></i> Upload File
        </button>
      </div>
    </div>

    <!-- Stat cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      ${[
        { label: 'Total Revenue', value: fmt$(totalRevenue), change: '+18.2%', icon: 'trending-up', color: 'emerald', note: 'all time' },
        { label: 'Files Hosted', value: fmtNum(completedFiles), change: '+3', icon: 'hard-drive', color: 'sky', note: 'this week' },
        { label: 'Total Downloads', value: fmtNum(totalDownloads), change: '+412', icon: 'arrow-down-to-line', color: 'indigo', note: 'last 30 days' },
        { label: 'Active Sales', value: activeSales, change: `-` + refundRate + '% refunded', icon: 'shopping-cart', color: 'emerald', note: 'completed orders' },
      ].map((s, i) => `
        <div class="glass rounded-2xl p-5 hover:border-emerald-500/30 transition-colors group slide-in" style="animation-delay:${i*60}ms">
          <div class="flex items-start justify-between">
            <div>
              <div class="text-xs font-mono text-slate-500 uppercase tracking-wider">${s.label}</div>
              <div class="text-2xl font-bold text-white mt-1 font-mono">${s.value}</div>
              <div class="text-xs mt-1 flex items-center gap-1 ${s.color === 'emerald' ? 'text-emerald-400' : s.color === 'sky' ? 'text-sky-400' : 'text-indigo-400'}">
                <i data-lucide="trending-up" class="w-3 h-3"></i>${s.change}
              </div>
              <div class="text-[10px] text-slate-600 mt-0.5">${s.note}</div>
            </div>
            <div class="w-10 h-10 rounded-xl flex items-center justify-center bg-${s.color}-500/10 text-${s.color}-400 group-hover:bg-${s.color}-500/20 transition-colors">
              <i data-lucide="${s.icon}" class="w-5 h-5"></i>
            </div>
          </div>
        </div>
      `).join('')}
    </div>

    <!-- Storage gauge + recent sales -->
    <div class="grid lg:grid-cols-3 gap-6">
      <!-- Storage Gauge -->
      <div class="glass rounded-2xl p-6 slide-in" style="animation-delay:240ms">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-sm font-semibold text-white">Cloud Storage</h2>
          <button onclick="switchTab('settings')" class="text-xs text-sky-400 hover:text-sky-300 transition-colors">Manage</button>
        </div>
        <!-- Radial gauge -->
        <div class="flex flex-col items-center py-4">
          <div class="relative w-40 h-40">
            <svg class="w-40 h-40 -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" fill="none" stroke="#1e293b" stroke-width="10"/>
              <circle cx="60" cy="60" r="50" fill="none" stroke="url(#gaugeGrad)" stroke-width="10" stroke-linecap="round" stroke-dasharray="${2*Math.PI*50}" stroke-dashoffset="${2*Math.PI*50*(1-pct/100)}" style="transition: stroke-dashoffset 1s ease" />
              <defs>
                <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stop-color="#34d399"/>
                  <stop offset="100%" stop-color="#38bdf8"/>
                </linearGradient>
              </defs>
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center">
              <div class="text-2xl font-bold text-white font-mono">${pct.toFixed(1)}%</div>
              <div class="text-xs text-slate-500">of 2 TB</div>
            </div>
          </div>
          <div class="mt-4 grid grid-cols-2 gap-3 w-full">
            <div class="bg-slate-800/50 rounded-xl p-3 text-center">
              <div class="text-lg font-bold text-white font-mono">${usedGB} GB</div>
              <div class="text-[10px] text-slate-500 font-mono uppercase">Used</div>
            </div>
            <div class="bg-slate-800/50 rounded-xl p-3 text-center">
              <div class="text-lg font-bold text-white font-mono">${(2147483648/1024/1024/1024 - parseFloat(usedGB)).toFixed(1)} GB</div>
              <div class="text-[10px] text-slate-500 font-mono uppercase">Free</div>
            </div>
          </div>
        </div>
        <!-- Mini breakdown -->
        <div class="mt-2 space-y-2">
          ${['Source Code','Design Assets','Video Course','Other'].map((cat, i) => {
            const sizes = [32, 24, 22, 22];
            const colors = ['#34d399','#38bdf8','#818cf8','#a855f7'];
            return `
              <div class="flex items-center gap-2 text-xs">
                <div class="w-2 h-2 rounded-full" style="background:${colors[i]}"></div>
                <span class="text-slate-400 flex-1">${cat}</span>
                <span class="text-slate-500 font-mono">${sizes[i]}%</span>
              </div>`;
          }).join('')}
        </div>
      </div>

      <!-- Recent Sales -->
      <div class="glass rounded-2xl p-6 lg:col-span-2 slide-in" style="animation-delay:300ms">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-sm font-semibold text-white">Recent Sales</h2>
          <div class="flex items-center gap-2">
            <div class="w-2 h-2 rounded-full bg-emerald-400 pulse-dot"></div>
            <span class="text-xs text-slate-400 font-mono">LIVE</span>
            <button onclick="switchTab('orders')" class="text-xs text-sky-400 hover:text-sky-300 transition-colors">View all →</button>
          </div>
        </div>
        <div class="space-y-3" id="recentSalesList">
          ${state.orders.slice(0,5).map((o,i) => `
            <div class="flex items-center gap-4 p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800/60 transition-colors slide-in" style="animation-delay:${(i+2)*50}ms">
              <div class="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500/20 to-indigo-500/20 flex items-center justify-center text-xs font-bold text-slate-300 shrink-0">
                ${o.email[0].toUpperCase()}
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-medium text-white truncate">${o.product}</div>
                <div class="text-xs text-slate-500 truncate">${o.email}</div>
              </div>
              <div class="text-right shrink-0">
                <div class="text-sm font-bold text-emerald-400 font-mono">${fmt$(o.amount)}</div>
                <div class="text-[10px] text-slate-600 font-mono">${o.date}</div>
              </div>
              <div class="shrink-0">
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${o.status === 'completed' ? 'bg-emerald-500/15 text-emerald-400' : o.status === 'refunded' ? 'bg-amber-500/15 text-amber-400' : 'bg-red-500/15 text-red-400'}">
                  <i data-lucide="${o.status === 'completed' ? 'check-circle' : o.status === 'refunded' ? 'rotate-ccw' : 'clock'}" class="w-2.5 h-2.5"></i>
                  ${o.status}
                </span>
              </div>
            </div>
          `).join('')}
        </div>
        <!-- Quick stats row -->
        <div class="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-slate-800">
          ${[
            { label: 'This Week', value: fmt$(2840), icon: 'calendar' },
            { label: 'Avg. Order', value: fmt$(totalRevenue / Math.max(1,activeSales)), icon: 'target' },
            { label: 'Refunds', value: refundRate + '%', icon: 'rotate-ccw' },
          ].map(q => `
            <div class="text-center py-2">
              <div class="text-lg font-bold text-white font-mono">${q.value}</div>
              <div class="text-[10px] text-slate-500 font-mono uppercase tracking-wide">${q.label}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <!-- Products at a glance -->
    <div class="mt-6 glass rounded-2xl p-6 slide-in" style="animation-delay:360ms">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-sm font-semibold text-white">Top Products</h2>
        <button onclick="switchTab('store')" class="text-xs text-sky-400 hover:text-sky-300 transition-colors">Manage Store →</button>
      </div>
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        ${state.products.slice(0,3).map((p,i) => {
          const f = state.files.find(x => x.id === p.fileId);
          return `
          <div class="flex items-center gap-3 p-3 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 transition-colors">
            <div class="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <i data-lucide="${p.icon}" class="w-4 h-4"></i>
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium text-white truncate">${p.title}</div>
              <div class="text-xs text-slate-500">${p.sales} sales</div>
            </div>
            <div class="text-right shrink-0">
              <div class="text-sm font-bold text-emerald-400 font-mono">${p.price === 0 ? 'Free' : fmt$(p.price)}</div>
              ${p.compareAt > p.price ? `<div class="text-[10px] text-slate-600 line-through font-mono">${fmt$(p.compareAt)}</div>` : ''}
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>
  `;
}

// ══ 2. CLOUD STORAGE MANAGER ═══════════════════════════
let storageFilter = { category: 'all', privacy: 'all' };
let uploadSim = null;

function renderStorage(el) {
  const files = state.files.filter(f => {
    if (storageFilter.category !== 'all' && f.category !== storageFilter.category) return false;
    if (storageFilter.privacy === 'public' && !f.public) return false;
    if (storageFilter.privacy === 'private' && f.public) return false;
    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      if (!f.name.toLowerCase().includes(q) && !f.category.toLowerCase().includes(q)) return false;
    }
    return true;
  });
  const totalSize = state.files.reduce((s,f) => s + f.sizeBytes, 0);
  const categories = ['all', ...new Set(state.files.map(f => f.category))];

  el.innerHTML = `
    <div class="flex items-start justify-between mb-6 slide-in">
      <div>
        <h1 class="text-xl font-bold text-white tracking-tight">Cloud Storage Manager</h1>
        <p class="text-sm text-slate-500 mt-1">${state.files.length} files • ${fmtSize(totalSize)} total</p>
      </div>
      <div class="flex gap-2">
        <button onclick="showToast('Syncing with storage provider…', 'info'); setTimeout(()=>showToast('Storage synced', 'success'), 1500)" class="flex items-center gap-2 bg-slate-800/60 border border-slate-700/50 rounded-xl px-3 py-2 text-sm text-slate-300 hover:text-white transition-colors">
          <i data-lucide="refresh-cw" class="w-4 h-4"></i> Sync
        </button>
        <button onclick="openUploadModal()" class="flex items-center gap-2 bg-emerald-500 text-slate-950 rounded-xl px-4 py-2 text-sm font-semibold hover:bg-emerald-400 transition-colors glow-emerald">
          <i data-lucide="upload-cloud" class="w-4 h-4"></i> Upload Files
        </button>
      </div>
    </div>

    <!-- Upload zone -->
    <div id="dropZone" class="mb-6 border-2 border-dashed border-slate-700/50 rounded-2xl p-8 text-center transition-all hover:border-emerald-500/50 hover:bg-emerald-500/3 cursor-pointer slide-in" style="animation-delay:60ms"
      ondragover="event.preventDefault(); this.style.borderColor='#34d399'; this.style.background='rgba(52,211,153,0.05)'"
      ondragleave="this.style.borderColor=''; this.style.background=''"
      ondrop="handleFileDrop(event)"
      onclick="document.getElementById('hiddenFileInput').click()"
      role="button" tabindex="0" onkeydown="if(e.key==='Enter'||e.key===' ')document.getElementById('hiddenFileInput').click()"
      aria-label="Upload files — drop or click">
      <input type="file" id="hiddenFileInput" class="hidden" multiple onchange="handleFileSelect(this.files)" />
      <div class="flex flex-col items-center gap-3">
        <div class="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center glow-emerald">
          <i data-lucide="cloud-upload" class="w-7 h-7 text-emerald-400"></i>
        </div>
        <div>
          <p class="text-sm font-semibold text-white">Drop files here or click to upload</p>
          <p class="text-xs text-slate-500 mt-1">Single or batch — simulation builds a real queue</p>
        </div>
        <div class="text-[10px] font-mono text-slate-600 bg-slate-800/50 px-3 py-1 rounded-full">All file types supported</div>
      </div>
    </div>

    ${state.uploadQueue.length > 0 ? `
    <!-- Upload queue -->
    <div class="mb-6 glass rounded-2xl p-4 slide-in">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-semibold text-white">Upload Queue</h3>
        <button onclick="clearUploadQueue()" class="text-xs text-slate-500 hover:text-slate-300">Clear</button>
      </div>
      <div class="space-y-2">
        ${state.uploadQueue.map(q => `
          <div class="flex items-center gap-3">
            <i data-lucide="file" class="w-4 h-4 text-slate-500 shrink-0"></i>
            <div class="flex-1 min-w-0">
              <div class="flex justify-between text-xs mb-1">
                <span class="text-slate-300 truncate">${q.name}</span>
                <span class="text-slate-500 font-mono">${q.progress}%</span>
              </div>
              <div class="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-emerald-500 to-sky-500 rounded-full transition-all duration-300 progress-animated" style="--progress:${q.progress}%"></div>
              </div>
            </div>
            <div class="shrink-0">
              ${q.status === 'uploading' ? '<i data-lucide="loader-2" class="w-4 h-4 text-sky-400 animate-spin"></i>' : q.status === 'done' ? '<i data-lucide="check-circle" class="w-4 h-4 text-emerald-400"></i>' : '<i data-lucide="clock" class="w-4 h-4 text-slate-500"></i>'}
            </div>
          </div>
        `).join('')}
      </div>
    </div>` : ''}

    <!-- Filter bar -->
    <div class="flex flex-wrap items-center gap-3 mb-4 slide-in" style="animation-delay:120ms">
      <div class="flex gap-1 bg-slate-800/40 rounded-xl p-1 border border-slate-700/40">
        ${['all','public','private'].map(p => `
          <button onclick="storageFilter.privacy='${p}'; renderMain()" class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${storageFilter.privacy===p ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}">
            ${p === 'all' ? 'All' : p === 'public' ? '🌐 Public' : '🔒 Private'}
          </button>
        `).join('')}
      </div>
      <div class="flex gap-1 bg-slate-800/40 rounded-xl p-1 border border-slate-700/40 overflow-x-auto">
        ${categories.map(c => `
          <button onclick="storageFilter.category='${c}'; renderMain()" class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${storageFilter.category===c ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}">
            ${c === 'all' ? 'All Types' : c}
          </button>
        `).join('')}
      </div>
      <div class="ml-auto text-xs text-slate-500 font-mono">${files.length} files</div>
    </div>

    <!-- File list -->
    <div class="glass rounded-2xl overflow-hidden slide-in" style="animation-delay:180ms">
      <div class="grid grid-cols-12 px-4 py-3 border-b border-slate-800 text-[10px] font-mono uppercase tracking-widest text-slate-600" style="min-width: 700px">
        <div class="col-span-4">Name</div>
        <div class="col-span-2">Size</div>
        <div class="col-span-2">Type</div>
        <div class="col-span-1">Downloads</div>
        <div class="col-span-1">Price</div>
        <div class="col-span-2">Actions</div>
      </div>
      ${files.length === 0 ? `
        <div class="py-16 text-center">
          <i data-lucide="folder-open" class="w-10 h-10 text-slate-700 mx-auto mb-3"></i>
          <p class="text-sm text-slate-500">No files match your filters</p>
          <button onclick="resetStorageFilters()" class="mt-2 text-xs text-emerald-400 hover:text-emerald-300">Reset filters</button>
        </div>
      ` : files.map((f, idx) => {
        const product = state.products.find(p => p.fileId === f.id);
        const iconInfo = getFileIcon(f.mimeType);
        return `
        <div class="grid grid-cols-12 items-center px-4 py-3 border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors group" style="min-width:700px" draggable="true" ondragstart="handleFileDragStart(event,'${f.id}')" ondragover="event.preventDefault()" ondrop="handleFileDropOnRow(event,'${f.id}')">
          <div class="col-span-4 flex items-center gap-3 min-w-0">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconInfo.bg} ${iconInfo.color}">
              <i data-lucide="${iconInfo.icon}" class="w-4 h-4"></i>
            </div>
            <div class="min-w-0">
              <div class="text-sm font-medium text-white truncate">${f.name}</div>
              <div class="text-[10px] text-slate-600 font-mono">${new Date(f.uploaded).toLocaleDateString()} • ${f.category}</div>
            </div>
          </div>
          <div class="col-span-2 text-xs text-slate-400 font-mono">${fmtSize(f.sizeBytes)}</div>
          <div class="col-span-2 text-xs text-slate-500 font-mono truncate">${f.mimeType}</div>
          <div class="col-span-1 text-xs font-mono text-slate-400">${fmtNum(f.downloads)}</div>
          <div class="col-span-1 text-xs font-mono ${f.price === 0 ? 'text-slate-500' : 'text-emerald-400'}">${f.price === 0 ? 'FREE' : fmt$(f.price)}</div>
          <div class="col-span-2 flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
            <button onclick="copyFileLink('${f.id}')" class="p-1.5 rounded-lg text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors tooltip" data-tip="Copy download link" aria-label="Copy link for ${f.name}">
              <i data-lucide="link" class="w-3.5 h-3.5"></i>
            </button>
            <button onclick="toggleFilePrivacy('${f.id}')" class="p-1.5 rounded-lg ${f.public ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-700/50'} hover:bg-slate-700/50 transition-colors tooltip" data-tip="${f.public ? 'Make private' : 'Make public'}" aria-label="${f.public ? 'Make private' : 'Make public'}">
              <i data-lucide="${f.public ? 'globe' : 'lock'}" class="w-3.5 h-3.5"></i>
            </button>
            ${product ? `<button onclick="openProductEditor('${product.id}')" class="p-1.5 rounded-lg text-sky-400 hover:bg-sky-500/10 transition-colors tooltip" data-tip="Edit product" aria-label="Edit product for ${f.name}"><i data-lucide="tag" class="w-3.5 h-3.5"></i></button>` : `<button onclick="quickCreateProduct('${f.id}')" class="p-1.5 rounded-lg text-slate-500 hover:text-sky-400 hover:bg-sky-500/10 transition-colors tooltip" data-tip="Set price & list in store" aria-label="Set price for ${f.name}"><i data-lucide="tag" class="w-3.5 h-3.5"></i></button>`}
            <button onclick="openMoveModal('${f.id}')" class="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-700/50 transition-colors tooltip" data-tip="Move / Rename" aria-label="Move or rename ${f.name}"><i data-lucide="folder-input" class="w-3.5 h-3.5"></i></button>
            <button onclick="confirmDeleteFile('${f.id}')" class="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors tooltip" data-tip="Delete" aria-label="Delete ${f.name}"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
          </div>
        </div>`;
      }).join('')}
      ${files.length > 0 ? `<div class="px-4 py-2 text-[10px] font-mono text-slate-600 border-t border-slate-800 flex justify-between">
        <span>Drag files to folders (simulated) • ${files.length} items • ${fmtSize(totalSize)} total</span>
        <span class="flex items-center gap-1"><i data-lucide="shield-check" class="w-3 h-3"></i> End-to-end encrypted</span>
      </div>` : ''}
    </div>
  `;
}

function getFileIcon(mime) {
  if (mime.includes('zip') || mime.includes('tar') || mime.includes('gzip')) return { icon: 'archive', bg: 'bg-indigo-500/10', color: 'text-indigo-400' };
  if (mime.startsWith('video/')) return { icon: 'film', bg: 'bg-rose-500/10', color: 'text-rose-400' };
  if (mime.startsWith('audio/')) return { icon: 'music', bg: 'bg-purple-500/10', color: 'text-purple-400' };
  if (mime.startsWith('image/')) return { icon: 'image', bg: 'bg-sky-500/10', color: 'text-sky-400' };
  if (mime.includes('pdf')) return { icon: 'book-open', bg: 'bg-red-500/10', color: 'text-red-400' };
  if (mime.includes('json') || mime.includes('javascript') || mime.includes('typescript')) return { icon: 'code-2', bg: 'bg-yellow-500/10', color: 'text-yellow-400' };
  if (mime.includes('dmg') || mime.includes('exe')) return { icon: 'cpu', bg: 'bg-emerald-500/10', color: 'text-emerald-400' };
  return { icon: 'file', bg: 'bg-slate-500/10', color: 'text-slate-400' };
}

// Upload simulation
function handleFileSelect(fileList) {
  const files = Array.from(fileList);
  if (files.length === 0) return;
  openUploadModalPrep(files);
}

function handleFileDrop(e) { e.preventDefault(); handleFileSelect(e.dataTransfer.files); }

function openUploadModalPrep(files) {
  state.uploadQueue = files.map(f => ({ id: uid(), name: f.name, size: f.size, progress: 0, status: 'pending' }));
  if (uploadSim) clearInterval(uploadSim);
  renderMain();
  simulateUpload();
}

function simulateUpload() {
  uploadSim = setInterval(() => {
    let changed = false;
    state.uploadQueue.forEach(q => {
      if (q.status === 'pending') { q.status = 'uploading'; changed = true; }
      if (q.status === 'uploading' && q.progress < 100) {
        q.progress = Math.min(100, q.progress + Math.random() * 18 + 2);
        if (q.progress >= 100) {
          q.status = 'done';
          // Move to files list
          const sizeBytes = q.size || Math.floor(Math.random() * 50000000) + 1000000;
          const ext = q.name.split('.').pop().toLowerCase();
          const mimeMap = { zip: 'application/zip', pdf: 'application/pdf', mp4: 'video/mp4', dmg: 'application/x-dmg', json: 'application/json', psd: 'application/zip', txt: 'text/plain' };
          state.files.unshift({
            id: uid(), name: q.name, folder: '/', size: sizeBytes/1024/1024, sizeBytes,
            mimeType: mimeMap[ext] || 'application/octet-stream',
            uploaded: new Date().toISOString(), public: false, price: 0, downloads: 0, status: 'active', featured: false, category: 'Uncategorized'
          });
        }
        changed = true;
      }
    });
    if (changed) renderStorageListOnly();
    if (state.uploadQueue.every(q => q.status === 'done')) {
      clearInterval(uploadSim);
      setTimeout(() => { state.uploadQueue = []; renderMain(); }, 800);
      showToast(`Uploaded ${årData1} file(s) to cloud storage`, 'success');
      
    }
  }, 120);
  
}

// Re-render only the storage list without full re-render
function renderStorageListOnly() { if (state.currentTab === 'storage') renderMain(); }

function resetStorageFilters() { storageFilter = { category: 'all', privacy: 'all' }; renderMain(); }

function copyFileLink(fileId) {
  const f = state.files.find(x => x.id === fileId);
  const url = `https://${state.settings.storeUrl}/d/${f.id}`;
  navigator.clipboard.writeText(url).then(() => showToast(`Link copied: ${f.name} → ${url}`, 'success'));
}

function toggleFilePrivacy(fileId) {
  const f = state.files.find(x => x.id === fileId);
  f.public = !f.public;
  showToast(`${f.name} is now ${f.public ? 'Public 🌐' : 'Private 🔒'}`, f.public ? 'success' : 'info');
  renderMain();
}

function confirmDeleteFile(fileId) {
  const f = state.files.find(x => x.id === fileId);
  const product = state.products.find(p => p.fileId === fileId);
  showConfirm(
    `Delete "${f.name}"?`,
    `This removes the file from cloud storage permanently${product ? ` — and unlists "${product.title}" from the store` : ''}.`,
    'Delete File', 'danger',
    () => {
      state.files = state.files.filter(x => x.id !== fileId);
      state.products = state.products.filter(p => p.fileId !== fileId);
      state.accessKeys = state.accessKeys.filter(k => {
        const p = state.products.find(p2 => p2.fileId === fileId);
        return p !== undefined;
      });
      showToast(`Deleted "${f.name}" from storage`, 'success');
      renderMain();
      updateSidebarStorage();
    }
  );
}

// File drag-to-move (simulated)
function handleFileDragStart(e, fileId) { e.dataTransfer.setData('text/plain', fileId); state.draggedFile = fileId; }
function handleFileDropOnRow(e, targetId) {
  e.preventDefault();
  const draggedId = state.draggedFile;
  if (!draggedId || draggedId === targetId) return;
  const dragged = state.files.find(f => f.id === draggedId);
  const target = state.files.find(f => f.id === targetId);
  const targetFolder = target.folder;
  dragged.folder = targetFolder;
  showToast(`Moved "${dragged.name}" to /${targetFolder === '/' ? 'root' : targetFolder.slice(1)}`, 'info');
  renderMain();
}

// Quick file create from store tab
function quickCreateProduct(fileId) {
  const f = state.files.find(x => x.id === fileId);
  const title = f.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const p = {
    id: uid(), fileId, title,
    description: `Automatically generated listing for ${f.name}.`,
    price: 9, compareAt: 19, category: 'General',
    maxDownloads: 3, expiryDays: 7, featured: false, unlisted: false, sales: 0, icon: 'package'
  };
  state.products.push(p);
  showToast(`Product "${title}" created — open Store to edit details`, 'success');
  renderMain();
}

function openProductEditor(productId) {
  const p = state.products.find(x => x.id === productId);
  if (!p) return;
  const f = state.files.find(x => x.id === p.fileId);
  openModal(`
    <div class="space-y-4">
      <div class="flex items-start gap-3">
        <div class="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
          <i data-lucide="${p.icon}" class="w-5 h-5"></i>
        </div>
        <div>
          <h2 class="text-base font-bold text-white">Edit Product</h2>
          <p class="text-xs text-slate-500">${f.name}</p>
        </div>
      </div>
      
      <div>
        <label class="block text-xs font-mono text-slate-500 uppercase tracking-wider mb-1.5" for="peTitle">Title</label>
        <input id="peTitle" value="${p.title}" class="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/25 transition" />
      </div>
      
      <div>
        <label class="block text-xs font-mono text-slate-500 uppercase tracking-wider mb-1.5" for="peDesc">Description</label>
        <textarea id="peDesc" rows="3" class="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/25 transition resize-none">${p.description}</textarea>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-mono text-slate-500 uppercase tracking-wider mb-1.5" for="pePrice">Price ($)</label>
          <input id="pePrice" type="number" min="0" value="${p.price}" class="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/25 transition" />
        </div>
        <div>
          <label class="block text-xs font-mono text-slate-500 uppercase tracking-wider mb-1.5" for="peCompare">Compare-at ($)</label>
          <input id="peCompare" type="number" min="0" value="${p.compareAt}" class="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/25 transition" />
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-mono text-slate-500 uppercase tracking-wider mb-1.5" for="peDownloads">Max Downloads / Purchase</label>
          <input id="peDownloads" type="number" min="1" value="${p.maxDownloads}" class="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/25 transition" />
        </div>
        <div>
          <label class="block text-xs font-mono text-slate-500 uppercase tracking-wider mb-1.5" for="peExpiry">Link Expiry (days)</label>
          <input id="peExpiry" type="number" min="1" value="${p.expiryDays}" class="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/25 transition" />
        </div>
      </div>

      <div class="flex items-center justify-between bg-slate-800/40 border border-slate-700/50 rounded-xl p-3">
        <div>
          <div class="text-sm font-medium text-white">Featured</div>
          <div class="text-xs text-slate-500">Show on storefront homepage</div>
        </div>
        <button onclick="pSettingToggle('featured','${p.id}',this)" data-key="featured" data-value="${p.featured}" class="w-11 h-6 rounded-full transition-all relative ${p.featured ? 'bg-emerald-500' : 'bg-slate-700'}">
          <span class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${p.featured ? 'translate-x-5' : ''}"></span>
        </button>
      </div>

      <div class="flex items-center justify-between bg-slate-800/40 border border-slate-700/50 rounded-xl p-3">
        <div>
          <div class="text-sm font-medium text-white">Unlisted</div>
          <div class="text-xs text-slate-500">Hidden from public store but accessible by link</div>
        </div>
        <button onclick="pSettingToggle('unlisted','${p.id}',this)" data-key="unlisted" data-value="${p.unlisted}" class="w-11 h-6 rounded-full transition-all relative ${p.unlisted ? 'bg-slate-600' : 'bg-slate-700'}">
          <span class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${p.unlisted ? 'translate-x-5' : ''}"></span>
        </button>
      </div>

      <div class="flex gap-2">
        <button onclick="saveProduct('${p.id}')" class="flex-1 bg-emerald-500 text-slate-950 rounded-xl py-2.5 text-sm font-semibold hover:bg-emerald-400 transition-colors flex items-center justify-center gap-2">
          <i data-lucide="check" class="w-4 h-4"></i> Save Product
        </button>
        <button onclick="duplicateProduct('${p.id}')" class="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-300 hover:text-white transition-colors">
          <i data-lucide="copy" class="w-4 h-4"></i> Duplicate
        </button>
      </div>
    </div>
  `, 'Product Editor');
}

function pSettingToggle(key, productId, btn) {
  const p = state.products.find(x => x.id === productId);
  p[key] = !p[key];
  const isOn = p[key];
  btn.className = `w-11 h-6 rounded-full transition-all relative ${isOn ? 'bg-emerald-500' : 'bg-slate-700'}`;
  btn.querySelector('span').style.transform = isOn ? 'translateX(20px)' : '';
  showToast(`${p.title.replace(/"/g,'')}: ${key} ${isOn ? 'ON' : 'OFF'}`, 'success');
}

function saveProduct(id) {
  const p = state.products.find(x => x.id === id);
  p.title = $('#peTitle').value.trim() || p.title;
  p.description = $('#peDesc').value.trim() || p.description;
  p.price = Math.max(0, parseFloat($('#pePrice').value) || 0);
  p.compareAt = Math.max(0, parseFloat($('#peCompare').value) || 0);
  p.maxDownloads = Math.max(1, parseInt($('#peDownloads').value) || 3);
  p.expiryDays = Math.max(1, parseInt($('#peExpiry').value) || 7);
  closeModal();
  showToast(`"${p.title}" saved`, 'success');
  renderMain();
}

function duplicateProduct(id) {
  const p = state.products.find(x => x.id === id);
  if (!p) return;
  const copy = { ...p, id: uid(), title: p.title + ' (Copy)', sales: 0 };
  state.products.push(copy);
  closeModal();
  showToast(`Duplicated as "${copy.title}"`, 'success');
  renderMain();
}

// Move/rename modal
let movingFileId = null;
function openMoveModal(fileId) {
  movingFileId = fileId;
  const f = state.files.find(x => x.id === fileId);
  const folders = [...new Set(state.files.map(x => x.folder))];
  openModal(`
    <div class="space-y-4">
      <div class="flex items-start gap-3">
        <div class="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center shrink-0"><i data-lucide="folder-input" class="w-5 h-5"></i></div>
        <div><h2 class="text-base font-bold text-white">Move / Rename File</h2><p class="text-xs text-slate-500 font-mono truncate">${f.name}</p></div>
      </div>
      <div>
        <label class="block text-xs font-mono text-slate-500 uppercase tracking-wider mb-1.5" for="mvFolder">Move to folder</label>
        <select id="mvFolder" class="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition">
          ${folders.map(f => `<option value="${f}" ${f === f.folder ? 'selected' : ''}>${f === '/' ? '/ root' : f}</option>`).join('')}
          <option value="__new__">+ Create new folder…</option>
        </select>
      </div>
      <div id="mvNewFolderWrap" class="hidden">
        <label class="block text-xs font-mono text-slate-500 uppercase tracking-wider mb-1.5" for="mvNewFolder">New folder name</label>
        <input id="mvNewFolder" placeholder="/assets, /releases, /2024-q1…" class="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition" spellcheck="false" />
      </div>
      <div>
        <label class="block text-xs font-mono text-slate-500 uppercase tracking-wider mb-1.5" for="mvName">Rename file</label>
        <input id="mvName" value="${f.name}" class="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500/50 transition" spellcheck="false" />
      </div>
      <div class="flex gap-2">
        <button onclick="saveMoveRename('${fileId}')" class="flex-1 bg-emerald-500 text-slate-950 rounded-xl py-2.5 text-sm font-semibold hover:bg-emerald-400 transition-colors flex items-center justify-center gap-2">
          <i data-lucide="check" class="w-4 h-4"></i> Save Changes
        </button>
      </div>
    </div>
  `, 'Move / Rename');
  $('#mvFolder').addEventListener('change', (e) => { $('#mvNewFolderWrap').classList.toggle('hidden', e.target.value !== '__new__'); });
}

function saveMoveRename(fileId) {
  const f = state.files.find(x => x.id === fileId);
  const newFolder = $('#mvFolder').value === '__new__' ? ($('#mvNewFolder').value.trim().replace(/\/+$/,'') || '/') : $('#mvFolder').value;
  const newName = $('#mvName').value.trim() || f.name;
  f.folder = newFolder.startsWith('/') ? newFolder : '/' + newFolder;
  f.name = newName;
  closeModal();
  showToast(`Moved to ${f.folder} • renamed to ${f.name}`, 'success');
  renderMain();
}

// ══ 3. DIGITAL FILE STORE ════════════════════════════
let storeFilter = { status: 'all', category: 'all' };

function renderStore(el) {
  const products = state.products.filter(p => {
    if (storeFilter.status !== 'all' && (
      (storeFilter.status === 'featured' && !p.featured) ||
      (storeFilter.status === 'unlisted' && !p.unlisted) ||
      (storeFilter.status === 'free' && p.price > 0) ||
      (storeFilter.status === 'sale' && (p.compareAt === 0 || p.compareAt <= p.price))
    )) return false;
    if (storeFilter.category !== 'all' && p.category !== storeFilter.category) return false;
    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      if (!p.title.toLowerCase().includes(q) && !p.description.toLowerCase().includes(q) && !p.category.toLowerCase().includes(q)) return false;
    }
    return true;
  });
  
  const totalRevenue = state.products.reduce((s,p) => s + (p.price * p.sales), 0);
  const totalUnits = state.products.reduce((s,p) => s + p.sales, 0);
  const categories = ['all', ...new Set(state.products.map(p => p.category))];

  el.innerHTML = `
    <div class="flex items-start justify-between mb-6 slide-in">
      <div>
        <h1 class="text-xl font-bold text-white tracking-tight">Digital File Store</h1>
        <p class="text-sm text-slate-500 mt-1">${state.products.length} products • ${fmtNum(totalUnits)} units sold • ${fmt$(totalRevenue)} total revenue</p>
      </div>
      <div class="flex gap-2">
        <button onclick="showToast('Importing from catalog…', 'info')" class="flex items-center gap-2 bg-slate-800/60 border border-slate-700/50 rounded-xl px-3 py-2 text-sm text-slate-300 hover:text-white transition-colors">
          <i data-lucide="rotate-ccw-import" class="w-4 h-4"></i> Import
        </button>
        <button onclick="switchTab('storage')" class="flex items-center gap-2 bg-emerald-500 text-slate-950 rounded-xl px-4 py-2 text-sm font-semibold hover:bg-emerald-400 transition-colors glow-emerald">
          <i data-lucide="plus" class="w-4 h-4"></i> New Product
        </button>
      </div>
    </div>

    <!-- Stats row -->
    <div class="grid grid-cols-3 gap-4 mb-5">
      ${[
        { label: 'Products Live', value: state.products.filter(p => !p.unlisted).length, icon: 'store', color: 'emerald' },
        { label: 'On Sale', value: state.products.filter(p => p.compareAt > p.price).length, icon: 'percent', color: 'sky' },
        { label: 'Total Revenue', value: fmt$(totalRevenue), icon: 'trending-up', color: 'indigo' },
      ].map((s,i) => `
        <div class="glass rounded-2xl p-4 flex items-center gap-3 slide-in" style="animation-delay:${i*60}ms">
          <div class="w-10 h-10 rounded-xl bg-${s.color}-500/10 text-${s.color}-400 flex items-center justify-center shrink-0">
            <i data-lucide="${s.icon}" class="w-5 h-5"></i>
          </div>
          <div><div class="text-lg font-bold text-white font-mono">${s.value}</div><div class="text-xs text-slate-500">${s.label}</div></div>
        </div>
      `).join('')}
    </div>

    <!-- Filter -->
    <div class="flex flex-wrap gap-2 mb-5 slide-in" style="animation-delay:180ms">
      ${['all','featured','sale','free','unlisted'].map(s => `
        <button onclick="storeFilter.status='${s}'; renderMain()" class="px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors capitalize ${storeFilter.status===s ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 glow-emerald' : 'bg-slate-800/40 border-slate-700/50 text-slate-500 hover:text-slate-300 hover:border-slate-600'}">
          ${s === 'all' ? 'All' : s === 'featured' ? '⭐ Featured' : s === 'sale' ? '🏷️ On Sale' : s === 'free' ? '🆓 Free' : '👁 Unlisted'}
        </button>
      `).join('')}
      <div class="ml-auto text-xs text-slate-500 font-mono">${products.length} products</div>
    </div>

    <!-- Product grid -->
    <div class="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
      ${products.map((p, i) => {
        const f = state.files.find(x => x.id === p.fileId);
        const discount = p.compareAt > p.price ? Math.round((1 - p.price/p.compareAt) * 100) : 0;
        return `
        <div class="glass rounded-2xl overflow-hidden hover:border-emerald-500/30 transition-all group slide-in ${p.unlisted ? 'opacity-60' : ''}" style="animation-delay:${i*50}ms">
          <!-- Top decoration -->
          <div class="h-1.5 ${p.featured ? 'bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-500' : 'bg-slate-800'}"></div>
          
          <div class="p-5">
            <div class="flex items-start gap-3 mb-4">
              <div class="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                p.category === 'Source Code' ? 'bg-yellow-500/10 text-yellow-400' :
                p.category === 'Design Assets' ? 'bg-pink-500/10 text-pink-400' :
                p.category === 'Ebook' ? 'bg-red-500/10 text-red-400' :
                p.category === 'Video Course' ? 'bg-indigo-500/10 text-indigo-400' :
                p.category === 'Templates' ? 'bg-sky-500/10 text-sky-400' :
                'bg-emerald-500/10 text-emerald-400'
              }">
                <i data-lucide="${p.icon}" class="w-5 h-5"></i>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-2">
                  <h3 class="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors leading-snug line-clamp-2">${p.title}</h3>
                  ${p.featured ? '<span class="shrink-0 text-[10px] font-mono text-amber-400 bg-amber-500/15 px-1.5 py-0.5 rounded-full flex items-center gap-0.5"><i data-lucide="star" class="w-2 h-2 fill-amber-400"></i>FEATURED</span>' : ''}
                </div>
                <p class="text-xs text-slate-500 mt-0.5 line-clamp-2">${p.description}</p>
              </div>
            </div>

            <!-- Price row -->
            <div class="flex items-center gap-3 mb-3">
              <div class="flex items-baseline gap-2">
                <span class="text-2xl font-bold text-white font-mono">${p.price === 0 ? 'Free' : fmt$(p.price)}</span>
                ${p.compareAt > p.price ? `<span class="text-xs text-slate-500 line-through font-mono">${fmt$(p.compareAt)}</span>` : ''}
              </div>
              ${discount > 0 ? `<span class="text-[10px] font-bold bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">-${discount}% OFF</span>` : ''}
            </div>

            <!-- Stats row -->
            <div class="flex items-center gap-4 text-xs text-slate-500 mb-4">
              <span class="flex items-center gap-1"><i data-lucide="download" class="w-3 h-3"></i>${fmtNum(p.sales)}</span>
              <span class="flex items-center gap-1"><i data-lucide="clock" class="w-3 h-3"></i>${p.expiryDays}d expiry</span>
              <span class="flex items-center gap-1"><i data-lucide="hard-drive" class="w-3 h-3"></i>${f ? fmtSize(f.sizeBytes) : '—'}</span>
              ${f && f.public ? '<span class="flex items-center gap-1 text-emerald-500"><i data-lucide="globe" class="w-3 h-3"></i>Public</span>' : '<span class="flex items-center gap-1 text-slate-500"><i data-lucide="lock" class="w-3 h-3"></i>Private</span>'}
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-2 pt-3 border-t border-slate-800/80">
              <button onclick="openProductEditor('${p.id}')" class="flex-1 bg-slate-800/60 border border-slate-700/50 text-slate-300 hover:text-white hover:border-slate-600 rounded-lg py-2 text-xs font-medium transition-colors flex items-center justify-center gap-1.5">
                <i data-lucide="edit-3" class="w-3.5 h-3.5"></i> Edit
              </button>
              <button onclick="copyStoreLink('${p.id}')" class="flex-1 bg-slate-800/60 border border-slate-700/50 text-slate-300 hover:text-white hover:border-slate-600 rounded-lg py-2 text-xs font-medium transition-colors flex items-center justify-center gap-1.5" aria-label="Copy share link for ${p.title}">
                <i data-lucide="link" class="w-3.5 h-3.5"></i> Link
              </button>
              <button onclick="quickSellProduct('${p.id}')" class="flex-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 rounded-lg py-2 text-xs font-medium transition-colors flex items-center justify-center gap-1.5" aria-label="Simulate sale for ${p.title}">
                <i data-lucide="zap" class="w-3.5 h-3.5"></i> Sell
              </button>
            </div>
          </div>
        </div>`;
      }).join('')}
      ${products.length === 0 ? `
        <div class="col-span-3 py-16 text-center glass rounded-2xl">
          <i data-lucide="shopping-bag" class="w-10 h-10 text-slate-700 mx-auto mb-3"></i>
          <p class="text-sm text-slate-500">No products match your filters</p>
          <button onclick="storeFilter={status:'all',category:'all'};renderMain()" class="mt-2 text-xs text-emerald-400 hover:text-emerald-300">Reset filters</button>
        </div>
      ` : ''}
    </div>
  `;
}

function copyStoreLink(productId) {
  const p = state.products.find(x => x.id === productId);
  const url = `https://${state.settings.storeUrl}/store/${p.id}`;
  navigator.clipboard.writeText(url).then(() => showToast(`Store link copied: ${p.title} → ${url}`, 'success'));
}

function quickSellProduct(productId) {
  const p = state.products.find(x => x.id === productId);
  const fakeEmails = ['customer@domain.io', 'user@mail.dev', 'buyer@fastmail.com', 'hello@studio.co', 'anon@privacy.cx'];
  const email = fakeEmails[Math.floor(Math.random() * fakeEmails.length)];
  const order = {
    id: 'ORD-' + Math.floor(1000 + Math.random()*9000),
    email, product: p.title, amount: p.price,
    method: ['card','paypal','stripe','bkash'][Math.floor(Math.random()*4)],
    status: 'completed', date: 'just now', linkActive: true,
    ip: `${Math.floor(Math.random()*200+50)}.${Math.floor(Math.random()*999)}.${Math.floor(Math.random()*999)}.${Math.floor(Math.random()*999)}`,
    country: ['US','DE','SG','GB','BD','NL','BR','JP'][Math.floor(Math.random()*8)]
  };
  state.orders.unshift(order);
  p.sales++;
  state.revenue.total += p.price;
  state.revenue.week += p.price;
  updateHeaderRevenue();
  showToast(`Sale simulated: "${p.title}" → ${fmt$(p.price)} to ${email}`, 'success');
}

// ══ 4. ORDERS & REVENUE ══════════════════════════════
let ordersFilter = 'all';
let ordersSort = 'newest';

function renderOrders(el) {
  let orders = [...state.orders];
  if (ordersFilter !== 'all') orders = orders.filter(o => o.status === ordersFilter);
  if (state.searchQuery) {
    const q = state.searchQuery.toLowerCase();
    orders = orders.filter(o => o.email.toLowerCase().includes(q) || o.id.toLowerCase().includes(q) || o.product.toLowerCase().includes(q));
  }
  if (ordersSort === 'amount') orders.sort((a,b) => b.amount - a.amount);

  const total = state.orders.filter(o=>o.status==='completed').reduce((s,o)=>s+o.amount,0);
  const refunded = state.orders.filter(o=>o.status==='refunded').reduce((s,o)=>s+o.amount,0);
  const pending = state.orders.filter(o=>o.status==='expired').reduce((s,o)=>s+o.amount,0);
  const stats = { total, refunded, pending, count: state.orders.length };

  el.innerHTML = `
    <div class="flex items-start justify-between mb-6 slide-in">
      <div>
        <h1 class="text-xl font-bold text-white tracking-tight">Orders, Revenue & Access Control</h1>
        <p class="text-sm text-slate-500 mt-1">${state.orders.length} orders • ${fmt$(stats.total)} revenue</p>
      </div>
      <div class="flex gap-2">
        <button onclick="exportOrdersCSV()" class="flex items-center gap-2 bg-slate-800/60 border border-slate-700/50 rounded-xl px-3 py-2 text-sm text-slate-300 hover:text-white transition-colors">
          <i data-lucide="download" class="w-4 h-4"></i> Export CSV
        </button>
        <button onclick="openCreateKeyModal()" class="flex items-center gap-2 bg-emerald-500 text-slate-950 rounded-xl px-4 py-2 text-sm font-semibold hover:bg-emerald-400 transition-colors glow-emerald">
          <i data-lucide="key-round" class="w-4 h-4"></i> New Access Key
        </button>
      </div>
    </div>

    <!-- Revenue cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      ${[
        { label: 'Gross Revenue', value: fmt$(stats.total), icon: 'dollar-sign', color: 'emerald', sub: state.orders.filter(o=>o.status==='completed').length + ' completed' },
        { label: 'Refunded', value: fmt$(stats.refunded), icon: 'rotate-ccw', color: 'amber', sub: state.orders.filter(o=>o.status==='refunded').length + ' orders' },
        { label: 'Pending / Expired', value: fmt$(stats.pending), icon: 'clock', color: 'red', sub: state.orders.filter(o=>o.status==='expired').length + ' orders' },
        { label: 'Avg. Order Value', value: fmt$(stats.count ? total/stats.count : 0), icon: 'target', color: 'sky', sub: 'across all orders' },
      ].map((s,i) => `
        <div class="glass rounded-2xl p-4 slide-in" style="animation-delay:${i*60}ms">
          <div class="flex items-center gap-2 mb-2">
            <div class="w-8 h-8 rounded-xl bg-${s.color}-500/10 text-${s.color}-400 flex items-center justify-center shrink-0"><i data-lucide="${s.icon}" class="w-4 h-4"></i></div>
            <div class="text-xs text-slate-500 font-mono uppercase tracking-wide">${s.label}</div>
          </div>
          <div class="text-2xl font-bold text-white font-mono">${s.value}</div>
          <div class="text-[10px] text-slate-600 mt-1">${s.sub}</div>
        </div>
      `).join('')}
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap gap-2 mb-4 slide-in" style="animation-delay:180ms">
      ${['all','completed','refunded','expired'].map(s => `
        <button onclick="ordersFilter='${s}'; renderMain()" class="px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors capitalize ${ordersFilter===s ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 glow-emerald' : 'bg-slate-800/40 border-slate-700/50 text-slate-500 hover:text-slate-300'}">
          ${s === 'all' ? 'All Orders' : s === 'completed' ? '✅ Completed' : s === 'refunded' ? '↩️ Refunded' : '⏰ Expired'}
        </button>
      `).join('')}
      <div class="ml-auto flex items-center gap-2 text-xs text-slate-500">
        <span class="font-mono">Sort:</span>
        <select onchange="ordersSort=this.value; renderMain()" class="bg-slate-800/60 border border-slate-700/50 rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none">
          <option value="newest" ${ordersSort==='newest'?'selected':''}>Newest first</option>
          <option value="amount" ${ordersSort==='amount'?'selected':''}>Highest amount</option>
        </select>
        <span class="font-mono">${orders.length} orders</span>
      </div>
    </div>

    <!-- Orders table -->
    <div class="glass rounded-2xl overflow-hidden slide-in" style="animation-delay:240ms">
      <div class="overflow-x-auto">
        <table class="w-full" style="min-width: 760px">
          <thead>
            <tr class="text-left text-[10px] font-mono uppercase tracking-widest text-slate-600 border-b border-slate-800">
              <th class="px-4 py-3">Order</th><th class="px-4 py-3">Customer</th><th class="px-4 py-3">Product</th>
              <th class="px-4 py-3">Amount</th><th class="px-4 py-3">Method</th><th class="px-4 py-3">Status</th>
              <th class="px-4 py-3">Link</th><th class="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody id="ordersTbody">
            ${orders.map((o,i) => `
              <tr class="border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors slide-in" style="animation-delay:${(i+2)*40}ms">
                <td class="px-4 py-3"><span class="text-xs font-mono text-sky-400">${o.id}</span></td>
                <td class="px-4 py-3">
                  <div class="text-sm text-white font-medium">${o.email}</div>
                  <div class="text-[10px] text-slate-600 font-mono">${o.ip} • ${o.country}</div>
                </td>
                <td class="px-4 py-3 text-sm text-slate-300 max-w-[180px] truncate">${o.product}</td>
                <td class="px-4 py-3 text-sm font-bold font-mono text-emerald-400">${fmt$(o.amount)}</td>
                <td class="px-4 py-3"><span class="text-xs font-mono text-slate-400 flex items-center gap-1">${o.method === 'card' ? '<i data-lucide="credit-card" class="w-3 h-3"></i>Card' : o.method === 'paypal' ? '<i data-lucide="paypal" class="w-3 h-3"></i>PayPal' : o.method === 'crypto' ? '<i data-lucide="bitcoin" class="w-3 h-3"></i>Crypto' : '<i data-lucide="smartphone" class="w-3 h-3"></i>bKash'}</span></td>
                <td class="px-4 py-3">
                  <span class="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium ${o.status === 'completed' ? 'bg-emerald-500/15 text-emerald-400' : o.status === 'refunded' ? 'bg-amber-500/15 text-amber-400' : 'bg-red-500/15 text-red-400'}">
                    <i data-lucide="${o.status === 'completed' ? 'check-circle' : o.status === 'refunded' ? 'rotate-ccw' : 'clock'}" class="w-2.5 h-2.5"></i>${o.status}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <button onclick="copyShareLink('${o.id}')" class="p-1.5 rounded-lg text-slate-500 hover:text-sky-400 hover:bg-sky-500/10 transition-colors tooltip" data-tip="Copy shareable link" aria-label="Copy link for order ${o.id}">
                    <i data-lucide="link-2" class="w-4 h-4"></i>
                  </button>
                </td>
                <td class="px-4 py-3">
                  <div class="flex items-center gap-1">
                    ${o.status === 'completed' ? `
                    <button onclick="refundOrder('${o.id}')" class="p-1.5 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors tooltip" data-tip="Issue refund" aria-label="Refund order">
                      <i data-lucide="rotate-ccw" class="w-4 h-4"></i>
                    </button>
                    <button onclick="revokeOrderLink('${o.id}')" class="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors tooltip" data-tip="Revoke access link" aria-label="Revoke link">
                      <i data-lucide="link-2-off" class="w-4 h-4"></i>
                    </button>
                    ` : ''}
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ${orders.length === 0 ? `<div class="py-12 text-center"><i data-lucide="inbox" class="w-8 h-8 text-slate-700 mx-auto mb-2"></i><p class="text-sm text-slate-500">No orders match your filters</p></div>` : ''}
    </div>

    <!-- Access keys mini panel -->
    <div class="mt-6 grid lg:grid-cols-2 gap-6 slide-in" style="animation-delay:320ms">
      <div class="glass rounded-2xl p-5">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-sm font-semibold text-white">Manual Access Keys</h2>
          <button onclick="switchTab('access')" class="text-xs text-sky-400 hover:text-sky-300 transition-colors">Manage all →</button>
        </div>
        <div class="space-y-2">
          ${state.accessKeys.slice(0,3).map(k => `
            <div class="flex items-center gap-3 p-2.5 rounded-xl bg-slate-800/40">
              <i data-lucide="key-round" class="w-4 h-4 text-slate-500 shrink-0"></i>
              <input value="${k.key}" readonly class="flex-1 bg-transparent text-xs font-mono text-slate-400 focus:outline-none" onclick="this.select()" />
              <div class="flex items-center gap-1 shrink-0">
                <span class="text-[10px] font-mono px-1.5 py-0.5 rounded ${k.revoked ? 'bg-red-500/15 text-red-400' : 'bg-emerald-500/15 text-emerald-400'}">${k.revoked ? 'revoked' : k.used + '/' + k.maxUses}</span>
                <button onclick="copyAccessKey('${k.id}')" class="p-1 text-slate-500 hover:text-slate-300 rounded"><i data-lucide="copy" class="w-3 h-3"></i></button>
                <button onclick="revokeAccessKey('${k.id}')" class="p-1 text-slate-500 hover:text-red-400 rounded"><i data-lucide="x-circle" class="w-3 h-3"></i></button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Revenue chart placeholder -->
      <div class="glass rounded-2xl p-5">
        <div class="flex items-center justify-between mb-5">
          <h2 class="text-sm font-semibold text-white">Revenue Trend</h2>
          <span class="text-xs text-emerald-400 font-mono flex items-center gap-1"><i data-lucide="trending-up" class="w-3 h-3"></i>+18.2%</span>
        </div>
        <div class="flex items-end gap-1 h-24" role="img" aria-label="Revenue chart, rising trend over 14 days">
          ${[65,40,45,70,55,80,75,90,85,100,95,110,105,120].map((h,i) => `
            <div class="flex-1 rounded-t transition-all hover:opacity-80" style="height:${h}%; background: linear-gradient(180deg, rgba(16,185,129,0.7), rgba(59,130,246,0.4));"
              title="Day ${i+1}: $${Math.round(h * 8)}" data-tip="Day ${i+1} — $${Math.round(h*8)}"></div>
          `).join('')}
        </div>
        <div class="flex justify-between text-[10px] text-slate-600 font-mono mt-2"><span>14 days ago</span><span>Today</span></div>
      </div>
    </div>
  `;
}

function refundOrder(id) {
  const o = state.orders.find(x => x.id === id);
  if (!o || o.status !== 'completed') return;
  showConfirm(
    `Refund ${o.id}?`,
    `${fmt$(o.amount)} will be refunded to ${o.email}. The download link will be revoked immediately.`,
    'Refund Order', 'warning',
    () => {
      o.status = 'refunded'; o.linkActive = false;
      const ak = state.accessKeys.find(k => k.product === o.product && k.email === o.email);
      if (ak) { ak.revoked = true; }
      state.revenue.total -= o.amount;
      updateHeaderRevenue();
      showToast(`Refunded ${o.id} — link revoked`, 'warning');
      renderMain();
    }
  );
}

function revokeOrderLink(id) {
  const o = state.orders.find(x => x.id === id);
  o.linkActive = false;
  showToast(`Access link revoked for ${o.id}`, 'warning');
  renderMain();
}

function copyShareLink(orderId) {
  const o = state.orders.find(x => x.id === orderId);
  if (!o.linkActive) { showToast('Link is revoked — cannot share', 'error'); return; }
  const url = `https://${state.settings.storeUrl}/dl/${orderId}`;
  navigator.clipboard.writeText(url).then(() => showToast(`Link copied: ${url}`, 'success'));
}

function copyAccessKey(keyId) {
  const k = state.accessKeys.find(x => x.id === keyId);
  if (k.revoked) { showToast('This key is revoked', 'error'); return; }
  navigator.clipboard.writeText(k.key).then(() => showToast('Access key copied to clipboard', 'success'));
}

function revokeAccessKey(keyId) {
  const k = state.accessKeys.find(x => x.id === keyId);
  showConfirm(
    `Revoke access key?`,
    `Download access for ${k.product} (${k.email}) will be blocked immediately. This cannot be undone.`,
    'Revoke Key', 'danger',
    () => { k.revoked = true; showToast('Access key revoked', 'warning'); renderMain(); }
  );
}

function openCreateKeyModal() {
  openModal(`
    <div class="space-y-4">
      <div class="flex items-start gap-3">
        <div class="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center shrink-0"><i data-lucide="key-round" class="w-5 h-5"></i></div>
        <div><h2 class="text-base font-bold text-white">Generate Access Key</h2><p class="text-xs text-slate-500">Manually grant download access to a customer</p></div>
      </div>
      <div>
        <label class="block text-xs font-mono text-slate-500 uppercase tracking-wider mb-1.5" for="ckEmail">Customer Email</label>
        <input id="ckEmail" type="email" placeholder="customer@example.com" autocomplete="off" spellcheck="false" class="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition" />
      </div>
      <div>
        <label class="block text-xs font-mono text-slate-500 uppercase tracking-wider mb-1.5" for="ckProduct">Product</label>
        <select id="ckProduct" class="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition">
          <option value="" disabled selected>Select a product…</option>
          ${state.products.filter(p => p.price > 0).map(p => `<option value="${p.id}">${p.title} — ${fmt$(p.price)}</option>`).join('')}
        </select>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-mono text-slate-500 uppercase tracking-wider mb-1.5" for="ckMaxUses">Max Uses</label>
          <input id="ckMaxUses" type="number" min="1" value="3" class="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition" />
        </div>
        <div>
          <label class="block text-xs font-mono text-slate-500 uppercase tracking-wider mb-1.5" for="ckExpiry">Expires (days)</label>
          <input id="ckExpiry" type="number" min="1" value="30" class="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition" />
        </div>
      </div>
      <div class="flex items-center gap-2 bg-sky-500/10 border border-sky-500/20 rounded-xl p-3">
        <i data-lucide="info" class="w-4 h-4 text-sky-400 shrink-0"></i>
        <p class="text-xs text-sky-300">Keys bypass payment entirely. Use only for support / manual comping.</p>
      </div>
      <div class="flex gap-2">
        <button onclick="generateAccessKey()" class="flex-1 bg-emerald-500 text-slate-950 rounded-xl py-2.5 text-sm font-semibold hover:bg-emerald-400 transition-colors flex items-center justify-center gap-2">
          <i data-lucide="sparkles" class="w-4 h-4"></i> Generate Key
        </button>
      </div>
    </div>
  `, 'Generate Access Key');
}

function generateAccessKey() {
  const email = $('#ckEmail').value.trim();
  const productId = $('#ckProduct').value;
  if (!email || !productId) { showToast('Email and product are required', 'error'); return; }
  const p = state.products.find(x => x.id === productId);
  const chars = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  let key = 'LC-';
  for (let g = 0; g < 5; g++) {
    for (let i = 0; i < 4; i++) key += chars[Math.floor(Math.random() * chars.length)];
    if (g < 4) key += '-';
  }
  const expiry = new Date(Date.now() + parseInt($('#ckExpiry').value || 30) * 86400000);
  const k = { id: uid(), key, product: p.title, email, created: 'just now', expires: expiry.toLocaleDateString('en-US', {month:'short',day:'numeric',year:'numeric'}), revoked: false, maxUses: parseInt($('#ckMaxUses').value) || 3, used: 0 };
  state.accessKeys.unshift(k);
  closeModal();
  showToast(`Access key generated for ${email}`, 'success');
  renderMain();
}

// ══ 5. ACCESS KEYS & LINKS ════════════════════════════
function renderAccess(el) {
  const active = state.accessKeys.filter(k => !k.revoked).length;
  const revoked = state.accessKeys.filter(k => k.revoked).length;
  const used = state.accessKeys.reduce((s,k) => s + k.used, 0);

  el.innerHTML = `
    <div class="flex items-start justify-between mb-6 slide-in">
      <div>
        <h1 class="text-xl font-bold text-white tracking-tight">Access Keys & Download Links</h1>
        <p class="text-sm text-slate-500 mt-1">Manual access grants & secure download link management</p>
      </div>
      <button onclick="openCreateKeyModal()" class="flex items-center gap-2 bg-emerald-500 text-slate-950 rounded-xl px-4 py-2 text-sm font-semibold hover:bg-emerald-400 transition-colors glow-emerald">
        <i data-lucide="plus" class="w-4 h-4"></i> Generate Key
      </button>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-3 gap-4 mb-6">
      ${[
        { label: 'Active Keys', value: active, icon: 'key-round', color: 'emerald' },
        { label: 'Revoked', value: revoked, icon: 'x-circle', color: 'red' },
        { label: 'Total Uses', value: used, icon: 'hash', color: 'sky' },
      ].map((s,i) => `
        <div class="glass rounded-2xl p-4 flex items-center gap-3 slide-in" style="animation-delay:${i*60}ms">
          <div class="w-9 h-9 rounded-xl bg-${s.color}-500/10 text-${s.color}-400 flex items-center justify-center shrink-0"><i data-lucide="${s.icon}" class="w-5 h-5"></i></div>
          <div><div class="text-xl font-bold text-white font-mono">${s.value}</div><div class="text-xs text-slate-500">${s.label}</div></div>
        </div>
      `).join('')}
    </div>

    <!-- Key generator -->
    <div class="glass rounded-2xl p-5 mb-6 slide-in" style="animation-delay:120ms">
      <h2 class="text-sm font-semibold text-white mb-4">Quick Key Generator</h2>
      <div class="flex flex-col sm:flex-row gap-3">
        <input id="qkEmail" type="email" placeholder="Customer email…" autocomplete="off" spellcheck="false" class="flex-1 bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 transition" />
        <select id="qkProduct" class="bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition min-w-[200px]">
          <option value="" disabled selected>Select product…</option>
          ${state.products.filter(p => !p.unlisted).map(p => `<option value="${p.id}">${p.title}</option>`).join('')}
        </select>
        <button onclick="quickGenerateKey()" class="bg-emerald-500 text-slate-950 rounded-xl px-4 py-2 text-sm font-semibold hover:bg-emerald-400 transition-colors flex items-center gap-2 whitespace-nowrap glow-emerald">
          <i data-lucide="zap" class="w-4 h-4"></i> Generate
        </button>
      </div>
    </div>

    <!-- Keys table -->
    <div class="glass rounded-2xl overflow-hidden slide-in" style="animation-delay:180ms">
      <div class="overflow-x-auto">
        <table class="w-full" style="min-width:720px">
          <thead>
            <tr class="text-left text-[10px] font-mono uppercase tracking-widest text-slate-600 border-b border-slate-800">
              <th class="px-4 py-3">Key</th><th class="px-4 py-3">Product</th><th class="px-4 py-3">Customer</th>
              <th class="px-4 py-3">Uses</th><th class="px-4 py-3">Expires</th><th class="px-4 py-3">Status</th><th class="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            ${state.accessKeys.map((k,i) => `
              <tr class="border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors ${k.revoked ? 'opacity-50' : ''} slide-in" style="animation-delay:${(i+2)*40}ms">
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2">
                    <code class="text-xs font-mono text-sky-400 bg-sky-500/10 px-2 py-1 rounded">${k.key.slice(0,20)}…</code>
                    <button onclick="copyAccessKey('${k.id}')" class="p-1 text-slate-600 hover:text-slate-300 rounded transition-colors" aria-label="Copy full key"><i data-lucide="copy" class="w-3 h-3"></i></button>
                  </div>
                </td>
                <td class="px-4 py-3 text-sm text-slate-300 max-w-[160px] truncate">${k.product}</td>
                <td class="px-4 py-3 text-xs text-slate-400 font-mono truncate">${k.email}</td>
                <td class="px-4 py-3 text-xs font-mono text-slate-400">${k.used} / ${k.maxUses}</td>
                <td class="px-4 py-3 text-xs text-slate-400 font-mono">${k.expires}</td>
                <td class="px-4 py-3">
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${k.revoked ? 'bg-red-500/12 text-red-400' : k.used >= k.maxUses ? 'bg-amber-500/12 text-amber-400' : 'bg-emerald-500/12 text-emerald-400'}">
                    <i data-lucide="${k.revoked ? 'x-circle' : k.used >= k.maxUses ? 'clock' : 'check-circle'}" class="w-2 h-2"></i>${k.revoked ? 'revoked' : k.used >= k.maxUses ? 'exhausted' : 'active'}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <div class="flex items-center gap-1 justify-end">
                    ${!k.revoked ? `<button onclick="extendAccessKey('${k.id}')" class="p-1.5 text-slate-500 hover:text-sky-400 hover:bg-sky-500/10 rounded-lg transition-colors tooltip" data-tip="Extend by 7 days" aria-label="Extend access key">
                      <i data-lucide="calendar-plus" class="w-3.5 h-3.5"></i>
                    </button>` : ''}
                    ${!k.revoked ? `<button onclick="revokeAccessKey('${k.id}')" class="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors tooltip" data-tip="Revoke key instantly" aria-label="Revoke access key">
                      <i data-lucide="link-2-off" class="w-3.5 h-3.5"></i>
                    </button>` : ''}
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- How it works -->
    <div class="mt-6 grid sm:grid-cols-3 gap-4 slide-in" style="animation-delay:300ms">
      ${[
        { icon: 'shield', title: 'One-Time Links', desc: 'Generated links work once and expire after the configured period.', color: 'emerald' },
        { icon: 'fingerprint', title: 'IP Binding', desc: 'Optionally bind links to the customer\'s first IP for extra security.', color: 'sky' },
        { icon: 'gauge', title: 'Speed Throttle', desc: 'Limit download speed to prevent bandwidth abuse (configurable).', color: 'indigo' },
      ].map((f,i) => `
        <div class="glass rounded-2xl p-4 slide-in" style="animation-delay:${(i+4)*60}ms">
          <div class="w-8 h-8 rounded-xl bg-${f.color}-500/10 text-${f.color}-400 flex items-center justify-center mb-3"><i data-lucide="${f.icon}" class="w-4 h-4"></i></div>
          <div class="text-sm font-semibold text-white mb-1">${f.title}</div>
          <div class="text-xs text-slate-500 leading-relaxed">${f.desc}</div>
        </div>
      `).join('')}
    </div>
  `;
}

function extendAccessKey(keyId) {
  const k = state.accessKeys.find(x => x.id === keyId);
  const d = new Date(k.expires);
  d.setDate(d.getDate() + 7);
  k.expires = d.toLocaleDateString('en-US', {month:'short',day:'numeric',year:'numeric'});
  showToast(`Extended "${k.key.slice(0,16)}…" by 7 days`, 'success');
  renderMain();
}

function quickGenerateKey() {
  const email = $('#qkEmail').value.trim();
  const productId = $('#qkProduct').value;
  if (!email || !productId) { showToast('Enter email and select a product', 'error'); return; }
  const p = state.products.find(x => x.id === productId);
  const chars = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  let key = 'LC-';
  for (let g = 0; g < 5; g++) { for (let i = 0; i < 4; i++) key += chars[Math.floor(Math.random()*chars.length)]; if (g < 4) key += '-'; }
  state.accessKeys.unshift({ id: uid(), key, product: p.title, email, created: 'just now', expires: new Date(Date.now()+30*86400000).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}), revoked: false, maxUses: 3, used: 0 });
  $('#qkEmail').value = ''; $('#qkProduct').value = '';
  showToast(`Key generated for ${email}`, 'success');
  renderMain();
}

// ══ 6. STORE SETTINGS ════════════════════════════════
function renderSettings(el) {
  el.innerHTML = `
    <div class="slide-in">
      <div class="mb-6">
        <h1 class="text-xl font-bold text-white tracking-tight">Store Settings</h1>
        <p class="text-sm text-slate-500 mt-1">Configure storage, payments, and link security</p>
      </div>

      <div class="space-y-6 max-w-3xl">
        <!-- Store identity -->
        <div class="glass rounded-2xl p-6">
          <h2 class="text-sm font-semibold text-white mb-1 flex items-center gap-2"><i data-lucide="store" class="w-4 h-4 text-emerald-400"></i>Store Identity</h2>
          <p class="text-xs text-slate-500 mb-5">Your storefront name and public URL.</p>
          <div class="grid sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-mono text-slate-500 uppercase tracking-wider mb-1.5" for="stStoreName">Store Name</label>
              <input id="stStoreName" value="${state.settings.storeName}" class="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition" />
            </div>
            <div>
              <label class="block text-xs font-mono text-slate-500 uppercase tracking-wider mb-1.5" for="stStoreUrl">Store URL</label>
              <div class="flex items-center bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden">
                <span class="px-3 text-slate-500 text-sm font-mono border-r border-slate-700">https://</span>
                <input id="stStoreUrl" value="${state.settings.storeUrl}" class="flex-1 bg-transparent px-3 py-2.5 text-sm text-white focus:outline-none" spellcheck="false" />
              </div>
            </div>
          </div>
        </div>

        <!-- Storage provider -->
        <div class="glass rounded-2xl p-6">
          <h2 class="text-sm font-semibold text-white mb-1 flex items-center gap-2"><i data-lucide="database" class="w-4 h-4 text-sky-400"></i>Storage Provider</h2>
          <p class="text-xs text-slate-500 mb-5">Where your files are physically stored. Switching requires migration.</p>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
            ${[
              { id: 'r2', name: 'Cloudflare R2', icon: 'cloud', desc: 'S3-compatible, zero egress fees', status: 'Active' },
              { id: 's3', name: 'AWS S3', icon: 'server', desc: 'Standard S3, regional buckets', status: null },
              { id: 'local', name: 'Local Disk', icon: 'hard-drive-download', desc: 'On-premises storage', status: null },
            ].map(p => `
              <button onclick="setProvider('${p.id}')" class="p-4 rounded-xl border text-left transition-all ${state.settings.provider === p.id ? 'bg-emerald-500/10 border-emerald-500/40 glow-emerald' : 'bg-slate-800/40 border-slate-700/50 hover:border-slate-600'}">
                <div class="flex items-center justify-between mb-2">
                  <i data-lucide="${p.icon}" class="w-5 h-5 ${state.settings.provider === p.id ? 'text-emerald-400' : 'text-slate-500'}"></i>
                  ${state.settings.provider === p.id ? '<span class="text-[10px] font-mono text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full">ACTIVE</span>' : ''}
                </div>
                <div class="text-sm font-semibold text-white">${p.name}</div>
                <div class="text-xs text-slate-500 mt-0.5 leading-relaxed">${p.desc}</div>
              </button>
            `).join('')}
          </div>
          <div class="mt-4 flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
            <i data-lucide="info" class="w-4 h-4 text-amber-400 shrink-0"></i>
            <p class="text-xs text-amber-300">Currently synced with <strong>${state.settings.provider === 'r2' ? 'Cloudflare R2' : state.settings.provider.toUpperCase()}</strong> — 420 GB used.</p>
          </div>
        </div>

        <!-- Payment gateway -->
        <div class="glass rounded-2xl p-6">
          <h2 class="text-sm font-semibold text-white mb-1 flex items-center gap-2"><i data-lucide="credit-card" class="w-4 h-4 text-indigo-400"></i>Payment Gateway</h2>
          <p class="text-xs text-slate-500 mb-5">Configure payment processors for your store.</p>
          <div class="space-y-4">
            <div class="rounded-xl border border-slate-700/50 overflow-hidden">
              <div class="flex items-center gap-3 px-4 py-3 bg-slate-800/40 border-b border-slate-700/50">
                <div class="w-8 h-8 rounded-lg bg-violet-500/15 flex items-center justify-center"><span class="text-base">S</span></div>
                <div class="flex-1">
                  <div class="text-sm font-medium text-white">Stripe</div>
                  <div class="text-xs text-slate-500">Cards, Apple Pay, Google Pay</div>
                </div>
                <span class="text-[10px] font-mono ${state.settings.stripeKey ? 'bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full' : 'bg-slate-700/40 text-slate-500 px-2 py-0.5 rounded-full'}">${state.settings.stripeKey ? 'CONNECTED' : 'NOT SET'}</span>
              </div>
              <div class="p-4">
                <label class="block text-xs font-mono text-slate-500 uppercase tracking-wider mb-1.5" for="stStripe">Secret Key</label>
                <div class="flex gap-2">
                  <input id="stStripe" type="password" placeholder="sk_live_…" value="${state.settings.stripeKey}" class="flex-1 bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-emerald-500/50 transition" />
                  <button onclick="togglePasswordVis('stStripe')" class="px-3 bg-slate-800/60 border border-slate-700 rounded-xl text-slate-400 hover:text-white transition-colors" aria-label="Toggle password visibility"><i data-lucide="eye" class="w-4 h-4"></i></button>
                </div>
              </div>
            </div>
            <div class="rounded-xl border border-slate-700/50 overflow-hidden">
              <div class="flex items-center gap-3 px-4 py-3 bg-slate-800/40 border-b border-slate-700/50">
                <div class="w-8 h-8 rounded-lg bg-sky-500/15 flex items-center justify-center"><span class="text-base">P</span></div>
                <div class="flex-1">
                  <div class="text-sm font-medium text-white">PayPal</div>
                  <div class="text-xs text-slate-500">In-browser checkout</div>
                </div>
                <span class="text-[10px] font-mono ${state.settings.paypalClientId ? 'bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full' : 'bg-slate-700/40 text-slate-500 px-2 py-0.5 rounded-full'}">${state.settings.paypalClientId ? 'CONNECTED' : 'NOT SET'}</span>
              </div>
              <div class="p-4">
                <label class="block text-xs font-mono text-slate-500 uppercase tracking-wider mb-1.5" for="stPaypal">Client ID</label>
                <input id="stPaypal" placeholder="AeA1QIZXiflr1_…" value="${state.settings.paypalClientId}" class="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-emerald-500/50 transition" />
              </div>
            </div>
            <div class="rounded-xl border border-slate-700/50 overflow-hidden">
              <div class="flex items-center gap-3 px-4 py-3 bg-slate-800/40 border-b border-slate-700/50">
                <div class="w-8 h-8 rounded-lg bg-rose-500/15 flex items-center justify-center"><span class="text-base">b</span></div>
                <div class="flex-1">
                  <div class="text-sm font-medium text-white">bKash / Nagad (BD)</div>
                  <div class="text-xs text-slate-500">Mobile payments for South Asia</div>
                </div>
                <span class="text-[10px] font-mono ${state.settings.bkashKey ? 'bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full' : 'bg-slate-700/40 text-slate-500 px-2 py-0.5 rounded-full'}">${state.settings.bkashKey ? 'CONNECTED' : 'NOT SET'}</span>
              </div>
              <div class="p-4">
                <label class="block text-xs font-mono text-slate-500 uppercase tracking-wider mb-1.5" for="stBkash">API Key</label>
                <input id="stBkash" placeholder="bkash-…" value="${state.settings.bkashKey}" class="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-emerald-500/50 transition" />
              </div>
            </div>
          </div>
        </div>

        <!-- Security -->
        <div class="glass rounded-2xl p-6">
          <h2 class="text-sm font-semibold text-white mb-1 flex items-center gap-2"><i data-lucide="shield" class="w-4 h-4 text-red-400"></i>Link Security</h2>
          <p class="text-xs text-slate-500 mb-5">Controls how download links behave.</p>
          <div class="space-y-3">
            ${[
              { key: 'ipBinding', label: 'IP Binding', desc: 'Links are tied to the customer\'s first IP address' },
              { key: 'speedLimit', label: 'Download Throttling', desc: 'Limit download speed to prevent bandwidth abuse' },
              { key: 'passwordProtectLinks', label: 'Password Protection', desc: 'Require order email verification before download' },
            ].map(s => `
              <div class="flex items-center justify-between bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
                <div>
                  <div class="text-sm font-medium text-white">${s.label}</div>
                  <div class="text-xs text-slate-500 mt-0.5">${s.desc}</div>
                </div>
                <button onclick="toggleSetting('${s.key}',this)" data-key="${s.key}" class="w-11 h-6 rounded-full transition-all relative ${state.settings[s.key] ? 'bg-emerald-500' : 'bg-slate-700'}" role="switch" aria-checked="${state.settings[s.key]}" aria-label="${s.label}">
                  <span class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${state.settings[s.key] ? 'translate-x-5' : ''}"></span>
                </button>
              </div>
            `).join('')}
            <div id="speedLimitRow" class="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 ${state.settings.speedLimit ? '' : 'opacity-50 pointer-events-none'}">
              <div class="flex items-center justify-between mb-2">
                <div>
                  <div class="text-sm font-medium text-white">Throttle Speed</div>
                  <div class="text-xs text-slate-500">Max download speed per connection</div>
                </div>
                <span class="text-sm font-mono text-emerald-400" id="speedValue">${fmtSize(state.settings.speedLimitKbps * 1024)}/s</span>
              </div>
              <input type="range" min="128" max="10240" step="128" value="${state.settings.speedLimitKbps}" 
                oninput="state.settings.speedLimitKbps=parseInt(this.value); $('#speedValue').textContent=fmtSize(this.value*1024)+'/s'"
                class="w-full" aria-label="Download throttle speed" />
              <div class="flex justify-between text-[9px] text-slate-600 font-mono mt-1"><span>128 KB/s</span><span>10 MB/s</span></div>
            </div>
            <div class="flex items-center justify-between bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
              <div>
                <div class="text-sm font-medium text-white">Default Link Expiry</div>
                <div class="text-xs text-slate-500 mt-0.5">Auto-expire download links after this many hours</div>
              </div>
              <div class="flex items-center gap-2">
                <input type="number" min="1" max="720" value="${state.settings.linkExpiryHours}" 
                  onchange="state.settings.linkExpiryHours=parseInt(this.value)"
                  class="w-20 bg-slate-800/60 border border-slate-700 rounded-lg px-2 py-1.5 text-sm text-white text-center font-mono focus:outline-none focus:border-emerald-500/50 transition" aria-label="Link expiry hours" />
                <span class="text-xs text-slate-500 font-mono">hrs</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Danger zone -->
        <div class="glass rounded-2xl p-6 border-red-900/30" style="border-color:rgba(127,29,29,0.3)">
          <h2 class="text-sm font-semibold text-red-400 mb-1 flex items-center gap-2"><i data-lucide="alert-triangle" class="w-4 h-4"></i>Danger Zone</h2>
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-sm font-medium text-white">Export All Data</div>
                <div class="text-xs text-slate-500">Download a ZIP of all configs, orders, and metadata</div>
              </div>
              <button onclick="showToast('Preparing export…','info'); setTimeout(()=>showToast('Export ready (simulated)','success'), 2000)" class="text-xs bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-300 hover:text-white hover:border-slate-500 transition-colors">Export</button>
            </div>
            <div class="border-t border-slate-800 pt-3 flex items-center justify-between">
              <div>
                <div class="text-sm font-medium text-red-400">Reset All Data</div>
                <div class="text-xs text-slate-500">Permanently deletes all files, orders, and settings</div>
              </div>
              <button onclick="showConfirm('Reset Everything?','This permanently wipes all files, orders, products, keys, and settings. This cannot be undone.','Reset Everything','danger', ()=>{ state.files=[]; state.products=[]; state.orders=[]; state.accessKeys=[]; state.updateHeaderRevenue=()=>{}; updateSidebarStorage(); showToast('All data wiped','error'); renderMain(); })" class="text-xs bg-red-900/30 border border-red-800/50 rounded-lg px-3 py-2 text-red-400 hover:bg-red-900/50 transition-colors">Reset</button>
            </div>
          </div>
        </div>

        <div class="flex gap-3 pb-6">
          <button onclick="saveSettings()" class="flex-1 bg-emerald-500 text-slate-950 rounded-xl py-3 text-sm font-semibold hover:bg-emerald-400 transition-colors glow-emerald flex items-center justify-center gap-2">
            <i data-lucide="check" class="w-4 h-4"></i> Save Changes
          </button>
          <button onclick="resetSettings()" class="bg-slate-800/60 border border-slate-700/50 rounded-xl px-6 py-3 text-sm text-slate-300 hover:text-white transition-colors">Reset</button>
        </div>
      </div>
    </div>
  `;
}

function setProvider(id) {
  state.settings.provider = id;
  renderMain();
  showToast(`Storage provider set to ${id === 'r2' ? 'Cloudflare R2' : id === 's3' ? 'AWS S3' : 'Local Disk'}`, 'success');
}

function togglePasswordVis(inputId) { const el = $('#'+inputId); el.type = el.type === 'password' ? 'text' : 'password'; }

function toggleSetting(key, btn) {
  state.settings[key] = !state.settings[key];
  const on = state.settings[key];
  btn.className = `w-11 h-6 rounded-full transition-all relative ${on ? 'bg-emerald-500' : 'bg-slate-700'}`;
  btn.querySelector('span').style.transform = on ? 'translateX(20px)' : '';
  btn.setAttribute('aria-checked', on);
  if (key === 'speedLimit') { const row = $('#speedLimitRow'); if (row) row.classList.toggle('opacity-50', !on); row.classList.toggle('pointer-events-none', !on); }
  showToast(`${key.replace(/[A-Z]/g, c => ' '+c.toLowerCase()).replace(/^./, c=>c.toUpperCase())} ${on ? 'enabled' : 'disabled'}`, 'success');
}

function saveSettings() {
  state.settings.storeName = $('#stStoreName').value.trim() || state.settings.storeName;
  state.settings.storeUrl = $('#stStoreUrl').value.trim() || state.settings.storeUrl;
  state.settings.stripeKey = $('#stStripe').value.trim();
  state.settings.paypalClientId = $('#stPaypal').value.trim();
  state.settings.bkashKey = $('#stBkash').value.trim();
  showToast('Settings saved', 'success');
}

function resetSettings() {
  showConfirm('Reset Settings?','Returns all settings to defaults without affecting your files or orders.','Reset','warning', () => {
    state.settings = { provider:'r2', stripeKey:'', paypalClientId:'', bkashKey:'', ipBinding:false, speedLimit:true, speedLimitKbps:2048, passwordProtectLinks:true, linkExpiryHours:24, storeName:'Lazy Cloud Store', storeUrl:'lazycloud.vercel.app' };
    showToast('Settings reset to defaults','success');
    renderMain();
  });
}

// ══ 7. STORE FRONT PREVIEW MODE ═══════════════════════
function toggleStorePreview() {
  state.buyerView = !state.buyerView;
  const root = $('#storePreviewRoot');
  if (state.buyerView) {
    renderStorePreview(root);
    root.innerHTML = root.innerHTML; // re-render icons
    if (typeof lucide !== 'undefined') lucide.createIcons();
    document.body.style.overflow = 'hidden';
    $('#storePreviewBtn').innerHTML = '<i data-lucide="x" class="w-4 h-4"></i><span class="hidden sm:inline text-sm font-medium text-sky-400">Exit</span>';
    $('#storePreviewBtn').setAttribute('data-tip', 'Exit Store');
  } else {
    root.innerHTML = '';
    document.body.style.overflow = '';
    $('#storePreviewBtn').innerHTML = '<i data-lucide="store" class="w-4 h-4 text-sky-400"></i><span class="hidden sm:inline text-sm font-medium text-sky-400">Store</span>';
    $('#storePreviewBtn').setAttribute('data-tip', 'View Store');
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
}

function renderStorePreview(root) {
  const featured = state.products.filter(p => p.featured && !p.unlisted);
  const all = state.products.filter(p => !p.unlisted);
  const categories = [...new Set(all.map(p => p.category))];

  root.innerHTML = `
    <!-- FULLSCREEN STORE -->
    <div class="fixed inset-0 z-[60] bg-slate-950 overflow-y-auto fade-in">
      <!-- Store header -->
      <header class="sticky top-0 z-10 glass-strong border-b border-slate-800 px-6 py-4 flex items-center gap-4">
        <div class="flex items-center gap-2">
          <img src="../favicon.svg" alt="Lazy Cloud" class="w-7 h-7" onerror="this.src='../logo.svg'" />
          <span class="font-bold text-white">${state.settings.storeName}</span>
        </div>
        <div class="ml-auto flex items-center gap-3">
          <span class="text-xs text-emerald-400 font-mono flex items-center gap-1"><i data-lucide="shield-check" class="w-3.5 h-3.5"></i> Secure downloads</span>
          <span class="text-xs text-slate-500 font-mono">${all.length} products</span>
          <button onclick="toggleStorePreview()" class="flex items-center gap-2 bg-rose-500/10 border border-rose-500/25 rounded-xl px-3 py-2 text-sm text-rose-400 hover:bg-rose-500/15 transition-colors">
            <i data-lucide="x" class="w-4 h-4"></i> Exit Preview
          </button>
        </div>
      </header>

      <!-- Hero -->
      <div class="relative px-6 py-16 text-center overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-b from-emerald-900/15 via-transparent to-transparent"></div>
        <div class="relative max-w-2xl mx-auto slide-in">
          <div class="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-mono px-3 py-1.5 rounded-full mb-4">
            <i data-lucide="zap" class="w-3 h-3"></i> Instant delivery
          </div>
          <h1 class="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-3">Digital Assets<br/>Built for Developers</h1>
          <p class="text-slate-400 text-sm max-w-md mx-auto">Premium source code, design assets, e-books, and courses — delivered instantly with secure one-time download links.</p>
        </div>
      </div>

      <!-- Featured products -->
      ${featured.length > 0 ? `
        <div class="max-w-5xl mx-auto px-6 pb-4">
          <div class="flex items-center gap-2 mb-5">
            <i data-lucide="star" class="w-4 h-4 text-amber-400 fill-amber-400"></i>
            <h2 class="text-sm font-semibold text-white">Featured</h2>
          </div>
          <div class="grid sm:grid-cols-2 gap-4 mb-10">
            ${featured.map((p,i) => {
              const f = state.files.find(x => x.id === p.fileId);
              const discount = p.compareAt > p.price ? Math.round((1-p.price/p.compareAt)*100) : 0;
              return `
              <div class="glass rounded-2xl overflow-hidden slide-in hover:border-emerald-500/30 transition-all group cursor-pointer" style="animation-delay:${i*80}ms">
                <div class="h-1.5 bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-500"></div>
                <div class="p-5">
                  <div class="flex items-start gap-4 mb-4">
                    <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-indigo-500/20 border border-emerald-500/20 flex items-center justify-center shrink-0">
                      <i data-lucide="${p.icon}" class="w-6 h-6 text-emerald-400"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 flex-wrap mb-1">
                        <span class="text-[10px] font-mono text-slate-500 bg-slate-800/50 px-2 py-0.5 rounded-full">${p.category}</span>
                        <span class="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full flex items-center gap-0.5"><i data-lucide="star" class="w-2 h-2 fill-amber-400"></i>FEATURED</span>
                      </div>
                      <h3 class="font-semibold text-white text-base">${p.title}</h3>
                      <p class="text-xs text-slate-500 mt-1 line-clamp-2">${p.description}</p>
                    </div>
                  </div>
                  <div class="flex items-center justify-between">
                    <div>
                      <div class="flex items-baseline gap-2">
                        <span class="text-2xl font-bold text-white font-mono">${p.price === 0 ? 'Free' : fmt$(p.price)}</span>
                        ${discount > 0 ? `<span class="text-sm text-slate-500 line-through font-mono">${fmt$(p.compareAt)}</span><span class="text-[10px] font-bold text-red-400 bg-red-500/15 px-1.5 py-0.5 rounded-full">-${discount}%</span>` : ''}
                      </div>
                      <div class="text-[10px] text-slate-500 font-mono mt-0.5">${fmtNum(p.sales)} downloads</div>
                    </div>
                    <button onclick="simulateCheckout('${p.id}')" class="bg-emerald-500 text-slate-950 rounded-xl px-5 py-2.5 text-sm font-bold hover:bg-emerald-400 transition-colors glow-emerald flex items-center gap-2" aria-label="Buy ${p.title}">
                      ${p.price === 0 ? '<i data-lucide="download" class="w-4 h-4"></i>Free Download' : '<i data-lucide="shopping-cart" class="w-4 h-4"></i>Buy Now'}
                    </button>
                  </div>
                </div>
              </div>`;
            }).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Categories -->
      <div class="max-w-5xl mx-auto px-6 pb-4">
        <div class="flex items-center gap-2 overflow-x-auto pb-2 mb-4 no-scrollbar">
          ${['all', ...categories].map(c => `
            <button onclick="state.storePreviewFilter='${c}'; renderStorePreview(document.getElementById('storePreviewRoot')); setTimeout(()=>lucide.createIcons(),50)" class="px-4 py-2 rounded-xl text-xs font-medium border whitespace-nowrap transition-colors ${c === 'all' ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:text-slate-300'}">
              ${c === 'all' ? 'All' : c}
            </button>
          `).join('')}
        </div>
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4" id="storeProducts">
          ${all.filter(p => !state.storePreviewFilter || state.storePreviewFilter === 'all' || p.category === state.storePreviewFilter).map((p,i) => {
            const f = state.files.find(x => x.id === p.fileId);
            const discount = p.compareAt > p.price ? Math.round((1-p.price/p.compareAt)*100) : 0;
  return `
            <div class="glass rounded-2xl p-4 hover:border-slate-600 transition-all slide-in group cursor-pointer" style="animation-delay:${i*50}ms" onclick="openProductDetail('${p.id}')">
              <div class="w-full h-40 rounded-xl mb-4 bg-gradient-to-br ${['from-emerald-900/40 to-slate-800','from-sky-900/40 to-slate-800','from-indigo-900/40 to-slate-800','from-rose-900/40 to-slate-800','from-violet-900/40 to-slate-800','from-amber-900/40 to-slate-800'][i%6]} flex items-center justify-center relative overflow-hidden">
                <div class="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent"></div>
                <i data-lucide="${p.icon}" class="w-10 h-10 text-white/30"></i>
                ${discount > 0 ? `<div class="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">-${discount}%</div>` : ''}
                <div class="absolute bottom-2 right-2 text-[10px] font-mono text-white/50">${f ? fmtSize(f.sizeBytes) : ''}</div>
              </div>
              <h3 class="font-semibold text-white text-sm mb-1 group-hover:text-emerald-400 transition-colors">${p.title}</h3>
              <p class="text-xs text-slate-500 line-clamp-2 mb-3">${p.description}</p>
              <div class="flex items-center justify-between">
                <div>
                  <span class="text-lg font-bold text-white font-mono">${p.price === 0 ? 'Free' : fmt$(p.price)}</span>
                  ${discount > 0 ? `<span class="text-xs text-slate-500 line-through font-mono ml-1">${fmt$(p.compareAt)}</span>` : ''}
                </div>
                <span class="text-[10px] text-slate-500 font-mono">${fmtNum(p.sales)} sales</span>
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>

      <!-- Trust bar -->
      <div class="max-w-5xl mx-auto px-6 py-8 grid grid-cols-3 gap-4 border-t border-slate-800/60 mt-4">
        ${[
          { icon: 'shield-check', title: 'Secure Downloads', desc: 'One-time links, IP binding available' },
          { icon: 'zap', title: 'Instant Delivery', desc: 'Files available seconds after payment' },
          { icon: 'refresh-ccw', title: 'Lifetime Access', desc: 'Re-download anytime with access keys' },
        ].map((f,i) => `
          <div class="text-center py-4 px-2 rounded-xl glass slide-in" style="animation-delay:${i*60}ms">
            <i data-lucide="${f.icon}" class="w-6 h-6 text-emerald-400 mx-auto mb-2"></i>
            <div class="text-xs font-semibold text-white">${f.title}</div>
            <div class="text-[10px] text-slate-500 mt-0.5">${f.desc}</div>
          </div>
        `).join('')}
      </div>

      <!-- Footer -->
      <div class="max-w-5xl mx-auto px-6 py-6 text-center text-xs text-slate-600 border-t border-slate-800/60 mt-2">
        <div class="flex items-center justify-center gap-4">
          <a href="#" class="hover:text-slate-400 transition-colors">Terms</a>
          <a href="#" class="hover:text-slate-400 transition-colors">Privacy</a>
          <a href="#" class="hover:text-slate-400 transition-colors">Refund Policy</a>
          <a href="#" class="hover:text-slate-400 transition-colors">Support</a>
        </div>
        <p class="mt-2 font-mono">© 2025 ${state.settings.storeName} • Secure checkout by Stripe</p>
      </div>
    </div>
  `;
}

// Quick product sello checkout
function simulateCheckout(productId) {
  const p = state.products.find(x => x.id === productId);
  if (p.price === 0) { showToast(`Free download started for "${p.title}"`, 'success'); return; }
  showConfirm(
    `Buy "${p.title}"?`,
    `Price: ${fmt$(p.price)}${p.compareAt > p.price ? ` (was ${fmt$(p.compareAt)})` : ''}. Instant download link via email after payment.`,
    'Simulate Purchase', 'custom',
    () => {
      const order = { id: 'ORD-' + Math.floor(1000+Math.random()*9000), email: 'customer@example.io', product: p.title, amount: p.price, method: 'card', status: 'completed', date: 'just now', linkActive: true, ip: '103.42.77.200', country: 'XX' };
      state.orders.unshift(order);
      p.sales++;
      state.revenue.total += p.price;
      state.revenue.week += p.price;
      updateHeaderRevenue();
      showToast(`Purchase simulated — ORD created for ${p.title}`, 'success');
      renderStorePreview(document.getElementById('storePreviewRoot'));
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }
  );
}

// ══ MODAL SYSTEM ════════════════════════════════════════
function openModal(html, title = '') {
  const root = $('#modalRoot');
  root.innerHTML = `
    <div class="fixed inset-0 z-[80] flex items-center justify-center p-4 fade-in" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
      <div class="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onclick="closeModal()" style="overscroll-behavior:contain"></div>
      <div class="relative glass-strong rounded-2xl w-full max-w-lg shadow-2xl slide-in" style="overscroll-behavior:contain">
        ${title ? `
          <div class="flex items-center justify-between px-6 py-4 border-b border-slate-800">
            <h2 id="modalTitle" class="text-base font-bold text-white">${title}</h2>
            <button onclick="closeModal()" class="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500" aria-label="Close modal" autofocus>
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>` : ''}
        <div class="p-6 max-h-[75vh] overflow-y-auto">${html}</div>
      </div>
    </div>
  `;
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function closeModal() { $('#modalRoot').innerHTML = ''; }

function showConfirm(title, desc, actionLabel, style = 'info', onConfirm) {
  const colors = { danger: 'bg-red-500', warning: 'bg-amber-500', info: 'bg-sky-500', custom: 'bg-emerald-500' };
  const cl = colors[style] || colors.info;
  openModal(`
    <div class="text-center py-2">
      <div class="w-12 h-12 rounded-2xl ${cl}/20 ${cl.replace('bg-','text-')}/70 flex items-center justify-center mx-auto mb-4">
        <i data-lucide="alert-triangle" class="w-6 h-6"></i>
      </div>
      <h3 class="text-lg font-bold text-white mb-2">${title}</h3>
      <p class="text-sm text-slate-400 mb-6 leading-relaxed">${desc}</p>
      <div class="flex gap-3">
        <button onclick="closeModal()" class="flex-1 bg-slate-800 border border-slate-700 rounded-xl py-2.5 text-sm text-slate-300 hover:text-white transition-colors">Cancel</button>
        <button id="modalConfirmBtn" class="flex-1 ${cl} text-white rounded-xl py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity">${actionLabel}</button>
      </div>
    </div>
  `, '');
  $('#modalConfirmBtn').onclick = () => { closeModal(); onConfirm && onConfirm(); };
  setTimeout(() => { if (typeof lucide !== 'undefined') lucide.createIcons(); $('#modalConfirmBtn')?.focus(); }, 30);
}

// Product detail modal for store preview
function openProductDetail(productId) {
  const p = state.products.find(x => x.id === productId);
  const f = state.files.find(x => x.id === p.fileId);
  const discount = p.compareAt > p.price ? Math.round((1-p.price/p.compareAt)*100) : 0;
  openModal(`
    <div class="space-y-5">
      <!-- Icon + title -->
      <div class="flex items-start gap-4">
        <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/25 to-indigo-500/25 border border-emerald-500/20 flex items-center justify-center shrink-0">
          <i data-lucide="${p.icon}" class="w-7 h-7 text-emerald-400"></i>
        </div>
        <div>
          <div class="flex items-center gap-2 flex-wrap mb-1">
            <span class="text-[10px] font-mono text-slate-500 bg-slate-800/50 px-2 py-0.5 rounded-full">${p.category}</span>
            ${p.featured ? `<span class="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full flex items-center gap-0.5"><i data-lucide="star" class="w-2 h-2 fill-amber-400"></i>FEATURED</span>` : ''}
            ${discount > 0 ? `<span class="text-[10px] font-bold text-red-400 bg-red-500/15 px-2 py-0.5 rounded-full">-${discount}% OFF</span>` : ''}
          </div>
          <h2 class="text-xl font-bold text-white">${p.title}</h2>
          <div class="text-xs text-slate-500 mt-1 font-mono">${fmtNum(p.sales)} sales • ${f ? fmtSize(f.sizeBytes) : 'Unknown size'}</div>
        </div>
      </div>
      <p class="text-sm text-slate-400 leading-relaxed">${p.description}</p>
      <div class="grid grid-cols-2 gap-3">
        ${[
          { label: 'Format', value: f ? f.mimeType.split('/')[1]?.toUpperCase() || 'FILE' : 'FILE', icon: 'file' },
          { label: 'Max Downloads', value: p.maxDownloads + ' per purchase', icon: 'download' },
          { label: 'Link Expires', value: p.expiryDays + ' days', icon: 'clock' },
          { label: 'Delivery', value: 'Instant via email', icon: 'zap' },
        ].map(s => `
          <div class="bg-slate-800/40 rounded-xl p-3 flex items-start gap-2.5">
            <i data-lucide="${s.icon}" class="w-4 h-4 text-slate-500 shrink-0 mt-0.5"></i>
            <div>
              <div class="text-[10px] font-mono text-slate-500 uppercase tracking-wider">${s.label}</div>
              <div class="text-xs font-medium text-white mt-0.5">${s.value}</div>
            </div>
          </div>
        `).join('')}
      </div>
      ${p.price === 0 ? `
        <div class="bg-emerald-500/10 border border-emerald-500/25 rounded-xl p-3 flex items-center gap-2">
          <i data-lucide="gift" class="w-4 h-4 text-emerald-400 shrink-0"></i>
          <p class="text-xs text-emerald-300">This file is free — instant download, no account required.</p>
        </div>
      ` : ''}
      <button onclick="simulateCheckout('${p.id}'); closeModal()" class="w-full bg-emerald-500 text-slate-950 rounded-xl py-3 text-sm font-bold hover:bg-emerald-400 transition-colors glow-emerald flex items-center justify-center gap-2">
        ${p.price === 0 ? '<i data-lucide="download" class="w-4 h-4"></i>Download Free' : '<i data-lucide="shopping-cart" class="w-4 h-4"></i>Buy Now for ' + fmt$(p.price)}
      </button>
    </div>
  `, 'Product Details');
}

// Upload modal (simulated)
function openUploadModal() { document.getElementById('hiddenFileInput')?.click(); }

// ── GLOBAL SEARCH ────────────────────────────────────────
function onGlobalSearch(q) {
  state.searchQuery = q;
  if (q.length > 1 && state.currentTab !== 'store' && state.currentTab !== 'orders' && state.currentTab !== 'storage') {
    switchTab('store');
  }
  if (state.currentTab === 'storage' || state.currentTab === 'store' || state.currentTab === 'orders') {
    renderMain();
  }
}

// ── EXPORT ───────────────────────────────────────────────
function exportOrdersCSV() {
  const rows = [['Order ID','Email','Product','Amount','Method','Status','Date'].join(',')];
  state.orders.forEach(o => rows.push([o.id, o.email, o.product, o.amount, o.method, o.status, o.date].join(',')));
  const csv = rows.join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'lazy-cloud-orders.csv';
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
  showToast('CSV exported — lazy-cloud-orders.csv', 'success');
}

// ── KEYBOARD SHORTCUTS ────────────────────────────────────
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (!$('#modalRoot').innerHTML) closeModal();
    if (state.buyerView) toggleStorePreview();
    $('#notifDrawer').classList.add('hidden');
    $('#profileMenu').classList.add('hidden');
  }
  if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA' && document.activeElement?.tagName !== 'SELECT') {
    e.preventDefault();
    $('#globalSearch')?.focus();
  }
});

// ── INIT ─────────────────────────────────────────────────
function init() {
  renderSidebar();
  renderMain();
  updateSidebarStorage();
  updateHeaderRevenue();
  if (typeof lucide !== 'undefined') lucide.createIcons();

  // Add notifications for activity
  setInterval(() => {
    if (state.buyerView || document.hidden) return;
    const actions = [
      { text: '⏳ New file queued for processing…', type: 'info' },
      { text: 'Concurrent download detected from new IP (allowed)', type: 'info' },
      { text: 'Daily backup completed for all files', type: 'success' },
    ];
    const { text, type } = actions[Math.floor(Math.random()*actions.length)];
    state.notifications.unshift({ id: Date.now(), icon: 'info', text, time: 'just now', unread: true, type });
    document.title = `(${state.notifications.filter(n=>n.unread).length}) Lazy Cloud — Admin`;
  }, 45000);

  document.title = 'Lazy Cloud — Admin';

  // Trade show off loading bar
  const bar = document.createElement('div');
  bar.style.cssText = 'position:fixed;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,#34d399,#38bdf8,#818cf8);z-index:99999;transform-origin:left;';
  document.body.appendChild(bar);
  setTimeout(() => bar.remove(), 800);
}

init();
