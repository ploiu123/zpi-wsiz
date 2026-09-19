
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.sync_profile() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.cleanup_expired_reservations() CASCADE;
DROP FUNCTION IF EXISTS public.update_cart_reservation(text, uuid, integer) CASCADE;
DROP FUNCTION IF EXISTS public.get_cart_reservations(text) CASCADE;
DROP FUNCTION IF EXISTS public.validate_product_prices() CASCADE;
DROP FUNCTION IF EXISTS public.handle_order_cancellation() CASCADE;
DROP FUNCTION IF EXISTS public.place_order_with_stock(uuid, numeric, text, text, text, jsonb, text) CASCADE;
DROP FUNCTION IF EXISTS public.place_order_with_stock(uuid, numeric, text, text, text, jsonb) CASCADE;

DROP TABLE IF EXISTS public.cart_reservations CASCADE;
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email text NOT NULL DEFAULT '',
  full_name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  postal_code text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'User' CHECK (lower(trim(role)) IN ('user', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  price numeric(10, 2) NOT NULL CHECK (price >= 0),
  old_price numeric(10, 2) DEFAULT NULL,
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  category text NOT NULL DEFAULT 'miód',
  image_url text NOT NULL DEFAULT '',
  featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  total_amount numeric(12, 2) NOT NULL CHECK (total_amount >= 0),
  status text NOT NULL DEFAULT 'nowe',
  shipping_address text NOT NULL DEFAULT '',
  shipping_city text NOT NULL DEFAULT '',
  shipping_postal_code text NOT NULL DEFAULT '',
  stripe_session_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders (id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products (id) ON DELETE SET NULL,
  product_name text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  price numeric(10, 2) NOT NULL CHECK (price >= 0)
);

CREATE TABLE public.cart_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id text NOT NULL,
  product_id uuid NOT NULL REFERENCES public.products (id) ON DELETE CASCADE,
  quantity integer NOT NULL CHECK (quantity > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 minutes'),
  CONSTRAINT cart_reservations_cart_product_unique UNIQUE (cart_id, product_id)
);

CREATE INDEX orders_user_id_idx ON public.orders (user_id);
CREATE INDEX order_items_order_id_idx ON public.order_items (order_id);
CREATE INDEX cart_reservations_cart_id_idx ON public.cart_reservations (cart_id);
CREATE INDEX cart_reservations_expires_at_idx ON public.cart_reservations (expires_at);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_reservations ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "profiles_select_self_or_admin" ON public.profiles FOR SELECT TO authenticated USING (
  id = auth.uid() OR public.is_admin()
);
CREATE POLICY "profiles_update_self" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_insert_self" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

CREATE POLICY "products_read_all" ON public.products FOR SELECT USING (true);
CREATE POLICY "products_write_admin" ON public.products FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "products_update_admin" ON public.products FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "products_delete_admin" ON public.products FOR DELETE TO authenticated USING (public.is_admin());

CREATE POLICY "orders_select_own_or_admin" ON public.orders FOR SELECT TO authenticated USING (
  user_id = auth.uid() OR public.is_admin()
);
CREATE POLICY "orders_insert_own" ON public.orders FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "orders_update_admin" ON public.orders FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "order_items_select" ON public.order_items FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
      AND (o.user_id = auth.uid() OR public.is_admin())
  )
);
CREATE POLICY "order_items_insert_own_order" ON public.order_items FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND o.user_id = auth.uid())
);

REVOKE ALL ON TABLE public.cart_reservations FROM anon, authenticated;

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

REVOKE ALL ON FUNCTION public.sync_profile() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sync_profile() TO authenticated;

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

GRANT EXECUTE ON FUNCTION public.cleanup_expired_reservations() TO anon, authenticated;

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
  v_current_reserved integer;
  v_diff integer;
  v_current_stock integer;
  v_expires_at timestamptz;
BEGIN
  IF p_cart_id IS NULL OR length(p_cart_id) NOT BETWEEN 8 AND 64 THEN
    RAISE EXCEPTION 'Nieprawidłowy identyfikator koszyka.';
  END IF;

  IF p_target_qty IS NULL OR p_target_qty < 0 THEN
    RAISE EXCEPTION 'Nieprawidłowa ilość produktu.';
  END IF;

  PERFORM public.cleanup_expired_reservations();

  SELECT stock INTO v_current_stock
  FROM public.products
  WHERE id = p_product_id
  FOR UPDATE;

  IF NOT FOUND THEN
    IF p_target_qty = 0 THEN
      DELETE FROM public.cart_reservations
      WHERE cart_id = p_cart_id AND product_id = p_product_id;
      RETURN jsonb_build_object('success', true, 'expires_at', NULL);
    END IF;
    RAISE EXCEPTION 'Produkt nie istnieje.';
  END IF;

  SELECT quantity INTO v_current_reserved
  FROM public.cart_reservations
  WHERE cart_id = p_cart_id AND product_id = p_product_id
  FOR UPDATE;

  v_current_reserved := COALESCE(v_current_reserved, 0);
  v_diff := p_target_qty - v_current_reserved;

  IF v_diff > 0 AND v_current_stock < v_diff THEN
    RAISE EXCEPTION 'Niewystarczająca ilość w magazynie. Dostępne: %', v_current_stock;
  END IF;

  IF v_diff <> 0 THEN
    UPDATE public.products
    SET stock = stock - v_diff,
        updated_at = now()
    WHERE id = p_product_id;
  END IF;

  IF p_target_qty = 0 THEN
    DELETE FROM public.cart_reservations
    WHERE cart_id = p_cart_id AND product_id = p_product_id;
    RETURN jsonb_build_object('success', true, 'expires_at', NULL);
  END IF;

  v_expires_at := now() + interval '30 minutes';
  INSERT INTO public.cart_reservations (cart_id, product_id, quantity, expires_at)
  VALUES (p_cart_id, p_product_id, p_target_qty, v_expires_at)
  ON CONFLICT (cart_id, product_id) DO UPDATE SET
    quantity = EXCLUDED.quantity,
    expires_at = EXCLUDED.expires_at;

  RETURN jsonb_build_object('success', true, 'expires_at', v_expires_at);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_cart_reservations(p_cart_id text)
RETURNS TABLE (product_id uuid, quantity integer, expires_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.product_id, r.quantity, r.expires_at
  FROM public.cart_reservations r
  WHERE r.cart_id = p_cart_id
  ORDER BY r.expires_at;
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
  v_line record;
  v_total numeric(12, 2);
  v_reserved_qty integer;
  v_needed_qty integer;
BEGIN
  IF auth.uid() IS NULL OR p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Zaloguj się, aby złożyć zamówienie.';
  END IF;

  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Koszyk jest pusty.';
  END IF;

  IF COALESCE(btrim(p_address), '') = '' OR COALESCE(btrim(p_city), '') = '' OR COALESCE(btrim(p_postal), '') = '' THEN
    RAISE EXCEPTION 'Uzupełnij adres dostawy.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(p_items) i
    WHERE COALESCE((i->>'quantity')::integer, 0) <= 0
  ) THEN
    RAISE EXCEPTION 'Nieprawidłowa ilość produktu.';
  END IF;

  PERFORM public.cleanup_expired_reservations();

  PERFORM 1
  FROM public.products
  WHERE id IN (SELECT (i->>'product_id')::uuid FROM jsonb_array_elements(p_items) i)
  ORDER BY id
  FOR UPDATE;

  IF (SELECT count(DISTINCT (i->>'product_id')::uuid) FROM jsonb_array_elements(p_items) i)
     <> (SELECT count(*) FROM public.products
         WHERE id IN (SELECT (i->>'product_id')::uuid FROM jsonb_array_elements(p_items) i)) THEN
    RAISE EXCEPTION 'Jeden z produktów w koszyku nie jest już dostępny.';
  END IF;

  SELECT COALESCE(sum(p.price * l.quantity), 0) INTO v_total
  FROM (
    SELECT (i->>'product_id')::uuid AS product_id, sum((i->>'quantity')::integer) AS quantity
    FROM jsonb_array_elements(p_items) i
    GROUP BY 1
  ) l
  JOIN public.products p ON p.id = l.product_id;

  IF p_total_amount IS NOT NULL AND abs(p_total_amount - v_total) >= 0.01 THEN
    RAISE EXCEPTION 'Ceny w koszyku uległy zmianie. Odśwież koszyk i spróbuj ponownie.';
  END IF;

  INSERT INTO public.orders (user_id, total_amount, status, shipping_address, shipping_city, shipping_postal_code)
  VALUES (p_user_id, v_total, 'nowe', btrim(p_address), btrim(p_city), btrim(p_postal))
  RETURNING id INTO v_order_id;

  FOR v_line IN
    SELECT l.product_id, l.quantity, p.name, p.price, p.stock
    FROM (
      SELECT (i->>'product_id')::uuid AS product_id, sum((i->>'quantity')::integer)::integer AS quantity
      FROM jsonb_array_elements(p_items) i
      GROUP BY 1
    ) l
    JOIN public.products p ON p.id = l.product_id
    ORDER BY l.product_id
  LOOP
    v_reserved_qty := NULL;
    IF p_cart_id IS NOT NULL THEN
      SELECT quantity INTO v_reserved_qty
      FROM public.cart_reservations
      WHERE cart_id = p_cart_id AND product_id = v_line.product_id
      FOR UPDATE;
    END IF;
    v_reserved_qty := COALESCE(v_reserved_qty, 0);

    v_needed_qty := v_line.quantity - v_reserved_qty;

    IF v_needed_qty > 0 AND v_line.stock < v_needed_qty THEN
      RAISE EXCEPTION 'Niewystarczająca ilość produktu % w magazynie. Dostępne: %', v_line.name, v_line.stock;
    END IF;

    IF v_needed_qty <> 0 THEN
      UPDATE public.products
      SET stock = stock - v_needed_qty,
          updated_at = now()
      WHERE id = v_line.product_id;
    END IF;

    IF v_reserved_qty > 0 THEN
      DELETE FROM public.cart_reservations
      WHERE cart_id = p_cart_id AND product_id = v_line.product_id;
    END IF;

    INSERT INTO public.order_items (order_id, product_id, product_name, quantity, price)
    VALUES (v_order_id, v_line.product_id, v_line.name, v_line.quantity, v_line.price);
  END LOOP;

  RETURN v_order_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_order_cancellation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_was_cancelled boolean := lower(btrim(COALESCE(OLD.status, ''))) = 'anulowane';
  v_is_cancelled boolean := lower(btrim(COALESCE(NEW.status, ''))) = 'anulowane';
BEGIN
  IF v_was_cancelled AND NOT v_is_cancelled THEN
    RAISE EXCEPTION 'Anulowanego zamówienia nie można przywrócić.';
  END IF;

  IF v_is_cancelled AND NOT v_was_cancelled THEN
    UPDATE public.products p
    SET stock = p.stock + oi.quantity,
        updated_at = now()
    FROM (
      SELECT product_id, sum(quantity)::integer AS quantity
      FROM public.order_items
      WHERE order_id = NEW.id AND product_id IS NOT NULL
      GROUP BY product_id
    ) oi
    WHERE p.id = oi.product_id;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_order_cancellation() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS orders_handle_cancellation ON public.orders;
CREATE TRIGGER orders_handle_cancellation
  BEFORE UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_order_cancellation();

CREATE OR REPLACE FUNCTION public.validate_product_prices()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.old_price IS NOT NULL AND NEW.old_price <= NEW.price THEN
    RAISE EXCEPTION 'Cena przed promocją musi być wyższa od ceny promocyjnej.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS products_validate_prices ON public.products;
CREATE TRIGGER products_validate_prices
  BEFORE INSERT OR UPDATE OF price, old_price ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.validate_product_prices();

REVOKE ALL ON FUNCTION public.update_cart_reservation(text, uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_cart_reservation(text, uuid, integer) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.get_cart_reservations(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_cart_reservations(text) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.place_order_with_stock(uuid, numeric, text, text, text, jsonb, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.place_order_with_stock(uuid, numeric, text, text, text, jsonb, text) TO authenticated;

INSERT INTO public.products (id, name, description, price, stock, category, image_url, featured)
VALUES
  ('a1000000-0000-4000-8000-000000000001', 'Miód wielokwiatowy leśny', 'Klasyczny miód z naszej pasieki zebrany na skraju lasu.', 42.9, 60, 'miód', 'https://images.unsplash.com/photo-1587049352846-4a222e784d38', true),
  ('a1000000-0000-4000-8000-000000000002', 'Miód akacjowy kremowany', 'Puszysty kremowany miód akacjowy, idealny do kanapek.', 48.5, 45, 'miód', 'https://images.unsplash.com/photo-1471943311424-64660e07a2e3', true),
  ('a1000000-0000-4000-8000-000000000003', 'Miód lipowy', 'Miód o wyrazistym, miętowym aromacie z bieszczadzkich lip.', 52.0, 32, 'miód', 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62', false),
  ('a1000000-0000-4000-8000-000000000004', 'Pyłek pszczeli świeży', 'Świeży pyłek pszczeli o bogatych właściwościach odżywczych.', 36.0, 28, 'pyłek', 'https://images.unsplash.com/photo-1509440159596-0249088772ff', false),
  ('a1000000-0000-4000-8000-000000000005', 'Miód wrzosowy szlachetny', 'Rzadki i niezwykle ceniony miód o galaretowatej konsystencji i wyrazistym smaku wrzosowisk.', 65.0, 15, 'miód', 'https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8', true),
  ('a1000000-0000-4000-8000-000000000006', 'Miód gryczany leśny', 'Ciemny miód o silnym aromacie kwiatów gryki, idealny do pieczenia.', 44.9, 20, 'miód', 'https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8', false),
  ('a1000000-0000-4000-8000-000000000007', 'Miód malinowy z pasieki', 'Niezwykle delikatny, o lekko kwaskowatym smaku dzikich leśnych malin.', 49.0, 25, 'miód', 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62', false);

ALTER PUBLICATION supabase_realtime ADD TABLE products;
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE order_items;
