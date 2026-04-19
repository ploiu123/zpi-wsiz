/** Wartości zapisywane w kolumnie `orders.status` — muszą być spójne w całej aplikacji. */
export const ORDER_STATUS_OPTIONS = [
  { value: 'nowe', label: 'Nowe' },
  { value: 'w realizacji', label: 'W realizacji' },
  { value: 'wysłane', label: 'Wysłane' },
  { value: 'dostarczone', label: 'Dostarczone' },
  { value: 'anulowane', label: 'Anulowane' },
] as const

export type OrderStatusValue = (typeof ORDER_STATUS_OPTIONS)[number]['value']

export function orderStatusLabel(value: string): string {
  const found = ORDER_STATUS_OPTIONS.find((o) => o.value === value)
  return found?.label ?? value
}
