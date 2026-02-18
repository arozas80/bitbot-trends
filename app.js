// Bitbot Command Center v2.0.5 - Corrected UI Mapping

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  refreshData();
  setInterval(refreshData, 30000); // 30s refresh
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
      headerLevelStart: 2,
      simplifiedAutoLink: true,
      strikethrough: true,
      tables: true,
      tasklists: true
    });
    const html = converter.makeHtml(markdown);
    document.getElementById('planContent').innerHTML = html;
  } catch (err) {
    console.error('Plan 2026 error:', err);
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

// === Data Loading Functions ===

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
            <div style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--accent-cyan);">${s.percent}%</div>
          </div>
          <div class="progress-container"><div class="progress-bar" style="width: ${s.percent}%"></div></div>
          <div style="display: flex; justify-content: space-between; font-size: 0.7rem; margin-top: 12px; color: var(--text-muted); font-family: var(--font-mono);">
            <span>${s.model}</span>
            <span>${s.usage} TOKENS</span>
          </div>
        </div>
      `).join('');
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
    
    // 1. Projects Grid
    document.getElementById('projectsGrid').innerHTML = data.projects.map(p => `
      <div class="card">
        <div class="card-header">
           <div class="item-title">${p.icon} ${p.name}</div>
           <span style="font-size: 0.6rem; padding: 2px 8px; background: rgba(34, 211, 238, 0.1); color: var(--accent-cyan); border-radius: 4px; font-family: var(--font-mono);">${p.status.toUpperCase()}</span>
        </div>
        <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 16px;">${p.description}</p>
        <div style="border-top: 1px solid var(--border-standard); padding-top: 12px;">
           ${p.milestones.slice(-2).map(m => `
             <div style="font-size: 0.75rem; margin-bottom: 4px; display: flex; gap: 8px;">
               <span style="color: var(--text-muted); font-family: var(--font-mono);">${m.date}</span>
               <span style="color: var(--text-secondary);">→ ${m.text}</span>
             </div>
           `).join('')}
        </div>
      </div>
    `).join('');
    
    // 2. Activity List (Overview) - FIXING CLAS NAMES HERE
    document.getElementById('activityList').innerHTML = data.activity.map(a => `
      <div class="list-item">
        <div class="item-icon">${getActivityIcon(a.type)}</div>
        <div class="item-body">
          <div class="item-title">${a.text}</div>
          <div class="item-meta">${a.date}</div>
        </div>
      </div>
    `).join('');
    
  } catch (err) { console.error('Projects error:', err); }
}

async function loadTrends() {
  if (typeof trendsData === 'undefined') return;
  document.getElementById('currentDate').textContent = trendsData.currentDate;
  document.getElementById('executiveSummary').textContent = trendsData.executiveSummary;
  document.getElementById('trendsGrid').innerHTML = trendsData.trends.map(t => `
    <div class="card">
      <div class="card-icon" style="margin-bottom: 16px;">${t.icon}</div>
      <div class="card-title" style="color: var(--accent-cyan); font-family: var(--font-mono); font-size: 0.7rem;">TREND #${t.id}</div>
      <div class="item-title" style="margin: 8px 0 12px 0;">${t.title}</div>
      <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5;">${t.description}</p>
    </div>
  `).join('');
}

async function loadTasks() {
  try {
    const res = await fetch('tasks.json');
    const data = await res.json();
    document.getElementById('todoList').innerHTML = data.todos.map(t => `
      <div class="list-item">
        <div class="item-icon">${t.status === 'urgent' ? '🚨' : '📌'}</div>
        <div class="item-body">
          <div class="item-title" style="${t.status === 'done' ? 'text-decoration: line-through; opacity: 0.5' : ''}">${t.text}</div>
          <div class="item-meta">PRIORIDAD: ${t.status.toUpperCase()}</div>
        </div>
      </div>
    `).join('');
    document.getElementById('cronList').innerHTML = data.cronJobs.map(c => `
       <div class="list-item">
        <div class="item-icon">⏰</div>
        <div class="item-body">
          <div class="item-title">${c.name}</div>
          <div class="item-meta">SKELETON: ${c.schedule}</div>
        </div>
      </div>
    `).join('');
  } catch (err) { console.error('Tasks error:', err); }
}

async function loadExpenses() {
  try {
    const res = await fetch('expenses.json');
    const data = await res.json();
    document.getElementById('totalExpenses').textContent = data.total_fmt;
    document.getElementById('remainingBalance').textContent = `$${(800000 - data.total).toLocaleString('es-CL')}`;
    document.getElementById('expensesList').innerHTML = data.items.map(i => `
       <div class="list-item">
        <div class="item-icon">🧾</div>
        <div class="item-body">
          <div class="item-title">${i.descripcion}</div>
          <div class="item-meta">DOC: #${i.factura} | ${i.fecha}</div>
        </div>
        <div style="font-family: var(--font-mono); font-weight: 700; color: var(--accent-cyan);">${i.monto_fmt}</div>
      </div>
    `).join('');
  } catch (err) { console.error('Expenses error:', err); }
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
        const badgeColor = status === 'OK' && err === 0 ? 'rgba(74, 222, 128, 0.12)' : 'rgba(251, 191, 36, 0.12)';
        const badgeText = status === 'OK' && err === 0 ? '#4ade80' : '#fbbf24';
        return `
        <div class="list-item">
          <div class="item-icon">⏰</div>
          <div class="item-body">
            <div class="item-title">${escapeHtml(j.name)}</div>
            <div class="item-meta">
              <span style="font-family: var(--font-mono)">${escapeHtml(j.schedule?.expr || j.summary || '—')}</span>
              <span>next: ${fmtShort(j.state?.nextRunAt)}</span>
              <span>last: ${fmtShort(j.state?.lastRunAt)} (${(j.state?.lastDurationMs ?? 0)}ms)</span>
            </div>
          </div>
          <div style="font-family: var(--font-mono); font-weight: 800; padding: 6px 10px; border-radius: 10px; background: ${badgeColor}; color: ${badgeText}; border: 1px solid rgba(255,255,255,0.06);">
            ${status}${err ? ` · e${err}` : ''}
          </div>
        </div>`;
      })
      .join('');
  } catch (err) {
    console.error('Automations error:', err);
    const el = document.getElementById('cronJobsList');
    if (el) el.innerHTML = `<div class="list-item"><div class="item-body"><div class="item-title">No se pudo cargar cron.json</div></div></div>`;
  }
}

async function loadMissionControl() {
  try {
    // Content Engine
    const ceRes = await fetch('content_engine.json');
    const ce = await ceRes.json();
    document.getElementById('ceIdeas').textContent = ce.ideas?.count ?? '--';
    document.getElementById('ceDrafts').textContent = ce.drafts?.count ?? '--';
    document.getElementById('ceQueue').textContent = ce.queue?.pending ?? '--';
    document.getElementById('ceNext').textContent = ce.queue?.nextItem ? (ce.queue.nextItem.title || ce.queue.nextItem.date || 'pendiente') : '—';

    // Priorities
    const prRes = await fetch('priorities.json');
    const pr = await prRes.json();

    const latest = pr.latest;
    document.getElementById('prioLatest').innerHTML = latest ? `
      <div style="font-family: var(--font-mono); color: var(--text-muted); font-size: 0.8rem; margin-bottom: 10px;">${escapeHtml(latest.date)}</div>
      <div style="margin-bottom: 10px;"><strong style="color: var(--accent-cyan)">AM</strong>: ${escapeHtml(latest.am)}</div>
      <div><strong style="color: var(--accent-purple)">PM</strong>: ${escapeHtml(latest.pm || '—')}</div>
    ` : '<p style="color: var(--text-muted)">Aún no hay registro.</p>';

    document.getElementById('prioList').innerHTML = (pr.last7 || []).slice().reverse().map(item => `
      <div class="list-item">
        <div class="item-icon">📌</div>
        <div class="item-body">
          <div class="item-title" style="font-family: var(--font-mono); color: var(--accent-cyan);">${escapeHtml(item.date)}</div>
          <div class="item-meta" style="flex-direction: column; gap: 6px; align-items:flex-start;">
            <div><span style="color: var(--text-muted); font-family: var(--font-mono);">AM</span> ${escapeHtml(item.am)}</div>
            <div><span style="color: var(--text-muted); font-family: var(--font-mono);">PM</span> ${escapeHtml(item.pm || '—')}</div>
          </div>
        </div>
      </div>
    `).join('');

  } catch (err) {
    console.error('Mission Control error:', err);
  }
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
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function getActivityIcon(type) {
  const icons = {
    deploy: '🚀',
    config: '⚙️',
    backup: '💾',
    setup: '🔧',
    security: '🔒',
    update: '📦'
  };
  return icons[type] || '📌';
}
