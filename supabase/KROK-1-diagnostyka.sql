-- ============================================================================
--  KROK 1 — DIAGNOSTYKA. Nic nie zmienia, tylko pokazuje stan.
--  Wklej do Supabase → SQL Editor → Run i przyślij mi wynik.
-- ============================================================================

-- Jakie konta w ogóle istnieją i czy da się na nie zalogować?
SELECT
  u.email                                        AS adres,
  u.created_at::date                             AS utworzone,
  (u.email_confirmed_at IS NOT NULL)             AS email_potwierdzony,
  u.last_sign_in_at                              AS ostatnie_logowanie,
  p.role                                         AS rola_w_profiles,
  (p.id IS NULL)                                 AS brak_wiersza_w_profiles
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
ORDER BY u.created_at;
