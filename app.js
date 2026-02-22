// Bitbot Command Center v3.0 - Enhanced Expenses Dashboard
// Improvements: Categories, Filters, Charts, Personal/Servivet split

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  refreshData();
  setInterval(refreshData, 30000);
});

function refreshData() {
  loadMetrics();
  loadTrends();
  loadProjects();
  loadTasks();
  loadExpenses();
  loadAutomations();
  loadMissionControl();
  loadPlan2026();
}

async function loadPlan2026() {
  try {
    const res = await fetch('BITWARE_PLAN_2026.md');
    if (!res.ok) throw new Error('No se pudo cargar el plan');
    const markdown = await res.text();
    const converter = new showdown.Converter({
      headerLevelStart: 2, simplifiedAutoLink: true,
      strikethrough: true, tables: true, tasklists: true
    });
    document.getElementById('planContent').innerHTML = converter.makeHtml(markdown);
  } catch (err) {
    document.getElementById('planContent').innerHTML = `<p style="color: var(--status-error)">⚠️ ${err.message}</p>`;
  }
}

function initTabs() {
  const tabs = document.querySelectorAll('.nav-item');
  const title = document.getElementById('activeTabTitle');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const targetId = tab.dataset.tab;
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      document.getElementById(`tab-${targetId}`).classList.add('active');
      title.textContent = tab.querySelector('.nav-text').textContent;
    });
  });
}

// ==========================================
// EXPENSES - Enhanced
// ==========================================
let expensesData = null;

async function loadExpenses() {
  try {
    const res = await fetch('expenses.json');
    expensesData = await res.json();
    renderExpensesSummary();
    renderExpensesChart();
    renderCategoryBreakdown();
    renderExpensesList(expensesData.items);
    initExpenseFilters();
  } catch (err) { console.error('Expenses error:', err); }
}

function renderExpensesSummary() {
  const d = expensesData;
  const personal = d.items.filter(i => i.tipo === 'personal').reduce((s, i) => s + i.monto, 0);
  const servivet = d.items.filter(i => i.tipo === 'servivet').reduce((s, i) => s + i.monto, 0);
  const budget = 400000;

  document.getElementById('totalExpenses').textContent = d.total_fmt;
  document.getElementById('personalTotal').textContent = `$${personal.toLocaleString('es-CL')}`;
  document.getElementById('servivetTotal').textContent = `$${servivet.toLocaleString('es-CL')}`;

  const remaining = budget - personal;
  const remEl = document.getElementById('remainingBalance');
  remEl.textContent = `$${remaining.toLocaleString('es-CL')}`;
  remEl.style.color = remaining > 0 ? 'var(--accent-cyan)' : '#ef4444';

  // Budget progress
  const pct = Math.min((personal / budget) * 100, 100);
  document.getElementById('budgetBar').style.width = `${pct}%`;
  document.getElementById('budgetBar').style.background = pct > 80
    ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
    : 'linear-gradient(90deg, var(--accent-cyan), var(--accent-purple))';
  document.getElementById('budgetPct').textContent = `${Math.round(pct)}%`;
}

function renderExpensesChart() {
  const canvas = document.getElementById('expensesChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // Aggregate by date
  const byDate = {};
  expensesData.items.forEach(i => {
    byDate[i.fecha] = (byDate[i.fecha] || 0) + i.monto;
  });

  const sortedDates = Object.keys(byDate).sort();
  const labels = sortedDates.map(d => d.slice(5)); // MM-DD
  let cumulative = 0;
  const cumulativeData = sortedDates.map(d => { cumulative += byDate[d]; return cumulative; });
  const dailyData = sortedDates.map(d => byDate[d]);

  if (window._expChart) window._expChart.destroy();
  window._expChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Gasto diario',
          data: dailyData,
          backgroundColor: 'rgba(34, 211, 238, 0.3)',
          borderColor: 'rgba(34, 211, 238, 0.8)',
          borderWidth: 1,
          borderRadius: 4,
          order: 2
        },
        {
          label: 'Acumulado',
          data: cumulativeData,
          type: 'line',
          borderColor: '#a855f7',
          backgroundColor: 'rgba(168, 85, 247, 0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 3,
          pointBackgroundColor: '#a855f7',
          borderWidth: 2,
          order: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#94a3b8', font: { family: "'JetBrains Mono'" } } },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.dataset.label}: $${ctx.parsed.y.toLocaleString('es-CL')}`
          }
        }
      },
      scales: {
        x: { ticks: { color: '#64748b', font: { family: "'JetBrains Mono'", size: 10 } }, grid: { color: 'rgba(255,255,255,0.03)' } },
        y: {
          ticks: {
            color: '#64748b',
            font: { family: "'JetBrains Mono'", size: 10 },
            callback: v => `$${(v/1000).toFixed(0)}k`
          },
          grid: { color: 'rgba(255,255,255,0.05)' }
        }
      }
    }
  });
}

function renderCategoryBreakdown() {
  const cats = {};
  expensesData.items.forEach(i => {
    const c = i.categoria || '📌 Otros';
    cats[c] = (cats[c] || 0) + i.monto;
  });

  const sorted = Object.entries(cats).sort((a, b) => b[1] - a[1]);
  const total = expensesData.total;
  const colors = ['#22d3ee', '#a855f7', '#f472b6', '#4ade80', '#fbbf24', '#ef4444', '#94a3b8'];

  document.getElementById('categoryBreakdown').innerHTML = sorted.map(([cat, val], idx) => {
    const pct = ((val / total) * 100).toFixed(1);
    const color = colors[idx % colors.length];
    return `
      <div class="cat-item" data-cat="${escapeHtml(cat)}" style="cursor:pointer;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <span style="font-size:0.9rem;">${cat}</span>
          <span style="font-family:var(--font-mono); color:${color}; font-weight:700;">$${val.toLocaleString('es-CL')}</span>
        </div>
        <div class="progress-container" style="margin-top:0;">
          <div class="progress-bar" style="width:${pct}%; background:${color};"></div>
        </div>
        <div style="font-size:0.7rem; color:var(--text-muted); margin-top:4px; font-family:var(--font-mono);">${pct}% del total</div>
      </div>`;
  }).join('');

  // Click to filter
  document.querySelectorAll('.cat-item').forEach(el => {
    el.addEventListener('click', () => {
      const cat = el.dataset.cat;
      const filtered = expensesData.items.filter(i => (i.categoria || '📌 Otros') === cat);
      renderExpensesList(filtered, cat);
    });
  });
}

function initExpenseFilters() {
  const filterTipo = document.getElementById('filterTipo');
  const filterSearch = document.getElementById('filterSearch');
  const filterReset = document.getElementById('filterReset');

  if (!filterTipo) return;

  const applyFilters = () => {
    let items = [...expensesData.items];
    const tipo = filterTipo.value;
    const search = filterSearch.value.toLowerCase().trim();

    if (tipo !== 'all') items = items.filter(i => i.tipo === tipo);
    if (search) items = items.filter(i => i.descripcion.toLowerCase().includes(search) || (i.categoria || '').toLowerCase().includes(search));

    renderExpensesList(items);
  };

  filterTipo.addEventListener('change', applyFilters);
  filterSearch.addEventListener('input', applyFilters);
  filterReset.addEventListener('click', () => {
    filterTipo.value = 'all';
    filterSearch.value = '';
    renderExpensesList(expensesData.items);
  });
}

function renderExpensesList(items, activeCategory) {
  const title = activeCategory
    ? `// DETALLE: ${activeCategory} (${items.length})`
    : `// TODOS LOS GASTOS (${items.length})`;

  document.getElementById('expensesListTitle').innerHTML = `${title}${activeCategory ? ' <button id="clearCatFilter" style="background:none;border:1px solid var(--accent-cyan);color:var(--accent-cyan);padding:2px 10px;border-radius:8px;cursor:pointer;font-size:0.75rem;margin-left:12px;">✕ Limpiar</button>' : ''}`;

  if (activeCategory) {
    setTimeout(() => {
      const btn = document.getElementById('clearCatFilter');
      if (btn) btn.addEventListener('click', () => renderExpensesList(expensesData.items));
    }, 50);
  }

  document.getElementById('expensesList').innerHTML = items.map(i => {
    const tipoBadge = i.tipo === 'servivet'
      ? '<span style="font-size:0.65rem;padding:2px 6px;background:rgba(168,85,247,0.15);color:#a855f7;border-radius:4px;font-family:var(--font-mono);">SERVIVET</span>'
      : '<span style="font-size:0.65rem;padding:2px 6px;background:rgba(34,211,238,0.15);color:var(--accent-cyan);border-radius:4px;font-family:var(--font-mono);">PERSONAL</span>';
    const catBadge = i.categoria ? `<span style="font-size:0.7rem;color:var(--text-muted);">${i.categoria}</span>` : '';

    return `
      <div class="list-item">
        <div class="item-icon">🧾</div>
        <div class="item-body">
          <div class="item-title">${escapeHtml(i.descripcion)}</div>
          <div class="item-meta">
            <span>${i.fecha}</span>
            ${catBadge}
            ${tipoBadge}
            ${i.factura ? `<span>DOC #${escapeHtml(i.factura)}</span>` : ''}
            ${i.comprobante && i.comprobante !== '#' ? `<a href="${escapeHtml(i.comprobante)}" target="_blank" style="color:var(--accent-cyan);text-decoration:none;">📎 Ver</a>` : ''}
          </div>
        </div>
        <div style="font-family:var(--font-mono);font-weight:700;color:var(--accent-cyan);white-space:nowrap;">${i.monto_fmt}</div>
      </div>`;
  }).join('');
}

// ==========================================
// OTHER TABS (unchanged logic)
// ==========================================
async function loadMetrics() {
  try {
    const res = await fetch('metrics.json');
    const data = await res.json();
    updateMetric('cpuUsage', 'cpuBar', data.cpu.usage);
    updateMetric('memUsage', 'memBar', data.memory.percent);
    updateMetric('diskUsage', 'diskBar', data.disk.percent);
    document.getElementById('hostname').textContent = data.hostname;
    document.getElementById('lastUpdate').textContent = `Sincronizado: ${formatTime(data.generatedAt)}`;

    if (data.sessions && data.sessions.length > 0) {
      document.getElementById('sessionsGrid').innerHTML = data.sessions.map(s => `
        <div class="card ${s.status}">
          <div class="card-header">
            <div class="card-title" title="${s.key}">${s.key}</div>
            <div style="font-family:var(--font-mono);font-size:0.8rem;color:var(--accent-cyan);">${s.percent}%</div>
          </div>
          <div class="progress-container"><div class="progress-bar" style="width:${s.percent}%"></div></div>
          <div style="display:flex;justify-content:space-between;font-size:0.7rem;margin-top:12px;color:var(--text-muted);font-family:var(--font-mono);">
            <span>${s.model}</span><span>${s.usage} TOKENS</span>
          </div>
        </div>`).join('');
    } else {
      document.getElementById('sessionsGrid').innerHTML = '<div class="card"><p style="color:var(--text-muted)">Esperando datos de sesiones...</p></div>';
    }
  } catch (err) {
    console.error('Metrics error:', err);
    document.getElementById('systemStatusText').textContent = 'ERROR';
  }
}

async function loadProjects() {
  try {
    const res = await fetch('projects.json');
    const data = await res.json();
    document.getElementById('projectsGrid').innerHTML = data.projects.map(p => `
      <div class="card">
        <div class="card-header">
          <div class="item-title">${p.icon} ${p.name}</div>
          <span style="font-size:0.6rem;padding:2px 8px;background:rgba(34,211,238,0.1);color:var(--accent-cyan);border-radius:4px;font-family:var(--font-mono);">${p.status.toUpperCase()}</span>
        </div>
        <p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:16px;">${p.description}</p>
        <div style="border-top:1px solid var(--border-standard);padding-top:12px;">
          ${p.milestones.slice(-2).map(m => `
            <div style="font-size:0.75rem;margin-bottom:4px;display:flex;gap:8px;">
              <span style="color:var(--text-muted);font-family:var(--font-mono);">${m.date}</span>
              <span style="color:var(--text-secondary);">→ ${m.text}</span>
            </div>`).join('')}
        </div>
      </div>`).join('');

    document.getElementById('activityList').innerHTML = data.activity.map(a => `
      <div class="list-item">
        <div class="item-icon">${getActivityIcon(a.type)}</div>
        <div class="item-body">
          <div class="item-title">${a.text}</div>
          <div class="item-meta">${a.date}</div>
        </div>
      </div>`).join('');
  } catch (err) { console.error('Projects error:', err); }
}

async function loadTrends() {
  if (typeof trendsData === 'undefined') return;
  document.getElementById('currentDate').textContent = trendsData.currentDate;
  document.getElementById('executiveSummary').textContent = trendsData.executiveSummary;
  document.getElementById('trendsGrid').innerHTML = trendsData.trends.map(t => `
    <div class="card">
      <div class="card-icon" style="margin-bottom:16px;">${t.icon}</div>
      <div class="card-title" style="color:var(--accent-cyan);font-family:var(--font-mono);font-size:0.7rem;">TREND #${t.id}</div>
      <div class="item-title" style="margin:8px 0 12px 0;">${t.title}</div>
      <p style="font-size:0.85rem;color:var(--text-secondary);line-height:1.5;">${t.description}</p>
    </div>`).join('');
}

async function loadTasks() {
  try {
    const res = await fetch('tasks.json');
    const data = await res.json();
    document.getElementById('todoList').innerHTML = data.todos.map(t => `
      <div class="list-item">
        <div class="item-icon">${t.status === 'urgent' ? '🚨' : '📌'}</div>
        <div class="item-body">
          <div class="item-title" style="${t.status === 'done' ? 'text-decoration:line-through;opacity:0.5' : ''}">${t.text}</div>
          <div class="item-meta">PRIORIDAD: ${t.status.toUpperCase()}</div>
        </div>
      </div>`).join('');
    document.getElementById('cronList').innerHTML = data.cronJobs.map(c => `
      <div class="list-item">
        <div class="item-icon">⏰</div>
        <div class="item-body">
          <div class="item-title">${c.name}</div>
          <div class="item-meta">${c.schedule}</div>
        </div>
      </div>`).join('');
  } catch (err) { console.error('Tasks error:', err); }
}

async function loadAutomations() {
  try {
    const res = await fetch('cron.json');
    const data = await res.json();
    const jobs = data.jobs || [];
    const maxErrors = jobs.reduce((m, j) => Math.max(m, j.state?.consecutiveErrors || 0), 0);
    document.getElementById('cronMaxErrors').textContent = String(maxErrors);
    const bad = jobs.filter(j => (j.state?.lastStatus && j.state.lastStatus !== 'ok') || (j.state?.consecutiveErrors || 0) > 0);
    document.getElementById('cronHealth').textContent = bad.length ? `ATENCIÓN (${bad.length})` : 'OK';

    document.getElementById('cronJobsList').innerHTML = jobs
      .sort((a, b) => String(a.state?.nextRunAt || '').localeCompare(String(b.state?.nextRunAt || '')))
      .map(j => {
        const status = (j.state?.lastStatus || 'unknown').toUpperCase();
        const err = j.state?.consecutiveErrors || 0;
        const badgeColor = status === 'OK' && err === 0 ? 'rgba(74,222,128,0.12)' : 'rgba(251,191,36,0.12)';
        const badgeText = status === 'OK' && err === 0 ? '#4ade80' : '#fbbf24';
        return `
        <div class="list-item">
          <div class="item-icon">⏰</div>
          <div class="item-body">
            <div class="item-title">${escapeHtml(j.name)}</div>
            <div class="item-meta">
              <span style="font-family:var(--font-mono)">${escapeHtml(j.schedule?.expr || j.summary || '—')}</span>
              <span>next: ${fmtShort(j.state?.nextRunAt)}</span>
              <span>last: ${fmtShort(j.state?.lastRunAt)} (${(j.state?.lastDurationMs ?? 0)}ms)</span>
            </div>
          </div>
          <div style="font-family:var(--font-mono);font-weight:800;padding:6px 10px;border-radius:10px;background:${badgeColor};color:${badgeText};border:1px solid rgba(255,255,255,0.06);">
            ${status}${err ? ` · e${err}` : ''}
          </div>
        </div>`;
      }).join('');
  } catch (err) {
    console.error('Automations error:', err);
    const el = document.getElementById('cronJobsList');
    if (el) el.innerHTML = `<div class="list-item"><div class="item-body"><div class="item-title">No se pudo cargar cron.json</div></div></div>`;
  }
}

async function loadMissionControl() {
  try {
    const ceRes = await fetch('content_engine.json');
    const ce = await ceRes.json();
    document.getElementById('ceIdeas').textContent = ce.ideas?.count ?? '--';
    document.getElementById('ceDrafts').textContent = ce.drafts?.count ?? '--';
    document.getElementById('ceQueue').textContent = ce.queue?.pending ?? '--';
    document.getElementById('ceNext').textContent = ce.queue?.nextItem ? (ce.queue.nextItem.title || ce.queue.nextItem.date || 'pendiente') : '—';

    const prRes = await fetch('priorities.json');
    const pr = await prRes.json();
    const latest = pr.latest;
    document.getElementById('prioLatest').innerHTML = latest ? `
      <div style="font-family:var(--font-mono);color:var(--text-muted);font-size:0.8rem;margin-bottom:10px;">${escapeHtml(latest.date)}</div>
      <div style="margin-bottom:10px;"><strong style="color:var(--accent-cyan)">AM</strong>: ${escapeHtml(latest.am)}</div>
      <div><strong style="color:var(--accent-purple)">PM</strong>: ${escapeHtml(latest.pm || '—')}</div>
    ` : '<p style="color:var(--text-muted)">Aún no hay registro.</p>';

    document.getElementById('prioList').innerHTML = (pr.last7 || []).slice().reverse().map(item => `
      <div class="list-item">
        <div class="item-icon">📌</div>
        <div class="item-body">
          <div class="item-title" style="font-family:var(--font-mono);color:var(--accent-cyan);">${escapeHtml(item.date)}</div>
          <div class="item-meta" style="flex-direction:column;gap:6px;align-items:flex-start;">
            <div><span style="color:var(--text-muted);font-family:var(--font-mono);">AM</span> ${escapeHtml(item.am)}</div>
            <div><span style="color:var(--text-muted);font-family:var(--font-mono);">PM</span> ${escapeHtml(item.pm || '—')}</div>
          </div>
        </div>
      </div>`).join('');
  } catch (err) { console.error('Mission Control error:', err); }
}

// === UI Helpers ===
function updateMetric(valId, barId, value) {
  document.getElementById(valId).textContent = `${value}%`;
  document.getElementById(barId).style.width = `${value}%`;
}

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
}

function fmtShort(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('es-CL', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(s) {
  return String(s ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

function getActivityIcon(type) {
  const icons = { deploy: '🚀', config: '⚙️', backup: '💾', setup: '🔧', security: '🔒', update: '📦' };
  return icons[type] || '📌';
}
