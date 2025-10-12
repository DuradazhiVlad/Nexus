import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Завантаження environment змінних
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

const fixUserProfiles = async () => {
  console.log('🚀 Виправлення профілів користувачів...');

  try {
    // Отримуємо всі пости
    console.log('📝 Отримання всіх постів...');
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('user_id, created_at')
      .order('created_at', { ascending: true });

    if (postsError) {
      console.error('❌ Помилка отримання постів:', postsError);
      return;
    }

    console.log(`📊 Знайдено постів: ${posts?.length || 0}`);

    if (!posts || posts.length === 0) {
      console.log('ℹ️ Пости відсутні');
      return;
    }

    // Отримуємо унікальні user_id з постів
    const uniqueUserIds = [...new Set(posts.map(p => p.user_id))];
    console.log(`👥 Унікальних користувачів у постах: ${uniqueUserIds.length}`);
    console.log('🆔 User IDs:', uniqueUserIds);

    // Перевіряємо які профілі вже існують
    console.log('📝 Перевірка існуючих профілів...');
    const { data: existingProfiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('id, auth_user_id, name, last_name')
      .in('id', uniqueUserIds);

    if (profilesError) {
      console.error('❌ Помилка отримання профілів:', profilesError);
      return;
    }

    console.log(`📊 Існуючих профілів: ${existingProfiles?.length || 0}`);
    
    const existingProfileIds = (existingProfiles || []).map(p => p.id);
    const missingUserIds = uniqueUserIds.filter(id => !existingProfileIds.includes(id));
    
    console.log(`❌ Відсутніх профілів: ${missingUserIds.length}`);
    console.log('🆔 Відсутні User IDs:', missingUserIds);

    if (missingUserIds.length === 0) {
      console.log('✅ Всі профілі існують!');
      return;
    }

    // Створюємо відсутні профілі
    console.log('📝 Створення відсутніх профілів...');
    
    for (let i = 0; i < missingUserIds.length; i++) {
      const userId = missingUserIds[i];
      console.log(`📝 Створення профілю ${i + 1}/${missingUserIds.length} для user_id: ${userId}`);
      
      const { data: newProfile, error: createError } = await supabase
        .from('user_profiles')
        .insert({
          id: userId,
          auth_user_id: userId, // Використовуємо той же ID
          name: `Користувач`,
          last_name: `${i + 1}`,
          email: `user${i + 1}@example.com`,
          bio: 'Автоматично створений профіль',
          created_at: new Date().toISOString()
        })
        .select();
        
      if (createError) {
        console.error(`❌ Помилка створення профілю для ${userId}:`, createError.message);
        
        // Спробуємо альтернативний метод
        console.log('🔄 Спроба альтернативного методу...');
        const { data: altProfile, error: altError } = await supabase
          .from('user_profiles')
          .upsert({
            id: userId,
            auth_user_id: userId,
            name: `User`,
            last_name: `${i + 1}`,
            email: `user${i + 1}@test.com`
          }, {
            onConflict: 'id'
          })
          .select();
          
        if (altError) {
          console.error(`❌ Альтернативний метод також не спрацював:`, altError.message);
        } else {
          console.log(`✅ Профіль створено альтернативним методом:`, altProfile);
        }
      } else {
        console.log(`✅ Профіль створено:`, newProfile);
      }
    }

    // Перевіряємо результат
    console.log('📝 Перевірка результату...');
    const { data: finalProfiles, error: finalError } = await supabase
      .from('user_profiles')
      .select('id, name, last_name, email')
      .in('id', uniqueUserIds);

    if (finalError) {
      console.error('❌ Помилка фінальної перевірки:', finalError);
    } else {
      console.log(`✅ Фінальна кількість профілів: ${finalProfiles?.length || 0}`);
      finalProfiles?.forEach(profile => {
        console.log(`👤 ${profile.name} ${profile.last_name} (${profile.id})`);
      });
    }

    console.log('🎉 Виправлення профілів завершено!');

  } catch (error) {
    console.error('❌ Загальна помилка:', error);
  }
};

// Запуск скрипта
fixUserProfiles();