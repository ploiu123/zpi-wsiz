-- ============================================================================
-- Naprawa polskich znaków w tabeli products
--
-- Objaw: "MiĂłd akacjowy" zamiast "Miód akacjowy". Tekst zapisany w UTF-8 został
-- odczytany jako Windows-1250 i ponownie zapisany jako UTF-8. Odwracamy to przez
-- convert_from(convert_to(kolumna,'WIN1250'),'UTF8').
--
-- ZABEZPIECZENIE PRZED DWUKROTNYM URUCHOMIENIEM (dwie niezależne warstwy):
--   1. Brane pod uwagę są tylko wiersze zawierające znaki charakterystyczne dla
--      mojibake (Ã, Ä, Ĺ, â€). Poprawny polski tekst ich nie zawiera, więc przy
--      drugim uruchomieniu zbiór jest pusty.
--   2. Każdy wiersz konwertowany jest w osobnym bloku z obsługą wyjątku. Poprawny
--      tekst ("Miód") daje po convert_to bajt 0xF3, który nie jest poprawnym UTF-8,
--      więc convert_from rzuca wyjątek i wiersz zostaje pominięty — nie uszkodzony.
--
-- Skrypt nie modyfikuje niczego poza public.products.
-- ============================================================================

DO $$
DECLARE
  r              record;
  v_name         text;
  v_description  text;
  v_category     text;
  v_fixed        integer := 0;
  v_skipped      integer := 0;
  -- znaki, które w poprawnym polskim tekście nie występują, a są typowe dla mojibake
  c_mojibake     text := '(Ã|Ä|Ĺ|â€)';
BEGIN
  FOR r IN
    SELECT id, name, description, category
    FROM public.products
    WHERE name        ~ c_mojibake
       OR description ~ c_mojibake
       OR category    ~ c_mojibake
  LOOP
    BEGIN
      v_name        := convert_from(convert_to(r.name,        'WIN1250'), 'UTF8');
      v_description := convert_from(convert_to(r.description, 'WIN1250'), 'UTF8');
      v_category    := convert_from(convert_to(r.category,    'WIN1250'), 'UTF8');
    EXCEPTION WHEN others THEN
      v_skipped := v_skipped + 1;
      RAISE NOTICE 'Pominięto produkt % — konwersja nieodwracalna (%).', r.id, SQLERRM;
      CONTINUE;
    END;

    UPDATE public.products
    SET name        = v_name,
        description = v_description,
        category    = v_category,
        updated_at  = now()
    WHERE id = r.id;

    v_fixed := v_fixed + 1;
  END LOOP;

  RAISE NOTICE 'Naprawiono wierszy: %. Pominięto: %.', v_fixed, v_skipped;
END $$;
