import { describe, expect, it } from 'vitest'
import { authErrorMessage } from '@/lib/auth/messages'

describe('komunikaty logowania', () => {
  it('tłumaczy błędne dane logowania po kodzie i po treści', () => {
    expect(authErrorMessage({ code: 'invalid_credentials', message: 'Invalid login credentials' })).toMatch(/Nieprawidłowy e-mail lub hasło/)
    expect(authErrorMessage({ message: 'Invalid login credentials' })).toMatch(/Nieprawidłowy e-mail lub hasło/)
  })

  it('rozpoznaje nieaktywowane konto, istniejące konto i wygasły link', () => {
    expect(authErrorMessage({ code: 'email_not_confirmed' })).toMatch(/nie zostało jeszcze aktywowane/)
    expect(authErrorMessage({ code: 'user_already_exists' })).toMatch(/już istnieje/)
    expect(authErrorMessage({ code: 'otp_expired' })).toMatch(/wygasł/)
  })

  it('zgłasza brak połączenia i zostawia nieznane komunikaty bez zmian', () => {
    expect(authErrorMessage({ message: 'Failed to fetch' })).toMatch(/Brak połączenia/)
    expect(authErrorMessage({ message: 'Coś innego' })).toBe('Coś innego')
    expect(authErrorMessage(null)).toBe('Wystąpił błąd podczas uwierzytelniania.')
  })
})
