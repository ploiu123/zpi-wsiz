-- =============================================================================
-- SYSTEM REZERWACJI KOSZYKA (30 MINUT)
-- Wklej ten plik do SQL Editora w Supabase i uruchom.
-- =============================================================================

-- 1. Tabela rezerwacji
CREATE TABLE IF NOT EXISTS public.cart_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id text NOT NULL,
  product_id uuid NOT NULL REFERENCES public.products (id) ON DELETE CASCADE,
  quantity integer NOT NULL CHECK (quantity > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 minutes'),
  CONSTRAINT cart_reservations_cart_product_unique UNIQUE (cart_id, product_id)
);

-- Indeksy dla optymalizacji
CREATE INDEX IF NOT EXISTS cart_reservations_cart_id_idx ON public.cart_reservations (cart_id);
CREATE INDEX IF NOT EXISTS cart_reservations_expires_at_idx ON public.cart_reservations (expires_at);

-- 2. RLS dla tabeli rezerwacji
ALTER TABLE public.cart_reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cart_reservations_allow_all" ON public.cart_reservations;
CREATE POLICY "cart_reservations_allow_all" ON public.cart_reservations FOR ALL USING (true) WITH CHECK (true);

-- 3. Funkcja czyszcząca wygasłe rezerwacje
CREATE OR REPLACE FUNCTION public.cleanup_expired_reservations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_res record;
BEGIN
  -- Usuwamy wygasłe rezerwacje i zwracamy ich stan do produktów
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

-- 4. Funkcja atomowej aktualizacji rezerwacji w koszyku
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
  -- Najpierw sprzątamy wygasłe rezerwacje
  PERFORM public.cleanup_expired_reservations();

  -- Pobieramy obecną ilość zarezerwowaną dla tego koszyka i produktu
  SELECT quantity INTO v_current_reserved
  FROM public.cart_reservations
  WHERE cart_id = p_cart_id AND product_id = p_product_id;

  IF v_current_reserved IS NULL THEN
    v_current_reserved := 0;
  END IF;

  v_diff := p_target_qty - v_current_reserved;

  IF v_diff = 0 THEN
    -- Brak zmian w ilości, tylko odświeżamy czas wygaśnięcia
    v_expires_at := now() + interval '30 minutes';
    UPDATE public.cart_reservations
    SET expires_at = v_expires_at
    WHERE cart_id = p_cart_id AND product_id = p_product_id;
    
    RETURN jsonb_build_object('success', true, 'expires_at', v_expires_at);
  END IF;

  -- Blokujemy wiersz produktu dla transakcji
  SELECT stock INTO v_current_stock
  FROM public.products
  WHERE id = p_product_id
  FOR UPDATE;

  IF v_current_stock IS NULL THEN
    RAISE EXCEPTION 'Produkt nie istnieje.';
  END IF;

  IF v_diff > 0 THEN
    -- Chcemy zarezerwować więcej sztuk. Sprawdzamy, czy jest tyle wolnych w magazynie.
    IF v_current_stock < v_diff THEN
      RAISE EXCEPTION 'Niewystarczająca ilość w magazynie. Dostępne: %', v_current_stock;
    END IF;

    -- Odejmujemy z magazynu
    UPDATE public.products
    SET stock = stock - v_diff,
        updated_at = now()
    WHERE id = p_product_id;

    -- Tworzymy/aktualizujemy wpis o rezerwacji
    v_expires_at := now() + interval '30 minutes';
    INSERT INTO public.cart_reservations (cart_id, product_id, quantity, expires_at)
    VALUES (p_cart_id, p_product_id, p_target_qty, v_expires_at)
    ON CONFLICT (cart_id, product_id) DO UPDATE SET
      quantity = EXCLUDED.quantity,
      expires_at = EXCLUDED.expires_at;

  ELSE
    -- Chcemy zarezerwować mniej sztuk (zmniejszenie lub usunięcie z koszyka)
    -- Zwracamy różnicę do magazynu
    UPDATE public.products
    SET stock = stock + abs(v_diff),
        updated_at = now()
    WHERE id = p_product_id;

    IF p_target_qty > 0 THEN
      -- Aktualizujemy rezerwację
      v_expires_at := now() + interval '30 minutes';
      UPDATE public.cart_reservations
      SET quantity = p_target_qty,
          expires_at = v_expires_at
      WHERE cart_id = p_cart_id AND product_id = p_product_id;
    ELSE
      -- Usuwamy rezerwację całkowicie
      DELETE FROM public.cart_reservations
      WHERE cart_id = p_cart_id AND product_id = p_product_id;
      v_expires_at := NULL;
    END IF;
  END IF;

  RETURN jsonb_build_object('success', true, 'expires_at', v_expires_at);
END;
$$;

-- Nadanie uprawnień do wykonywania funkcji dla ról anon i authenticated
GRANT EXECUTE ON FUNCTION public.cleanup_expired_reservations() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_cart_reservation(text, uuid, integer) TO anon, authenticated;
