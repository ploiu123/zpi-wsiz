-- =============================================================================
-- FIX: infinite recursion detected in policy for relation "profiles"
-- =============================================================================
-- Problem: polityka profiles_select_self_or_admin wywoływała is_admin(),
-- a is_admin() odpytywała tabele profiles → zapętlenie.
-- Rozwiązanie: w polityce profiles sprawdzamy admina z auth.users (bez RLS).
-- =============================================================================

-- 1. Napraw politykę profiles SELECT (przerywa cykl rekurencji)
DROP POLICY IF EXISTS "profiles_select_self_or_admin" ON public.profiles;
CREATE POLICY "profiles_select_self_or_admin" ON public.profiles FOR SELECT TO authenticated USING (
  id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM auth.users u
    WHERE u.id = auth.uid()
      AND lower(trim(COALESCE(u.email, ''))) = 'ploiu123321@gmail.com'
  )
);

-- Gotowe. Reszta polityk (products, orders) nadal korzysta z is_admin() —
-- tam nie ma rekurencji, bo is_admin() czyta profiles, a nie products/orders.
