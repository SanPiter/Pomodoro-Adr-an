export function createTask(text) {
  return { id: Date.now(), text: text.trim(), done: false };
}
