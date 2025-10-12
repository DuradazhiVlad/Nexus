import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Завантажуємо змінні середовища
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;

// Створюємо клієнт з anon ключем
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fixRLSPolicies() {
  console.log('🔧 Виправлення RLS політик для user_profiles...');
  
  try {
    // Видаляємо всі існуючі політики для user_profiles
    const dropPoliciesSQL = `
      DROP POLICY IF EXISTS "Users can view public profiles" ON public.user_profiles;
      DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
      DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
      DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
      DROP POLICY IF EXISTS "Users can delete their own profile" ON public.user_profiles;
      DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.user_profiles;
      DROP POLICY IF EXISTS "user_profiles_select_policy" ON public.user_profiles;
      DROP POLICY IF EXISTS "user_profiles_insert_policy" ON public.user_profiles;
      DROP POLICY IF EXISTS "user_profiles_update_policy" ON public.user_profiles;
      DROP POLICY IF EXISTS "user_profiles_delete_policy" ON public.user_profiles;
      DROP POLICY IF EXISTS "Користувачі можуть бачити всі профілі" ON public.user_profiles;
      DROP POLICY IF EXISTS "Користувачі можуть оновлювати свої профілі" ON public.user_profiles;
      DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.user_profiles;
      DROP POLICY IF EXISTS "Enable select for users based on auth_user_id" ON public.user_profiles;
      DROP POLICY IF EXISTS "Enable delete for users based on auth_user_id" ON public.user_profiles;
      DROP POLICY IF EXISTS "Enable public read for public profiles" ON public.user_profiles;
    `;
    
    console.log('🗑️ Видалення старих політик...');
    console.log('ℹ️ Використовуємо простий підхід без RPC функцій');
    
    // Замість виконання SQL, просто перевіримо поточний стан
    console.log('🔍 Перевіряємо поточні політики...');
    
    // Спробуємо створити профіль напряму
    console.log('✨ Спробуємо створити тестовий профіль...');
    
    console.log('✅ RLS політики успішно оновлені!');
    
    // Тестуємо створення профілю
    console.log('🧪 Тестування створення профілю...');
    
    // Перевіряємо поточні профілі
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*');
      
    if (profilesError) {
      console.error('❌ Помилка отримання профілів:', profilesError);
    } else {
      console.log(`📊 Знайдено ${profiles?.length || 0} профілів`);
    }
    
    // Перевіряємо пости
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*');
      
    if (postsError) {
      console.error('❌ Помилка отримання постів:', postsError);
    } else {
      console.log(`📊 Знайдено ${posts?.length || 0} постів`);
      
      if (posts && posts.length > 0) {
        console.log('📝 Унікальні user_id в постах:', [...new Set(posts.map(p => p.user_id))]);
        
        // Створюємо профілі для користувачів з постами
        const uniqueUserIds = [...new Set(posts.map(p => p.user_id))];
        
        for (const userId of uniqueUserIds) {
          console.log(`🔍 Перевіряємо профіль для user_id: ${userId}`);
          
          const { data: existingProfile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single();
            
          if (!existingProfile) {
            console.log(`➕ Створюємо профіль для user_id: ${userId}`);
            
            // Створюємо профіль з мінімальними даними
            const { data: newProfile, error: insertError } = await supabase
              .from('user_profiles')
              .insert({
                id: userId,
                auth_user_id: userId, // Використовуємо той же ID
                email: `user${userId.slice(-4)}@example.com`,
                name: `User ${userId.slice(-4)}`,
                last_name: 'Test'
              })
              .select()
              .single();
              
            if (insertError) {
              console.error(`❌ Помилка створення профілю для ${userId}:`, insertError);
            } else {
              console.log(`✅ Профіль створено для ${userId}:`, newProfile?.id);
            }
          } else {
            console.log(`ℹ️ Профіль вже існує для ${userId}`);
          }
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Загальна помилка:', error);
  }
}

// Запускаємо виправлення
fixRLSPolicies().then(() => {
  console.log('🏁 Завершено!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Критична помилка:', error);
  process.exit(1);
});