-- ============================================================================
--  NAPRAWA: nie da się dodać ani edytować produktu (błąd o old_price)
--
--  Przyczyna: tabela products została odtworzona przez reset_database.sql,
--  którego CREATE TABLE nie miało kolumny old_price (dokładała ją osobna
--  migracja 20260501_add_old_price.sql). Formularz dodawania i edycji zawsze
--  wysyła old_price, więc każdy zapis kończył się błędem.
--
--  Zapobiega też NASTĘPNEMU błędowi: zapis produktu przechodzi przez politykę
--  RLS wołającą is_admin(), a reset zostawił wersję akceptującą tylko jeden
--  adres. Tu is_admin() akceptuje oba.
--
--  Bezpieczny dla żywej bazy: zero DROP TABLE, DELETE, TRUNCATE.
--  Można uruchomić wielokrotnie.
-- ============================================================================


-- ─── 1. BRAKUJĄCA KOLUMNA ──────────────────────────────────────────────────

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS old_price numeric(10, 2) DEFAULT NULL;


-- ─── 2. UPRAWNIENIA ADMINA (oba adresy) ────────────────────────────────────

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

UPDATE public.profiles SET role = 'Admin', updated_at = now()
WHERE lower(trim(email)) IN ('pkulec@gmail.com', 'ploiu123321@gmail.com');


-- ─── 3. POLITYKI RLS NA PRODUCTS ───────────────────────────────────────────

DROP POLICY IF EXISTS "products_read_all"     ON public.products;
DROP POLICY IF EXISTS "products_write_admin"  ON public.products;
DROP POLICY IF EXISTS "products_update_admin" ON public.products;
DROP POLICY IF EXISTS "products_delete_admin" ON public.products;

CREATE POLICY "products_read_all"     ON public.products FOR SELECT USING (true);
CREATE POLICY "products_write_admin"  ON public.products FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "products_update_admin" ON public.products FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "products_delete_admin" ON public.products FOR DELETE TO authenticated USING (public.is_admin());


-- ─── 4. BRAKUJĄCE PRODUKTY (istniejących nie nadpisuje) ────────────────────

INSERT INTO public.products (id, name, description, price, stock, category, image_url, featured)
VALUES
  ('a1000000-0000-4000-8000-000000000001', 'Miód wielokwiatowy leśny', 'Klasyczny miód z naszej pasieki zebrany na skraju lasu.', 42.9, 60, 'miód', 'https://images.unsplash.com/photo-1587049352846-4a222e784d38', true),
  ('a1000000-0000-4000-8000-000000000002', 'Miód akacjowy kremowany', 'Puszysty kremowany miód akacjowy, idealny do kanapek.', 48.5, 45, 'miód', 'https://images.unsplash.com/photo-1471943311424-64660e07a2e3', true),
  ('a1000000-0000-4000-8000-000000000003', 'Miód lipowy', 'Miód o wyrazistym, miętowym aromacie z bieszczadzkich lip.', 52.0, 32, 'miód', 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62', false),
  ('a1000000-0000-4000-8000-000000000004', 'Pyłek pszczeli świeży', 'Świeży pyłek pszczeli o bogatych właściwościach odżywczych.', 36.0, 28, 'pyłek', 'https://images.unsplash.com/photo-1509440159596-0249088772ff', false),
  ('a1000000-0000-4000-8000-000000000005', 'Miód wrzosowy szlachetny', 'Rzadki i niezwykle ceniony miód o galaretowatej konsystencji i wyrazistym smaku wrzosowisk.', 65.0, 15, 'miód', 'https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8', true),
  ('a1000000-0000-4000-8000-000000000006', 'Miód gryczany leśny', 'Ciemny miód o silnym aromacie kwiatów gryki, idealny do pieczenia.', 44.9, 20, 'miód', 'https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8', false),
  ('a1000000-0000-4000-8000-000000000007', 'Miód malinowy z pasieki', 'Niezwykle delikatny, o lekko kwaskowatym smaku dzikich leśnych malin.', 49.0, 25, 'miód', 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62', false)
ON CONFLICT (id) DO NOTHING;


-- ─── 5. ODŚWIEŻENIE CACHE SCHEMATU API ─────────────────────────────────────
--     Bez tego API może jeszcze chwilę "nie widzieć" nowej kolumny.

NOTIFY pgrst, 'reload schema';


-- ─── 6. KONTROLA ───────────────────────────────────────────────────────────

SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'old_price';

SELECT policyname, cmd FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'products' ORDER BY policyname;

SELECT count(*) AS liczba_produktow FROM public.products;

SELECT email, role FROM public.profiles
WHERE lower(trim(email)) IN ('pkulec@gmail.com', 'ploiu123321@gmail.com');
