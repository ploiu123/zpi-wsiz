-- ============================================================================
-- Rezerwacja koszyka w Realtime
--
-- Bez tego wpisu tabela cart_reservations nie jest replikowana, więc rezerwacja
-- koszyka nie synchronizuje się między urządzeniami — czyli teza nr 1 projektu
-- (natychmiastowa synchronizacja stanów) nie ma pokrycia w działaniu.
--
-- Skrypt jest idempotentny: można go puścić wielokrotnie.
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'cart_reservations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.cart_reservations;
    RAISE NOTICE 'Dodano public.cart_reservations do publikacji supabase_realtime.';
  ELSE
    RAISE NOTICE 'public.cart_reservations już jest w publikacji — bez zmian.';
  END IF;
END $$;

-- Przy DELETE Postgres wysyła domyślnie tylko klucz główny. Tutaj kluczem jest
-- sztuczne `id`, więc odbiorca nie dowiedziałby się, KTÓREGO produktu dotyczyło
-- zwolnienie rezerwacji. REPLICA IDENTITY FULL dokłada do zdarzenia cały stary
-- wiersz razem z product_id i quantity.
ALTER TABLE public.cart_reservations REPLICA IDENTITY FULL;
