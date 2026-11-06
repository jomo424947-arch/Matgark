import type { Metadata } from "next"
import { Cairo, Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/layout/ThemeProvider"
import { Toaster } from "sonner"

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
})

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

export const metadata: Metadata = {
  title: "متجرك | منصة متاجر إلكترونية للمحلات والمشاريع الصغيرة",
  description:
    "افتح متجرك الإلكتروني في 5 دقايق باسم محلك. بيع لعملائك، ونظّم أوردراتك ومخزونك بكل سهولة وبدون عمولات خفية.",
  keywords: [
    "متجر الكتروني",
    "تجارة الكترونية",
    "مشاريع صغيرة",
    "براندات",
    "متجرك",
    "بيع اونلاين",
    "واتساب",
  ],
  authors: [{ name: "Matgarak" }],
  openGraph: {
    title: "متجرك | من البراندات الصغيرة .. إلى بيتك",
    description: "أنشئ متجرك الإلكتروني الآن وابدأ البيع لعملائك مباشرة وبسهولة.",
    type: "website",
    locale: "ar_EG",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        className={`${cairo.variable} ${inter.variable} font-cairo min-h-screen bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster richColors position="top-center" dir="rtl" />
        </ThemeProvider>
      </body>
    </html>
  )
}
