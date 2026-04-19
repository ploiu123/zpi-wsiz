/**
 * Lista maili z pełnym dostępem do /admin (oddziel przecinkiem w .env).
 * Używane obok roli w `profiles` — gdy SQL się nie wykonał w całości, nadal wejdziesz na panel.
 */
const DEFAULT_ADMIN_EMAILS = 'ploiu123321@gmail.com'

export function adminEmailList(): string[] {
  const raw = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? DEFAULT_ADMIN_EMAILS : DEFAULT_ADMIN_EMAILS
  return raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return adminEmailList().includes(email.trim().toLowerCase())
}
