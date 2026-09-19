'use client'

import { useEffect } from 'react'

export function RecoveryRedirect() {
  useEffect(() => {
    const { hash, pathname } = window.location
    if (!hash || pathname === '/reset-password') return
    const params = new URLSearchParams(hash.slice(1))
    if (params.get('type') === 'recovery') {
      window.location.replace('/reset-password' + hash)
    }
  }, [])

  return null
}
