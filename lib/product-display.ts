import type { Product } from '@/lib/types'

export function oldPriceOf(product: Pick<Product, 'price' | 'old_price'>): number | null {
  if (product.old_price == null) return null
  const oldPrice = Number(product.old_price)
  return oldPrice > Number(product.price) ? oldPrice : null
}

export function isRemoteImage(src: string): boolean {
  return !src.startsWith('/')
}

export function validateProductNumbers(price: number, stock: number, oldPrice: number | null): string | null {
  if (!Number.isFinite(price) || price < 0) return 'Podaj prawidłową cenę (liczba nieujemna).'
  if (!Number.isInteger(stock) || stock < 0) return 'Podaj prawidłowy stan magazynowy (liczba całkowita nieujemna).'
  if (oldPrice !== null && (!Number.isFinite(oldPrice) || oldPrice <= price)) {
    return 'Cena przed promocją musi być wyższa od ceny promocyjnej.'
  }
  return null
}
