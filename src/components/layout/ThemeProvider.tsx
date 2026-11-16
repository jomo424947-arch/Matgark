"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { useMerchantStore } from "@/stores/merchantStore"
import { useCartStore } from "@/stores/cartStore"

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  React.useEffect(() => {
    useMerchantStore.persist.rehydrate()
    useCartStore.persist.rehydrate()
  }, [])

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}

