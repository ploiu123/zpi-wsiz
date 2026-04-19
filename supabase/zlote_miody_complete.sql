-- =============================================================================
-- Złote Miody — JEDEN PLIK SQL (wklej całość w Supabase → SQL Editor → Run)
-- =============================================================================
-- Zawiera: tabele, indeksy, RLS, is_admin, sync_profile, trigger rejestracji,
-- role Admin/User (w tym ploiu123321@gmail.com), przykładowe produkty.
-- =============================================================================

-- --- Tabele ---
CREATE TABLE IF NOT EXISTS public.profiles (
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

CREATE TABLE IF NOT EXISTS public.products (
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

CREATE TABLE IF NOT EXISTS public.orders (
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

CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders (id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products (id) ON DELETE RESTRICT,
  product_name text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  price numeric(10, 2) NOT NULL CHECK (price >= 0)
);

CREATE INDEX IF NOT EXISTS orders_user_id_idx ON public.orders (user_id);
CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON public.order_items (order_id);

-- --- Uaktualnienie CHECK na profiles (gdy migracja była starsza: tylko małe litery) ---
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check CHECK (lower(trim(role)) IN ('user', 'admin'));

UPDATE public.profiles
SET role = initcap(lower(trim(role))), updated_at = now()
WHERE role IS NOT NULL;

UPDATE public.profiles
SET role = 'Admin', updated_at = now()
WHERE lower(trim(email)) = 'ploiu123321@gmail.com';

-- --- Normalizacja starych statusów zamówień ---
UPDATE public.orders SET status = 'nowe' WHERE status IN ('Nowe');
UPDATE public.orders SET status = 'w realizacji' WHERE status IN ('W trakcie realizacji');
UPDATE public.orders SET status = 'wysłane' WHERE status IN ('Wysłane do kuriera');
UPDATE public.orders SET status = 'dostarczone' WHERE status IN ('Zakończone');
UPDATE public.orders SET status = 'anulowane' WHERE status IN ('Anulowane');

-- --- RLS ---
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Admin po roli w profiles LUB po mailu w auth.users (gdy profil się nie zsynchronizował).
-- WAŻNE: musi być plpgsql (nie sql), bo plpgsql + SECURITY DEFINER poprawnie
-- omija RLS na profiles. Bez tego: orders JOIN profiles → RLS → is_admin() → profiles → ∞
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
  v_email := (
    SELECT lower(trim(COALESCE(u.email, '')))
    FROM auth.users u
    WHERE u.id = auth.uid()
  );

  IF v_email = 'ploiu123321@gmail.com' THEN
    RETURN true;
  END IF;

  v_role := (
    SELECT lower(trim(COALESCE(p.role, '')))
    FROM public.profiles p
    WHERE p.id = auth.uid()
  );

  RETURN v_role = 'admin';
END;
$$;

-- UWAGA: NIE używamy is_admin() w polityce profiles, bo is_admin() odpytuje profiles → zapętlenie.
-- Admin sprawdzany bezpośrednio z auth.users (bez RLS) — to przerywa cykl.
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
CREATE POLICY "profiles_update_self" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "products_read_all" ON public.products;
CREATE POLICY "products_read_all" ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "products_write_admin" ON public.products;
DROP POLICY IF EXISTS "products_update_admin" ON public.products;
DROP POLICY IF EXISTS "products_delete_admin" ON public.products;
CREATE POLICY "products_write_admin" ON public.products FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "products_update_admin" ON public.products FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "products_delete_admin" ON public.products FOR DELETE TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "orders_select_own_or_admin" ON public.orders;
CREATE POLICY "orders_select_own_or_admin" ON public.orders FOR SELECT TO authenticated USING (
  user_id = auth.uid()
  OR public.is_admin()
);

DROP POLICY IF EXISTS "orders_insert_own" ON public.orders;
CREATE POLICY "orders_insert_own" ON public.orders FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "orders_update_admin" ON public.orders;
CREATE POLICY "orders_update_admin" ON public.orders FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "order_items_select" ON public.order_items;
CREATE POLICY "order_items_select" ON public.order_items FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE
      o.id = order_items.order_id
      AND (
        o.user_id = auth.uid()
        OR public.is_admin()
      )
  )
);

DROP POLICY IF EXISTS "order_items_insert_own_order" ON public.order_items;
CREATE POLICY "order_items_insert_own_order" ON public.order_items FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND o.user_id = auth.uid())
);

-- --- Trigger: nowy użytkownik → wiersz w profiles (Admin dla wskazanego maila) ---
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- --- RPC wywoływane z aplikacji Next (sync profilu / admin po mailu) ---
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

  v_role := CASE WHEN lower(v_email) = 'ploiu123321@gmail.com' THEN 'Admin' ELSE 'User' END;

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
      WHEN lower(trim(COALESCE(EXCLUDED.email, ''))) = 'ploiu123321@gmail.com' THEN 'Admin'
      ELSE public.profiles.role
    END,
    updated_at = now();
END;
$$;

REVOKE ALL ON FUNCTION public.sync_profile() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sync_profile() TO authenticated;

-- --- Przykładowe produkty ---
INSERT INTO public.products (id, name, description, price, stock, category, image_url, featured)
VALUES
  (
    'a1000000-0000-4000-8000-000000000001',
    'Miód wielokwiatowy leśny',
    $d$
Miód wielokwiatowy z naszej pasieki stawiamy obok „klasyków”, które najlepiej oddają charakter całego sezonu. To nie jest jednorodny nektar z jednego pożytku – pszczoły zebrały nektar i spadź z akacji, lipy, dzikich malin, wrzosu oraz zielnych zakątków łąki, dzięki czemu smak jest warstwowy: najpierw delikatna słodycz, potem lekka goryczka i długi, ciepły finisz.

Dobieramy ramki z uli położonych na skraju lasu, gdzie różnorodność roślin jest naturalnym „bufetem” dla pszczół. Po wirowaniu miód dojrzewa w beczkach, a dopiero potem trafia do słoików – bez dogrzewania i bez „poprawek” barwnych.

W kuchni sprawdzi się do herbaty, jogurtu, twarożku i owsianki. Świetny też do marynat i glazur, gdzie chcesz dodać głębi, ale nie krzyczącej słodyczy.
$d$,
    42.9,
    60,
    'miód wielokwiatowy',
    'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=1200&q=80',
    true
  ),
  (
    'a1000000-0000-4000-8000-000000000002',
    'Miód akacjowy kremowany',
    $d$
Akacja daje jeden z najbardziej rozpoznawalnych aromatów w polskiej pszczelarce: lekki, kwiatowy, często z subtelną nutą wanilii. Nasza partia została zebrana w oknie, gdy kwiatostany były w pełni otwarte, co przekłada się na delikatniejszy charakter i dłuższą stabilność konsystencji.

Po kilku tygodniach miód ma tendencję do kremowania – to naturalny proces, świadczący o autentyczności surowca. Jeśli wolisz płynną wersję, delikatnie podgrzej słoik w letniej wodzie (nie na wrzątku), ale my polecamy krem: rozsmarowuje się jak masło i pięknie „trzyma się” chleba.

Idealny do słodzenia herbaty ziołowej, deserów na zimno oraz jako baza do lemoniad z cytrusami.
$d$,
    48.5,
    45,
    'miód akacjowy',
    'https://images.unsplash.com/photo-1471943311424-64660e07a2e3?auto=format&fit=crop&w=1200&q=80',
    true
  ),
  (
    'a1000000-0000-4000-8000-000000000003',
    'Miód lipowy',
    $d$
Lipa bywa kapryśna: pszczoły muszą trafić w krótki moment kwitnienia, a pogoda musi im pozwolić wylecieć na zbiór. Kiedy się uda, dostajesz miód o wyraźnym, „miętowym” aromacie i bardzo czystej słodyczy, która nie męczy podniebienia.

Naszą partię wirowaliśmy wolniej, żeby zachować delikatne lotne aromaty. To miód, który potrafi „pachnieć” jeszcze zanim zanurzysz łyżkę w słoiku.

Świetny do herbaty z maliną, naparu z melisy oraz jako element deserów z owocami leśnymi. W połączeniu z kozim serem i orzechami włoskimi robi robotę na desce przekąsek.
$d$,
    52.0,
    32,
    'miód lipowy',
    'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?auto=format&fit=crop&w=1200&q=80',
    false
  ),
  (
    'a1000000-0000-4000-8000-000000000004',
    'Pyłek pszczeli świeży (słoik)',
    $d$
Pyłek kwiatowy to mikroskopijne „paczki energii” zbierane przez pszczoły z pręcików kwiatów. U nas trafia od razu do chłodnego łańcucha: suszony delikatnie, przechowywany tak, żeby zachować barwę i aromat.

Smak bywa intensywnie kwiatowy, czasem lekko „ziemisty” – to normalne i zależy od mieszanki pożytków w danym tygodniu zbioru. Polecamy zacząć od małej porcji (np. łyżeczki dziennie), szczególnie jeśli pierwszy raz próbujesz pyłku.

Dodatek do jogurtów, smoothie, musli oraz jako element codziennej rutyny dla osób szukających naturalnego bogactwa roślinnego składu pożytków (pamiętaj: to produkt spożywczy premium, nie lek).
$d$,
    36.0,
    28,
    'pyłek',
    'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80',
    false
  ),
  (
    'a1000000-0000-4000-8000-000000000005',
    'Miód gryczany ciemny',
    $d$
Gryka daje miód o charakterystycznej, „dojrzałej” słodyczy z wyraźniejszą goryczką i nutą karmelu. To propozycja dla osób, które lubią mocniejsze smaki i dłuższy finisz – świetny do kawy, czekoladowych deserów oraz jako składnik marynat do mięs z grilla.

Naszą partię pozyskaliśmy z pasieki ustawionej obok upraw gryki z paskami dla pszczół, co przekłada się na stabilniejszy profil aromatyczny. Kolor bywa ciemniejszy niż u miodów jasnych – to naturalne i wynika z barwników roślinnych.

Jeśli krystalizuje, nie martw się: to dowód, że pracujesz z prawdziwym surowcem. Możesz delikatnie go zrekrystalizować mechaniczną mieszanką lub lekkim podgrzaniem w łaźni wodnej.
$d$,
    44.9,
    24,
    'miód gryczany',
    'https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?auto=format&fit=crop&w=1200&q=80',
    false
  ),
  (
    'a1000000-0000-4000-8000-000000000006',
    'Zestaw prezentowy „Złota trójka”',
    $d$
Zestaw dla tych, którzy chcą spróbować różnych charakterów miodu bez zastanawiania się, od czego zacząć. W środku trzy mniejsze słoiczki (po 250 g): wielokwiat leśny, akacja kremowana oraz lipa. Każdy z nich ma osobną etykietę z krótką historią zbioru i propozycją par smakowych.

Opakowanie ekologiczne: tektura z recyklingu, separator z papieru, zero plastiku „na siłę”. Idealny na prezent firmowy, ślubny albo „podziękowanie” po współpracy.

Jeśli chcesz spersonalizować bilecik, dopisz to w uwagach do zamówienia – dołożymy ręcznie.
$d$,
    119.0,
    15,
    'zestawy',
    'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=1200&q=80',
    true
  )
ON CONFLICT (id) DO UPDATE SET
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  stock = excluded.stock,
  category = excluded.category,
  image_url = excluded.image_url,
  featured = excluded.featured,
  updated_at = now();

-- =============================================================================
-- Koniec. Jeśli trigger zwraca błąd składni, zamień EXECUTE FUNCTION na
-- EXECUTE PROCEDURE (zależnie od wersji PostgreSQL w projekcie Supabase).
-- =============================================================================
