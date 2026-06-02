export function createSession({ projectId, projectName, projectColor, note, duration, tipo }) {
  const now = Date.now();
  return {
    id: now,
    projectId: projectId || null,
    projectName,
    projectColor,
    note,
    duration,
    tipo: tipo || 'completa',
    ts: now,
  };
}
