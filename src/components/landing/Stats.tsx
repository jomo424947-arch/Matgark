import React from "react"
import { Store, Package, ShoppingCart, Star } from "lucide-react"

export function Stats() {
  const stats = [
    {
      icon: Store,
      number: "+500",
      label: "متجر نشط وناجح",
      desc: "في مختلف المجالات",
    },
    {
      icon: Package,
      number: "+12,000",
      label: "منتج مضاف",
      desc: "بصور ومقاسات دقيقة",
    },
    {
      icon: ShoppingCart,
      number: "+75,000",
      label: "أوردر مكتمل",
      desc: "بدون أوردرات ضائعة",
    },
    {
      icon: Star,
      number: "4.9/5",
      label: "رضا أصحاب المحلات",
      desc: "تقييم حقيقي للتجربة",
    },
  ]

  return (
    <section className="py-12 border-y border-border/60 bg-secondary/30 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {stats.map((stat, idx) => {
            const Icon = stat.icon
            return (
              <div
                key={idx}
                className="text-center p-4 rounded-2xl bg-card/50 border border-border/40 hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground mb-1 font-cairo">
                  {stat.number}
                </div>
                <div className="text-sm font-bold text-foreground/90">
                  {stat.label}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {stat.desc}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

