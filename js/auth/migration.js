import { saveProjects, saveHistory, persistConfig, saveTasks } from '../data/storage.js';
import { DEFAULT_CONFIG } from '../models/Config.js';

const LS_PROJECTS = 'pomoprojects_v2';
const LS_HISTORY  = 'pomohistory_v2';
const LS_CONFIG   = 'pomoconfig_v2';
const LS_TASKS    = 'pomotasks_v1';

export async function migrateFromLocalStorage(userId) {
  const flagKey = `pomo_migrated_${userId}`;
  if (localStorage.getItem(flagKey)) return;

  const rawProjects = localStorage.getItem(LS_PROJECTS);
  const rawHistory  = localStorage.getItem(LS_HISTORY);
  const rawConfig   = localStorage.getItem(LS_CONFIG);
  const rawTasks    = localStorage.getItem(LS_TASKS);

  const hasData = rawProjects || rawHistory || rawConfig || rawTasks;
  if (!hasData) { localStorage.setItem(flagKey, '1'); return; }

  const projects = tryParse(rawProjects, []);
  const history  = tryParse(rawHistory, []);
  const config   = tryParse(rawConfig, null);
  const tasks    = tryParse(rawTasks, []);

  const hasRealData = projects.length || history.length || config || tasks.length;
  if (!hasRealData) { localStorage.setItem(flagKey, '1'); return; }

  const ok = confirm(
    `¿Querés importar tus datos guardados en este dispositivo a tu cuenta en la nube?\n\n` +
    `· ${history.length} sesiones en el historial\n` +
    `· ${projects.length} proyectos\n\n` +
    `Esto te permite acceder a todos tus reportes desde cualquier dispositivo.`
  );

  localStorage.setItem(flagKey, '1');
  if (!ok) return;

  try {
    if (projects.length) await saveProjects(projects);
    if (config) await persistConfig({ ...DEFAULT_CONFIG, ...config });
    if (tasks.length) await saveTasks(tasks);
    if (history.length) await saveHistory(history);
  } catch (e) {
    console.error('Error en migración:', e);
  }
}

function tryParse(raw, fallback) {
  try { return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
}
