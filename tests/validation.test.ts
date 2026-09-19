import { describe, expect, it } from 'vitest'
import { r } from '@/lib/l'
import { isRemoteImage, oldPriceOf, sortAvailableFirst, validateProductNumbers } from '@/lib/product-display'

describe('bezpieczne przekierowanie po logowaniu', () => {
  it.each([
    ['/checkout', '/checkout'],
    ['/admin?tab=orders#top', '/admin?tab=orders#top'],
    ['/dashboard', '/dashboard'],
  ])('przepuszcza ścieżkę wewnętrzną %s', (input, expected) => {
    expect(r(input)).toBe(expected)
  })

  it.each([
    null,
    '',
    'https://evil.example',
    '//evil.example',
    '/\\evil.example',
    '\\/evil.example',
    '/\t/evil.example',
    'javascript:alert(1)',
  ])('odrzuca adres zewnętrzny %j', (input) => {
    expect(r(input)).toBe('/')
  })
})

describe('ceny promocyjne', () => {
  it('pokazuje starą cenę tylko, gdy jest wyższa', () => {
    expect(oldPriceOf({ price: 35, old_price: 50 })).toBe(50)
    expect(oldPriceOf({ price: 50, old_price: 35 })).toBeNull()
    expect(oldPriceOf({ price: 50, old_price: 50 })).toBeNull()
    expect(oldPriceOf({ price: 50, old_price: null })).toBeNull()
  })

  it('waliduje dane z formularza produktu', () => {
    expect(validateProductNumbers(50, 10, null)).toBeNull()
    expect(validateProductNumbers(35, 10, 50)).toBeNull()
    expect(validateProductNumbers(-1, 10, null)).not.toBeNull()
    expect(validateProductNumbers(Number.NaN, 10, null)).not.toBeNull()
    expect(validateProductNumbers(50, 1.5, null)).not.toBeNull()
    expect(validateProductNumbers(50, -3, null)).not.toBeNull()
    expect(validateProductNumbers(50, 10, 35)).not.toBeNull()
  })
})

describe('zdjęcia produktów', () => {
  it('rozpoznaje zdjęcia z zewnętrznych serwerów', () => {
    expect(isRemoteImage('/products/miod.jpg')).toBe(false)
    expect(isRemoteImage('https://images.unsplash.com/photo')).toBe(true)
  })
})

describe('kolejność produktów', () => {
  it('produkty dostępne są przed wyprzedanymi, a kolejność w grupach się nie zmienia', () => {
    const list = [
      { name: 'A', stock: 0 },
      { name: 'B', stock: 5 },
      { name: 'C', stock: 0 },
      { name: 'D', stock: 1 },
    ]
    expect(sortAvailableFirst(list).map((p) => p.name)).toEqual(['B', 'D', 'A', 'C'])
    expect(list.map((p) => p.name)).toEqual(['A', 'B', 'C', 'D'])
  })
})
