/**
 * 🎓 STUDYFLOW - Supabase Configuration & Initialization
 * 
 * Instructions:
 * You can replace the placeholder values below with your Supabase Project URL and Anon/Publishable Key,
 * OR you can leave them as-is and enter them directly in the application's "Connect Supabase" settings dialog!
 * 
 * You can find your Supabase credentials in:
 * Supabase Dashboard -> Project Settings -> API -> Project URL & Project API Keys (anon / public).
 */

const DEFAULT_SUPABASE_CONFIG = {
  // Enter your Supabase Project URL here (e.g. 'https://xyzcompany.supabase.co')
  url: '',
  
  // Enter your Supabase Publishable / Anon Key here (never use service_role in frontend code!)
  anonKey: ''
};

// Storage keys for user-configured credentials via UI
const SUPABASE_STORAGE_KEYS = {
  URL: 'studyflow_supabase_url',
  ANON_KEY: 'studyflow_supabase_anon_key',
  IS_DEMO: 'studyflow_demo_mode'
};

/**
 * Retrieves the currently active Supabase configuration
 */
function getSupabaseConfig() {
  const storedUrl = localStorage.getItem(SUPABASE_STORAGE_KEYS.URL);
  const storedKey = localStorage.getItem(SUPABASE_STORAGE_KEYS.ANON_KEY);

  const url = (storedUrl && storedUrl.trim()) || DEFAULT_SUPABASE_CONFIG.url.trim();
  const anonKey = (storedKey && storedKey.trim()) || DEFAULT_SUPABASE_CONFIG.anonKey.trim();

  return {
    url,
    anonKey,
    isConfigured: Boolean(url && anonKey && url.startsWith('http'))
  };
}

/**
 * Saves new Supabase configuration to local storage
 */
function setSupabaseConfig(url, anonKey) {
  if (url) localStorage.setItem(SUPABASE_STORAGE_KEYS.URL, url.trim());
  if (anonKey) localStorage.setItem(SUPABASE_STORAGE_KEYS.ANON_KEY, anonKey.trim());
  localStorage.removeItem(SUPABASE_STORAGE_KEYS.IS_DEMO);
  return initSupabaseClient();
}

/**
 * Clears stored Supabase configuration
 */
function clearSupabaseConfig() {
  localStorage.removeItem(SUPABASE_STORAGE_KEYS.URL);
  localStorage.removeItem(SUPABASE_STORAGE_KEYS.ANON_KEY);
  window.supabaseClient = null;
}

/**
 * Initializes or re-initializes the global Supabase client
 */
function initSupabaseClient() {
  const config = getSupabaseConfig();
  
  if (!config.isConfigured) {
    window.supabaseClient = null;
    return null;
  }

  try {
    if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
      window.supabaseClient = window.supabase.createClient(config.url, config.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storage: window.localStorage
        }
      });
      console.log('✅ Supabase client initialized successfully.');
      return window.supabaseClient;
    } else {
      console.warn('⚠️ Supabase SDK (@supabase/supabase-js) is not yet loaded.');
      return null;
    }
  } catch (error) {
    console.error('❌ Failed to create Supabase client:', error);
    window.supabaseClient = null;
    return null;
  }
}

/**
 * Tests connection to the configured Supabase instance
 */
async function testSupabaseConnection(url, anonKey) {
  try {
    const testUrl = (url || getSupabaseConfig().url).trim();
    const testKey = (anonKey || getSupabaseConfig().anonKey).trim();

    if (!testUrl || !testKey) {
      return { success: false, message: 'Please provide both Supabase URL and Anon/Publishable Key.' };
    }

    if (typeof window.supabase === 'undefined') {
      return { success: false, message: 'Supabase JS library not loaded. Check internet connection.' };
    }

    const tempClient = window.supabase.createClient(testUrl, testKey, {
      auth: { persistSession: false }
    });

    // Test a lightweight query or auth status
    const { error } = await tempClient.from('profiles').select('id').limit(1);

    // If table doesn't exist or RLS triggers, check error code:
    // A 401 or Invalid API key is a failure; a 404 or empty data or RLS restricted is a successful API connection!
    if (error) {
      if (error.code === 'PGRST301' || error.message?.includes('JWT') || error.message?.includes('API key')) {
        return { success: false, message: `Authentication error: ${error.message}` };
      }
      // If table not found yet, the connection itself is valid
      if (error.code === '42P01') {
        return { 
          success: true, 
          message: 'Connected to Supabase! (Note: Remember to run supabase/schema.sql in SQL Editor to create tables)' 
        };
      }
    }

    return { success: true, message: 'Successfully connected to Supabase database!' };
  } catch (err) {
    return { success: false, message: err.message || 'Failed to reach Supabase endpoint.' };
  }
}

// Auto-initialize when script loads
if (typeof window !== 'undefined') {
  window.studyflowConfig = {
    getSupabaseConfig,
    setSupabaseConfig,
    clearSupabaseConfig,
    initSupabaseClient,
    testSupabaseConnection
  };

  // Attempt initial client setup
  initSupabaseClient();
}
