import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Завантаження environment змінних
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

const updatePostsTable = async () => {
  console.log('🚀 Оновлення структури таблиці posts...');

  try {
    // Спробуємо створити тестовий пост для перевірки структури
    console.log('📝 Перевірка поточної структури таблиці posts...');
    
    const { data: existingPosts, error: selectError } = await supabase
      .from('posts')
      .select('id, user_id, content, group_id')
      .limit(1);

    if (selectError) {
      console.log('❌ Помилка при читанні posts:', selectError.message);
      return;
    }

    console.log('✅ Таблиця posts доступна для читання');
    console.log('📊 Структура існуючих постів:', existingPosts?.[0] ? Object.keys(existingPosts[0]) : 'Немає постів');

    // Перевіримо чи існує поле group_id
    if (existingPosts && existingPosts.length > 0) {
      const hasGroupId = 'group_id' in existingPosts[0];
      console.log(`📋 Поле group_id: ${hasGroupId ? '✅ існує' : '❌ відсутнє'}`);
    }

    // Спробуємо створити тестовий пост з group_id
    console.log('📝 Тестування створення посту з group_id...');
    
    // Спочатку отримаємо поточного користувача
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('ℹ️ Користувач не аутентифікований, використовуємо тестові дані');
      
      // Спробуємо отримати будь-який існуючий профіль для тесту
      const { data: profiles, error: profileError } = await supabase
        .from('user_profiles')
        .select('id')
        .limit(1);
        
      if (profileError || !profiles || profiles.length === 0) {
        console.log('❌ Не вдалося знайти профілі користувачів для тесту');
        return;
      }
      
      const testUserId = profiles[0].id;
      console.log('🧪 Використовуємо тестовий user_id:', testUserId);
      
      // Спробуємо вставити тестовий пост
      const { data: insertData, error: insertError } = await supabase
        .from('posts')
        .insert({
          user_id: testUserId,
          content: 'Тестовий пост для перевірки структури таблиці',
          group_id: null // Тестуємо чи працює поле group_id
        })
        .select();
        
      if (insertError) {
        console.log('❌ Помилка створення тестового посту:', insertError.message);
        
        if (insertError.message.includes('group_id')) {
          console.log('📋 Поле group_id відсутнє в таблиці posts');
          console.log('💡 Рекомендація: Додайте поле group_id через Supabase Dashboard:');
          console.log('   ALTER TABLE posts ADD COLUMN group_id uuid REFERENCES groups(id);');
        }
      } else {
        console.log('✅ Тестовий пост створено успішно:', insertData);
        
        // Видаляємо тестовий пост
        if (insertData && insertData.length > 0) {
          await supabase
            .from('posts')
            .delete()
            .eq('id', insertData[0].id);
          console.log('🗑️ Тестовий пост видалено');
        }
      }
    }

    // Перевіримо існуючі пости
    console.log('📊 Аналіз існуючих постів...');
    const { data: allPosts, error: allPostsError } = await supabase
      .from('posts')
      .select('*')
      .limit(5);
      
    if (allPostsError) {
      console.log('❌ Помилка отримання постів:', allPostsError.message);
    } else {
      console.log(`📈 Знайдено постів: ${allPosts?.length || 0}`);
      if (allPosts && allPosts.length > 0) {
        console.log('📋 Структура посту:', Object.keys(allPosts[0]));
        console.log('📄 Приклад посту:', {
          id: allPosts[0].id,
          user_id: allPosts[0].user_id,
          content: allPosts[0].content?.substring(0, 50) + '...',
          created_at: allPosts[0].created_at
        });
      }
    }

    console.log('🎉 Аналіз завершено!');
    console.log('📋 Наступні кроки:');
    console.log('1. Якщо поле group_id відсутнє, додайте його через Supabase Dashboard');
    console.log('2. Перевірте RLS політики для таблиці posts');
    console.log('3. Переконайтеся що таблиця groups існує');

  } catch (error) {
    console.error('❌ Загальна помилка:', error);
  }
};

// Запуск скрипта
updatePostsTable();