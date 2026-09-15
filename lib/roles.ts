export function isAdminRole(role: string | null | undefined): boolean {
  if (role == null) return false
  return role.trim().toLowerCase() === 'admin'
}
