import { signInWithGoogle, onAuthChange, IS_CONFIGURED } from './auth.js';

let _onLogin = null;

export function showAuthScreen(onLogin) {
  _onLogin = onLogin;

  // Aplicar tema inicial para que los CSS vars estén definidos
  document.body.classList.add('theme-pomo');

  if (!IS_CONFIGURED) {
    showSetupScreen();
    return;
  }

  const screen = document.getElementById('auth-screen');
  screen.innerHTML = `
    <div id="auth-card">
      <div class="auth-logo">🍅</div>
      <h1 class="auth-title">Pomodoro</h1>
      <p class="auth-subtitle">Iniciá sesión para sincronizar tus datos<br>en todos tus dispositivos.</p>
      <button class="auth-google-btn" id="auth-google-btn">
        <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
          <path fill="#4A90D9" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
        </svg>
        Continuar con Google
      </button>
      <p id="auth-error" class="auth-error" style="display:none;"></p>
    </div>
  `;

  document.getElementById('auth-google-btn').addEventListener('click', async () => {
    const btn = document.getElementById('auth-google-btn');
    btn.disabled = true;
    btn.textContent = 'Redirigiendo…';
    const { error } = await signInWithGoogle();
    if (error) {
      showError(error.message);
      btn.disabled = false;
      btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4A90D9" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg> Continuar con Google';
    }
    // Si no hay error, el browser redirige; cuando vuelva, onAuthChange lo captura
  });

  // Capturar el retorno del redirect de Google
  onAuthChange((event, session) => {
    if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
      hideAuthScreen();
      _onLogin?.(session.user.id);
    }
  });
}

export function hideAuthScreen() {
  const screen = document.getElementById('auth-screen');
  if (screen) { screen.innerHTML = ''; screen.style.display = 'none'; }
  document.getElementById('app').style.display = '';
}

function showError(msg) {
  const el = document.getElementById('auth-error');
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}

function showSetupScreen() {
  const screen = document.getElementById('auth-screen');
  screen.innerHTML = `
    <div id="auth-card">
      <div class="auth-logo">🍅</div>
      <h1 class="auth-title">Pomodoro</h1>
      <p class="auth-subtitle" style="margin-bottom:1.5rem;">Configuración pendiente</p>
      <div style="background:rgba(0,0,0,0.2);border-radius:12px;padding:1.25rem;text-align:left;font-size:13px;line-height:1.7;color:rgba(255,255,255,0.85);">
        <p style="margin-bottom:0.5rem;font-weight:600;">Para usar la app, completá estos pasos:</p>
        <ol style="padding-left:1.2rem;display:flex;flex-direction:column;gap:4px;">
          <li>Creá un proyecto gratis en <strong>supabase.com</strong></li>
          <li>Ejecutá el SQL del esquema en el SQL Editor</li>
          <li>Activá Google en Authentication → Providers</li>
          <li>Copiá la <strong>Project URL</strong> y <strong>Anon Key</strong></li>
          <li>Pegalas en <code style="background:rgba(255,255,255,0.15);padding:1px 5px;border-radius:4px;">js/auth/auth.js</code></li>
        </ol>
      </div>
      <p style="margin-top:1.25rem;font-size:12px;color:rgba(255,255,255,0.5);">Una vez configurado, recargá la página.</p>
    </div>
  `;
}
