# Słownik jednoliterowych symboli (`lib/l.ts`)

Ten plik to **„repozytorium znaczeń”**: co oznacza która litera i **dlaczego nie traktujemy skracania nazw w źródle jako głównej optymalizacji**.

## 1. Co jest zoptymalizowane naprawdę

| Obszar | Dlaczego to ma znaczenie |
|--------|-------------------------|
| **Produkcja Next.js** | Kompilator (SWC) + bundler i tak **minifikują** nazwy lokalnych funkcji i zmiennych w `.next/`. Długa nazwa w Twoim `.tsx` **nie** oznacza dłuższego kodu wykonywanego przez przeglądarkę. |
| **Sieć** | Liczy się rozmiar **przesłanego** JS/CSS (tree-shaking, code splitting, `dynamic()`). Skracanie nazw w źródle daje **margines** w porównaniu z bibliotekami i assetami. |
| **Runtime** | Czas działania zależy od algorytmów, I/O (Supabase), renderów React — nie od tego, czy funkcja nazywa się `normalizeOrderStatus` czy `n`. |
| **Czytelność** | Krótkie nazwy **wszędzie** obniżają utrzymanie projektu. Dlatego jednoliterowe symbole są **świadomie** zwężone do małej warstwy `lib/l.ts` + ta dokumentacja. |

**Wniosek:** „Bardzo dobra optymalizacja” = sensowne wzorce React, obrazy (`next/image`), ograniczenie re-renderów tam gdzie boli, porządek w zapytaniach do API — **nie** masowe `a()` / `b()` w całym kodzie.

## 2. Mapowanie liter → pełne znaczenie

| Symbol | Pełna nazwa / pochodzenie | Rola |
|--------|---------------------------|------|
| **`r`** | redirect (bezpieczny) | Walidacja parametru `redirect` z URL: tylko ścieżki względne zaczynające się od `/`, blokada `//` (open redirect). |
| **`n`** | `normalizeOrderStatus` | Mapuje wartość statusu zamówienia z bazy (w tym stare etykiety) na kanoniczny zestaw statusów. |
| **`e`** | `orderStatusLabel` (etykieta) | Zwraca **czytelną** etykietę PL do wyświetlenia użytkownikowi na podstawie wartości z bazy. |
| **`O`** | `ORDER_STATUS_OPTIONS` | **Stała** (tablica), nie funkcja — lista `{ value, label }` dla selecta w panelu admina. Litera jak „Options”. |
| **`V`** | typ `OrderStatusValue` | **Typ** TypeScript — dozwolone wartości `status` w zamówieniu. |

Źródło prawdy implementacji (długie, czytelne nazwy): `lib/order-status.ts`.  
Warstwa aliasów: `lib/l.ts`.

## 3. Gdzie w kodzie używamy `lib/l.ts`

- `r` — logowanie (`app/login/page.tsx`).
- `e` — etykieta statusu na pulpicie (`app/dashboard/page.tsx`).
- `n`, `O`, `V` — aktualizacja statusu zamówienia (`app/admin/order-status-updater.tsx`).

## 4. Inne zmiany wydajnościowe (bez literówek)

- **Navbar:** tablica linków wyciągnięta poza komponent (jedna alokacja na moduł zamiast przy każdym renderze).
- **Karta produktu:** `React.memo` — mniej zbędnych reconciliacji, gdy rodzeństwo się przerysowuje.

---

Jeśli kiedyś zespół uzna, że `lib/l.ts` przeszkadza w czytelności, można go usunąć **bez zmiany logiki** — wystarczy podmienić importy z powrotem na `lib/order-status` i lokalną funkcję `r` w loginie.
