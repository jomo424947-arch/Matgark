"use client"

import React from "react"
import { Languages } from "lucide-react"
import { useI18n } from "@/components/providers/LanguageProvider"
import { cn } from "@/lib/utils"

interface LanguageSwitcherProps {
  className?: string
  compact?: boolean
}

export function LanguageSwitcher({
  className,
  compact = false,
}: LanguageSwitcherProps) {
  const { locale, toggleLocale } = useI18n()

  return (
    <button
      type="button"
      onClick={toggleLocale}
      aria-label={locale === "ar" ? "Switch language to English" : "تبديل اللغة إلى العربية"}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-background/80 px-2.5 h-9 text-xs font-semibold text-foreground hover:bg-muted transition-colors whitespace-nowrap shrink-0 cursor-pointer",
        className
      )}
    >
      <Languages className="w-3.5 h-3.5 text-muted-foreground" />
      <span>{compact ? (locale === "ar" ? "EN" : "ع") : locale === "ar" ? "English" : "العربية"}</span>
    </button>
  )
}
