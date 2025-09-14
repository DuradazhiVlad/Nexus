import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Завантаження environment змінних
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

const createTablesStepByStep = async () => {
  console.log('🚀 Створення відсутніх таблиць покроково...');

  try {
    // 1. Створення таблиці user_personal_info
    console.log('📝 Створення таблиці user_personal_info...');
    const { error: error1 } = await supabase.rpc('create_user_personal_info_table');
    
    if (error1) {
      console.log('❌ Помилка створення user_personal_info:', error1.message);
      // Спробуємо альтернативний метод
      console.log('🔄 Спробуємо створити через SQL запит...');
      
      const { error: sqlError1 } = await supabase
        .from('user_personal_info')
        .insert({
          user_id: '00000000-0000-0000-0000-000000000000', // тестовий запис
          education: 'test'
        });
        
      if (sqlError1) {
        console.log('❌ Таблиця user_personal_info дійсно не існує:', sqlError1.message);
      }
    } else {
      console.log('✅ Таблиця user_personal_info створена');
    }

    // 2. Перевіримо чи можемо створити записи в існуючих таблицях
    console.log('📝 Перевірка можливості створення записів...');
    
    // Спробуємо отримати поточного користувача
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('❌ Помилка аутентифікації:', authError.message);
      console.log('ℹ️ Використовуємо анонімний ключ, тому аутентифікація недоступна');
    } else if (user) {
      console.log('✅ Користувач аутентифікований:', user.email);
    } else {
      console.log('ℹ️ Користувач не аутентифікований');
    }

    // 3. Перевіримо структуру існуючих таблиць
    console.log('📝 Перевірка структури таблиці user_profiles...');
    const { data: profilesData, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);

    if (profilesError) {
      console.log('❌ Помилка з user_profiles:', profilesError.message);
    } else {
      console.log('✅ Структура user_profiles:', Object.keys(profilesData?.[0] || {}));
    }

    // 4. Перевіримо чи є функції для створення таблиць
    console.log('📝 Перевірка доступних RPC функцій...');
    const { data: rpcData, error: rpcError } = await supabase.rpc('version');
    
    if (rpcError) {
      console.log('❌ RPC функції недоступні:', rpcError.message);
    } else {
      console.log('✅ RPC функції працюють. Версія PostgreSQL:', rpcData);
    }

    console.log('🎉 Діагностика завершена!');
    console.log('📋 Рекомендації:');
    console.log('1. Створіть відсутні таблиці через Supabase Dashboard');
    console.log('2. Або виконайте SQL скрипт fix_missing_tables.sql через SQL Editor');
    console.log('3. Перевірте права доступу до бази даних');

  } catch (error) {
    console.error('❌ Загальна помилка:', error);
  }
};

// Запуск скрипта
createTablesStepByStep();