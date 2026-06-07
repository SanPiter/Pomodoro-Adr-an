import { loadProjects, saveProjects, loadHistory, saveHistory, loadConfig, persistConfig, loadTasks, saveTasks } from './data/storage.js';
import { createSession } from './models/Session.js';
import { createTask } from './models/Task.js';
import { getDefaultProjects, addProject as svcAddProject, deleteProject as svcDeleteProject } from './business/projectService.js';
import * as timerSvc from './business/timerService.js';
import { switchTab, showToast, updateDisplay, updateModeUI } from './presentation/ui.js';
import { renderDots, renderProjects, selectProject, renderTasks } from './presentation/timerPanel.js';
import { renderStats, renderHistory } from './presentation/statsPanel.js';
import { renderSettings } from './presentation/settingsPanel.js';
import { getSession } from './auth/auth.js';
import { showAuthScreen, hideAuthScreen } from './auth/authUI.js';
import { migrateFromLocalStorage } from './auth/migration.js';
import { signOut } from './auth/auth.js';

// ─── State ────────────────────────────────────────────────────────────────────
let projects = [];
let history  = [];
let config   = {};
let tasks    = [];

// ─── Auth gate ────────────────────────────────────────────────────────────────
const { data: { session } } = await getSession();
if (session) {
  hideAuthScreen();
  await initApp(session.user.id);
} else {
  showAuthScreen(initApp);
}

// ─── initApp ─────────────────────────────────────────────────────────────────
async function initApp(userId) {
  await migrateFromLocalStorage(userId);

  [projects, history, config, tasks] = await Promise.all([
    loadProjects(), loadHistory(), loadConfig(), loadTasks(),
  ]);

  if (!projects.length) {
    projects = getDefaultProjects();
    await saveProjects(projects);
  }

  // Render inicial
  timerSvc.init(config);
  updateDisplay(timerSvc.getState().secondsLeft, timerSvc.getState().mode);
  updateModeUI('pomo');
  renderProjects(projects, history);
  renderDots(timerSvc.getState().pomoCycleCount, config.cycle);
  renderTasks(tasks, onToggleTask, onDeleteTask);

  registerListeners();
}

// ─── Listeners (se registran una sola vez tras el login) ─────────────────────
function registerListeners() {
  // Tab switching
  const TABS = ['timer', 'stats', 'history', 'settings'];
  document.querySelectorAll('.tab').forEach((btn, i) => {
    btn.addEventListener('click', () => {
      switchTab(TABS[i], {
        stats:    () => renderStats(history, projects, config),
        history:  () => renderHistory(history, config),
        settings: () => renderSettings(config, projects, onDeleteProject),
      });
    });
  });

  // Mode buttons
  const MODES = ['pomo', 'short', 'long'];
  document.querySelectorAll('.mode-btn').forEach((btn, i) => {
    btn.addEventListener('click', () => {
      timerSvc.changeMode(MODES[i], config);
      updateModeUI(MODES[i]);
      updateDisplay(timerSvc.getState().secondsLeft, MODES[i]);
      document.getElementById('start-btn').textContent = 'Iniciar';
    });
  });

  // Timer controls
  document.getElementById('start-btn').addEventListener('click', () => {
    timerSvc.toggle(config, onTick, onTimerEnd);
    const btn = document.getElementById('start-btn');
    btn.textContent = timerSvc.getState().running ? 'Pausar' : 'Continuar';
  });

  document.getElementById('reset-btn').addEventListener('click', () => {
    savePartialIfNeeded();
    timerSvc.reset(config);
    updateDisplay(timerSvc.getState().secondsLeft, timerSvc.getState().mode);
    document.getElementById('start-btn').textContent = 'Iniciar';
  });

  // Project list (event delegation)
  document.getElementById('project-list').addEventListener('click', e => {
    const item = e.target.closest('.project-item');
    if (item) selectProject(item.dataset.id);
  });

  // Add project
  document.getElementById('add-project-btn').addEventListener('click', addProjectHandler);
  document.getElementById('new-project-name').addEventListener('keydown', e => {
    if (e.key === 'Enter') addProjectHandler();
  });

  // Settings: config inputs (debounced)
  let configDebounce = null;
  ['cfg-pomo', 'cfg-short', 'cfg-long', 'cfg-cycle'].forEach(id => {
    document.getElementById(id).addEventListener('input', () => {
      clearTimeout(configDebounce);
      configDebounce = setTimeout(onConfigChange, 300);
    });
  });

  // Tasks
  document.getElementById('add-task-btn').addEventListener('click', addTaskHandler);
  document.getElementById('new-task-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') addTaskHandler();
  });

  // History: clear
  document.getElementById('clear-history-btn').addEventListener('click', async () => {
    if (!confirm('¿Borrar todo el historial de sesiones?')) return;
    history = [];
    await saveHistory(history);
    renderHistory(history, config);
    showToast('Historial borrado');
  });

  // Sign out
  const signOutBtn = document.getElementById('sign-out-btn');
  if (signOutBtn) signOutBtn.addEventListener('click', async () => {
    await signOut();
    window.location.reload();
  });

  window.addEventListener('beforeunload', () => {
    savePartialIfNeeded(); // fire-and-forget en beforeunload
  });
}

// ─── Handlers ─────────────────────────────────────────────────────────────────
async function addProjectHandler() {
  const inp = document.getElementById('new-project-name');
  const name = inp.value.trim();
  if (!name) return;
  try {
    const project = svcAddProject(name, projects);
    projects.push(project);
    await saveProjects(projects);
    inp.value = '';
    renderProjects(projects, history);
  } catch {}
}

async function addTaskHandler() {
  const inp = document.getElementById('new-task-input');
  const text = inp.value.trim();
  if (!text) return;
  tasks.push(createTask(text));
  await saveTasks(tasks);
  inp.value = '';
  renderTasks(tasks, onToggleTask, onDeleteTask);
}

function onTick(secondsLeft, mode) {
  updateDisplay(secondsLeft, mode);
}

async function onTimerEnd(endedMode) {
  if (endedMode === 'pomo') {
    const pid = document.getElementById('active-project').value;
    const note = document.getElementById('session-note').value.trim();
    const proj = projects.find(p => p.id === pid);
    const entry = createSession({
      projectId: pid,
      projectName: proj ? proj.name : 'Sin proyecto',
      projectColor: proj ? proj.color : '#888780',
      note,
      duration: config.pomo,
    });
    history.unshift(entry);
    await saveHistory(history);
    document.getElementById('session-note').value = '';

    const result = timerSvc.advancePomo(config);
    showToast(result.isLong
      ? '¡Ciclo completo! Tomá un descanso largo.'
      : '¡Pomodoro completado! Descansá un poco.');
    updateModeUI(result.nextMode);
    updateDisplay(timerSvc.getState().secondsLeft, result.nextMode);
    renderDots(timerSvc.getState().pomoCycleCount, config.cycle);
    tasks = tasks.filter(t => !t.done);
    await saveTasks(tasks);
    renderTasks(tasks, onToggleTask, onDeleteTask);
  } else {
    timerSvc.advanceBreak(config);
    showToast('¡Descanso terminado! A trabajar.');
    updateModeUI('pomo');
    updateDisplay(timerSvc.getState().secondsLeft, 'pomo');
  }
  document.getElementById('start-btn').textContent = 'Iniciar';
}

async function onToggleTask(id) {
  const t = tasks.find(t => t.id === id);
  if (t) { t.done = !t.done; await saveTasks(tasks); renderTasks(tasks, onToggleTask, onDeleteTask); }
}

async function onDeleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  await saveTasks(tasks);
  renderTasks(tasks, onToggleTask, onDeleteTask);
}

async function onDeleteProject(id) {
  if (!confirm('¿Eliminar este proyecto? El historial se conserva.')) return;
  projects = svcDeleteProject(id, projects);
  await saveProjects(projects);
  renderProjects(projects, history);
  renderSettings(config, projects, onDeleteProject);
}

async function onConfigChange() {
  config.pomo  = parseInt(document.getElementById('cfg-pomo').value)  || 25;
  config.short = parseInt(document.getElementById('cfg-short').value) || 5;
  config.long  = parseInt(document.getElementById('cfg-long').value)  || 15;
  config.cycle = parseInt(document.getElementById('cfg-cycle').value) || 4;
  await persistConfig(config);
  if (!timerSvc.getState().running) {
    timerSvc.reset(config);
    updateDisplay(timerSvc.getState().secondsLeft, timerSvc.getState().mode);
  }
  renderDots(timerSvc.getState().pomoCycleCount, config.cycle);
}

async function savePartialIfNeeded() {
  const { mode, secondsLeft } = timerSvc.getState();
  if (mode !== 'pomo') return;
  const totalSecs = config.pomo * 60;
  if (secondsLeft === totalSecs) return;
  const elapsedSecs = totalSecs - secondsLeft;
  if (elapsedSecs <= 60) return;
  const pid = document.getElementById('active-project').value;
  const note = document.getElementById('session-note').value.trim();
  const proj = projects.find(p => p.id === pid);
  const entry = createSession({
    projectId: pid,
    projectName: proj ? proj.name : 'Sin proyecto',
    projectColor: proj ? proj.color : '#888780',
    note,
    duration: +(elapsedSecs / 60).toFixed(2),
    tipo: 'parcial',
  });
  history.unshift(entry);
  await saveHistory(history);
}
