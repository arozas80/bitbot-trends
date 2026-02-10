// Bitbot Command Center v2.0 - Application Logic

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
}

function initTabs() {
  const tabs = document.querySelectorAll('.nav-item');
  const title = document.getElementById('activeTabTitle');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Sidebar UI
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Content UI
      const targetId = tab.dataset.tab;
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      document.getElementById(`tab-${targetId}`).classList.add('active');
      
      // Title
      title.textContent = tab.querySelector('.nav-text').textContent;
    });
  });
}

// === API / Data Loading ===

async function loadMetrics() {
  try {
    const res = await fetch('metrics.json');
    const data = await res.json();
    
    // Core Metrics
    updateMetric('cpuUsage', 'cpuBar', data.cpu.usage);
    updateMetric('memUsage', 'memBar', data.memory.percent);
    updateMetric('diskUsage', 'diskBar', data.disk.percent);
    
    document.getElementById('hostname').textContent = data.hostname;
    document.getElementById('lastUpdate').textContent = `Sync: ${formatTime(data.generatedAt)}`;
    
    // Sessions
    if (data.sessions) {
      document.getElementById('sessionsGrid').innerHTML = data.sessions.map(s => `
        <div class="card ${s.status}">
          <div class="card-header">
            <div class="card-title">${s.key}</div>
            <div style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--accent-cyan);">${s.percent}%</div>
          </div>
          <div class="progress-container"><div class="progress-bar" style="width: ${s.percent}%"></div></div>
          <div style="display: flex; justify-content: space-between; font-size: 0.7rem; margin-top: 12px; color: var(--text-muted); font-family: var(--font-mono);">
            <span>${s.model}</span>
            <span>${s.usage} TOKENS</span>
          </div>
        </div>
      `).join('');
    }
  } catch (err) {
    console.error('Metrics error:', err);
    document.getElementById('systemStatusText').textContent = 'OFFLINE';
    document.querySelector('.status-dot').style.backgroundColor = '#f87171';
  }
}

async function loadLeads() {
  try {
    const res = await fetch('leads.json');
    const leads = await res.json();
    
    document.getElementById('leadsList').innerHTML = leads.map(l => {
      const isCritical = l.notes.includes('Lorem Ipsum') || l.notes.includes('abandonado');
      const badge = isCritical ? '<span style="color:#f87171">[CRÍTICO]</span>' : '<span style="color:var(--accent-cyan)">[PROSPECTO]</span>';
      
      return `
        <div class="list-item">
          <div class="item-icon">${isCritical ? '🚨' : '🎯'}</div>
          <div class="item-body">
            <div class="item-title">${badge} ${l.name}</div>
            <div class="item-meta">
              <span>${l.website}</span>
              <span>${l.phone}</span>
            </div>
            <div style="margin-top: 8px; font-size: 0.9rem; color: var(--text-secondary);">${l.notes}</div>
          </div>
          <button class="nav-item" style="padding: 8px 16px; border-radius: 8px; border: 1px solid var(--border-glow); font-size: 0.7rem;">Cerrar Venta</button>
        </div>
      `;
    }).join('');
  } catch (err) { console.error('Leads error:', err); }
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

async function loadProjects() {
  try {
    const res = await fetch('projects.json');
    const data = await res.json();
    
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
    
    // Update small activity list in overview if needed
  } catch (err) { console.error('Projects error:', err); }
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
    document.getElementById('remainingBalance').textContent = `$${(400000 - data.total).toLocaleString('es-CL')}`;
    
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

// === UI Helpers ===

function updateMetric(valId, barId, value) {
  document.getElementById(valId).textContent = `${value}%`;
  document.getElementById(barId).style.width = `${value}%`;
}

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
}
