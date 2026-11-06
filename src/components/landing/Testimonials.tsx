import React from "react"
import { Card, CardContent } from "@/components/ui/Card"
import { Star, Quote } from "lucide-react"

export function Testimonials() {
  const reviews = [
    {
      name: "سارة محمود",
      store: "براند سارة كروشيه",
      avatar: "👩‍🎨",
      role: "أشغال يدوية وإكسسوارات",
      comment:
        "كنت بقضي 4 ساعات في اليوم بس أرد على الرسايل وأسجل في نوت بوك، ودلوقتي العميل بيدخل يختار اللون والمقاس ويعمل أوردر في دقيقة، وكل حاجة منظمة قدامي!",
      rating: 5,
    },
    {
      name: "كريم عبد الله",
      store: "Urban Kicks Store",
      avatar: "👟",
      role: "أحذية وملابس شبابية",
      comment:
        "أهم ميزة عندي كانت المخزون لكل مقاس. قبل كده كان العميل يطلب مقاس 42 ولما أجي أجهز الأوردر ألاقيه خلصان ويحصل إحراج. متجرك وفر عليا الصداع ده نهائياً.",
      rating: 5,
    },
    {
      name: "ميادة حسن",
      store: "Sweet House Bakery",
      avatar: "🧁",
      role: "حلويات ومخبوزات منزلية",
      comment:
        "الإشعار اللي بيجي فوري على واتساب بأول ما حد يطلب غير طريقتي في الشغل تماماً. بنصح أي حد بادئ يبيع على السوشيال ميديا يجرب متجرك فوراً.",
      rating: 5,
    },
  ]

  return (
    <section className="py-20 md:py-28 bg-secondary/30 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold">
            <Star className="w-4 h-4 fill-primary text-primary" />
            <span>قصص نجاح حقيقية</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground tracking-tight">
            تجار متجرك بيتكلموا عن تجربتهم
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground">
            أكتر من 500 براند ومحل صغير وثقوا فينا وكبروا مبيعاتهم.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reviews.map((rev, idx) => (
            <Card
              key={idx}
              className="relative bg-card hover:shadow-xl transition-all duration-300"
            >
              <CardContent className="p-8 text-right space-y-4">
                <Quote className="w-8 h-8 text-primary/30" />
                
                <div className="flex items-center gap-1">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                <p className="text-sm text-foreground/80 leading-relaxed italic">
                  "{rev.comment}"
                </p>

                <div className="pt-4 border-t border-border flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-secondary flex items-center justify-center text-2xl">
                    {rev.avatar}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">
                      {rev.name}
                    </h4>
                    <p className="text-xs text-primary font-semibold">
                      {rev.store}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {rev.role}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

      </div>
    </section>
  )
}

