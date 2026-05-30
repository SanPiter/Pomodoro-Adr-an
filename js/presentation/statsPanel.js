import { calcStreak, getWeekStart, getLast21Days, getLast7DaysHours, aggregateByProject } from '../business/statsService.js';

let dailyChart = null;
let weeklyChart = null;
let totalChart = null;

export function renderStats(history, projects, config) {
  const weekStart = getWeekStart();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayPoms = history.filter(h => h.ts >= todayStart.getTime()).length;
  const weekPoms = history.filter(h => h.ts >= weekStart).length;
  const totalPoms = history.length;
  const weekHours = (weekPoms * config.pomo / 60).toFixed(1);
  const totalHours = (totalPoms * config.pomo / 60).toFixed(1);
  const streak = calcStreak(history);

  document.getElementById('stats-grid').innerHTML = `
    <div class="metric-card"><div class="metric-label">Hoy</div><div class="metric-value">${todayPoms}</div><div class="metric-sub">pomodoros</div></div>
    <div class="metric-card"><div class="metric-label">Esta semana</div><div class="metric-value">${weekHours}h</div><div class="metric-sub">${weekPoms} sesiones</div></div>
    <div class="metric-card"><div class="metric-label">Total acumulado</div><div class="metric-value">${totalHours}h</div><div class="metric-sub">${totalPoms} sesiones</div></div>
    <div class="metric-card"><div class="metric-label">Racha actual</div><div class="metric-value">${streak}</div><div class="metric-sub">días consecutivos</div></div>
  `;

  const byProjWeek = aggregateByProject(history, projects, h => h.ts >= weekStart);
  const byProjTotal = aggregateByProject(history, projects);

  weeklyChart = renderHorizontalChart('weekly-bars', weeklyChart, byProjWeek, projects, config.pomo);
  totalChart = renderHorizontalChart('total-bars', totalChart, byProjTotal, projects, config.pomo);

  const last21 = getLast21Days(history);
  document.getElementById('streak-row').innerHTML = last21.map(d =>
    `<div class="streak-day${d.hasWork ? ' active' : ''}${d.isToday ? ' today' : ''}" title="${d.label}">${d.label}</div>`
  ).join('');

  const last7 = getLast7DaysHours(history, config.pomo);
  if (dailyChart) { dailyChart.destroy(); dailyChart = null; }
  const ctx = document.getElementById('daily-chart');
  if (ctx) {
    dailyChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: last7.map(d => d.label),
        datasets: [{
          label: 'Horas',
          data: last7.map(d => d.hours),
          backgroundColor: 'rgba(255,255,255,0.6)',
          borderColor: 'rgba(255,255,255,0.9)',
          borderWidth: 1.5,
          borderRadius: 4,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.15)' }, ticks: { color: '#000000', font: { size: 12 }, callback: v => v + 'h' } },
          x: { grid: { display: false }, ticks: { color: '#000000', font: { size: 12 }, autoSkip: false } },
        },
      },
    });
  }
}

function renderHorizontalChart(containerId, existingChart, counts, projects, pomoDuration) {
  const container = document.getElementById(containerId);
  if (existingChart) existingChart.destroy();

  const entries = Object.entries(counts)
    .filter(([id, poms]) => projects.find(p => p.id === id) && poms > 0)
    .sort((a, b) => b[1] - a[1]);

  if (!entries.length) {
    container.style.height = '';
    container.innerHTML = '<div class="empty-state">Sin datos aún</div>';
    return null;
  }

  const data = entries.map(([id, poms]) => {
    const p = projects.find(pr => pr.id === id);
    return { label: p.name, hours: +(poms * pomoDuration / 60).toFixed(2), color: p.color };
  });

  container.style.position = 'relative';
  container.style.height = Math.max(data.length * 40 + 20, 60) + 'px';
  container.innerHTML = '<canvas></canvas>';

  return new Chart(container.querySelector('canvas'), {
    type: 'bar',
    data: {
      labels: data.map(d => d.label),
      datasets: [{
        data: data.map(d => d.hours),
        backgroundColor: data.map(d => d.color + 'aa'),
        borderColor: data.map(d => d.color),
        borderWidth: 1.5,
        borderRadius: 4,
      }],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { beginAtZero: true, grid: { color: 'rgba(128,128,128,0.1)' }, ticks: { font: { size: 11 }, callback: v => v + 'h' } },
        y: { grid: { display: false }, ticks: { font: { size: 11 } } },
      },
    },
  });
}

export function renderHistory(history, config) {
  const list = document.getElementById('history-list');
  if (!history.length) {
    list.innerHTML = '<div class="empty-state">No hay sesiones aún.<br>¡Completá tu primer pomodoro!</div>';
    return;
  }
  list.innerHTML = history.slice(0, 100).map(h => {
    const d = new Date(h.ts);
    const dateStr = d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
    const timeStr = d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    return `<div class="history-item">
      <div class="history-dot" style="background:${h.projectColor}"></div>
      <div class="history-info">
        <div class="history-proj">${h.projectName}</div>
        ${h.note ? `<div class="history-note">${h.note}</div>` : ''}
      </div>
      <div class="history-meta">
        <div class="history-time">${dateStr} · ${timeStr}</div>
        <div class="history-dur">${h.duration || config.pomo} min</div>
      </div>
    </div>`;
  }).join('');
}
