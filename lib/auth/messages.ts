type AuthErrorLike = { code?: string; message?: string; status?: number } | null | undefined

const BY_CODE: Record<string, string> = {
  invalid_credentials: 'Nieprawidłowy e-mail lub hasło. Sprawdź, czy nie masz włączonego Caps Locka, albo ustaw nowe hasło.',
  email_not_confirmed: 'Konto nie zostało jeszcze aktywowane. Kliknij link w wiadomości wysłanej po rejestracji.',
  user_already_exists: 'Konto z tym adresem już istnieje. Zaloguj się albo ustaw nowe hasło.',
  email_exists: 'Konto z tym adresem już istnieje. Zaloguj się albo ustaw nowe hasło.',
  weak_password: 'Hasło jest za słabe — użyj co najmniej 6 znaków.',
  over_email_send_rate_limit: 'Wysłano już zbyt wiele wiadomości. Odczekaj kilka minut i spróbuj ponownie.',
  over_request_rate_limit: 'Zbyt wiele prób. Odczekaj chwilę i spróbuj ponownie.',
  validation_failed: 'Podaj prawidłowy adres e-mail.',
  same_password: 'Nowe hasło musi różnić się od poprzedniego.',
  otp_expired: 'Link wygasł lub został już użyty. Poproś o nowy.',
  session_not_found: 'Sesja wygasła. Poproś o nowy link do ustawienia hasła.',
}

export function authErrorMessage(error: AuthErrorLike): string {
  if (!error) return 'Wystąpił błąd podczas uwierzytelniania.'
  if (error.code && BY_CODE[error.code]) return BY_CODE[error.code]
  const message = error.message ?? ''
  if (/invalid login credentials/i.test(message)) return BY_CODE.invalid_credentials
  if (/email not confirmed/i.test(message)) return BY_CODE.email_not_confirmed
  if (/already registered|already exists/i.test(message)) return BY_CODE.user_already_exists
  if (/at least 6 characters|weak password/i.test(message)) return BY_CODE.weak_password
  if (/rate limit/i.test(message)) return BY_CODE.over_request_rate_limit
  if (/failed to fetch|network/i.test(message)) return 'Brak połączenia z serwerem. Sprawdź internet i spróbuj ponownie.'
  return message || 'Wystąpił błąd podczas uwierzytelniania.'
}
