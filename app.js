// Bitbot Trends - Main Application
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  renderLastUpdate();
  renderCurrentDate();
  renderTrends();
  renderExecutiveSummary();
  renderImpact();
  renderArchive();
}

function renderLastUpdate() {
  const element = document.getElementById('lastUpdate');
  const date = new Date(trendsData.lastUpdate);
  const timeAgo = getTimeAgo(date);
  element.textContent = `Actualizado ${timeAgo}`;
}

function renderCurrentDate() {
  const element = document.getElementById('currentDate');
  element.textContent = trendsData.currentDate;
}

function renderTrends() {
  const grid = document.getElementById('trendsGrid');
  grid.innerHTML = trendsData.trends.map(trend => `
    <article class="trend-card">
      <div class="trend-number">TREND #${String(trend.id).padStart(2, '0')}</div>
      <div class="trend-icon">${trend.icon}</div>
      <h3>${trend.title}</h3>
      <p>${trend.description}</p>
    </article>
  `).join('');
}

function renderExecutiveSummary() {
  const element = document.getElementById('executiveSummary');
  element.textContent = trendsData.executiveSummary;
}

function renderImpact() {
  const element = document.getElementById('impactContent');
  element.innerHTML = `
    <p><span class="opportunity">🎯 Oportunidad:</span> ${trendsData.impact.opportunity}</p>
    <p style="margin-top: 12px;"><span class="action">⚡ Acción Sugerida:</span> ${trendsData.impact.action}</p>
  `;
}

function renderArchive() {
  const list = document.getElementById('archiveList');
  
  if (trendsData.archive.length === 0) {
    list.innerHTML = '<p class="loading">No hay archivos históricos aún</p>';
    return;
  }
  
  list.innerHTML = trendsData.archive.map(item => `
    <div class="archive-item" onclick="loadArchive('${item.file}')">
      <span class="date">${formatDate(item.date)}</span>
      <span class="preview">${item.preview}</span>
      <span class="arrow">→</span>
    </div>
  `).join('');
}

function loadArchive(file) {
  // Future: Load historical data
  console.log('Loading archive:', file);
}

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

function formatDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  const options = { day: 'numeric', month: 'short', year: 'numeric' };
  return date.toLocaleDateString('es-CL', options);
}

// Matrix effect (subtle)
function initMatrix() {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;opacity:0.02;z-index:0';
  document.body.prepend(canvas);
  
  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resize();
  window.addEventListener('resize', resize);
  
  const chars = '01';
  const fontSize = 14;
  const columns = Math.floor(canvas.width / fontSize);
  const drops = Array(columns).fill(1);
  
  function draw() {
    ctx.fillStyle = 'rgba(10, 10, 15, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#22d3ee';
    ctx.font = `${fontSize}px monospace`;
    
    for (let i = 0; i < drops.length; i++) {
      const char = chars[Math.floor(Math.random() * chars.length)];
      ctx.fillText(char, i * fontSize, drops[i] * fontSize);
      if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i]++;
    }
    requestAnimationFrame(draw);
  }
  draw();
}

// Uncomment for matrix effect:
// initMatrix();
