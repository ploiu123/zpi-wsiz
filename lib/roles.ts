/** Zgodna z CHECK w bazie: tylko te wartości po normalizacji uznajemy za admina. */
export function isAdminRole(role: string | null | undefined): boolean {
  if (role == null) return false
  return role.trim().toLowerCase() === 'admin'
}
