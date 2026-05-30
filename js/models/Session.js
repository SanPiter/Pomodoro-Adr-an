export function createSession({ projectId, projectName, projectColor, note, duration }) {
  const now = Date.now();
  return {
    id: now,
    projectId: projectId || null,
    projectName,
    projectColor,
    note,
    duration,
    ts: now,
  };
}
