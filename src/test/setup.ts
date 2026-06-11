import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import { webcrypto } from 'node:crypto'

// Testing Library only auto-registers cleanup when Vitest globals are enabled
afterEach(() => {
  cleanup()
})

// jsdom does not implement crypto.subtle, which fileUtils.hashContent relies on
if (!globalThis.crypto?.subtle) {
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    configurable: true,
  })
}

// jsdom does not implement matchMedia, which framer-motion queries for
// prefers-reduced-motion
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList
}
