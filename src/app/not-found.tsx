import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { Logo } from "@/components/ui/Logo"
import { Home } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-between p-6 text-center">
      <div className="flex justify-center pt-8">
        <Logo size="lg" />
      </div>

      <div className="max-w-md mx-auto space-y-4 my-12">
        <div className="text-7xl font-black text-primary font-cairo">404</div>
        <h1 className="text-2xl font-black text-foreground">
          الصفحة غير موجودة
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          عذراً، الصفحة التي تبحث عنها قد تم نقلها أو حذفها أو أن الرابط غير
          صحيح.
        </p>

        <div className="pt-4 flex justify-center">
          <Link href="/">
            <Button size="lg" className="font-bold gap-2">
              <Home className="w-4 h-4" />
              <span>العودة للصفحة الرئيسية</span>
            </Button>
          </Link>
        </div>
      </div>

      <div className="text-xs text-muted-foreground pb-4">
        منصة متجرك © 2026 • جميع الحقوق محفوظة
      </div>
    </div>
  )
}
