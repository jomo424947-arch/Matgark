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
  title: "متجرك | منصة إطلاق متاجر وبراندات الملابس — Matgarak Fashion SaaS",
  description:
    "أنشئ متجر ملابسك المستقل في دقائق بقوالب مصممة لبراندات الأزياء، إدارة المقاسات والألوان والمخزون، الشحن لجميع المحافظات والدفع عند الاستلام.",
  icons: {
    icon: "/images/matgarak-bag-logo.png",
    apple: "/images/matgarak-bag-logo.png",
  },
  openGraph: {
    title: "متجرك | منصة إطلاق متاجر وبراندات الملابس — Matgarak",
    description:
      "أطلق متجر ملابسك وأزيائك المستقل بالعربية والإنجليزية مع إدارة كاملة للمقاسات والطلبات.",
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
