-- ============================================================================
--  PRODUKTY ZNIKNĘŁY — diagnoza i naprawa
--
--  Strona główna, /products oraz lokalny serwer zwracają zero produktów,
--  a zapytanie nie zgłasza błędu. Oznacza to, że baza oddaje pusty zbiór:
--  albo tabela jest pusta, albo zniknęła polityka odczytu.
--
--  Skrypt jest nieniszczący. ON CONFLICT DO NOTHING sprawia, że istniejące
--  produkty NIE zostaną nadpisane — dołożone będą tylko brakujące.
-- ============================================================================

-- ─── 1. DIAGNOZA (uruchom i zobacz wyniki) ─────────────────────────────────

SELECT count(*) AS liczba_produktow FROM public.products;

SELECT policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'products'
ORDER BY policyname;

SELECT relrowsecurity AS rls_wlaczone
FROM pg_class WHERE oid = 'public.products'::regclass;


-- ─── 2. PRZYWRÓCENIE POLITYKI ODCZYTU ──────────────────────────────────────
--     Bez niej anonimowy odwiedzający nie widzi ani jednego produktu.

DROP POLICY IF EXISTS "products_read_all" ON public.products;
CREATE POLICY "products_read_all" ON public.products FOR SELECT USING (true);


-- ─── 3. UZUPEŁNIENIE PRODUKTÓW ─────────────────────────────────────────────
--     Dokłada tylko brakujące wiersze; istniejących nie rusza.

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


-- ─── 4. KONTROLA ───────────────────────────────────────────────────────────

SELECT count(*) AS produktow_po_naprawie FROM public.products;
SELECT name, category, stock, featured FROM public.products ORDER BY name;
