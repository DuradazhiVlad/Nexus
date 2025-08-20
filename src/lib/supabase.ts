import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Перевіряємо environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error('Missing VITE_SUPABASE_URL environment variable');
  throw new Error('Missing VITE_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  console.error('Missing VITE_SUPABASE_ANON_KEY environment variable');
  throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable');
}

// Налагоджувальна інформація (тільки для development)
if (import.meta.env.DEV) {
  console.log('Supabase URL:', supabaseUrl);
  console.log('Supabase Key (first 20 chars):', supabaseAnonKey.substring(0, 20) + '...');
}

// Глобальний синглтон для Supabase клієнта
let supabaseInstance: SupabaseClient | null = null;

function createSupabaseClient(): SupabaseClient {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: 'nexus-supabase-auth-token',
      flowType: 'pkce'
    },
    global: {
      headers: { 
        'x-application-name': 'nexus-social-network',
        'x-client-info': 'nexus/1.0.0'
      },
    },
    db: {
      schema: 'public'
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  });

  // Додаємо обробник помилок аутентифікації
  supabaseInstance.auth.onAuthStateChange((event, session) => {
    if (import.meta.env.DEV) {
      console.log('Supabase auth state change:', event, session?.user?.email || 'no user');
    }
    
    if (event === 'SIGNED_OUT') {
      // Очищаємо локальне сховище при виході
      localStorage.removeItem('nexus-supabase-auth-token');
    }
  });

  return supabaseInstance;
}

// Експортуємо єдиний екземпляр
export const supabase = createSupabaseClient();

// Допоміжні функції для роботи з аутентифікацією
export const auth = {
  signUp: (email: string, password: string, options?: any) => {
    console.log('🔍 Auth signUp called with:', { email, options });
    return supabase.auth.signUp({ 
      email, 
      password, 
      options: {
        ...options,
        emailRedirectTo: undefined, // Вимикаємо email підтвердження
        data: {
          name: options?.data?.name || email.split('@')[0]
        }
      }
    });
  },
  
  signIn: async (email: string, password: string) => {
    try {
      const result = await supabase.auth.signInWithPassword({ email, password });
      
      // Якщо вхід успішний, перевіряємо чи існує профіль
      if (result.data.user && !result.error) {
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('auth_user_id', result.data.user.id)
          .single();
          
        // Якщо профіль не існує, створюємо його
        if (profileError && profileError.code === 'PGRST116') {
          console.log('📝 Creating missing profile...');
          await supabase.from('user_profiles').insert({
            auth_user_id: result.data.user.id,
            name: result.data.user.user_metadata?.name || email.split('@')[0],
            email: email,
            avatar: result.data.user.user_metadata?.avatar_url
          });
        }
      }
      
      return result;
    } catch (error) {
      console.error('❌ Sign in error:', error);
      throw error;
    }
  },
  
  signOut: () => supabase.auth.signOut(),
  
  getUser: () => supabase.auth.getUser(),
  
  getSession: () => supabase.auth.getSession()
};

// Експортуємо також типи для TypeScript
export type { SupabaseClient } from '@supabase/supabase-js'; 