export function getWeekStart() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const m = new Date(d.setDate(diff));
  m.setHours(0, 0, 0, 0);
  return m.getTime();
}

export function calcStreak(history) {
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    const hasWork = history.some(h => h.ts >= d.getTime() && h.ts < next.getTime());
    if (hasWork) streak++;
    else if (i > 0) break;
  }
  return streak;
}

export function getLast21Days(history) {
  const days = [];
  for (let i = 20; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    days.push({
      hasWork: history.some(h => h.ts >= d.getTime() && h.ts < next.getTime()),
      isToday: i === 0,
      label: ['D', 'L', 'M', 'X', 'J', 'V', 'S'][d.getDay()],
    });
  }
  return days;
}

export function getLast7DaysHours(history, pomoDuration) {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    const poms = history.filter(h => h.ts >= d.getTime() && h.ts < next.getTime()).length;
    days.push({
      label: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][d.getDay()],
      hours: +(poms * pomoDuration / 60).toFixed(2),
    });
  }
  return days;
}

export function aggregateByProject(history, projects, filterFn) {
  const counts = {};
  projects.forEach(p => { counts[p.id] = 0; });
  (filterFn ? history.filter(filterFn) : history).forEach(h => {
    if (h.projectId) {
      if (counts[h.projectId] === undefined) counts[h.projectId] = 0;
      counts[h.projectId]++;
    }
  });
  return counts;
}
