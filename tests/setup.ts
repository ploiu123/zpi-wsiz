/**
 * Musi wykonać się ZANIM zaimportowany zostanie lib/store.ts.
 *
 * zustand/persist sięga po `window.localStorage` w momencie tworzenia store'u.
 * W środowisku Node nie ma ani `window`, ani `localStorage`, więc dostęp rzuca
 * wyjątek, a middleware po cichu wyłącza utrwalanie razem z całym API `.persist`.
 */
class MemoryStorage implements Storage {
  private map = new Map<string, string>()
  get length() { return this.map.size }
  key(i: number) { return [...this.map.keys()][i] ?? null }
  getItem(k: string) { return this.map.get(k) ?? null }
  setItem(k: string, v: string) { this.map.set(k, String(v)) }
  removeItem(k: string) { this.map.delete(k) }
  clear() { this.map.clear() }
}

globalThis.localStorage = new MemoryStorage()
// Minimalne `window` wskazujące na globalThis — daje zustandowi window.localStorage,
// a kodowi store'u window.crypto.randomUUID z Node'a.
;(globalThis as Record<string, unknown>).window = globalThis
