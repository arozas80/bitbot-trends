// Bitbot Command Center - Main Application

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  loadMetrics();
  loadTrends();
  loadProjects();
});

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
    
    // CPU
    document.getElementById('cpuUsage').textContent = `${data.cpu.usage}%`;
    document.getElementById('cpuBar').style.width = `${data.cpu.usage}%`;
    
    // Memory
    document.getElementById('memUsage').textContent = `${data.memory.percent}%`;
    document.getElementById('memBar').style.width = `${data.memory.percent}%`;
    
    // Disk
    document.getElementById('diskUsage').textContent = `${data.disk.percent}%`;
    document.getElementById('diskBar').style.width = `${data.disk.percent}%`;
    
    // Uptime
    document.getElementById('uptime').textContent = data.uptime.formatted;
    
    // Services
    const servicesHtml = Object.entries(data.services).map(([name, status]) => `
      <div class="service-badge">
        <span class="dot ${status === 'active' ? 'active' : 'inactive'}"></span>
        <span>${name}</span>
      </div>
    `).join('');
    document.getElementById('servicesGrid').innerHTML = servicesHtml;
    
    // Hostname & Time
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
    
    // Projects Grid
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
    
    // Activity List
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
