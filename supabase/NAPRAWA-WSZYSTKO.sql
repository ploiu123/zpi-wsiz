-- ============================================================================
--  ZŁOTE MIODY — kompletna naprawa bazy
--  Wygenerowany 2026-09-15 z definicji w supabase/reset_database.sql
--
--  BEZPIECZNY DLA ŻYWEJ BAZY. Nie ma tu ani jednego DROP TABLE — zamówienia,
--  konta i produkty zostają nietknięte. Można uruchomić wielokrotnie.
--
--  Wklej CAŁOŚĆ do Supabase → SQL Editor → New query → Run.
-- ============================================================================


-- ─────────────────────────────────────────────────────────────────────────
-- 1. ADMIN: pkulec@gmail.com zamiast ploiu123321@gmail.com
--
--    Adres administratora był zaszyty w trzech funkcjach. Sam UPDATE na
--    profiles nie wystarczy — sync_profile() wymusza rolę przy każdym wejściu
--    na /admin i cofnąłby zmianę. Dlatego najpierw funkcje, potem dane.
--
--    is_admin() jest używane w politykach RLS (m.in. na samej tabeli profiles),
--    więc używamy CREATE OR REPLACE. DROP skasowałby te polityki kaskadowo.
-- ─────────────────────────────────────────────────────────────────────────

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

  IF v_email = 'pkulec@gmail.com' THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

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
    WHEN lower(trim(COALESCE(new.email, ''))) = 'pkulec@gmail.com' THEN 'Admin'
    ELSE 'User'
  END;

  INSERT INTO public.profiles (id, email, role, full_name, phone, address, city, postal_code, created_at, updated_at)
  VALUES (
    new.id,
    COALESCE(new.email, ''),
    v_role,
    COALESCE(new.raw_user_meta_data ->> 'full_name', ''),
    '', '', '', '', now(), now()
  );
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

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
  v_role := CASE WHEN v_email = 'pkulec@gmail.com' THEN 'Admin' ELSE 'User' END;

  INSERT INTO public.profiles (id, email, role, full_name, phone, address, city, postal_code, created_at, updated_at)
  VALUES (v_id, COALESCE(v_email, ''), v_role, '', '', '', '', '', now(), now())
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    role = CASE WHEN lower(trim(COALESCE(EXCLUDED.email, ''))) = 'pkulec@gmail.com' THEN 'Admin' ELSE public.profiles.role END,
    updated_at = now();
END;
$$;

-- Dane: nadaj rolę adminowi, odbierz staremu.
UPDATE public.profiles SET role = 'Admin', updated_at = now()
WHERE lower(trim(email)) = 'pkulec@gmail.com';

UPDATE public.profiles SET role = 'User', updated_at = now()
WHERE lower(trim(email)) = 'ploiu123321@gmail.com';


-- ─────────────────────────────────────────────────────────────────────────
-- 2. PROCEDURY SKLEPU
--    Bez place_order_with_stock składanie zamówień kończy się błędem.
-- ─────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.cleanup_expired_reservations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_res record;
BEGIN
  FOR v_res IN 
    WITH deleted AS (
      DELETE FROM public.cart_reservations
      WHERE expires_at < now()
      RETURNING product_id, quantity
    )
    SELECT * FROM deleted
  LOOP
    UPDATE public.products
    SET stock = stock + v_res.quantity,
        updated_at = now()
    WHERE id = v_res.product_id;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_cart_reservation(
  p_cart_id text,
  p_product_id uuid,
  p_target_qty integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_reserved integer := 0;
  v_diff integer;
  v_current_stock integer;
  v_expires_at timestamptz;
BEGIN
  PERFORM public.cleanup_expired_reservations();

  SELECT quantity INTO v_current_reserved
  FROM public.cart_reservations
  WHERE cart_id = p_cart_id AND product_id = p_product_id;

  IF v_current_reserved IS NULL THEN
    v_current_reserved := 0;
  END IF;

  v_diff := p_target_qty - v_current_reserved;

  IF v_diff = 0 THEN
    v_expires_at := now() + interval '30 minutes';
    UPDATE public.cart_reservations
    SET expires_at = v_expires_at
    WHERE cart_id = p_cart_id AND product_id = p_product_id;
    
    RETURN jsonb_build_object('success', true, 'expires_at', v_expires_at);
  END IF;

  SELECT stock INTO v_current_stock
  FROM public.products
  WHERE id = p_product_id
  FOR UPDATE;

  IF v_current_stock IS NULL THEN
    RAISE EXCEPTION 'Produkt nie istnieje.';
  END IF;

  IF v_diff > 0 THEN
    IF v_current_stock < v_diff THEN
      RAISE EXCEPTION 'Niewystarczająca ilość w magazynie. Dostępne: %', v_current_stock;
    END IF;

    UPDATE public.products
    SET stock = stock - v_diff,
        updated_at = now()
    WHERE id = p_product_id;

    v_expires_at := now() + interval '30 minutes';
    INSERT INTO public.cart_reservations (cart_id, product_id, quantity, expires_at)
    VALUES (p_cart_id, p_product_id, p_target_qty, v_expires_at)
    ON CONFLICT (cart_id, product_id) DO UPDATE SET
      quantity = EXCLUDED.quantity,
      expires_at = EXCLUDED.expires_at;

  ELSE
    UPDATE public.products
    SET stock = stock + abs(v_diff),
        updated_at = now()
    WHERE id = p_product_id;

    IF p_target_qty > 0 THEN
      v_expires_at := now() + interval '30 minutes';
      UPDATE public.cart_reservations
      SET quantity = p_target_qty,
          expires_at = v_expires_at
      WHERE cart_id = p_cart_id AND product_id = p_product_id;
    ELSE
      DELETE FROM public.cart_reservations
      WHERE cart_id = p_cart_id AND product_id = p_product_id;
      v_expires_at := NULL;
    END IF;
  END IF;

  RETURN jsonb_build_object('success', true, 'expires_at', v_expires_at);
END;
$$;

CREATE OR REPLACE FUNCTION public.place_order_with_stock(
  p_user_id uuid,
  p_total_amount numeric,
  p_address text,
  p_city text,
  p_postal text,
  p_items jsonb,
  p_cart_id text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id uuid;
  v_item jsonb;
  v_product_id uuid;
  v_qty integer;
  v_price numeric;
  v_name text;
  v_current_stock integer;
  v_reserved_qty integer := 0;
  v_needed_qty integer := 0;
BEGIN
  PERFORM public.cleanup_expired_reservations();

  INSERT INTO public.orders (user_id, total_amount, status, shipping_address, shipping_city, shipping_postal_code)
  VALUES (p_user_id, p_total_amount, 'nowe', p_address, p_city, p_postal)
  RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::uuid;
    v_qty := (v_item->>'quantity')::integer;
    v_price := (v_item->>'price')::numeric;
    v_name := v_item->>'product_name';

    v_reserved_qty := 0;
    IF p_cart_id IS NOT NULL THEN
      SELECT quantity INTO v_reserved_qty
      FROM public.cart_reservations
      WHERE cart_id = p_cart_id AND product_id = v_product_id;
      
      IF v_reserved_qty IS NULL THEN
        v_reserved_qty := 0;
      END IF;
    END IF;

    v_needed_qty := v_qty - v_reserved_qty;

    SELECT stock INTO v_current_stock
    FROM public.products
    WHERE id = v_product_id
    FOR UPDATE;

    IF v_current_stock IS NULL THEN
      RAISE EXCEPTION 'Produkt % nie istnieje.', v_name;
    END IF;

    IF v_needed_qty > 0 THEN
      IF v_current_stock < v_needed_qty THEN
        RAISE EXCEPTION 'Niewystarczająca ilość produktu % w magazynie. Dostępne: %', v_name, v_current_stock;
      END IF;

      UPDATE public.products
      SET stock = stock - v_needed_qty,
          updated_at = now()
      WHERE id = v_product_id;
    END IF;

    IF v_reserved_qty > 0 THEN
      DELETE FROM public.cart_reservations
      WHERE cart_id = p_cart_id AND product_id = v_product_id;
    END IF;

    INSERT INTO public.order_items (order_id, product_id, product_name, quantity, price)
    VALUES (v_order_id, v_product_id, v_name, v_qty, v_price);
  END LOOP;

  RETURN v_order_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.place_order_with_stock(uuid, numeric, text, text, text, jsonb, text) TO authenticated;


-- ─────────────────────────────────────────────────────────────────────────
-- 3. POLSKIE ZNAKI W DANYCH
--
--    Każda kolumna konwertuje się NIEZALEŻNIE. Gdyby objąć wszystkie jednym
--    blokiem obsługi wyjątku, kolumna już poprawna przerywałaby naprawę
--    pozostałych — dokładnie dlatego przy poprzedniej próbie nazwy produktów
--    się naprawiły, a kategorie nie.
-- ─────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.fix_mojibake(p text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Poprawny polski tekst nie zawiera Ã, Ä, Ĺ ani â€ — zostawiamy bez zmian.
  IF p IS NULL OR p !~ '(Ã|Ä|Ĺ|â€)' THEN
    RETURN p;
  END IF;
  BEGIN
    RETURN convert_from(convert_to(p, 'WIN1250'), 'UTF8');
  EXCEPTION WHEN others THEN
    RETURN p;   -- konwersja nieodwracalna — nie psujemy danych
  END;
END $$;

UPDATE public.products
SET name        = public.fix_mojibake(name),
    description = public.fix_mojibake(description),
    category    = public.fix_mojibake(category),
    updated_at  = now()
WHERE name ~ '(Ã|Ä|Ĺ|â€)' OR description ~ '(Ã|Ä|Ĺ|â€)' OR category ~ '(Ã|Ä|Ĺ|â€)';

-- order_items trzyma własną kopię nazwy z chwili złożenia zamówienia.
UPDATE public.order_items
SET product_name = public.fix_mojibake(product_name)
WHERE product_name ~ '(Ã|Ä|Ĺ|â€)';

UPDATE public.profiles
SET full_name = public.fix_mojibake(full_name),
    address   = public.fix_mojibake(address),
    city      = public.fix_mojibake(city),
    updated_at = now()
WHERE full_name ~ '(Ã|Ä|Ĺ|â€)' OR address ~ '(Ã|Ä|Ĺ|â€)' OR city ~ '(Ã|Ä|Ĺ|â€)';

DROP FUNCTION public.fix_mojibake(text);


-- ─────────────────────────────────────────────────────────────────────────
-- 4. REALTIME DLA REZERWACJI KOSZYKA
--    Bez tego rezerwacja nie synchronizuje się między urządzeniami.
-- ─────────────────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'cart_reservations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.cart_reservations;
  END IF;
END $$;

-- Przy DELETE Postgres wysyła domyślnie sam klucz główny; FULL dokłada product_id.
ALTER TABLE public.cart_reservations REPLICA IDENTITY FULL;


-- ─────────────────────────────────────────────────────────────────────────
-- 5. WERYFIKACJA — wyniki zobaczysz w zakładce Results
-- ─────────────────────────────────────────────────────────────────────────

-- 5a. Kto jest administratorem?
SELECT email, role FROM public.profiles
WHERE lower(trim(email)) IN ('pkulec@gmail.com', 'ploiu123321@gmail.com')
ORDER BY email;

-- 5b. Czy procedury istnieją?
SELECT p.proname AS funkcja, pg_get_function_identity_arguments(p.oid) AS argumenty
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('place_order_with_stock','update_cart_reservation',
                    'cleanup_expired_reservations','sync_profile','is_admin')
ORDER BY p.proname;

-- 5c. Czy zostało zepsute kodowanie? Wszystko powinno być 0.
SELECT count(*) FILTER (WHERE name ~ '(Ã|Ä|Ĺ|â€)')        AS zepsute_nazwy,
       count(*) FILTER (WHERE description ~ '(Ã|Ä|Ĺ|â€)') AS zepsute_opisy,
       count(*) FILTER (WHERE category ~ '(Ã|Ä|Ĺ|â€)')    AS zepsute_kategorie,
       count(*)                                     AS wszystkich_produktow
FROM public.products;

-- 5d. Co jest w publikacji Realtime? Muszą być 4 tabele, w tym cart_reservations.
SELECT tablename FROM pg_publication_tables
WHERE pubname = 'supabase_realtime' AND schemaname = 'public'
ORDER BY tablename;
