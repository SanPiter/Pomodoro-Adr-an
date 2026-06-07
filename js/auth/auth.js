// Las credenciales se cargan desde js/config.js (gitignoreado)
const SUPABASE_URL      = window.SUPABASE_URL      ?? '';
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY ?? '';

export const IS_CONFIGURED = SUPABASE_URL.startsWith('https://') && SUPABASE_ANON_KEY.length > 20;

export const supabase = IS_CONFIGURED
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

export const signInWithGoogle = () =>
  supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });

export const signOut = () => supabase.auth.signOut();
export const getSession = () => supabase ? supabase.auth.getSession() : Promise.resolve({ data: { session: null } });
export const onAuthChange = (cb) => supabase ? supabase.auth.onAuthStateChange(cb) : { data: { subscription: { unsubscribe: () => {} } } };
