import { DEFAULT_CONFIG } from '../models/Config.js';

const KEY_PROJECTS = 'pomoprojects_v2';
const KEY_TASKS = 'pomotasks_v1';
const KEY_HISTORY = 'pomohistory_v2';
const KEY_CONFIG = 'pomoconfig_v2';

export function loadProjects() {
  try { return JSON.parse(localStorage.getItem(KEY_PROJECTS)) || []; } catch { return []; }
}

export function saveProjects(projects) {
  localStorage.setItem(KEY_PROJECTS, JSON.stringify(projects));
}

export function loadHistory() {
  try { return JSON.parse(localStorage.getItem(KEY_HISTORY)) || []; } catch { return []; }
}

export function saveHistory(history) {
  localStorage.setItem(KEY_HISTORY, JSON.stringify(history));
}

export function loadConfig() {
  try {
    const c = JSON.parse(localStorage.getItem(KEY_CONFIG));
    return c ? { ...DEFAULT_CONFIG, ...c } : { ...DEFAULT_CONFIG };
  } catch { return { ...DEFAULT_CONFIG }; }
}

export function persistConfig(config) {
  localStorage.setItem(KEY_CONFIG, JSON.stringify(config));
}

export function loadTasks() {
  try { return JSON.parse(localStorage.getItem(KEY_TASKS)) || []; } catch { return []; }
}

export function saveTasks(tasks) {
  localStorage.setItem(KEY_TASKS, JSON.stringify(tasks));
}
