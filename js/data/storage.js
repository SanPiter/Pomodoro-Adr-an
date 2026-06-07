import { supabase } from '../auth/auth.js';
import { DEFAULT_CONFIG } from '../models/Config.js';

async function uid() {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

// ─── Projects ────────────────────────────────────────────────────────────────

export async function loadProjects() {
  const id = await uid();
  if (!id) return [];
  const { data, error } = await supabase
    .from('projects').select('id,name,color').eq('user_id', id).order('created_at');
  if (error) { console.error(error); return []; }
  return data ?? [];
}

export async function saveProjects(projects) {
  const id = await uid();
  if (!id) return;
  await supabase.from('projects').delete().eq('user_id', id);
  if (projects.length)
    await supabase.from('projects').insert(projects.map(p => ({ id: p.id, name: p.name, color: p.color, user_id: id })));
}

// ─── History ─────────────────────────────────────────────────────────────────

export async function loadHistory() {
  const id = await uid();
  if (!id) return [];
  const { data, error } = await supabase
    .from('history').select('id,project_id,project_name,project_color,note,duration,tipo,ts')
    .eq('user_id', id).order('ts', { ascending: false });
  if (error) { console.error(error); return []; }
  return (data ?? []).map(r => ({
    id: r.id,
    projectId: r.project_id,
    projectName: r.project_name,
    projectColor: r.project_color,
    note: r.note,
    duration: r.duration,
    tipo: r.tipo,
    ts: r.ts,
  }));
}

export async function saveHistory(history) {
  const id = await uid();
  if (!id) return;
  await supabase.from('history').delete().eq('user_id', id);
  if (history.length)
    await supabase.from('history').insert(history.map(h => ({
      id: String(h.id),
      user_id: id,
      project_id: h.projectId ?? null,
      project_name: h.projectName,
      project_color: h.projectColor,
      note: h.note ?? null,
      duration: h.duration,
      tipo: h.tipo,
      ts: h.ts,
    })));
}

// ─── Config ───────────────────────────────────────────────────────────────────

export async function loadConfig() {
  const id = await uid();
  if (!id) return { ...DEFAULT_CONFIG };
  const { data, error } = await supabase
    .from('config').select('pomo,short,long,cycle').eq('user_id', id).maybeSingle();
  if (error || !data) return { ...DEFAULT_CONFIG };
  return { pomo: data.pomo, short: data.short, long: data.long, cycle: data.cycle };
}

export async function persistConfig(config) {
  const id = await uid();
  if (!id) return;
  await supabase.from('config').upsert({
    user_id: id,
    pomo: config.pomo,
    short: config.short,
    long: config.long,
    cycle: config.cycle,
    updated_at: new Date().toISOString(),
  });
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export async function loadTasks() {
  const id = await uid();
  if (!id) return [];
  const { data, error } = await supabase
    .from('tasks').select('id,text,done').eq('user_id', id).order('created_at');
  if (error) { console.error(error); return []; }
  return (data ?? []).map(r => ({ id: r.id, text: r.text, done: r.done }));
}

export async function saveTasks(tasks) {
  const id = await uid();
  if (!id) return;
  await supabase.from('tasks').delete().eq('user_id', id);
  if (tasks.length)
    await supabase.from('tasks').insert(tasks.map(t => ({
      id: String(t.id),
      user_id: id,
      text: t.text,
      done: t.done,
    })));
}
