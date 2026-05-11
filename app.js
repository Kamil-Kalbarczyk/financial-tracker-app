'use strict';

const STORAGE_KEY = 'budget_transactions';

const EXPENSE_CATEGORIES = ['Food', 'Rent', 'Transport', 'Entertainment', 'Health', 'Shopping', 'Other'];
const INCOME_CATEGORIES  = ['Income'];

const CATEGORY_COLORS = ['#ef4444', '#f97316', '#eab308', '#10b981', '#3b82f6', '#8b5cf6', '#64748b'];

let transactions = [];
let spendingChart = null;

// --- Storage ---

function loadTransactions() {
  try {
    transactions = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    transactions = [];
  }
}

function saveTransactions() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

// --- Data ---

function addTransaction(formData) {
  const txn = {
    id: 'txn_' + Date.now() + '_' + Math.floor(Math.random() * 9000 + 1000),
    type: formData.type,
    description: formData.description,
    amount: parseFloat(formData.amount),
    category: formData.category,
    date: formData.date,
  };
  transactions.push(txn);
}

function addTransactionAndRender(formData) {
  addTransaction(formData);
  saveTransactions();
  renderAll();
}

function deleteTransaction(id) {
  transactions = transactions.filter(t => t.id !== id);
  saveTransactions();
  renderAll();
}

function getTotals() {
  let income = 0, expenses = 0;
  for (const t of transactions) {
    if (t.type === 'income') income += t.amount;
    else expenses += t.amount;
  }
  return { income, expenses, balance: income - expenses };
}

function getCategoryTotals() {
  const totals = {};
  for (const cat of EXPENSE_CATEGORIES) totals[cat] = 0;
  for (const t of transactions) {
    if (t.type === 'expense' && totals[t.category] !== undefined) {
      totals[t.category] += t.amount;
    }
  }
  return totals;
}

function formatCurrency(n) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

// --- Rendering ---

function renderAll() {
  renderSummaryCards();
  renderTransactionList();
  renderChart();
}

function renderSummaryCards() {
  const { income, expenses, balance } = getTotals();
  document.getElementById('summary-income').textContent   = formatCurrency(income);
  document.getElementById('summary-expenses').textContent = formatCurrency(expenses);
  const balEl = document.getElementById('summary-balance');
  balEl.textContent = formatCurrency(balance);
  balEl.classList.toggle('balance--negative', balance < 0);
}

function getFilteredTransactions() {
  const catFilter  = document.getElementById('filter-category').value;
  const typeFilter = document.getElementById('filter-type').value;
  const dateFrom   = document.getElementById('filter-date-from').value;
  const dateTo     = document.getElementById('filter-date-to').value;

  return transactions
    .filter(t => {
      if (catFilter  && t.category !== catFilter)  return false;
      if (typeFilter && t.type !== typeFilter)      return false;
      if (dateFrom   && t.date < dateFrom)          return false;
      if (dateTo     && t.date > dateTo)            return false;
      return true;
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

function renderTransactionList() {
  const list       = document.getElementById('transaction-list');
  const emptyState = document.getElementById('empty-state');
  const filtered   = getFilteredTransactions();

  list.innerHTML = '';

  if (filtered.length === 0) {
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';
  for (const txn of filtered) {
    list.appendChild(buildTransactionItem(txn));
  }
}

function buildTransactionItem(txn) {
  const li = document.createElement('li');
  li.className = 'txn-item';
  li.dataset.id = txn.id;

  const sign = txn.type === 'income' ? '+' : '-';

  const desc = txn.description || '—';

  li.innerHTML = `
    <div class="txn-left">
      <span class="txn-desc">${escapeHtml(desc)}</span>
      <span class="txn-meta">${escapeHtml(txn.category)} &middot; ${txn.date}</span>
    </div>
    <div class="txn-right">
      <span class="txn-amount ${txn.type}">${sign}${formatCurrency(txn.amount)}</span>
      <button class="btn-delete" data-id="${txn.id}" aria-label="Delete transaction">&times;</button>
    </div>
  `;

  li.querySelector('.btn-delete').addEventListener('click', () => deleteTransaction(txn.id));
  return li;
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function renderChart() {
  const catTotals = getCategoryTotals();
  const labels = EXPENSE_CATEGORIES.filter(cat => catTotals[cat] > 0);
  const data   = labels.map(cat => catTotals[cat]);

  const canvas   = document.getElementById('spending-chart');
  const emptyMsg = document.getElementById('chart-empty');

  if (labels.length === 0) {
    canvas.style.display   = 'none';
    emptyMsg.style.display = 'block';
    if (spendingChart) { spendingChart.destroy(); spendingChart = null; }
    return;
  }

  canvas.style.display   = 'block';
  emptyMsg.style.display = 'none';

  if (spendingChart) spendingChart.destroy();
  spendingChart = new Chart(canvas, buildChartConfig(labels, data));
}

function buildChartConfig(labels, data) {
  return {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: labels.map((_, i) => CATEGORY_COLORS[i % CATEGORY_COLORS.length]),
        borderWidth: 2,
        borderColor: '#ffffff',
      }],
    },
    options: {
      cutout: '60%',
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { font: { size: 12 }, padding: 12 },
        },
        tooltip: {
          callbacks: {
            label: ctx => ` ${formatCurrency(ctx.parsed)}`,
          },
        },
      },
    },
  };
}

// --- Form & Filters ---

function populateCategoryDropdown(type, selectId = 'input-category') {
  const select = document.getElementById(selectId);
  const cats   = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  select.innerHTML = cats.map(c => `<option value="${c}">${c}</option>`).join('');
}

function populateFilterCategoryDropdown() {
  const select = document.getElementById('filter-category');
  const allCats = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];
  select.innerHTML = '<option value="">All Categories</option>' +
    allCats.map(c => `<option value="${c}">${c}</option>`).join('');
}

function handleFormSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const description = document.getElementById('input-description').value.trim();
  const amount      = parseFloat(document.getElementById('input-amount').value);
  const type        = document.getElementById('input-type').value;
  const category    = document.getElementById('input-category').value;
  const date        = document.getElementById('input-date').value;

  if (isNaN(amount) || amount <= 0 || !date) return;

  addTransactionAndRender({ type, description, amount, category, date });
  form.reset();
  document.getElementById('input-type').value = 'expense';
  populateCategoryDropdown('expense');
  document.getElementById('input-date').value = new Date().toISOString().split('T')[0];
}

function handleTypeChange() {
  const type = document.getElementById('input-type').value;
  populateCategoryDropdown(type);
}

// --- Bulk import ---

let parsedBulkRows = [];

function parseDate(raw) {
  // YYYY-MM-DD
  let m = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) {
    const [, y, mo, d] = m;
    if (mo >= 1 && mo <= 12 && d >= 1 && d <= 31) return `${y}-${mo}-${d}`;
  }
  // M/D/YYYY or MM/DD/YYYY (Excel US locale)
  m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    const [, mo, d, y] = m;
    if (mo >= 1 && mo <= 12 && d >= 1 && d <= 31) {
      return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
  }
  return null;
}

function parseImportText(text) {
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map((line, i) => {
      const parts  = line.split('\t');
      const rawAmt = (parts[0] || '').trim().replace(/[,$\s]/g, '');
      const rawDate = (parts[1] || '').trim();
      const amount = parseFloat(rawAmt);

      if (isNaN(amount) || amount <= 0) {
        return { row: i + 1, amount: rawAmt, date: rawDate, valid: false, error: 'Invalid amount' };
      }

      const date = parseDate(rawDate);
      if (!date) {
        return { row: i + 1, amount, date: rawDate, valid: false, error: 'Invalid date (use YYYY-MM-DD or MM/DD/YYYY)' };
      }

      return { row: i + 1, amount, date, valid: true, error: '' };
    });
}

function renderImportPreview(rows) {
  const container = document.getElementById('bulk-preview');
  const btn       = document.getElementById('btn-bulk-import');
  const validCount = rows.filter(r => r.valid).length;

  if (rows.length === 0) {
    container.innerHTML = '';
    btn.textContent = 'Import 0 rows';
    btn.disabled = true;
    return;
  }

  const rowsHtml = rows.map(r => {
    const safeAmount = typeof r.amount === 'number' ? formatCurrency(r.amount) : escapeHtml(String(r.amount));
    const safeDate   = escapeHtml(String(r.date));
    const safeError  = escapeHtml(r.error);
    return `
    <tr>
      <td>${r.row}</td>
      <td>${safeAmount}</td>
      <td>${safeDate}</td>
      <td class="${r.valid ? 'preview-valid' : 'preview-invalid'}">${r.valid ? '✓' : '✗ ' + safeError}</td>
    </tr>`;
  }).join('');

  container.innerHTML = `
    <table>
      <thead><tr><th>#</th><th>Amount</th><th>Date</th><th>Status</th></tr></thead>
      <tbody>${rowsHtml}</tbody>
    </table>
  `;

  btn.textContent = `Import ${validCount} row${validCount !== 1 ? 's' : ''}`;
  btn.disabled = validCount === 0;
}

function handleBulkInput() {
  const text = document.getElementById('bulk-input').value;
  parsedBulkRows = parseImportText(text);
  renderImportPreview(parsedBulkRows);
}

function handleBulkImport() {
  const type     = document.getElementById('bulk-type').value;
  const category = document.getElementById('bulk-category').value;
  const valid    = parsedBulkRows.filter(r => r.valid);
  if (valid.length === 0) return;

  for (const row of valid) {
    addTransaction({ type, description: '', amount: row.amount, category, date: row.date });
  }
  saveTransactions();
  renderAll();

  document.getElementById('bulk-input').value = '';
  parsedBulkRows = [];
  renderImportPreview([]);

  const existing = document.getElementById('bulk-import-msg');
  if (existing) existing.remove();

  const msg = document.createElement('p');
  msg.id = 'bulk-import-msg';
  msg.textContent = `${valid.length} record${valid.length !== 1 ? 's' : ''} imported.`;
  document.getElementById('bulk-preview').appendChild(msg);
  setTimeout(() => { if (msg.parentNode) msg.remove(); }, 3000);
}

function switchTab(tab) {
  const isbulk = tab === 'bulk';
  document.getElementById('tab-single').classList.toggle('active', !isbulk);
  document.getElementById('tab-bulk').classList.toggle('active', isbulk);
  document.getElementById('panel-single').hidden = isbulk;
  document.getElementById('panel-bulk').hidden   = !isbulk;
}

function handleFilterChange() {
  renderAll();
}

function clearFilters() {
  document.getElementById('filter-category').value  = '';
  document.getElementById('filter-type').value      = '';
  document.getElementById('filter-date-from').value = '';
  document.getElementById('filter-date-to').value   = '';
  renderTransactionList();
}

// --- Init ---

function init() {
  loadTransactions();
  populateCategoryDropdown('expense');
  populateCategoryDropdown('expense', 'bulk-category');
  populateFilterCategoryDropdown();
  document.getElementById('input-date').value = new Date().toISOString().split('T')[0];

  document.getElementById('transaction-form').addEventListener('submit', handleFormSubmit);
  document.getElementById('input-type').addEventListener('change', handleTypeChange);
  document.getElementById('filter-category').addEventListener('change', handleFilterChange);
  document.getElementById('filter-type').addEventListener('change', handleFilterChange);
  document.getElementById('filter-date-from').addEventListener('change', handleFilterChange);
  document.getElementById('filter-date-to').addEventListener('change', handleFilterChange);
  document.getElementById('btn-clear-filters').addEventListener('click', clearFilters);

  document.getElementById('tab-single').addEventListener('click', () => switchTab('single'));
  document.getElementById('tab-bulk').addEventListener('click', () => switchTab('bulk'));
  document.getElementById('bulk-type').addEventListener('change', () => {
    populateCategoryDropdown(document.getElementById('bulk-type').value, 'bulk-category');
  });
  document.getElementById('bulk-input').addEventListener('input', handleBulkInput);
  document.getElementById('btn-bulk-import').addEventListener('click', handleBulkImport);

  renderAll();
}

document.addEventListener('DOMContentLoaded', init);
