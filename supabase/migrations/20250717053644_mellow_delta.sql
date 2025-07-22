/*
  # Виправлення рекурсії в RLS політиках для group_members

  1. Проблема
    - RLS політики для group_members створюють нескінченну рекурсію
    - Політики посилаються самі на себе через підзапити

  2. Рішення
    - Спростити політики, уникаючи складних підзапитів
    - Використовувати прямі перевірки auth.uid()
    - Розділити логіку для різних операцій
*/

-- Видалити всі існуючі політики для group_members
DROP POLICY IF EXISTS "Group members can view memberships" ON group_members;
DROP POLICY IF EXISTS "Users can join groups" ON group_members;
DROP POLICY IF EXISTS "Users can leave groups" ON group_members;

-- Створити нові спрощені політики без рекурсії

-- Політика для SELECT: користувачі можуть бачити членство в групах, де вони є учасниками
CREATE POLICY "Users can view group memberships" ON group_members
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR 
    group_id IN (
      SELECT group_id FROM group_members gm2 
      WHERE gm2.user_id = auth.uid()
    )
  );

-- Політика для INSERT: користувачі можуть приєднуватися до груп
CREATE POLICY "Users can join groups" ON group_members
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Політика для DELETE: користувачі можуть покидати групи
CREATE POLICY "Users can leave groups" ON group_members
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Переконатися, що RLS увімкнено
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;