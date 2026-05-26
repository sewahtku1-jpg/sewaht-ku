// Data State (Temporary while loading from DB)
let state = {
  quotations: [],
  customers: [],
  items: [],
  transactions: [] // Finance records (Income/Expense)
};

// --- INITIALIZE DATABASE ---
function initDB() {
  const stText = document.querySelector('.status-text');
  if (stText) stText.textContent = 'Database: Neon PostgreSQL (Active)';
  return loadAllData();
}

async function loadAllData() {
  state.quotations = await getAll('quotations');
  state.customers = await getAll('customers');
  state.items = await getAll('items');
  state.transactions = await getAll('transactions');
  
  if (state.items.length === 0) {
    await seedData();
  }
}

async function seedData() {
  const sampleCust = [
    { id: 'C-001', name: 'PT Maju Jaya', address: 'Jl. Sudirman No 1', phone: '0812345', email: 'info@majujaya.com' },
    { id: 'C-002', name: 'Yayasan Berkah', address: 'Jl. Melati 12', phone: '081999', email: 'admin@berkah.org' }
  ];
  const sampleItems = [
    { id: 'I-001', name: 'Handy Talkie Baofeng BF-888S', unit: 'Unit', price: 10000, desc: 'HT handal untuk event outdoor dan indoor.', img: '/assets/bf888s_new_1.png', specs: ['Jarak 1-3km', '16 Channel', 'Baterai 1500mAh'] },
    { id: 'I-002', name: 'Handy Talkie Baofeng UV-82', unit: 'Unit', price: 20000, desc: 'HT Dual Band dengan layar LCD dan keypad.', img: '/assets/uv82_new_1.png', specs: ['Dual Band VHF/UHF', 'Jarak 3-5km', 'Baterai Awet'] }
  ];
  for (let c of sampleCust) await save('customers', c, true);
  for (let i of sampleItems) await save('items', i, true);
  state.customers = sampleCust;
  state.items = sampleItems;
}

// --- DB HELPERS (Neon CRUD via Next.js API) ---
async function getAll(storeName) {
  try {
    const res = await fetch(`/api/admin/db?store=${storeName}`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (err) {
    console.warn('API fetch error:', err.message);
  }
  return [];
}

async function save(storeName, data, silent = false) {
  // 1. Persist to Local State immediately
  if (!state[storeName]) state[storeName] = [];
  const existingIdx = state[storeName].findIndex(x => x.id === data.id);
  if (existingIdx >= 0) {
    state[storeName][existingIdx] = data;
  } else {
    state[storeName].push(data);
  }

  // 2. Sync to DB
  try {
    const res = await fetch('/api/admin/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ store: storeName, data })
    });
    if (!res.ok) throw new Error('API save failed');
    return await res.json();
  } catch (err) {
    console.warn('API save error:', err.message);
    if (!silent) toast('Tersimpan lokal (Offline)', 'primary');
    return data;
  }
}

async function remove(storeName, id) {
  // Update local state immediately
  if (state[storeName]) {
    state[storeName] = state[storeName].filter(x => x.id !== id);
  }

  try {
    const res = await fetch(`/api/admin/db?store=${storeName}&id=${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('API delete failed');
  } catch (err) {
    console.warn('API delete error:', err.message);
  }
}

// --- APP INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  initDB().then(() => {
    updateUI();
    initCharts();
    updateDate();
    initNotifications();
  });
  
  // Close AC on click outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.autocomplete-wrap')) hideAC();
  });
});

function updateDate() {
  const now = new Date();
  const options = { day: 'numeric', month: 'short', year: 'numeric' };
  document.getElementById('topbar-date').textContent = now.toLocaleDateString('id-ID', options);
}

// --- NOTIFICATIONS ---
let lastOrderCount = 0;
async function initNotifications() {
  if (window.LocalNotifications) {
    try {
      await window.LocalNotifications.requestPermissions();
    } catch (e) {
      console.warn("Notifications permission error:", e);
    }
  }
  
  // Set baseline order count
  lastOrderCount = state.quotations.length;
  
  // Poll every 15 seconds
  setInterval(pollOrders, 15000);
}

async function pollOrders() {
  try {
    const freshOrders = await getAll('quotations');
    if (freshOrders.length > lastOrderCount) {
      const diff = freshOrders.length - lastOrderCount;
      const latestOrder = freshOrders[freshOrders.length - 1]; // Assume appended or sort needed
      
      // Notify
      if (window.LocalNotifications) {
        window.LocalNotifications.schedule({
          notifications: [
            {
              title: "Pesanan Baru!",
              body: `Ada ${diff} pesanan baru dari website. Cek dashboard sekarang.`,
              id: new Date().getTime(),
              schedule: { at: new Date(Date.now() + 1000) }
            }
          ]
        });
      } else {
        // Fallback for Web browser
        if (Notification.permission === 'granted') {
          new Notification("Pesanan Baru!", { body: `Ada pesanan baru dari website!` });
        }
      }
      
      // Update state and UI
      state.quotations = freshOrders;
      lastOrderCount = freshOrders.length;
      updateUI();
      updateCharts();
    }
  } catch (err) {
    // Silent fail
  }
}

// --- UI UPDATES ---
function updateUI() {
  renderDashboard();
  renderQuotations();
  renderFinance();
  renderCustomers();
  renderItems();
  updateBadges();
}

function updateBadges() {
  document.getElementById('nav-badge-quotations').textContent = state.quotations.length;
}

// --- NAVIGATION ---
function navigateTo(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelectorAll('.b-nav-item').forEach(b => b.classList.remove('active'));
  
  document.getElementById(`page-${pageId}`).classList.add('active');
  
  // Update Sidebar
  const sidebarItem = document.querySelector(`.nav-item[data-page="${pageId}"]`);
  if (sidebarItem) sidebarItem.classList.add('active');
  
  // Update Bottom Nav
  const bottomItem = document.querySelector(`.b-nav-item[data-target="${pageId}"]`);
  if (bottomItem) bottomItem.classList.add('active');
  
  if (pageId === 'logos') {
    loadLogosAdmin();
  }
  
  if (window.innerWidth <= 768) {
    const sb = document.getElementById('sidebar');
    if (sb.classList.contains('active')) toggleSidebar();
  }
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('active');
}

// --- FORMATTERS ---
function toIDR(num) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num || 0);
}

function toIDDate(str) {
  if (!str) return '-';
  const d = new Date(str);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function toast(msg, type = 'primary') {
  const box = document.getElementById('toast-box');
  const t = document.createElement('div');
  t.className = `toast`;
  t.style.borderLeftColor = type === 'error' ? 'var(--danger)' : 'var(--accent)';
  t.textContent = msg;
  box.appendChild(t);
  setTimeout(() => {
    t.style.opacity = '0';
    setTimeout(() => t.remove(), 400);
  }, 3000);
}

// --- DASHBOARD LOGIC ---
function renderDashboard() {
  const income = state.transactions.filter(t => t.type === 'IN').reduce((s, t) => s + t.amount, 0);
  const expense = state.transactions.filter(t => t.type === 'OUT').reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;
  const activeQuotes = state.quotations.filter(q => q.status === 'Disetujui').length;

  document.getElementById('m-total-income').textContent = toIDR(income);
  document.getElementById('m-total-expense').textContent = toIDR(expense);
  document.getElementById('m-balance').textContent = toIDR(balance);
  document.getElementById('m-active-quotes').textContent = activeQuotes;

  const trendEl = document.getElementById('m-balance-trend');
  trendEl.textContent = balance >= 0 ? 'Surplus Operasional' : 'Defisit Anggaran';
  trendEl.className = `metric-trend ${balance >= 0 ? 'trend-up' : 'trend-down'}`;

  // Recent Quotes
  const qBody = document.getElementById('tbody-recent-quotes');
  qBody.innerHTML = '';
  state.quotations.slice(-5).reverse().forEach(q => {
    qBody.innerHTML += `
      <tr>
        <td><strong>${q.invoiceNo || q.id}</strong></td>
        <td>${q.customer.name}</td>
        <td>${toIDR(q.grandTotal)}</td>
        <td><span class="badge ${getBadgeColor(q.status)}">${q.status}</span></td>
      </tr>
    `;
  });

  // Recent Finance
  const fBody = document.getElementById('tbody-recent-finance');
  fBody.innerHTML = '';
  state.transactions.slice(-5).reverse().forEach(t => {
    fBody.innerHTML += `
      <tr>
        <td>${t.category}</td>
        <td>${t.note}</td>
        <td><strong class="${t.type === 'IN' ? 'trend-up' : 'trend-down'}">${toIDR(t.amount)}</strong></td>
        <td><span class="badge ${t.type === 'IN' ? 'b-green' : 'b-red'}">${t.type}</span></td>
      </tr>
    `;
  });
}

function getBadgeColor(s) {
  if (s === 'Disetujui' || s === 'Lunas') return 'b-green';
  if (s === 'Terkirim' || s === 'DP') return 'b-amber';
  if (s === 'Draf') return 'b-gray';
  return 'b-blue';
}

// --- QUOTATION LOGIC ---
function renderQuotations() {
  const body = document.getElementById('tbody-quotations');
  body.innerHTML = '';
  state.quotations.slice().reverse().forEach(q => {
    body.innerHTML += `
      <tr>
        <td><span class="badge ${getBadgeColor(q.paymentStatus)}">${q.paymentStatus}</span></td>
        <td><strong>${q.invoiceNo || '-'}</strong><br><small>${q.id}</small></td>
        <td>${toIDDate(q.date)}</td>
        <td>${q.customer.name}</td>
        <td><strong>${toIDR(q.grandTotal)}</strong></td>
        <td><span class="badge ${getBadgeColor(q.status)}">${q.status}</span></td>
        <td>
          <button class="btn-text" style="color:#1A56DB" onclick="printInvoice('${q.id}')"><i class="ti ti-printer"></i> Cetak</button>
          <button class="btn-text" onclick="editQuote('${q.id}')">Edit</button>
          <button class="btn-text" style="color:var(--danger)" onclick="deleteData('quotations', '${q.id}')">Hapus</button>
        </td>
      </tr>
    `;
  });
}

function addQuoteRow(data = null) {
  const tbody = document.getElementById('q-items-tbody');
  const tr = document.createElement('tr');
  let opts = '<option value="">-- Pilih --</option>';
  state.items.forEach(i => opts += `<option value="${i.id}" ${data && data.id === i.id ? 'selected' : ''}>${i.name}</option>`);
  
  tr.innerHTML = `
    <td><select class="row-id" onchange="onItemChange(this)">${opts}</select></td>
    <td><input type="number" class="row-qty" value="${data ? data.qty : 1}" min="1" oninput="calcQuote()"></td>
    <td><input type="number" class="row-days" value="${data ? data.days : 1}" min="1" oninput="calcQuote()"></td>
    <td><input type="number" class="row-price" value="${data ? data.price : 0}" oninput="calcQuote()"></td>
    <td class="row-total">${toIDR(data ? data.total : 0)}</td>
    <td><button type="button" class="btn-text" style="color:var(--danger)" onclick="this.closest('tr').remove();calcQuote();">×</button></td>
  `;
  tbody.appendChild(tr);
}

function onItemChange(el) {
  const tr = el.closest('tr');
  const item = state.items.find(i => i.id === el.value);
  if (item) tr.querySelector('.row-price').value = item.price;
  calcQuote();
}

function calcQuote() {
  let raw = 0;
  document.querySelectorAll('#q-items-tbody tr').forEach(tr => {
    const q = parseInt(tr.querySelector('.row-qty').value) || 0;
    const d = parseInt(tr.querySelector('.row-days').value) || 0;
    const p = parseInt(tr.querySelector('.row-price').value) || 0;
    const t = q * d * p;
    tr.querySelector('.row-total').textContent = toIDR(t);
    tr.querySelector('.row-total').dataset.val = t;
    raw += t;
  });

  const disc = parseInt(document.getElementById('q-disc').value) || 0;
  const sub = raw - (raw * disc / 100);
  const pph = parseInt(document.getElementById('q-pph').value) || 0;
  const grand = sub - (sub * pph / 100);

  document.getElementById('s-raw').textContent = toIDR(raw);
  document.getElementById('s-sub').textContent = toIDR(sub);
  document.getElementById('s-grand').textContent = toIDR(grand);
  document.getElementById('s-grand').dataset.val = grand;
}

async function saveQuotation(e) {
  e.preventDefault();
  const id = document.getElementById('q-edit-id').value || 'ORD-' + Date.now().toString().slice(-6);
  const custName = document.getElementById('q-cust-name').value;
  let cust = state.customers.find(c => c.name === custName);
  
  // Auto-save new customer if not exists
  if (!cust && custName.trim() !== '') {
    cust = {
      id: 'C-' + Math.floor(Math.random()*10000),
      name: custName,
      address: document.getElementById('q-cust-address').value || '-',
      phone: '-',
      email: '-'
    };
    await save('customers', cust);
  } else if (!cust) {
    cust = { name: custName };
  }

  const data = {
    id,
    invoiceNo: document.getElementById('q-invoice-no').value,
    date: document.getElementById('q-date').value,
    status: document.getElementById('q-status').value,
    paymentStatus: document.getElementById('q-payment-status').value,
    customer: cust,
    event: document.getElementById('q-event').value,
    location: document.getElementById('q-location').value,
    loadingDate: document.getElementById('q-loading-date').value,
    note: document.getElementById('q-note').value,
    discount: parseInt(document.getElementById('q-disc').value),
    pph: parseInt(document.getElementById('q-pph').value),
    grandTotal: parseInt(document.getElementById('s-grand').dataset.val),
    items: Array.from(document.querySelectorAll('#q-items-tbody tr')).map(tr => ({
      id: tr.querySelector('.row-id').value,
      qty: parseInt(tr.querySelector('.row-qty').value),
      days: parseInt(tr.querySelector('.row-days').value),
      price: parseInt(tr.querySelector('.row-price').value),
      total: parseInt(tr.querySelector('.row-total').dataset.val)
    }))
  };

  await save('quotations', data);
  
  // Create auto-transaction if payment status changed to DP/Lunas
  if (data.paymentStatus !== 'Lainnya') {
    const tId = 'TX-' + id;
    const existingTx = state.transactions.find(t => t.id === tId);
    if (!existingTx) {
      await save('transactions', {
        id: tId,
        date: data.date,
        type: 'IN',
        category: 'Pembayaran Sewa',
        amount: data.grandTotal,
        note: `Otomatis dari Invoice ${data.invoiceNo || id}`
      });
    }
  }

  // Update UI and close modal immediately for snappy responsiveness
  updateUI();
  updateCharts();
  closeModal('modal-quotation');
  toast('Quotation berhasil disimpan');

  try { await loadAllData(); updateUI(); } catch(e){}
}


function editQuote(id) {
  const q = state.quotations.find(x => x.id === id);
  document.getElementById('q-edit-id').value = q.id;
  document.getElementById('q-order-no').value = q.id;
  document.getElementById('q-invoice-no').value = q.invoiceNo;
  document.getElementById('q-date').value = q.date;
  document.getElementById('q-status').value = q.status;
  document.getElementById('q-payment-status').value = q.paymentStatus;
  document.getElementById('q-cust-name').value = q.customer.name;
  document.getElementById('q-cust-address').value = q.customer.address || '';
  document.getElementById('q-cust-email').value = q.customer.email || '';
  document.getElementById('q-event').value = q.event;
  document.getElementById('q-location').value = q.location;
  document.getElementById('q-loading-date').value = q.loadingDate;
  document.getElementById('q-note').value = q.note;
  document.getElementById('q-disc').value = q.discount;
  document.getElementById('q-pph').value = q.pph;

  const tbody = document.getElementById('q-items-tbody');
  tbody.innerHTML = '';
  q.items.forEach(i => addQuoteRow(i));
  calcQuote();
  openModal('modal-quotation');
}

function printInvoice(id) {
  const q = state.quotations.find(x => x.id === id);
  if (!q) return;
  
  // Enrich items with real names, units, and descriptions from master catalog
  const enrichedItems = (q.items || []).map(it => {
    const masterItem = state.items.find(mi => mi.id === it.id);
    return {
      ...it,
      name: masterItem ? masterItem.name : (it.name || it.id),
      unit: masterItem ? masterItem.unit : (it.unit || 'Unit'),
      desc: masterItem ? masterItem.desc : (it.desc || '')
    };
  });

  const rawTotal = enrichedItems.reduce((sum, it) => sum + (it.total || 0), 0);
  const discountAmount = rawTotal * (q.discount || 0) / 100;

  const printData = {
    ...q,
    items: enrichedItems,
    subTotal: rawTotal,
    discountAmount: discountAmount
  };

  localStorage.setItem('print_quote', JSON.stringify(printData));
  window.open('/admin/invoice.html', '_blank');
}

// --- FINANCE LOGIC ---
function renderFinance() {
  const body = document.getElementById('tbody-finance');
  body.innerHTML = '';
  state.transactions.slice().reverse().forEach(t => {
    body.innerHTML += `
      <tr>
        <td>${toIDDate(t.date)}</td>
        <td><span class="badge ${t.type === 'IN' ? 'b-green' : 'b-red'}">${t.type === 'IN' ? 'Masuk' : 'Keluar'}</span></td>
        <td><strong>${t.category}</strong></td>
        <td>${t.note}</td>
        <td><strong class="${t.type === 'IN' ? 'trend-up' : 'trend-down'}">${toIDR(t.amount)}</strong></td>
        <td>
          <button class="btn-text" style="color:var(--danger)" onclick="deleteData('transactions', '${t.id}')">Hapus</button>
        </td>
      </tr>
    `;
  });
}

async function saveTransaction(e) {
  e.preventDefault();
  const id = document.getElementById('t-edit-id').value || 'TX-' + Date.now();
  const type = document.getElementById('t-type').value;
  const data = {
    id,
    date: document.getElementById('t-date').value,
    type,
    category: document.getElementById('t-category').value,
    amount: parseInt(document.getElementById('t-amount').value),
    note: document.getElementById('t-note').value
  };

  await save('transactions', data);
  updateUI();
  updateCharts();
  closeModal('modal-transaction');
  toast('Transaksi berhasil dicatat');

  try { await loadAllData(); updateUI(); } catch(e){}
}

// --- MASTER DATA LOGIC ---
function renderCustomers() {
  const body = document.getElementById('tbody-customers');
  body.innerHTML = '';
  state.customers.forEach(c => {
    body.innerHTML += `<tr>
      <td>${c.id}</td>
      <td><strong>${c.name}</strong></td>
      <td>${c.address}</td>
      <td>${c.phone}<br><small>${c.email}</small></td>
      <td>
        <button class="btn-text" onclick="editCust('${c.id}')">Edit</button>
        <button class="btn-text" style="color:var(--danger)" onclick="deleteData('customers', '${c.id}')">Hapus</button>
      </td>
    </tr>`;
  });
}

async function saveCustomer(e) {
  e.preventDefault();
  const id = document.getElementById('c-edit-id').value || 'C-' + Math.floor(Math.random()*1000);
  const data = {
    id,
    name: document.getElementById('c-name').value,
    address: document.getElementById('c-address').value,
    phone: document.getElementById('c-phone').value,
    email: document.getElementById('c-email').value
  };
  await save('customers', data);
  updateUI();
  closeModal('modal-customer');
  toast('Pelanggan berhasil disimpan');

  try { await loadAllData(); updateUI(); } catch(e){}
}

function renderItems() {
  const body = document.getElementById('tbody-items');
  body.innerHTML = '';
  state.items.forEach(i => {
    body.innerHTML += `<tr>
      <td>${i.id}</td>
      <td><strong>${i.name}</strong></td>
      <td>${i.unit}</td>
      <td><strong>${toIDR(i.price)}</strong></td>
      <td>
        <button class="btn-text" onclick="editItem('${i.id}')">Edit</button>
        <button class="btn-text" style="color:var(--danger)" onclick="deleteData('items', '${i.id}')">Hapus</button>
      </td>
    </tr>`;
  });
}

async function saveItem(e) {
  e.preventDefault();
  const id = document.getElementById('i-edit-id').value || 'I-' + Math.floor(Math.random()*1000);
  const specsRaw = document.getElementById('i-specs').value || '';
  const data = {
    id,
    name: document.getElementById('i-name').value,
    unit: document.getElementById('i-unit').value,
    price: parseInt(document.getElementById('i-price').value),
    desc: document.getElementById('i-desc').value,
    img: document.getElementById('i-img').value || '/assets/baofeng.png',
    specs: specsRaw.split(',').map(s => s.trim()).filter(Boolean)
  };
  await save('items', data);
  updateUI();
  closeModal('modal-item');
  toast('Item berhasil disimpan');

  try { await loadAllData(); updateUI(); } catch(e){}
}

function editItem(id) {
  const i = state.items.find(x => x.id === id);
  if (!i) return;
  document.getElementById('i-edit-id').value = i.id;
  document.getElementById('i-name').value = i.name;
  document.getElementById('i-unit').value = i.unit || '';
  document.getElementById('i-price').value = i.price || 0;
  document.getElementById('i-desc').value = i.desc || '';
  document.getElementById('i-img').value = i.img || '';
  document.getElementById('i-specs').value = (i.specs || []).join(', ');
  openModal('modal-item');
}

// --- COMMON UI LOGIC ---
function openModal(id, extra = null) {
  const modal = document.getElementById(id);
  modal.classList.add('active');
  if (id === 'modal-quotation') resetQuoteForm();
  if (id === 'modal-transaction') {
    document.getElementById('form-transaction').reset();
    document.getElementById('t-edit-id').value = '';
    document.getElementById('t-type').value = extra;
    document.getElementById('t-date').valueAsDate = new Date();
    document.getElementById('t-modal-title').textContent = extra === 'IN' ? 'Catat Uang Masuk' : 'Catat Uang Keluar';
  }
}

function closeModal(id) { document.getElementById(id).classList.remove('active'); }

function resetQuoteForm() {
  document.getElementById('form-quotation').reset();
  document.getElementById('q-edit-id').value = '';
  document.getElementById('q-order-no').value = 'ORD-' + Date.now().toString().slice(-6);
  document.getElementById('q-date').valueAsDate = new Date();
  document.getElementById('q-items-tbody').innerHTML = '';
  addQuoteRow();
  calcQuote();
}

async function deleteData(store, id) {
  if (confirm('Yakin ingin menghapus data ini?')) {
    await remove(store, id);
    await loadAllData();
    updateUI();
    updateCharts();
    toast('Data telah dihapus', 'error');
  }
}

// Autocomplete
function custSearch(val) {
  const list = document.getElementById('ac-cust-list');
  list.innerHTML = '';
  if (!val) return list.style.display = 'none';
  const match = state.customers.filter(c => c.name.toLowerCase().includes(val.toLowerCase()));
  if (match.length) {
    match.forEach(c => {
      const d = document.createElement('div');
      d.className = 'ac-item';
      d.textContent = c.name;
      d.onclick = () => {
        document.getElementById('q-cust-name').value = c.name;
        document.getElementById('q-cust-address').value = c.address;
        document.getElementById('q-cust-email').value = c.email;
        list.style.display = 'none';
      };
      list.appendChild(d);
    });
    list.style.display = 'block';
  } else list.style.display = 'none';
}
function hideAC() { document.getElementById('ac-cust-list').style.display = 'none'; }

// --- CHARTS ---
let cfChart, donutChart;
function initCharts() {
  const ctxCF = document.getElementById('chart-cashflow').getContext('2d');
  cfChart = new Chart(ctxCF, {
    type: 'line',
    data: getCFData(),
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      tension: 0.4,
      scales: { y: { ticks: { callback: v => toIDR(v) } } }
    }
  });

  const ctxD = document.getElementById('chart-status-donut').getContext('2d');
  donutChart = new Chart(ctxD, {
    type: 'doughnut',
    data: getDonutData(),
    options: { cutout: '75%', plugins: { legend: { display: false } } }
  });
  updateDonutLegend();
}

function updateCharts() {
  cfChart.data = getCFData();
  donutChart.data = getDonutData();
  cfChart.update();
  donutChart.update();
  updateDonutLegend();
}

function getCFData() {
  const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
  const incomeArr = Array(12).fill(0);
  const expenseArr = Array(12).fill(0);

  state.transactions.forEach(t => {
    const m = new Date(t.date).getMonth();
    if (t.type === 'IN') incomeArr[m] += t.amount;
    else expenseArr[m] += t.amount;
  });

  return {
    labels,
    datasets: [
      { label: 'Masuk', data: incomeArr, borderColor: '#2563eb', backgroundColor: 'rgba(37, 99, 235, 0.1)', fill: true },
      { label: 'Keluar', data: expenseArr, borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', fill: true }
    ]
  };
}

function getDonutData() {
  const stats = { 'Draf': 0, 'Terkirim': 0, 'Disetujui': 0 };
  state.quotations.forEach(q => { if (stats[q.status] !== undefined) stats[q.status]++; });
  return {
    labels: Object.keys(stats),
    datasets: [{ data: Object.values(stats), backgroundColor: ['#94a3b8', '#f59e0b', '#10b981'], borderJoinStyle: 'round' }]
  };
}

function updateDonutLegend() {
  const leg = document.getElementById('legend-status');
  leg.innerHTML = '';
  donutChart.data.labels.forEach((l, i) => {
    leg.innerHTML += `
      <div class="legend-item" style="font-size:0.8rem; display:flex; align-items:center; gap:8px; margin-bottom:5px;">
        <span style="width:10px;height:10px;border-radius:50%;background:${donutChart.data.datasets[0].backgroundColor[i]}"></span>
        <span>${l}: <strong>${donutChart.data.datasets[0].data[i]}</strong></span>
      </div>
    `;
  });
}

// --- LOGO / MARQUEE MANAGEMENT LOGIC ---
async function loadLogosAdmin() {
  const container = document.getElementById('logo-grid-preview');
  if (!container) return;
  container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">Memuat daftar logo sponsor...</div>';
  
  try {
    const res = await fetch('/api/logos');
    const data = await res.json();
    
    container.innerHTML = '';
    if (data.success && data.logos && data.logos.length > 0) {
      data.logos.forEach(logo => {
        const card = document.createElement('div');
        card.className = 'logo-item-card';
        card.style.cssText = 'background: #ffffff; border: 1px solid var(--border-color-subtle); border-radius: var(--radius-md); padding: 1rem; display: flex; flex-direction: column; align-items: center; justify-content: space-between; gap: 0.75rem; box-shadow: var(--shadow-sm);';
        
        card.innerHTML = `
          <div style="height: 60px; width: 100%; display: flex; align-items: center; justify-content: center;">
            <img src="${logo.url}" alt="${logo.name}" style="max-height: 100%; max-width: 100%; object-fit: contain;" />
          </div>
          <div style="font-size: 0.75rem; font-weight: 600; color: var(--text-main); text-align: center; word-break: break-all; width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            ${logo.name}
          </div>
          <button type="button" class="btn btn-sm btn-outline" style="color: var(--danger); border-color: var(--danger); width: 100%;" onclick="deleteLogoFile('${logo.id}')">
            <i class="ti ti-trash"></i> Hapus
          </button>
        `;
        container.appendChild(card);
      });
    } else {
      container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 2rem 0;">Belum ada logo sponsor yang diupload. Gunakan tombol Upload di kanan atas.</div>';
    }
  } catch (err) {
    container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--danger);">Gagal memuat logo: ${err.message}</div>`;
  }
}

async function uploadLogoFile(input) {
  const file = input.files[0];
  if (!file) return;
  
  const formData = new FormData();
  formData.append('file', file);
  
  toast('Mengupload logo...', 'primary');
  try {
    const res = await fetch('/api/logos', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    
    if (data.success) {
      toast('Logo berhasil diupload!', 'success');
      loadLogosAdmin();
    } else {
      toast('Gagal upload: ' + data.error, 'error');
    }
  } catch (err) {
    toast('Error upload: ' + err.message, 'error');
  }
  input.value = '';
}

async function deleteLogoFile(filename) {
  if (!confirm('Apakah Anda yakin ingin menghapus logo ini?')) return;
  
  toast('Menghapus logo...', 'primary');
  try {
    const res = await fetch(`/api/logos?filename=${encodeURIComponent(filename)}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    
    if (data.success) {
      toast('Logo berhasil dihapus', 'success');
      loadLogosAdmin();
    } else {
      toast('Gagal menghapus: ' + data.error, 'error');
    }
  } catch (err) {
    toast('Error hapus: ' + err.message, 'error');
  }
}

async function uploadProductImage(input) {
  const file = input.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('file', file);

  toast('Mengupload gambar produk...', 'primary');
  try {
    const res = await fetch('/api/products/upload', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();

    if (data.success && data.url) {
      document.getElementById('i-img').value = data.url;
      toast('Gambar produk berhasil diupload!', 'success');
    } else {
      toast('Gagal upload: ' + data.error, 'error');
    }
  } catch (err) {
    toast('Error upload: ' + err.message, 'error');
  }
  input.value = '';
}

// --- ANDROID PWA INSTALLER LOGIC ---
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  // Mencegah Chrome memunculkan mini-infobar secara otomatis
  e.preventDefault();
  // Menyimpan event agar bisa dipicu nanti
  deferredPrompt = e;
  // Menambahkan efek glow/animasi ke tombol install
  const installBtn = document.getElementById('install-apk-btn');
  if (installBtn) {
    installBtn.classList.add('ready-install');
    installBtn.style.display = 'inline-flex';
  }
});

window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
  toast('Aplikasi Android berhasil diinstal ke Layar Beranda!', 'success');
  const installBtn = document.getElementById('install-apk-btn');
  if (installBtn) {
    installBtn.innerHTML = '<i class="ti ti-check"></i> <span class="hide-mobile">Terinstal</span>';
    installBtn.classList.remove('ready-install');
    installBtn.classList.add('installed-badge');
  }
});

function triggerAndroidInstall() {
  if (deferredPrompt) {
    // Menampilkan prompt instalasi native Android
    deferredPrompt.prompt();
    // Menunggu respons pengguna
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      deferredPrompt = null;
    });
  } else {
    // Fallback instruksi jika browser/perangkat belum mendukung prompt otomatis
    // atau aplikasi sudah terinstal
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
      toast('Aplikasi Android sudah aktif & berjalan.', 'success');
    } else {
      alert('Untuk menginstal Aplikasi Android:\n\n1. Ketuk ikon menu tiga titik (⋮) di pojok kanan atas browser Chrome/Android Anda.\n2. Pilih menu "Tambahkan ke Layar Utama" atau "Instal Aplikasi".\n3. Aplikasi SewaHTku siap digunakan langsung dari layar utama HP Anda!');
    }
  }
}
