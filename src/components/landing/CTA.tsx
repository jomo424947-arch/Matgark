import React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { ArrowLeft, Sparkles, Store } from "lucide-react"

export function CTA() {
  return (
    <section className="py-20 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="relative rounded-[36px] bg-gradient-to-br from-primary via-primary/95 to-amber-600 p-8 sm:p-12 lg:p-16 text-center text-primary-foreground overflow-hidden shadow-2xl shadow-primary/20">
          
          {/* دوائر ديكورية في الخلفية */}
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-black/10 rounded-full blur-2xl" />

          <div className="relative z-10 max-w-3xl mx-auto space-y-6">
            
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-white text-xs font-bold">
              <Sparkles className="w-4 h-4" />
              <span>جاهز تبدأ تبيع باحترافية؟</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
              افتح متجرك الإلكتروني دلوقتي <br />
              وابدأ استقبل أول أوردر النهاردة
            </h2>

            <p className="text-base sm:text-lg text-white/90 max-w-xl mx-auto leading-relaxed">
              انضم لمئات البراندات الصغيرة اللي بتكبر كل يوم مع متجرك. متجرك جاهز في أقل من 5 دقايق وبدون أي تكلفة مبدئية.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-white text-primary hover:bg-white/90 font-black shadow-xl hover:scale-105 active:scale-95"
                >
                  <Store className="w-5 h-5 ml-2" />
                  <span>أنشئ متجرك مجاناً في 5 دقايق</span>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                </Button>
              </Link>
            </div>

            <p className="text-xs text-white/70 pt-2">
              ✓ لا حاجة لبطاقة بنكية • ✓ بدون عمولات على المبيعات • ✓ إلغاء في أي وقت
            </p>

          </div>

        </div>

      </div>
    </section>
  )
}

