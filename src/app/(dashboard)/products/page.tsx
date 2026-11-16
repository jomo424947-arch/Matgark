"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { Card, CardContent } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { useMerchantStore } from "@/stores/merchantStore"
import { Plus, Search, Filter, Trash2, ExternalLink } from "lucide-react"
import { toast } from "sonner"

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const products = useMerchantStore((s) => s.products)
  const deleteProduct = useMerchantStore((s) => s.deleteProduct)
  const settings = useMerchantStore((s) => s.settings)

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.includes(searchTerm) || p.category.includes(searchTerm)
    const matchesStatus = statusFilter === "all" || p.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleDelete = (id: string, name: string) => {
    deleteProduct(id)
    toast.success(`تم حذف المنتج "${name}"`)
  }

  return (
    <div className="space-y-6 text-right">
      {/* الرأس والزر الأساسي */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground">
            إدارة المنتجات
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            أضف منتجاتك بالصور والمقاسات والألوان وتابع المخزون ({products.length} منتج)
          </p>
        </div>

        <Link href="/products/new">
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
              aria-label="ابحث باسم المنتج أو الفئة"
              placeholder="ابحث باسم المنتج أو الفئة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-11 pr-10 pl-4 rounded-xl border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 text-right"
            />
            <Search className="w-4 h-4 text-muted-foreground absolute right-3.5 top-3.5" />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
            <select
              aria-label="فلترة حسب حالة المخزون"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-11 px-3 rounded-xl border border-input bg-background text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="all">كل الحالات</option>
              <option value="نشط">نشط</option>
              <option value="مخزون منخفض">مخزون منخفض</option>
              <option value="نفذ المخزون">نفذ المخزون</option>
            </select>
          </div>
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
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                      لا توجد منتجات مطابقة للبحث حالياً.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-2xl">
                            {p.emoji}
                          </div>
                          <div>
                            <div className="font-bold text-foreground">{p.name}</div>
                            <div className="text-[11px] text-muted-foreground">
                              ID: #{p.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-xs font-medium text-muted-foreground">
                        {p.category}
                      </td>
                      <td className="py-4 px-4 font-black text-foreground font-cairo">
                        {p.price} ج.م
                      </td>
                      <td className="py-4 px-4 text-xs font-bold">
                        {p.stock > 0 ? (
                          <span className="text-foreground">{p.stock} قطعة</span>
                        ) : (
                          <span className="text-destructive">خلصان</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-xs text-muted-foreground">
                        {p.variantsText}
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
                          <Link
                            href={`/store/${settings.slug}`}
                            aria-label={`معاينة ${p.name} في المتجر`}
                            title="معاينة في المتجر"
                            className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(p.id, p.name)}
                            aria-label={`حذف ${p.name}`}
                            title="حذف المنتج"
                            className="p-2 rounded-lg hover:bg-destructive/10 text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
