-- Funkcja do składania zamówienia z atomowym sprawdzeniem i zmniejszeniem stocku
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

-- Aby użytkownicy mogli wywołać tę funkcję
GRANT EXECUTE ON FUNCTION public.place_order_with_stock TO authenticated;
