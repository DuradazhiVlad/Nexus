-- Очищення та виправлення політик RLS

-- Видаляємо всі існуючі політики для user_profiles
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
DROP POLICY IF EXISTS "Enable update for users based on auth_user_id" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable delete for users based on auth_user_id" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable public read for public profiles" ON public.user_profiles;

-- Створюємо нові чіткі політики для user_profiles
CREATE POLICY "user_profiles_select_all" ON public.user_profiles
  FOR SELECT TO authenticated
  USING (true); -- Всі можуть бачити всі профілі

CREATE POLICY "user_profiles_insert_own" ON public.user_profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "user_profiles_update_own" ON public.user_profiles
  FOR UPDATE TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "user_profiles_delete_own" ON public.user_profiles
  FOR DELETE TO authenticated
  USING (auth_user_id = auth.uid());

-- Переконуємося що RLS увімкнено
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Видаляємо дублікати політик для friend_requests
DROP POLICY IF EXISTS "Users can view their friend requests" ON friend_requests;
DROP POLICY IF EXISTS "Users can create friend requests" ON friend_requests;
DROP POLICY IF EXISTS "Users can update their friend requests" ON friend_requests;
DROP POLICY IF EXISTS "Users can create friend requests" ON friend_requests;
DROP POLICY IF EXISTS "Users can update friend requests" ON friend_requests;

-- Створюємо нові політики для friend_requests
CREATE POLICY "friend_requests_select" ON friend_requests
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up1 WHERE up1.id = friend_requests.user_id AND up1.auth_user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM user_profiles up2 WHERE up2.id = friend_requests.friend_id AND up2.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "friend_requests_insert" ON friend_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up WHERE up.id = friend_requests.user_id AND up.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "friend_requests_update" ON friend_requests
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up1 WHERE up1.id = friend_requests.user_id AND up1.auth_user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM user_profiles up2 WHERE up2.id = friend_requests.friend_id AND up2.auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up1 WHERE up1.id = friend_requests.user_id AND up1.auth_user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM user_profiles up2 WHERE up2.id = friend_requests.friend_id AND up2.auth_user_id = auth.uid()
    )
  );

-- Переконуємося що RLS увімкнено для friend_requests
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;

-- Перевіряємо політики для conversations (вони виглядають правильно)
-- Політики для messages також правильні

-- Додаємо індекси для покращення продуктивності
CREATE INDEX IF NOT EXISTS idx_user_profiles_auth_user_id ON public.user_profiles(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_user_id ON friend_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_friend_id ON friend_requests(friend_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_status ON friend_requests(status);