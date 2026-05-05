import { beforeEach, describe, expect, it } from 'vitest'
import {
  fallbackLocale,
  getLocale,
  isValidLocale,
  locales,
  setLocale,
  setMaybeLocale,
} from '../../src/utils/i18n'

describe('i18n', () => {
  beforeEach(() => {
    setLocale('de')
  })

  it('exposes "de" as the fallback locale', () => {
    expect(fallbackLocale).toBe('de')
  })

  it('returns the active locale via getLocale()', () => {
    expect(getLocale()).toBe('de')
  })

  it('exports the supported locales list', () => {
    expect(locales).toMatchInlineSnapshot(`
      [
        "de",
        "fr",
      ]
    `)
  })

  it('isValidLocale recognizes "de" and "fr" but rejects "en"', () => {
    expect(isValidLocale('de')).toBe(true)
    expect(isValidLocale('fr')).toBe(true)
    expect(isValidLocale('en')).toBe(false)
  })

  it('setLocale switches the active locale', () => {
    setLocale('fr')
    expect(getLocale()).toBe('fr')
  })

  it('setMaybeLocale ignores unsupported locales and keeps the current one', () => {
    setMaybeLocale('fr')
    expect(getLocale()).toBe('fr')
    setMaybeLocale('ko')
    expect(getLocale()).toBe('de')
  })
})
