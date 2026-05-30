import { createProject } from '../models/Project.js';

export const COLORS = ['#D85A30', '#1D9E75', '#378ADD', '#BA7517', '#993356', '#3B6D11', '#534AB7', '#888780'];

export function addProject(name, projects) {
  if (!name) throw new Error('Nombre requerido');
  const id = 'p' + Date.now();
  const color = COLORS[projects.length % COLORS.length];
  return createProject(id, name, color);
}

export function deleteProject(id, projects) {
  return projects.filter(p => p.id !== id);
}

export function getDefaultProjects() {
  return [
    createProject('p1', 'ReplyFast', COLORS[0]),
    createProject('p2', 'Universidad', COLORS[1]),
    createProject('p3', 'Contenido', COLORS[2]),
  ];
}
