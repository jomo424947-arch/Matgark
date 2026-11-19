"use client"

import React, {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useMemo,
  useSyncExternalStore,
} from "react"
import type { Locale } from "@/types/saas"
import {
  translations,
  formatCurrencyAmount,
  type TranslationDictionary,
} from "@/lib/i18n/translations"

interface I18nContextValue {
  locale: Locale
  dir: "rtl" | "ltr"
  t: TranslationDictionary
  setLocale: (next: Locale) => void
  toggleLocale: () => void
  pick: <T>(ar: T, en: T) => T
  formatCurrency: (amount: number, currency?: string) => string
}

const STORAGE_KEY = "matgarak-locale"

const localeListeners = new Set<() => void>()

function getClientLocaleSnapshot(): Locale {
  if (typeof window === "undefined") return "ar"
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (saved === "ar" || saved === "en") return saved
  } catch {
    // ignore storage errors
  }
  return "ar"
}

function getServerLocaleSnapshot(): Locale {
  return "ar"
}

function subscribeLocale(onStoreChange: () => void): () => void {
  localeListeners.add(onStoreChange)
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      onStoreChange()
    }
  }
  if (typeof window !== "undefined") {
    window.addEventListener("storage", onStorage)
  }
  return () => {
    localeListeners.delete(onStoreChange)
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", onStorage)
    }
  }
}

function writeLocale(next: Locale) {
  try {
    window.localStorage.setItem(STORAGE_KEY, next)
  } catch {
    // ignore storage errors
  }
  localeListeners.forEach((listener) => listener())
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const locale = useSyncExternalStore(
    subscribeLocale,
    getClientLocaleSnapshot,
    getServerLocaleSnapshot
  )

  useEffect(() => {
    const dir = locale === "ar" ? "rtl" : "ltr"
    document.documentElement.lang = locale
    document.documentElement.dir = dir
  }, [locale])

  const setLocale = useCallback((next: Locale) => {
    writeLocale(next)
  }, [])

  const toggleLocale = useCallback(() => {
    const current = getClientLocaleSnapshot()
    writeLocale(current === "ar" ? "en" : "ar")
  }, [])

  const pick = useCallback(
    <T,>(ar: T, en: T): T => (locale === "ar" ? ar : en),
    [locale]
  )

  const formatCurrency = useCallback(
    (amount: number, currency = "EGP") =>
      formatCurrencyAmount(amount, currency, locale),
    [locale]
  )

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      dir: locale === "ar" ? "rtl" : "ltr",
      t: translations[locale],
      setLocale,
      toggleLocale,
      pick,
      formatCurrency,
    }),
    [locale, setLocale, toggleLocale, pick, formatCurrency]
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) {
    throw new Error("useI18n must be used within a LanguageProvider")
  }
  return ctx
}
