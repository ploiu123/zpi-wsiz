-- ============================================================================
--  KROK 2 — PRZYWRÓCENIE DOSTĘPU
--
--  Czyni administratorami OBA adresy naraz. Dzięki temu nie ma znaczenia,
--  na które konto faktycznie potrafisz się zalogować — panel zadziała.
--  Gdy założysz konto pkulec@gmail.com, drugi adres można usunąć z listy.
--
--  is_admin() celowo czyta adres z auth.users, a NIE kolumnę role z profiles:
--  ta funkcja jest używana w polityce RLS nałożonej na samą tabelę profiles,
--  więc sięgnięcie po profiles groziłoby nieskończoną rekurencją polityki.
--
--  Używamy CREATE OR REPLACE, nie DROP — DROP skasowałby kaskadowo wszystkie
--  polityki RLS, które z tej funkcji korzystają.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_email text;
BEGIN
  v_email := (
    SELECT lower(trim(COALESCE(u.email, '')))
    FROM auth.users u
    WHERE u.id = auth.uid()
  );
  RETURN v_email IN ('pkulec@gmail.com', 'ploiu123321@gmail.com');
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_profile()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid := auth.uid();
  v_email text;
  v_role text;
BEGIN
  IF v_id IS NULL THEN RETURN; END IF;

  v_email := (SELECT lower(trim(COALESCE(email, ''))) FROM auth.users WHERE id = v_id);
  v_role := CASE WHEN v_email IN ('pkulec@gmail.com', 'ploiu123321@gmail.com')
                 THEN 'Admin' ELSE 'User' END;

  INSERT INTO public.profiles (id, email, role, full_name, phone, address, city, postal_code, created_at, updated_at)
  VALUES (v_id, COALESCE(v_email, ''), v_role, '', '', '', '', '', now(), now())
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    role = CASE WHEN lower(trim(COALESCE(EXCLUDED.email, ''))) IN ('pkulec@gmail.com', 'ploiu123321@gmail.com')
                THEN 'Admin' ELSE public.profiles.role END,
    updated_at = now();
END;
$$;
REVOKE ALL ON FUNCTION public.sync_profile() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sync_profile() TO authenticated;

-- Nadaj rolę wszystkim istniejącym kontom z tych dwóch adresów.
UPDATE public.profiles SET role = 'Admin', updated_at = now()
WHERE lower(trim(email)) IN ('pkulec@gmail.com', 'ploiu123321@gmail.com');

-- Gdyby konto istniało w auth.users, ale nie miało wiersza w profiles.
INSERT INTO public.profiles (id, email, role, full_name, phone, address, city, postal_code, created_at, updated_at)
SELECT u.id, lower(trim(u.email)), 'Admin', '', '', '', '', '', now(), now()
FROM auth.users u
WHERE lower(trim(u.email)) IN ('pkulec@gmail.com', 'ploiu123321@gmail.com')
  AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id);

-- Kontrola
SELECT u.email, p.role, (u.email_confirmed_at IS NOT NULL) AS potwierdzony
FROM auth.users u LEFT JOIN public.profiles p ON p.id = u.id
ORDER BY u.created_at;
