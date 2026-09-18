'use client'

import { useSyncExternalStore } from 'react'

export type DesktopOS = 'mac' | 'win' | 'other'

const subscribeNever = () => () => {}

function userAgent(): string {
  return navigator.userAgent.toLowerCase()
}

function detectElectron(): boolean {
  const ua = userAgent()
  return ua.includes('electron') || ua.includes('zlotemiodyapp')
}

function detectDesktopOS(): DesktopOS {
  const ua = userAgent()
  if (ua.includes('mac')) return 'mac'
  if (ua.includes('win')) return 'win'
  return 'other'
}

export function useIsClient(): boolean {
  return useSyncExternalStore(subscribeNever, () => true, () => false)
}

export function useIsElectron(): boolean {
  return useSyncExternalStore(subscribeNever, detectElectron, () => false)
}

export function useDesktopOS(): DesktopOS {
  return useSyncExternalStore(subscribeNever, detectDesktopOS, () => 'other')
}
