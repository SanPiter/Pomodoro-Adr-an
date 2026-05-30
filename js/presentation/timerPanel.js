export function renderDots(pomoCycleCount, cycleTotal) {
  let html = '';
  for (let i = 0; i < cycleTotal; i++) {
    html += `<div class="pom-dot${i < pomoCycleCount ? ' done' : ''}"></div>`;
  }
  document.getElementById('pom-dots').innerHTML = html;
}

export function renderProjects(projects, history) {
  const list = document.getElementById('project-list');
  const sel = document.getElementById('active-project');
  const cur = sel.value;
  list.innerHTML = '';
  sel.innerHTML = '<option value="">— Sin proyecto —</option>';
  projects.forEach(p => {
    const poms = history.filter(h => h.projectId === p.id).length;
    const item = document.createElement('div');
    item.className = 'project-item';
    item.id = 'pi-' + p.id;
    item.dataset.id = p.id;
    item.innerHTML = `
      <div class="project-dot" style="background:${p.color}"></div>
      <span class="project-name">${p.name}</span>
      <span class="project-poms">${poms} 🍅</span>`;
    list.appendChild(item);
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.name;
    if (p.id === cur) opt.selected = true;
    sel.appendChild(opt);
  });
  if (cur) sel.value = cur;
}

export function renderTasks(tasks, onToggle, onDelete) {
  const list = document.getElementById('task-list');
  if (!tasks.length) {
    list.innerHTML = '<div class="empty-state" style="padding:0.75rem 0;text-align:left;">Sin tareas aún</div>';
    return;
  }
  list.innerHTML = tasks.map(t => `
    <div class="task-item" data-id="${t.id}">
      <input type="checkbox" class="task-check"${t.done ? ' checked' : ''}>
      <span class="task-text${t.done ? ' done' : ''}">${t.text}</span>
      <button class="task-del" data-id="${t.id}">×</button>
    </div>`).join('');
  list.querySelectorAll('.task-check').forEach(cb => {
    cb.addEventListener('change', () => onToggle(Number(cb.closest('.task-item').dataset.id)));
  });
  list.querySelectorAll('.task-del').forEach(btn => {
    btn.addEventListener('click', () => onDelete(Number(btn.dataset.id)));
  });
}

export function selectProject(id) {
  document.getElementById('active-project').value = id;
  document.querySelectorAll('.project-item').forEach(el => el.classList.remove('selected'));
  const el = document.getElementById('pi-' + id);
  if (el) el.classList.add('selected');
}
