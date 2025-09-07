/*
  # Обробка дублювання членства в групах

  1. Створення функції для безпечного додавання до групи
  2. Додавання обробки конфліктів при вставці
  3. Створення функції для перевірки членства
*/

-- Створюємо функцію для безпечного приєднання до групи
CREATE OR REPLACE FUNCTION join_group_safe(
    p_group_id uuid,
    p_user_id uuid DEFAULT NULL,
    p_role text DEFAULT 'member'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id uuid;
    v_existing_member boolean;
    v_result jsonb;
BEGIN
    -- Отримуємо user_id з поточного користувача якщо не передано
    IF p_user_id IS NULL THEN
        SELECT id INTO v_user_id 
        FROM public.user_profiles 
        WHERE auth_user_id = auth.uid();
        
        IF v_user_id IS NULL THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'User profile not found',
                'code', 'USER_NOT_FOUND'
            );
        END IF;
    ELSE
        v_user_id := p_user_id;
    END IF;
    
    -- Перевіряємо чи користувач вже є членом групи
    SELECT EXISTS(
        SELECT 1 FROM public.group_members 
        WHERE group_id = p_group_id AND user_id = v_user_id
    ) INTO v_existing_member;
    
    IF v_existing_member THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'User is already a member of this group',
            'code', 'ALREADY_MEMBER'
        );
    END IF;
    
    -- Перевіряємо чи група існує
    IF NOT EXISTS(SELECT 1 FROM public.groups WHERE id = p_group_id) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Group not found',
            'code', 'GROUP_NOT_FOUND'
        );
    END IF;
    
    -- Додаємо користувача до групи
    BEGIN
        INSERT INTO public.group_members (group_id, user_id, role)
        VALUES (p_group_id, v_user_id, p_role);
        
        RETURN jsonb_build_object(
            'success', true,
            'message', 'Successfully joined the group',
            'data', jsonb_build_object(
                'group_id', p_group_id,
                'user_id', v_user_id,
                'role', p_role
            )
        );
    EXCEPTION
        WHEN unique_violation THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'User is already a member of this group',
                'code', 'DUPLICATE_MEMBERSHIP'
            );
        WHEN OTHERS THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'Failed to join group: ' || SQLERRM,
                'code', 'JOIN_FAILED'
            );
    END;
END;
$$;

-- Створюємо функцію для перевірки членства в групі
CREATE OR REPLACE FUNCTION check_group_membership(
    p_group_id uuid,
    p_user_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id uuid;
    v_membership record;
BEGIN
    -- Отримуємо user_id з поточного користувача якщо не передано
    IF p_user_id IS NULL THEN
        SELECT id INTO v_user_id 
        FROM public.user_profiles 
        WHERE auth_user_id = auth.uid();
        
        IF v_user_id IS NULL THEN
            RETURN jsonb_build_object(
                'is_member', false,
                'error', 'User profile not found'
            );
        END IF;
    ELSE
        v_user_id := p_user_id;
    END IF;
    
    -- Перевіряємо членство
    SELECT * INTO v_membership
    FROM public.group_members 
    WHERE group_id = p_group_id AND user_id = v_user_id;
    
    IF FOUND THEN
        RETURN jsonb_build_object(
            'is_member', true,
            'role', v_membership.role,
            'joined_at', v_membership.joined_at
        );
    ELSE
        RETURN jsonb_build_object(
            'is_member', false
        );
    END IF;
END;
$$;

-- Створюємо функцію для безпечного видалення з групи
CREATE OR REPLACE FUNCTION leave_group_safe(
    p_group_id uuid,
    p_user_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id uuid;
    v_deleted_count integer;
BEGIN
    -- Отримуємо user_id з поточного користувача якщо не передано
    IF p_user_id IS NULL THEN
        SELECT id INTO v_user_id 
        FROM public.user_profiles 
        WHERE auth_user_id = auth.uid();
        
        IF v_user_id IS NULL THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'User profile not found',
                'code', 'USER_NOT_FOUND'
            );
        END IF;
    ELSE
        v_user_id := p_user_id;
    END IF;
    
    -- Видаляємо користувача з групи
    DELETE FROM public.group_members 
    WHERE group_id = p_group_id AND user_id = v_user_id;
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    IF v_deleted_count > 0 THEN
        RETURN jsonb_build_object(
            'success', true,
            'message', 'Successfully left the group'
        );
    ELSE
        RETURN jsonb_build_object(
            'success', false,
            'error', 'User was not a member of this group',
            'code', 'NOT_A_MEMBER'
        );
    END IF;
END;
$$;

-- Додаємо політику для безпечного вставлення в group_members
DROP POLICY IF EXISTS "Users can join groups" ON public.group_members;
CREATE POLICY "Users can join groups" ON public.group_members
    FOR INSERT WITH CHECK (
        user_id IN (
            SELECT id FROM public.user_profiles 
            WHERE auth_user_id = auth.uid()
        )
    );

-- Додаємо політику для видалення з group_members
DROP POLICY IF EXISTS "Users can leave groups" ON public.group_members;
CREATE POLICY "Users can leave groups" ON public.group_members
    FOR DELETE USING (
        user_id IN (
            SELECT id FROM public.user_profiles 
            WHERE auth_user_id = auth.uid()
        )
    );

-- Надаємо дозволи на виконання функцій
GRANT EXECUTE ON FUNCTION join_group_safe(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION check_group_membership(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION leave_group_safe(uuid, uuid) TO authenticated;

-- Перевіряємо, що функції створені успішно
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'join_group_safe'
        AND routine_schema = 'public'
    ) THEN
        RAISE NOTICE 'Group membership functions created successfully';
    ELSE
        RAISE EXCEPTION 'Failed to create group membership functions';
    END IF;
END $$;