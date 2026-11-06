"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Sun, Moon } from "lucide-react"

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-xl border border-border/40 bg-background/50 animate-pulse" />
    )
  }

  const isDark = resolvedTheme === "dark"

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`relative inline-flex items-center justify-center w-10 h-10 rounded-xl border border-border/60 bg-background/80 hover:bg-muted text-foreground transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm ${className || ""}`}
      aria-label="تبديل الوضع (داكن / فاتح)"
      title={isDark ? "تفعيل الوضع الفاتح" : "تفعيل الوضع الداكن"}
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0 text-amber-500" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100 text-sky-400" />
      <span className="sr-only">تبديل الوضع</span>
    </button>
  )
}

