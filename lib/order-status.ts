/** Wartości zapisywane w kolumnie `orders.status` — muszą być spójne w całej aplikacji. */
export const ORDER_STATUS_OPTIONS = [
  { value: 'nowe', label: 'Nowe' },
  { value: 'w realizacji', label: 'W realizacji' },
  { value: 'wysłane', label: 'Wysłane' },
  { value: 'dostarczone', label: 'Dostarczone' },
  { value: 'anulowane', label: 'Anulowane' },
] as const

export type OrderStatusValue = (typeof ORDER_STATUS_OPTIONS)[number]['value']

/** Mapowanie starych etykiet z wcześniejszej wersji panelu na wartości w bazie. */
const LEGACY_STATUS_MAP: Record<string, OrderStatusValue> = {
  Nowe: 'nowe',
  'W trakcie realizacji': 'w realizacji',
  'Wysłane do kuriera': 'wysłane',
  Zakończone: 'dostarczone',
  Anulowane: 'anulowane',
}

export function normalizeOrderStatus(value: string): OrderStatusValue {
  if (ORDER_STATUS_OPTIONS.some((o) => o.value === value)) {
    return value as OrderStatusValue
  }
  return LEGACY_STATUS_MAP[value] ?? 'nowe'
}

export function orderStatusLabel(value: string): string {
  const normalized = normalizeOrderStatus(value)
  const found = ORDER_STATUS_OPTIONS.find((o) => o.value === normalized)
  return found?.label ?? value
}
