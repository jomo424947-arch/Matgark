"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Plus, Search, Filter, Edit, Trash2, Eye } from "lucide-react"

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState("")

  const products = [
    {
      id: "1",
      name: "جاكيت شتوي أوفرسايز صوف",
      category: "ملابس شتوية",
      price: "850 ج.م",
      stock: 14,
      variants: "M, L, XL • أسود، زيتي",
      status: "نشط",
      emoji: "🧥",
    },
    {
      id: "2",
      name: "سنيكرز جلد أبيض كلاسيك",
      category: "أحذية",
      price: "620 ج.م",
      stock: 3,
      variants: "38, 39, 40, 41, 42 • أبيض",
      status: "مخزون منخفض",
      emoji: "👟",
    },
    {
      id: "3",
      name: "هودي قطن مصري 100%",
      category: "ملابس كاجوال",
      price: "550 ج.م",
      stock: 22,
      variants: "S, M, L • رمادي، كحلي، نبيتي",
      status: "نشط",
      emoji: "👕",
    },
    {
      id: "4",
      name: "بنطلون كارجو بجيوب متعددة",
      category: "بناطيل",
      price: "490 ج.م",
      stock: 0,
      variants: "30, 32, 34 • بيج",
      status: "نفذ المخزون",
      emoji: "👖",
    },
  ]

  return (
    <div className="space-y-6 text-right">
      
      {/* الرأس والزر الأساسي */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground">
            إدارة المنتجات
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            أضف منتجاتك بالصور والمقاسات والألوان وتابع المخزون
          </p>
        </div>

        <Link href="/dashboard/products/new">
          <Button className="font-bold gap-2 shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4" />
            <span>إضافة منتج جديد</span>
          </Button>
        </Link>
      </div>

      {/* البحث والفلترة */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              placeholder="ابحث باسم المنتج أو الفئة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-11 pr-10 pl-4 rounded-xl border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 text-right"
            />
            <Search className="w-4 h-4 text-muted-foreground absolute right-3.5 top-3.5" />
          </div>
          <Button variant="outline" size="sm" className="w-full sm:w-auto gap-2">
            <Filter className="w-4 h-4" />
            <span>فلترة</span>
          </Button>
        </CardContent>
      </Card>

      {/* جدول المنتجات */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-muted/40 text-muted-foreground text-xs font-bold border-b border-border">
                <tr>
                  <th className="py-3 px-4">المنتج</th>
                  <th className="py-3 px-4">الفئة</th>
                  <th className="py-3 px-4">السعر</th>
                  <th className="py-3 px-4">المخزون</th>
                  <th className="py-3 px-4">الخيارات (Variants)</th>
                  <th className="py-3 px-4">الحالة</th>
                  <th className="py-3 px-4 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-2xl">
                          {p.emoji}
                        </div>
                        <div>
                          <div className="font-bold text-foreground">{p.name}</div>
                          <div className="text-[11px] text-muted-foreground">ID: #{p.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-xs font-medium text-muted-foreground">
                      {p.category}
                    </td>
                    <td className="py-4 px-4 font-black text-foreground font-cairo">
                      {p.price}
                    </td>
                    <td className="py-4 px-4 text-xs font-bold">
                      {p.stock > 0 ? (
                        <span className="text-foreground">{p.stock} قطعة</span>
                      ) : (
                        <span className="text-destructive">خلصان</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-xs text-muted-foreground">
                      {p.variants}
                    </td>
                    <td className="py-4 px-4">
                      <Badge
                        variant={
                          p.stock === 0
                            ? "danger"
                            : p.stock < 5
                            ? "warning"
                            : "success"
                        }
                      >
                        {p.status}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-2 rounded-lg hover:bg-destructive/10 text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}

