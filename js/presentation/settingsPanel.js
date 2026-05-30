export function renderSettings(config, projects, onDeleteProject) {
  document.getElementById('cfg-pomo').value = config.pomo;
  document.getElementById('cfg-short').value = config.short;
  document.getElementById('cfg-long').value = config.long;
  document.getElementById('cfg-cycle').value = config.cycle;

  const mp = document.getElementById('manage-projects');
  mp.innerHTML = projects.map(p =>
    `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:0.5px solid var(--color-border-tertiary);">
      <div style="width:8px;height:8px;border-radius:50%;background:${p.color};flex-shrink:0;"></div>
      <span style="flex:1;font-size:13px;color:var(--color-text-primary);">${p.name}</span>
      <button class="btn-sec btn-delete-proj" data-id="${p.id}" style="font-size:13px;padding:4px 8px;">✕</button>
    </div>`
  ).join('');

  mp.querySelectorAll('.btn-delete-proj').forEach(btn => {
    btn.addEventListener('click', () => onDeleteProject(btn.dataset.id));
  });
}
