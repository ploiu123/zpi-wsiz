-- ============================================================================
--  Dokończenie naprawy polskich znaków w danych
--
--  Poprzednia wersja filtrowała wiersze po liście znaków zawierającej Ã (U+00C3
--  z Latin-1). Mojibake pochodzi jednak z CP1250, gdzie bajt 0xC3 odpowiada
--  znakowi Ă (U+0102). Przez to "miĂłd" nie pasował do filtra i został pominięty.
--
--  Tutaj nie ma już żadnej listy znaków. Naprawiamy wiersz wtedy i tylko wtedy,
--  gdy konwersja faktycznie coś zmienia — to jest odporne na dobór markerów.
--
--  Dlaczego jest to bezpieczne dla tekstu już poprawnego:
--    "Miód" -> convert_to WIN1250 -> bajty 4D 69 F3 64
--    bajt 0xF3 nie jest poprawnym początkiem sekwencji UTF-8
--    -> convert_from rzuca wyjątek -> funkcja zwraca wartość bez zmian.
--  Dlatego skrypt można uruchamiać wielokrotnie bez ryzyka.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.fix_mojibake(p text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF p IS NULL OR p = '' THEN
    RETURN p;
  END IF;
  BEGIN
    RETURN convert_from(convert_to(p, 'WIN1250'), 'UTF8');
  EXCEPTION WHEN others THEN
    RETURN p;   -- tekst już poprawny albo konwersja nieodwracalna
  END;
END $$;

UPDATE public.products
SET name        = public.fix_mojibake(name),
    description = public.fix_mojibake(description),
    category    = public.fix_mojibake(category),
    updated_at  = now()
WHERE public.fix_mojibake(name)        IS DISTINCT FROM name
   OR public.fix_mojibake(description) IS DISTINCT FROM description
   OR public.fix_mojibake(category)    IS DISTINCT FROM category;

UPDATE public.order_items
SET product_name = public.fix_mojibake(product_name)
WHERE public.fix_mojibake(product_name) IS DISTINCT FROM product_name;

UPDATE public.profiles
SET full_name  = public.fix_mojibake(full_name),
    address    = public.fix_mojibake(address),
    city       = public.fix_mojibake(city),
    updated_at = now()
WHERE public.fix_mojibake(full_name) IS DISTINCT FROM full_name
   OR public.fix_mojibake(address)   IS DISTINCT FROM address
   OR public.fix_mojibake(city)      IS DISTINCT FROM city;

DROP FUNCTION public.fix_mojibake(text);

-- ─── Weryfikacja: obie kolumny powinny być puste ───────────────────────────
SELECT DISTINCT category FROM public.products ORDER BY category;

SELECT name, category FROM public.products
WHERE name ~ '[ÂĂÄĹâ]' OR description ~ '[ÂĂÄĹâ]' OR category ~ '[ÂĂÄĹâ]';
