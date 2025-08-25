// Скрипт для перевірки таблиці user_profiles
import { supabase } from './src/lib/supabase.js';

async function checkUserProfilesTable() {
  try {
    console.log('🔍 Checking user_profiles table...');
    
    // Перевіряємо чи існує таблиця
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error accessing user_profiles table:', error);
      console.log('📝 Table might not exist or have permission issues');
      return false;
    }
    
    console.log('✅ user_profiles table exists');
    console.log('📊 Sample data:', data);
    return true;
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('❌ Auth error:', error);
      return null;
    }
    
    console.log('👤 Current user:', user?.email);
    return user;
  } catch (error) {
    console.error('❌ Error getting user:', error);
    return null;
  }
}

async function testProfileOperations() {
  console.log('🚀 Starting profile debug...');
  
  const tableExists = await checkUserProfilesTable();
  const user = await getCurrentUser();
  
  if (!tableExists) {
    console.log('❌ Cannot proceed - user_profiles table does not exist');
    return;
  }
  
  if (!user) {
    console.log('❌ Cannot proceed - no authenticated user');
    return;
  }
  
  // Спробуємо отримати профіль користувача
  try {
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('auth_user_id', user.id)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('❌ Error getting profile:', error);
    } else if (error && error.code === 'PGRST116') {
      console.log('📝 No profile found for user');
    } else {
      console.log('✅ User profile found:', profile);
    }
  } catch (error) {
    console.error('❌ Unexpected error getting profile:', error);
  }
}

testProfileOperations();