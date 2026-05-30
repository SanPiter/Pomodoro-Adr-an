const TABS = ['timer', 'stats', 'history', 'settings'];

export function switchTab(tabName, callbacks) {
  TABS.forEach((name, i) => {
    document.getElementById('tab-' + name).style.display = name === tabName ? '' : 'none';
    document.querySelectorAll('.tab')[i].classList.toggle('active', name === tabName);
  });
  if (callbacks && callbacks[tabName]) callbacks[tabName]();
}

export function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

export function updateDisplay(secondsLeft, mode) {
  const time = String(Math.floor(secondsLeft / 60)).padStart(2, '0') + ':' + String(secondsLeft % 60).padStart(2, '0');
  document.getElementById('timer-display').textContent = time;
  document.title = time + ' | Pomodoro';
}

export function updateModeUI(mode) {
  const modes = ['pomo', 'short', 'long'];
  const labels = { pomo: 'Pomodoro', short: 'Descanso corto', long: 'Descanso largo' };
  document.querySelectorAll('.mode-btn').forEach((b, i) => b.classList.toggle('active', modes[i] === mode));
  document.getElementById('mode-label').textContent = labels[mode];
  document.body.classList.remove('theme-pomo', 'theme-short', 'theme-long');
  document.body.classList.add('theme-' + mode);
}
