-- ============================================================================
-- Zapytania weryfikacyjne — wklej w SQL Editor w panelu Supabase.
-- Nic nie modyfikują.
-- ============================================================================

-- 1. Czy istnieje procedura place_order_with_stock i z jakimi argumentami?
--    Pusty wynik = procedury NIE MA i składanie zamówień będzie się wywalać.
SELECT
  p.proname                                   AS funkcja,
  pg_get_function_identity_arguments(p.oid)   AS argumenty,
  pg_get_function_result(p.oid)               AS zwraca,
  p.prosecdef                                 AS security_definer
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('place_order_with_stock', 'update_cart_reservation', 'cleanup_expired_reservations')
ORDER BY p.proname;

-- 2. Jakie tabele są w publikacji supabase_realtime?
--    Na liście MUSZĄ być: products, orders, order_items ORAZ cart_reservations.
SELECT
  t.tablename                                 AS tabela,
  c.relreplident                              AS replica_identity  -- 'f' = FULL, 'd' = domyślna
FROM pg_publication_tables t
JOIN pg_class c      ON c.relname = t.tablename
JOIN pg_namespace n  ON n.oid = c.relnamespace AND n.nspname = t.schemaname
WHERE t.pubname = 'supabase_realtime'
  AND t.schemaname = 'public'
ORDER BY t.tablename;

-- 3. Ile wierszy w products ma zepsute polskie znaki?
--    Po naprawie wszystkie liczniki powinny wynosić 0.
SELECT
  count(*) FILTER (WHERE name        ~ '(Ã|Ä|Ĺ|â€)') AS zepsute_nazwy,
  count(*) FILTER (WHERE description ~ '(Ã|Ä|Ĺ|â€)') AS zepsute_opisy,
  count(*) FILTER (WHERE category    ~ '(Ã|Ä|Ĺ|â€)') AS zepsute_kategorie,
  count(*)                                            AS wszystkich_produktow
FROM public.products;

-- 3b. Podgląd konkretnych zepsutych wierszy (przed naprawą).
SELECT id, name, category
FROM public.products
WHERE name ~ '(Ã|Ä|Ĺ|â€)' OR description ~ '(Ã|Ä|Ĺ|â€)' OR category ~ '(Ã|Ä|Ĺ|â€)'
ORDER BY name;
