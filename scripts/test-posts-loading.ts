import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Завантажуємо змінні середовища
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;

// Створюємо клієнт
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testPostsLoading() {
  console.log('🧪 Тестування завантаження постів...');
  
  try {
    // 1. Перевіряємо профілі
    console.log('\n1️⃣ Перевіряємо user_profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*');
      
    if (profilesError) {
      console.error('❌ Помилка отримання профілів:', profilesError);
    } else {
      console.log(`✅ Знайдено ${profiles?.length || 0} профілів`);
      if (profiles && profiles.length > 0) {
        console.log('📋 Профілі:', profiles.map(p => ({ id: p.id, name: p.name, email: p.email })));
      }
    }
    
    // 2. Перевіряємо пости
    console.log('\n2️⃣ Перевіряємо posts...');
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*');
      
    if (postsError) {
      console.error('❌ Помилка отримання постів:', postsError);
    } else {
      console.log(`✅ Знайдено ${posts?.length || 0} постів`);
      if (posts && posts.length > 0) {
        console.log('📋 Пости:', posts.map(p => ({ id: p.id, user_id: p.user_id, content: p.content?.substring(0, 50) + '...' })));
      }
    }
    
    // 3. Тестуємо завантаження постів з авторами (як в ProfileNew.tsx)
    console.log('\n3️⃣ Тестуємо завантаження постів з авторами...');
    const { data: postsWithAuthors, error: postsWithAuthorsError } = await supabase
      .from('posts')
      .select(`
        *,
        author:user_profiles!posts_user_id_fkey(name, last_name, avatar)
      `)
      .order('created_at', { ascending: false })
      .limit(10);
      
    if (postsWithAuthorsError) {
      console.error('❌ Помилка завантаження постів з авторами:', postsWithAuthorsError);
    } else {
      console.log(`✅ Завантажено ${postsWithAuthors?.length || 0} постів з авторами`);
      if (postsWithAuthors && postsWithAuthors.length > 0) {
        console.log('📋 Пости з авторами:');
        postsWithAuthors.forEach(post => {
          console.log(`  - ${post.id}: "${post.content?.substring(0, 30)}..." від ${post.author?.name || 'Unknown'} ${post.author?.last_name || ''}`);
        });
      }
    }
    
    // 4. Тестуємо завантаження постів для конкретного користувача
    if (profiles && profiles.length > 0) {
      const testUserId = profiles[0].id;
      console.log(`\n4️⃣ Тестуємо завантаження постів для користувача ${testUserId}...`);
      
      const { data: userPosts, error: userPostsError } = await supabase
        .from('posts')
        .select(`
          *,
          author:user_profiles!posts_user_id_fkey(name, last_name, avatar)
        `)
        .eq('user_id', testUserId)
        .order('created_at', { ascending: false });
        
      if (userPostsError) {
        console.error('❌ Помилка завантаження постів користувача:', userPostsError);
      } else {
        console.log(`✅ Знайдено ${userPosts?.length || 0} постів для користувача ${testUserId}`);
        if (userPosts && userPosts.length > 0) {
          userPosts.forEach(post => {
            console.log(`  - ${post.content?.substring(0, 50)}... від ${post.author?.name || 'Unknown'}`);
          });
        }
      }
    }
    
    // 5. Тестуємо foreign key зв'язки
    console.log('\n5️⃣ Перевіряємо foreign key зв'язки...');
    const { data: foreignKeyTest, error: fkError } = await supabase
      .from('posts')
      .select(`
        id,
        user_id,
        user_profiles!posts_user_id_fkey(id, name)
      `)
      .limit(5);
      
    if (fkError) {
      console.error('❌ Помилка перевірки foreign key:', fkError);
    } else {
      console.log('✅ Foreign key зв\'язки працюють правильно');
      if (foreignKeyTest && foreignKeyTest.length > 0) {
        foreignKeyTest.forEach(post => {
          console.log(`  - Post ${post.id} -> User ${post.user_profiles?.name || 'Unknown'}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Загальна помилка:', error);
  }
}

// Запускаємо тестування
testPostsLoading().then(() => {
  console.log('\n🏁 Тестування завершено!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Критична помилка:', error);
  process.exit(1);
});