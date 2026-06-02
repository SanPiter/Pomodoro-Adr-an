import { calcStreak, getWeekStart, getLast21Days, getLast7DaysHoursByProject, aggregateByProject } from '../business/statsService.js';

function fmtHours(hours) {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

let dailyChart = null;
let weeklyChart = null;
let totalChart = null;

export function renderStats(history, projects, config) {
  const weekStart = getWeekStart();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayPoms = history.filter(h => h.ts >= todayStart.getTime()).length;
  const weekSessions = history.filter(h => h.ts >= weekStart);
  const weekPoms = weekSessions.length;
  const weekHours = weekSessions.reduce((sum, h) => sum + (h.duration || config.pomo), 0) / 60;
  const totalPoms = history.length;
  const totalHours = history.reduce((sum, h) => sum + (h.duration || config.pomo), 0) / 60;
  const streak = calcStreak(history);

  document.getElementById('stats-grid').innerHTML = `
    <div class="metric-card"><div class="metric-label">Hoy</div><div class="metric-value">${todayPoms}</div><div class="metric-sub">pomodoros</div></div>
    <div class="metric-card"><div class="metric-label">Esta semana</div><div class="metric-value">${fmtHours(weekHours)}</div><div class="metric-sub">${weekPoms} sesiones</div></div>
    <div class="metric-card"><div class="metric-label">Total acumulado</div><div class="metric-value">${fmtHours(totalHours)}</div><div class="metric-sub">${totalPoms} sesiones</div></div>
    <div class="metric-card"><div class="metric-label">Racha actual</div><div class="metric-value">${streak}</div><div class="metric-sub">días consecutivos</div></div>
  `;

  const byProjWeek = aggregateByProject(history, projects, h => h.ts >= weekStart);
  const byProjTotal = aggregateByProject(history, projects);

  weeklyChart = renderHorizontalChart('weekly-bars', weeklyChart, byProjWeek, projects);
  totalChart = renderHorizontalChart('total-bars', totalChart, byProjTotal, projects);

  const last21 = getLast21Days(history);
  document.getElementById('streak-row').innerHTML = last21.map(d =>
    `<div class="streak-day${d.hasWork ? ' active' : ''}${d.isToday ? ' today' : ''}" title="${d.label}">${d.label}</div>`
  ).join('');

  const { labels: dayLabels, projectData } = getLast7DaysHoursByProject(history, projects);
  if (dailyChart) { dailyChart.destroy(); dailyChart = null; }
  const ctx = document.getElementById('daily-chart');
  if (ctx) {
    const datasets = projectData.length
      ? projectData.map(pd => ({
          label: pd.projectName,
          data: pd.hours,
          backgroundColor: pd.color,
          borderRadius: 2,
          stack: 'days',
        }))
      : [{ label: 'Horas', data: [0,0,0,0,0,0,0], backgroundColor: 'rgba(255,255,255,0.6)', stack: 'days' }];

    dailyChart = new Chart(ctx, {
      type: 'bar',
      data: { labels: dayLabels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: c => `${c.dataset.label}: ${fmtHours(c.parsed.y)}`,
            },
          },
        },
        scales: {
          x: { stacked: true, grid: { display: false }, ticks: { color: '#000000', font: { size: 12 }, autoSkip: false } },
          y: { stacked: true, beginAtZero: true, grid: { color: 'rgba(0,0,0,0.15)' }, ticks: { color: '#000000', font: { size: 12 }, callback: v => fmtHours(v) } },
        },
      },
    });
  }

  // Leyenda del gráfico diario
  const legendEl = document.getElementById('daily-chart-legend');
  if (legendEl) {
    legendEl.innerHTML = projectData.map(pd =>
      `<span class="legend-item"><span class="legend-dot" style="background:${pd.color}"></span>${pd.projectName}</span>`
    ).join('');
  }
}

function renderHorizontalChart(containerId, existingChart, durations, projects) {
  const container = document.getElementById(containerId);
  if (existingChart) existingChart.destroy();

  const entries = Object.entries(durations)
    .filter(([id, mins]) => projects.find(p => p.id === id) && mins > 0)
    .sort((a, b) => b[1] - a[1]);

  if (!entries.length) {
    container.style.height = '';
    container.innerHTML = '<div class="empty-state">Sin datos aún</div>';
    return null;
  }

  const data = entries.map(([id, mins]) => {
    const p = projects.find(pr => pr.id === id);
    return { label: p.name, hours: +(mins / 60).toFixed(2), color: p.color };
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
        x: { beginAtZero: true, grid: { color: 'rgba(128,128,128,0.1)' }, ticks: { font: { size: 11 }, callback: v => fmtHours(v) } },
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
    const badge = h.tipo === 'parcial' ? '<span class="session-badge-partial">parcial</span>' : '';
    const durMins = h.duration || config.pomo;
    const durLabel = durMins < 1 ? `${Math.round(durMins * 60)}s` : `${Math.round(durMins)} min`;
    return `<div class="history-item">
      <div class="history-dot" style="background:${h.projectColor}"></div>
      <div class="history-info">
        <div class="history-proj">${h.projectName}${badge}</div>
        ${h.note ? `<div class="history-note">${h.note}</div>` : ''}
      </div>
      <div class="history-meta">
        <div class="history-time">${dateStr} · ${timeStr}</div>
        <div class="history-dur">${durLabel}</div>
      </div>
    </div>`;
  }).join('');
}
