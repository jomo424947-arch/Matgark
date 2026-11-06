import React from "react"
import { Card, CardContent } from "@/components/ui/Card"
import {
  Zap,
  Smartphone,
  Layers,
  ClipboardList,
  MessageSquare,
  Share2,
  TrendingUp,
  Shield,
} from "lucide-react"

export function Features() {
  const features = [
    {
      icon: Zap,
      title: "متجرك جاهز في 5 دقايق",
      desc: "تسجيل فوري برقم موبايلك، اختيار اسم متجرك، وإضافة أول منتج. مفيش أي خطوات تقنية معقدة.",
      tag: "سريع جداً",
      color: "text-amber-500 bg-amber-500/10",
    },
    {
      icon: Smartphone,
      title: "Mobile-First لك ولعميلك",
      desc: "لوحة تحكم كاملة تقدر تدير منها متجرك من تليفونك، ومتجر عملاء سريع وخفيف حتى مع أضعف سرعة إنترنت.",
      tag: "مصمم للموبايل",
      color: "text-sky-500 bg-sky-500/10",
    },
    {
      icon: Layers,
      title: "إدارة المقاسات والألوان",
      desc: "كل منتج تقدر تضيف له مقاساته وألوانه، مع تتبع دقيق للمخزون لكل variant علشان مفيش عميل يطلب حاجة مخلصة.",
      tag: "مخزون ذكي",
      color: "text-purple-500 bg-purple-500/10",
    },
    {
      icon: MessageSquare,
      title: "إشعار فوري على واتساب",
      desc: "أول ما العميل يطلب، بيوصلك إشعار فوري بتفاصيل الأوردر كاملة (الاسم، العنوان، المنتجات، المجموع) على واتساب.",
      tag: "متابعة لحظية",
      color: "text-emerald-500 bg-emerald-500/10",
    },
    {
      icon: ClipboardList,
      title: "Guest Checkout بدون تعقيد",
      desc: "العميل مش محتاج يعمل حساب أو باسورد. بيدخل اسمه، رقمه، وعنوانه وبيدوس طلب بنقرة واحدة، والدفع عند الاستلام.",
      tag: "معدل تحويل أعلى",
      color: "text-primary bg-primary/10",
    },
    {
      icon: Share2,
      title: "لينك مخصص للبايو و السوشيال",
      desc: "لينك قصير وشيك مثل `matgarak.com/your-brand` تحطه في بايو إنستجرام وفيسبوك وتيك توك، مع معاينة صور تلقائية.",
      tag: "جاهز للمشاركة",
      color: "text-rose-500 bg-rose-500/10",
    },
  ]

  return (
    <section id="features" className="py-20 md:py-28 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* عنوان القسم */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold">
            <TrendingUp className="w-4 h-4" />
            <span>ليه تختار منصة متجرك؟</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground tracking-tight">
            كل اللي محتاجه علشان تكبّر مشروعك.. <br />
            <span className="text-primary">في مكان واحد</span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground">
            صممنا متجرك خصيصاً علشان يحل كل المشاكل اليومية اللي بتواجه أصحاب البراندات والمحلات على السوشيال ميديا.
          </p>
        </div>

        {/* شبكة الكروت */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, idx) => {
            const Icon = feature.icon
            return (
              <Card
                key={idx}
                className="group relative overflow-hidden hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
              >
                <CardContent className="p-8 text-right space-y-4">
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center ${feature.color} group-hover:scale-110 transition-transform duration-300`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground">
                      {feature.tag}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>

                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.desc}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>

      </div>
    </section>
  )
}

