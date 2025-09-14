import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Завантаження environment змінних
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

const checkAndCreateTables = async () => {
  console.log('🚀 Перевірка та створення відсутніх таблиць...');

  try {
    // Перевірка user_personal_info
    console.log('📝 Перевірка таблиці user_personal_info...');
    const { error: error1 } = await supabase
      .from('user_personal_info')
      .select('id')
      .limit(1);

    if (error1) {
      console.log('❌ Таблиця user_personal_info не існує:', error1.message);
      console.log('📋 Код помилки:', error1.code);
    } else {
      console.log('✅ Таблиця user_personal_info існує');
    }

    // Перевірка user_photos
    console.log('📝 Перевірка таблиці user_photos...');
    const { error: error2 } = await supabase
      .from('user_photos')
      .select('id')
      .limit(1);

    if (error2) {
      console.log('❌ Таблиця user_photos не існує:', error2.message);
      console.log('📋 Код помилки:', error2.code);
    } else {
      console.log('✅ Таблиця user_photos існує');
    }

    // Перевірка user_videos
    console.log('📝 Перевірка таблиці user_videos...');
    const { error: error3 } = await supabase
      .from('user_videos')
      .select('id')
      .limit(1);

    if (error3) {
      console.log('❌ Таблиця user_videos не існує:', error3.message);
      console.log('📋 Код помилки:', error3.code);
    } else {
      console.log('✅ Таблиця user_videos існує');
    }

    // Перевірка profiles
    console.log('📝 Перевірка таблиці profiles...');
    const { error: error4 } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (error4) {
      console.log('❌ Таблиця profiles не існує:', error4.message);
      console.log('📋 Код помилки:', error4.code);
    } else {
      console.log('✅ Таблиця profiles існує');
    }

    // Перевірка posts
    console.log('📝 Перевірка таблиці posts...');
    const { data: postsData, error: postsError } = await supabase
      .from('posts')
      .select('id, user_id, content, created_at')
      .limit(5);

    if (postsError) {
      console.log('❌ Помилка з таблицею posts:', postsError.message);
    } else {
      console.log('✅ Таблиця posts працює. Знайдено постів:', postsData?.length || 0);
      if (postsData && postsData.length > 0) {
        console.log('📋 Приклад поста:', postsData[0]);
      }
    }

    // Перевірка user_profiles
    console.log('📝 Перевірка таблиці user_profiles...');
    const { data: profilesData, error: profilesError } = await supabase
      .from('user_profiles')
      .select('id, name, email')
      .limit(3);

    if (profilesError) {
      console.log('❌ Помилка з таблицею user_profiles:', profilesError.message);
    } else {
      console.log('✅ Таблиця user_profiles працює. Знайдено профілів:', profilesData?.length || 0);
    }

    console.log('🎉 Перевірка таблиць завершена!');

  } catch (error) {
    console.error('❌ Загальна помилка:', error);
  }
};

// Запуск скрипта
checkAndCreateTables();