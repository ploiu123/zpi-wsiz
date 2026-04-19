-- Tworzy lub aktualizuje profil dla zalogowanego użytkownika i ustawia admina dla wskazanego maila.
-- Wywoływane z aplikacji (middleware / layout / po loginie), omija problem „brak wiersza w profiles”.

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
  IF v_id IS NULL THEN
    RETURN;
  END IF;

  SELECT trim(COALESCE(email, '')) INTO v_email FROM auth.users WHERE id = v_id;

  v_role := CASE WHEN lower(v_email) = 'ploiu123321@gmail.com' THEN 'admin' ELSE 'user' END;

  INSERT INTO public.profiles (id, email, role, full_name, phone, address, city, postal_code, created_at, updated_at)
  VALUES (
    v_id,
    COALESCE(v_email, ''),
    v_role,
    '',
    '',
    '',
    '',
    '',
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = CASE WHEN EXCLUDED.email IS NOT NULL AND EXCLUDED.email <> '' THEN EXCLUDED.email ELSE public.profiles.email END,
    role = CASE
      WHEN lower(trim(COALESCE(EXCLUDED.email, ''))) = 'ploiu123321@gmail.com' THEN 'admin'
      ELSE public.profiles.role
    END,
    updated_at = now();
END;
$$;

REVOKE ALL ON FUNCTION public.sync_profile() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sync_profile() TO authenticated;
