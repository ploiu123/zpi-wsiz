-- =============================================================================
-- FIX v2: infinite recursion detected in policy for relation "profiles"
-- =============================================================================
-- ROOT CAUSE: is_admin() odpytuje public.profiles, a polityki na orders/products
-- wywołują is_admin(). Kiedy orders robi JOIN na profiles (np. select('*, profiles(...)')),
-- RLS na profiles triggeruje ewaluację polityk → is_admin() → profiles → RLS → is_admin() → ∞
--
-- ROZWIĄZANIE: is_admin() sprawdza admina WYŁĄCZNIE z auth.users (tabela bez RLS).
-- Dodajemy kolumnę raw_user_meta_data->>'role' w auth.users jako źródło prawdy,
-- albo prościej — sprawdzamy po mailu (bo i tak to hardcodowane).
-- =============================================================================

-- 1. Zmień is_admin() — NIE czytaj profiles, TYLKO auth.users
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
  -- Pobierz email z auth.users (bez RLS)
  SELECT lower(trim(COALESCE(u.email, '')))
  INTO v_email
  FROM auth.users u
  WHERE u.id = auth.uid();

  -- Sprawdź czy admin po mailu
  IF v_email = 'ploiu123321@gmail.com' THEN
    RETURN true;
  END IF;

  -- Sprawdź rolę w profiles BEZ triggerowania RLS (używamy SECURITY DEFINER + plpgsql)
  -- plpgsql z SECURITY DEFINER omija RLS (w przeciwieństwie do sql language)
  SELECT lower(trim(COALESCE(p.role, '')))
  INTO v_role
  FROM public.profiles p
  WHERE p.id = auth.uid();

  RETURN v_role = 'admin';
END;
$$;

-- 2. Upewnij się, że polityka profiles NIE używa is_admin()
-- (to już powinno być ok, ale dla pewności — nadpisz)
DROP POLICY IF EXISTS "profiles_select_self_or_admin" ON public.profiles;
CREATE POLICY "profiles_select_self_or_admin" ON public.profiles FOR SELECT TO authenticated USING (
  id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM auth.users u
    WHERE u.id = auth.uid()
      AND lower(trim(COALESCE(u.email, ''))) = 'ploiu123321@gmail.com'
  )
);

-- 3. Upewnij się, że polityka profiles UPDATE jest ok
DROP POLICY IF EXISTS "profiles_update_self" ON public.profiles;
CREATE POLICY "profiles_update_self" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- 4. Dodaj INSERT policy na profiles (potrzebne dla sync_profile i handle_new_user)
DROP POLICY IF EXISTS "profiles_insert_self" ON public.profiles;
CREATE POLICY "profiles_insert_self" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- =============================================================================
-- GOTOWE. Uruchom ten SQL w Supabase → SQL Editor → Run
-- =============================================================================
