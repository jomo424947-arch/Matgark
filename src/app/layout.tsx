import type { Metadata } from "next"
import { Cairo, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/layout/ThemeProvider"
import { LanguageProvider } from "@/components/providers/LanguageProvider"
import { Toaster } from "sonner"

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
})

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "Matgarak | Multi-Tenant E-Commerce SaaS Platform — منصة متجرك",
  description:
    "Launch, customize, and manage independent online stores with visual theming, inventory management, order workflows, and bilingual Arabic/English storefronts.",
  icons: {
    icon: "/images/matgarak-bag-logo.png",
    apple: "/images/matgarak-bag-logo.png",
  },
  openGraph: {
    title: "Matgarak | Multi-Tenant E-Commerce SaaS Platform",
    description:
      "Create, customize, and scale your independent brand storefront in Arabic and English.",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body
        className={`${cairo.variable} ${jakarta.variable} ${jetbrainsMono.variable} min-h-screen bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <LanguageProvider>
            {children}
            <Toaster richColors position="top-center" />
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
