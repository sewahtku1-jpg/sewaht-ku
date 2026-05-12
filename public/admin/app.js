// --- CONFIG & DATABASE (Sanity Cloud) ---
let sanityClient;

// Data State (Temporary while loading from DB)
let state = {
  quotations: [],
  customers: [],
  items: [],
  transactions: [] // Finance records (Income/Expense)
};

function initSanity() {
  const token = 'skJv4LPgTaoktDrUSNKIPD7fBndC0JYFrzaG364rRg9Xp6BV4Aw46D3fpTb4qAf1jfuD1F0KY0KS9sss6mrn0vpvtQalmVBOO6rGK1WWgD6Djk2rJ6Arxtolk1DU0JBeuIwDg9DKLMhOVZ0l4SAClvGD9GlkDCxpx2LqnFSPASRsey8vBH8H';
  sanityClient = window.SanityClient.createClient({
    projectId: 'lzgftrin',
    dataset: 'production',
    useCdn: false,
    apiVersion: '2023-05-03',
    token: token
  });
  
  // update footer status
  const stText = document.querySelector('.status-text');
  if (stText) {
    stText.textContent = token ? 'Database: Sanity Cloud (Online)' : 'Database: Sanity (Read Only)';
  }
}

function saveSettings() {
  const token = document.getElementById('s-api-token').value;
  localStorage.setItem('SANITY_API_TOKEN', token.trim());
  initSanity();
  closeModal('modal-settings');
  toast('Token Sanity berhasil disimpan!');
}

// --- INITIALIZE DATABASE ---
function initDB() {
  initSanity();
  // populate token input if exists
  const tInput = document.getElementById('s-api-token');
  if (tInput) tInput.value = localStorage.getItem('SANITY_API_TOKEN') || '';
  
  return loadAllData();
}

async function loadAllData() {
  state.quotations = await getAll('quotations');
  state.customers = await getAll('customers');
  state.items = await getAll('items');
  state.transactions = await getAll('transactions');
  
  // If first time/empty cloud, load sample data
  if (state.items.length === 0 && sanityClient.config().token) {
    await seedData();
  }
}

async function seedData() {
  const sampleCust = [
    { id: 'C-001', name: 'PT Maju Jaya', address: 'Jl. Sudirman No 1', phone: '0812345', email: 'info@majujaya.com' },
    { id: 'C-002', name: 'Yayasan Berkah', address: 'Jl. Melati 12', phone: '081999', email: 'admin@berkah.org' }
  ];
  const sampleItems = [
    { id: 'I-001', name: 'Handy Talkie Baofeng BF-888S', unit: 'Unit', price: 25000, desc: 'HT handal untuk event outdoor dan indoor.', img: '/assets/baofeng.png', specs: ['Jarak 1-3km', '16 Channel', 'Baterai 1500mAh'] },
    { id: 'I-002', name: 'Handy Talkie Baofeng UV-5R', unit: 'Unit', price: 35000, desc: 'HT Dual Band dengan layar LCD dan keypad.', img: '/assets/baofeng.png', specs: ['Dual Band VHF/UHF', 'Jarak 3-5km', 'Baterai Awet'] }
  ];
  for (let c of sampleCust) await save('customers', c);
  for (let i of sampleItems) await save('items', i);
  state.customers = sampleCust;
  state.items = sampleItems;
}

// --- DB HELPERS (Sanity CRUD) ---
async function getAll(storeName) {
  const typeMap = { quotations: 'quotation', customers: 'customer', items: 'item', transactions: 'transaction' };
  const type = typeMap[storeName] || storeName;
  try {
    const docs = await sanityClient.fetch(`*[_type == "${type}"]`);
    return docs.map(d => ({ ...d, id: d._id }));
  } catch (err) {
    console.error('Sanity fetch error:', err);
    toast('Gagal memuat data dari Sanity Cloud', 'error');
    return [];
  }
}

async function save(storeName, data) {
  const typeMap = { quotations: 'quotation', customers: 'customer', items: 'item', transactions: 'transaction' };
  const type = typeMap[storeName] || storeName;
  
  if (!sanityClient.config().token) {
    toast('Error: Masukkan Sanity API Token di Pengaturan untuk menyimpan!', 'error');
    openModal('modal-settings');
    throw new Error('No write token');
  }

  // Remove keys that start with _ if they are undefined or mapped
  const sanityDoc = {
    ...data,
    _type: type,
    _id: data.id || data._id
  };
  delete sanityDoc.id;

  try {
    const res = await sanityClient.createOrReplace(sanityDoc);
    return { ...res, id: res._id };
  } catch (err) {
    console.error('Sanity save error:', err);
    toast('Gagal menyimpan ke cloud: ' + err.message, 'error');
    throw err;
  }
}

async function remove(storeName, id) {
  if (!sanityClient.config().token) {
    toast('Error: Masukkan Sanity API Token di Pengaturan untuk menghapus!', 'error');
    openModal('modal-settings');
    throw new Error('No write token');
  }
  try {
    await sanityClient.delete(id);
  } catch (err) {
    console.error('Sanity delete error:', err);
    toast('Gagal menghapus dari cloud: ' + err.message, 'error');
    throw err;
  }
}

// --- APP INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  initDB().then(() => {
    updateUI();
    initCharts();
    updateDate();
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
  const cust = state.customers.find(c => c.name === custName) || { name: custName };

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

  await loadAllData();
  updateUI();
  updateCharts();
  closeModal('modal-quotation');
  toast('Quotation berhasil disimpan');
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
  await loadAllData();
  updateUI();
  updateCharts();
  closeModal('modal-transaction');
  toast('Transaksi berhasil dicatat');
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
  await loadAllData();
  updateUI();
  closeModal('modal-customer');
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
  await loadAllData();
  updateUI();
  closeModal('modal-item');
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
