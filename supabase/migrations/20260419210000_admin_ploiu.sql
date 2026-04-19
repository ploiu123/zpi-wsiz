-- Konto ploiu123321@gmail.com: rola admin (pełny dostęp do panelu /admin).
-- Działa dla istniejącego profilu oraz dla nowych rejestracji z tym adresem.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
BEGIN
  v_role := CASE
    WHEN lower(trim(COALESCE(new.email, ''))) = 'ploiu123321@gmail.com' THEN 'admin'
    ELSE 'user'
  END;

  INSERT INTO public.profiles (id, email, role, full_name, phone, address, city, postal_code, created_at, updated_at)
  VALUES (
    new.id,
    COALESCE(new.email, ''),
    v_role,
    COALESCE(new.raw_user_meta_data ->> 'full_name', ''),
    '',
    '',
    '',
    '',
    now(),
    now()
  );
  RETURN new;
END;
$$;

UPDATE public.profiles
SET role = 'admin', updated_at = now()
WHERE lower(trim(email)) = 'ploiu123321@gmail.com';
