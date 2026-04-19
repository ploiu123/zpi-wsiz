-- =============================================================================
-- MASTER FIX: Naprawia WSZYSTKIE problemy z RLS jednym uruchomieniem
-- Wklej w Supabase → SQL Editor → Run
-- =============================================================================

-- ═══════════════════════════════════════════════════════════════════
-- 1. NAPRAW is_admin() — MUSI być plpgsql (nie sql!)
--    sql + SECURITY DEFINER NIE omija RLS w Supabase → rekurencja
-- ═══════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_email text;
  v_role text;
BEGIN
  -- Pobierz email z auth.users (tabela BEZ RLS — nigdy nie zapętli)
  SELECT lower(trim(COALESCE(u.email, '')))
  INTO v_email
  FROM auth.users u
  WHERE u.id = auth.uid();

  -- Admin po mailu
  IF v_email = 'ploiu123321@gmail.com' THEN
    RETURN true;
  END IF;

  -- Admin po roli (plpgsql + SECURITY DEFINER omija RLS na profiles)
  SELECT lower(trim(COALESCE(p.role, '')))
  INTO v_role
  FROM public.profiles p
  WHERE p.id = auth.uid();

  RETURN v_role = 'admin';
END;
$$;

-- ═══════════════════════════════════════════════════════════════════
-- 2. POLITYKI: profiles
-- ═══════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "profiles_select_self_or_admin" ON public.profiles;
CREATE POLICY "profiles_select_self_or_admin" ON public.profiles FOR SELECT TO authenticated USING (
  id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM auth.users u
    WHERE u.id = auth.uid()
      AND lower(trim(COALESCE(u.email, ''))) = 'ploiu123321@gmail.com'
  )
);

DROP POLICY IF EXISTS "profiles_update_self" ON public.profiles;
CREATE POLICY "profiles_update_self" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "profiles_insert_self" ON public.profiles;
CREATE POLICY "profiles_insert_self" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════
-- 3. POLITYKI: products — KAŻDY może czytać (anon + authenticated)
-- ═══════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "products_read_all" ON public.products;
CREATE POLICY "products_read_all" ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "products_write_admin" ON public.products;
DROP POLICY IF EXISTS "products_update_admin" ON public.products;
DROP POLICY IF EXISTS "products_delete_admin" ON public.products;
CREATE POLICY "products_write_admin" ON public.products FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "products_update_admin" ON public.products FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "products_delete_admin" ON public.products FOR DELETE TO authenticated USING (public.is_admin());

-- ═══════════════════════════════════════════════════════════════════
-- 4. POLITYKI: orders
-- ═══════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "orders_select_own_or_admin" ON public.orders;
CREATE POLICY "orders_select_own_or_admin" ON public.orders FOR SELECT TO authenticated USING (
  user_id = auth.uid() OR public.is_admin()
);

DROP POLICY IF EXISTS "orders_insert_own" ON public.orders;
CREATE POLICY "orders_insert_own" ON public.orders FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "orders_update_admin" ON public.orders;
CREATE POLICY "orders_update_admin" ON public.orders FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ═══════════════════════════════════════════════════════════════════
-- 5. POLITYKI: order_items
-- ═══════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "order_items_select" ON public.order_items;
CREATE POLICY "order_items_select" ON public.order_items FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
      AND (o.user_id = auth.uid() OR public.is_admin())
  )
);

DROP POLICY IF EXISTS "order_items_insert_own_order" ON public.order_items;
CREATE POLICY "order_items_insert_own_order" ON public.order_items FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND o.user_id = auth.uid())
);

-- ═══════════════════════════════════════════════════════════════════
-- 6. Upewnij się, że RLS jest WŁĄCZONE na wszystkich tabelach
-- ═══════════════════════════════════════════════════════════════════
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════
-- GOTOWE. Po uruchomieniu odśwież stronę.
-- ═══════════════════════════════════════════════════════════════════
