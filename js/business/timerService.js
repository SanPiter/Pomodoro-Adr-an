function playAlarm() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.value = 880;
  osc.type = 'sine';
  gain.gain.setValueAtTime(0.6, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 1.5);
}

let mode = 'pomo';
let secondsLeft = 0;
let running = false;
let timerInterval = null;
let pomoCycleCount = 0;
let pomoDoneToday = 0;

export function getState() {
  return { mode, secondsLeft, running, pomoCycleCount, pomoDoneToday };
}

export function getModeSecs(m, config) {
  if (m === 'pomo') return config.pomo * 60;
  if (m === 'short') return config.short * 60;
  return config.long * 60;
}

export function init(config) {
  secondsLeft = getModeSecs(mode, config);
}

export function changeMode(newMode, config) {
  mode = newMode;
  clearInterval(timerInterval);
  timerInterval = null;
  running = false;
  secondsLeft = getModeSecs(newMode, config);
}

export function toggle(config, onTick, onEnd) {
  if (running) {
    clearInterval(timerInterval);
    timerInterval = null;
    running = false;
    return;
  }
  running = true;
  timerInterval = setInterval(async () => {
    secondsLeft--;
    if (secondsLeft <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      running = false;
      playAlarm();
      await onEnd(mode);
    } else {
      onTick(secondsLeft, mode);
    }
  }, 1000);
}

export function reset(config) {
  clearInterval(timerInterval);
  timerInterval = null;
  running = false;
  secondsLeft = getModeSecs(mode, config);
}

export function advancePomo(config) {
  pomoCycleCount++;
  pomoDoneToday++;
  const isLong = pomoCycleCount >= config.cycle;
  if (isLong) pomoCycleCount = 0;
  const nextMode = isLong ? 'long' : 'short';
  mode = nextMode;
  secondsLeft = getModeSecs(nextMode, config);
  return { nextMode, pomoCycleCount, isLong };
}

export function advanceBreak(config) {
  mode = 'pomo';
  secondsLeft = getModeSecs('pomo', config);
  return { nextMode: 'pomo', pomoCycleCount };
}
