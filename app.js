// Bitbot Command Center - Main Application

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  refreshData();
  // Auto-refresh cada 30 segundos
  setInterval(refreshData, 30000);
});

function refreshData() {
  loadMetrics();
  loadTrends();
  loadProjects();
  loadTasks();
  loadExpenses();
}

// === Tab Navigation ===
function initTabs() {
  const tabs = document.querySelectorAll('.nav-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
    });
  });
}

// === Load Metrics ===
async function loadMetrics() {
  try {
    const res = await fetch('metrics.json');
    const data = await res.json();
    
    document.getElementById('cpuUsage').textContent = `${data.cpu.usage}%`;
    document.getElementById('cpuBar').style.width = `${data.cpu.usage}%`;
    
    document.getElementById('memUsage').textContent = `${data.memory.percent}%`;
    document.getElementById('memBar').style.width = `${data.memory.percent}%`;
    
    document.getElementById('diskUsage').textContent = `${data.disk.percent}%`;
    document.getElementById('diskBar').style.width = `${data.disk.percent}%`;
    
    document.getElementById('uptime').textContent = data.uptime.formatted;
    
    // Sessions / Tokens
    if (data.sessions) {
      const sessionsHtml = data.sessions.map(s => `
        <div class="metric-card ${s.status}">
          <div class="metric-info" style="width: 100%">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span class="metric-label" style="font-size: 0.8rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 180px;">${s.key}</span>
              <span class="metric-value" style="font-size: 0.9rem;">${s.percent}%</span>
            </div>
            <div class="metric-bar"><div class="metric-fill" style="width: ${s.percent}%"></div></div>
            <div style="display: flex; justify-content: space-between; font-size: 0.7rem; margin-top: 6px; color: var(--text-muted);">
              <span>${s.model}</span>
              <span>${s.usage} tokens</span>
            </div>
          </div>
        </div>
      `).join('');
      document.getElementById('sessionsGrid').innerHTML = sessionsHtml;
    }

    const servicesHtml = Object.entries(data.services).map(([name, status]) => `
      <div class="service-badge">
        <span class="dot ${status === 'active' ? 'active' : 'inactive'}"></span>
        <span>${name}</span>
      </div>
    `).join('');
    document.getElementById('servicesGrid').innerHTML = servicesHtml;
    
    document.getElementById('hostname').textContent = data.hostname;
    document.getElementById('metricsTime').textContent = formatDateTime(data.generatedAt);
    document.getElementById('lastUpdate').textContent = `Actualizado ${getTimeAgo(new Date(data.generatedAt))}`;
    
  } catch (err) {
    console.error('Error loading metrics:', err);
    document.getElementById('systemStatus').textContent = '● Offline';
    document.getElementById('systemStatus').classList.remove('online');
    document.getElementById('systemStatus').classList.add('offline');
  }
}

// === Load Trends ===
function loadTrends() {
  if (typeof trendsData === 'undefined') return;
  
  document.getElementById('currentDate').textContent = trendsData.currentDate;
  document.getElementById('executiveSummary').textContent = trendsData.executiveSummary;
  
  const trendsHtml = trendsData.trends.map(trend => `
    <article class="trend-card">
      <div class="trend-number">TREND #${String(trend.id).padStart(2, '0')}</div>
      <div class="trend-icon">${trend.icon}</div>
      <h3>${trend.title}</h3>
      <p>${trend.description}</p>
    </article>
  `).join('');
  document.getElementById('trendsGrid').innerHTML = trendsHtml;
  
  document.getElementById('impactContent').innerHTML = `
    <p><span class="opportunity">🎯 Oportunidad:</span> ${trendsData.impact.opportunity}</p>
    <p style="margin-top: 12px;"><span class="action">⚡ Acción Sugerida:</span> ${trendsData.impact.action}</p>
  `;
}

// === Load Projects ===
async function loadProjects() {
  try {
    const res = await fetch('projects.json');
    const data = await res.json();
    
    const projectsHtml = data.projects.map(project => `
      <div class="project-card">
        <div class="project-header">
          <span class="project-icon">${project.icon}</span>
          <span class="project-name">${project.name}</span>
          <span class="project-status">${project.status.toUpperCase()}</span>
        </div>
        <p class="project-desc">${project.description}</p>
        <div class="project-milestones">
          ${project.milestones.slice(-3).map(m => `
            <div class="milestone">
              <span class="date">${formatShortDate(m.date)}</span>
              <span class="text">${m.text}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');
    document.getElementById('projectsGrid').innerHTML = projectsHtml;
    
    const activityHtml = data.activity.slice(0, 5).map(a => `
      <div class="activity-item">
        <span class="icon">${getActivityIcon(a.type)}</span>
        <span class="text">${a.text}</span>
        <span class="date">${formatShortDate(a.date)}</span>
      </div>
    `).join('');
    document.getElementById('activityList').innerHTML = activityHtml;
    
  } catch (err) {
    console.error('Error loading projects:', err);
  }
}

// === Load Tasks & Cron ===
async function loadTasks() {
  try {
    const res = await fetch('tasks.json');
    const data = await res.json();
    
    const todoHtml = data.todos.map(todo => `
      <div class="activity-item">
        <span class="icon">${todo.status === 'urgent' ? '🚨' : '📌'}</span>
        <span class="text" style="${todo.status === 'done' ? 'text-decoration: line-through; opacity: 0.5' : ''}">${todo.text}</span>
        <span class="date">${todo.status.toUpperCase()}</span>
      </div>
    `).join('');
    document.getElementById('todoList').innerHTML = todoHtml || '<p class="loading">No hay tareas pendientes</p>';
    
    const cronHtml = data.cronJobs.map(job => `
      <div class="activity-item">
        <span class="icon">⏰</span>
        <span class="text">${job.name}</span>
        <span class="date">${job.schedule}</span>
      </div>
    `).join('');
    document.getElementById('cronList').innerHTML = cronHtml || '<p class="loading">No hay crons configurados</p>';
    
  } catch (err) {
    console.error('Error loading tasks:', err);
  }
}

// === Load Expenses ===
async function loadExpenses() {
  try {
    const res = await fetch('expenses.json');
    const data = await res.json();
    
    const budget = 400000;
    const spent = data.total || 0;
    const remaining = budget - spent;

    document.getElementById('totalExpenses').textContent = data.total_fmt;
    document.getElementById('remainingBalance').textContent = `$${remaining.toLocaleString('es-CL')}`;
    
    const expensesHtml = data.items.map(item => `
      <div class="activity-item" style="cursor: pointer; display: flex; align-items: center; gap: 16px; padding: 16px;" onclick="window.open('${item.comprobante}', '_blank')">
        <span class="icon" style="font-size: 1.5rem;">🧾</span>
        <div class="text" style="flex: 1; min-width: 0;">
           <div style="font-weight: 600; color: var(--text-primary); white-space: normal; word-break: break-word;">${item.descripcion}</div>
           <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">Doc: #${item.factura}</div>
        </div>
        <div style="text-align: right; min-width: 100px;">
           <div style="font-family: var(--font-mono); font-weight: 700; color: var(--accent-primary); font-size: 1.1rem;">${item.monto_fmt}</div>
           <div class="date" style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;">${item.fecha}</div>
        </div>
      </div>
    `).join('');
    
    document.getElementById('expensesList').innerHTML = expensesHtml || '<p class="loading">No hay gastos registrados</p>';
    
  } catch (err) {
    console.error('Error loading expenses:', err);
  }
}

// === Helpers ===
function getTimeAgo(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'hace un momento';
  if (diffMins < 60) return `hace ${diffMins} min`;
  if (diffHours < 24) return `hace ${diffHours}h`;
  if (diffDays === 1) return 'ayer';
  return `hace ${diffDays} días`;
}

function formatDateTime(isoString) {
  const date = new Date(isoString);
  return date.toLocaleString('es-CL', { 
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
  });
}

function formatShortDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
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
