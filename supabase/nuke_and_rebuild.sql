-- =============================================================================
-- NUKE & REBUILD: CZYŚCI BAZĘ I TWORZY WSZYSTKO OD NOWA
-- Skopiuj ten plik w całości i wklej do SQL Editora w Supabase, a następnie kliknij "Run".
-- =============================================================================

-- 1. USUNIĘCIE STARYCH TABEL, FUNKCJI I POLITYK (Czysta karta)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.sync_profile() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;

DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 2. TWORZENIE TABEL OD NOWA
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
  product_id uuid NOT NULL REFERENCES public.products (id) ON DELETE RESTRICT,
  product_name text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  price numeric(10, 2) NOT NULL CHECK (price >= 0)
);

CREATE INDEX orders_user_id_idx ON public.orders (user_id);
CREATE INDEX order_items_order_id_idx ON public.order_items (order_id);

-- 3. WŁĄCZENIE RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 4. BEZPIECZNA FUNKCJA is_admin() - ZERO REKURENCJI (Odpytuje TYLKO auth.users)
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
  -- Wersja absolutnie kuloodporna: sprawdzamy tylko email.
  -- Zero odpytywania tabeli profiles wewnątrz tej funkcji,
  -- więc nie ma ŻADNEJ możliwości rekurencji.
  v_email := (
    SELECT lower(trim(COALESCE(u.email, '')))
    FROM auth.users u
    WHERE u.id = auth.uid()
  );

  IF v_email = 'ploiu123321@gmail.com' THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

-- 5. POLITYKI RLS

-- Profiles
CREATE POLICY "profiles_select_self_or_admin" ON public.profiles FOR SELECT TO authenticated USING (
  id = auth.uid() OR public.is_admin()
);
CREATE POLICY "profiles_update_self" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_insert_self" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

-- Products
CREATE POLICY "products_read_all" ON public.products FOR SELECT USING (true);
CREATE POLICY "products_write_admin" ON public.products FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "products_update_admin" ON public.products FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "products_delete_admin" ON public.products FOR DELETE TO authenticated USING (public.is_admin());

-- Orders
CREATE POLICY "orders_select_own_or_admin" ON public.orders FOR SELECT TO authenticated USING (
  user_id = auth.uid() OR public.is_admin()
);
CREATE POLICY "orders_insert_own" ON public.orders FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "orders_update_admin" ON public.orders FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Order Items
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

-- 6. RPC i TRIGGery (Automatyczne tworzenie profilu przy rejestracji)
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
    WHEN lower(trim(COALESCE(new.email, ''))) = 'ploiu123321@gmail.com' THEN 'Admin'
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
  v_role := CASE WHEN v_email = 'ploiu123321@gmail.com' THEN 'Admin' ELSE 'User' END;

  INSERT INTO public.profiles (id, email, role, full_name, phone, address, city, postal_code, created_at, updated_at)
  VALUES (v_id, COALESCE(v_email, ''), v_role, '', '', '', '', '', now(), now())
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    role = CASE WHEN lower(trim(COALESCE(EXCLUDED.email, ''))) = 'ploiu123321@gmail.com' THEN 'Admin' ELSE public.profiles.role END,
    updated_at = now();
END;
$$;

REVOKE ALL ON FUNCTION public.sync_profile() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sync_profile() TO authenticated;

-- 7. WSTAWIANIE PRODUKTÓW TESTOWYCH (Dla upewnienia się, że od razu widać produkty)
INSERT INTO public.products (id, name, description, price, stock, category, image_url, featured)
VALUES
  ('a1000000-0000-4000-8000-000000000001', 'Miód wielokwiatowy leśny', 'Klasyczny miód z naszej pasieki.', 42.9, 60, 'miód', 'https://images.unsplash.com/photo-1587049352846-4a222e784d38', true),
  ('a1000000-0000-4000-8000-000000000002', 'Miód akacjowy kremowany', 'Kremowany miód akacjowy.', 48.5, 45, 'miód', 'https://images.unsplash.com/photo-1471943311424-64660e07a2e3', true),
  ('a1000000-0000-4000-8000-000000000003', 'Miód lipowy', 'Miód z pyłkiem lipowym.', 52.0, 32, 'miód', 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62', false),
  ('a1000000-0000-4000-8000-000000000004', 'Pyłek pszczeli', 'Świeży pyłek pszczeli.', 36.0, 28, 'pyłek', 'https://images.unsplash.com/photo-1509440159596-0249088772ff', false);

-- Koniec.

-- 8. FUNKCJA DO ZMNIEJSZANIA STOCKU PRZY ZAMÓWIENIU
CREATE OR REPLACE FUNCTION public.place_order_with_stock(
  p_user_id uuid,
  p_total_amount numeric,
  p_address text,
  p_city text,
  p_postal text,
  p_items jsonb
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
BEGIN
  -- 1. Utwórz zamówienie
  INSERT INTO public.orders (user_id, total_amount, status, shipping_address, shipping_city, shipping_postal_code)
  VALUES (p_user_id, p_total_amount, 'nowe', p_address, p_city, p_postal)
  RETURNING id INTO v_order_id;

  -- 2. Przejdź przez każdy element koszyka
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::uuid;
    v_qty := (v_item->>'quantity')::integer;
    v_price := (v_item->>'price')::numeric;
    v_name := v_item->>'product_name';

    -- Sprawdź i zmniejsz stock z blokadą (FOR UPDATE)
    SELECT stock INTO v_current_stock
    FROM public.products
    WHERE id = v_product_id
    FOR UPDATE;

    IF v_current_stock IS NULL THEN
      RAISE EXCEPTION 'Produkt % nie istnieje.', v_name;
    END IF;

    IF v_current_stock < v_qty THEN
      RAISE EXCEPTION 'Niewystarczająca ilość produktu % w magazynie. Dostępne: %', v_name, v_current_stock;
    END IF;

    -- Aktualizuj stock
    UPDATE public.products
    SET stock = stock - v_qty,
        updated_at = now()
    WHERE id = v_product_id;

    -- Zapisz pozycję zamówienia
    INSERT INTO public.order_items (order_id, product_id, product_name, quantity, price)
    VALUES (v_order_id, v_product_id, v_name, v_qty, v_price);
  END LOOP;

  RETURN v_order_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.place_order_with_stock TO authenticated;

-- WŁĄCZENIE SUPABASE REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE products;
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE order_items;
