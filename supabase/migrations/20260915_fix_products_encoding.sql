-- ============================================================================
-- Naprawa polskich znaków w tabeli products
--
-- Objaw: "MiĂłd akacjowy" zamiast "Miód akacjowy". Tekst zapisany w UTF-8 został
-- odczytany jako Windows-1250 i ponownie zapisany jako UTF-8.
--
-- WAŻNE: każda kolumna konwertuje się NIEZALEŻNIE. Wcześniejsza wersja tego
-- skryptu obejmowała wszystkie kolumny jednym blokiem obsługi wyjątku — gdy
-- jedna z nich była już poprawna, wyjątek przerywał cały wiersz i pozostałe
-- kolumny zostawały nienaprawione.
--
-- Skrypt jest idempotentny: kolumna bez znaków mojibake jest zwracana bez zmian,
-- a gdy konwersja się nie powiedzie, zwracana jest wartość oryginalna.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.fix_mojibake(p text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Poprawny polski tekst nie zawiera Ã, Ä, Ĺ ani â€ — nie ruszamy go.
  IF p IS NULL OR p !~ '(Ã|Ä|Ĺ|â€)' THEN
    RETURN p;
  END IF;
  BEGIN
    RETURN convert_from(convert_to(p, 'WIN1250'), 'UTF8');
  EXCEPTION WHEN others THEN
    RETURN p;   -- nie da się odwrócić — zostawiamy nietknięte
  END;
END $$;

UPDATE public.products
SET name        = public.fix_mojibake(name),
    description = public.fix_mojibake(description),
    category    = public.fix_mojibake(category),
    updated_at  = now()
WHERE name        ~ '(Ã|Ä|Ĺ|â€)'
   OR description ~ '(Ã|Ä|Ĺ|â€)'
   OR category    ~ '(Ã|Ä|Ĺ|â€)';

-- order_items przechowuje nazwę produktu z chwili złożenia zamówienia,
-- więc ma własną kopię zepsutego tekstu.
UPDATE public.order_items
SET product_name = public.fix_mojibake(product_name)
WHERE product_name ~ '(Ã|Ä|Ĺ|â€)';

DROP FUNCTION public.fix_mojibake(text);
