"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { Card, CardContent } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Input } from "@/components/ui/Input"
import { getMerchantDashboardDataAction } from "@/server/actions/store"
import { updateProductAction, deleteProductAction } from "@/server/actions/products"
import { formatPrice } from "@/lib/utils"
import {
  PRODUCT_STATUS_BADGE_MAP,
  type Product,
} from "@/types/domain"
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  X,
  CheckCircle2,
} from "lucide-react"
import { toast } from "sonner"

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")

  // Modal states
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [editName, setEditName] = useState("")
  const [editPrice, setEditPrice] = useState("")
  const [editCategory, setEditCategory] = useState("")
  const [editVariants, setEditVariants] = useState<
    { id?: string; size: string; color: string; stock: number }[]
  >([])
  const [isSaving, setIsSaving] = useState(false)

  const loadData = () => {
    getMerchantDashboardDataAction()
      .then((data) => {
        setProducts(data.products)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
  }, [])

  const categories = [
    "all",
    ...Array.from(new Set(products.map((p) => p.category))),
  ]

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      searchTerm.trim() === "" ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory =
      selectedCategory === "all" || p.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  const openEditModal = (p: Product) => {
    setEditingProduct(p)
    setEditName(p.name)
    setEditPrice(String(p.price))
    setEditCategory(p.category)
    setEditVariants(
      p.variants.map((v) => ({
        id: v.id,
        size: v.size,
        color: v.color,
        stock: v.stock,
      }))
    )
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingProduct) return

    setIsSaving(true)
    const res = await updateProductAction(editingProduct.id, {
      name: editName,
      price: Number(editPrice),
      category: editCategory,
      variants: editVariants,
    })
    setIsSaving(false)

    if (!res.ok) {
      toast.error(res.error || "فشل حفظ التعديلات")
      return
    }

    toast.success("تم تحديث المنتج بنجاح!")
    setEditingProduct(null)
    loadData()
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف المنتج "${name}"؟`)) return

    const res = await deleteProductAction(id)
    if (!res.ok) {
      toast.error(res.error || "فشل حذف المنتج")
      return
    }

    toast.success("تم حذف المنتج بنجاح")
    loadData()
  }

  return (
    <div className="space-y-6 text-right">
      {/* Header */}
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

      {/* Search and Category Filters */}
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

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-muted-foreground hidden sm:block" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-11 px-3 rounded-xl border border-input bg-background text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-right w-full sm:w-auto"
            >
              <option value="all">كل الفئات ({products.length})</option>
              {categories
                .filter((c) => c !== "all")
                .map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
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
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-muted-foreground">
                      جاري تحميل المنتجات...
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-muted-foreground">
                      لا توجد منتجات مطابقة للبحث
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const badgeVariant =
                      PRODUCT_STATUS_BADGE_MAP[p.status] || "default"
                    const variantsSummary = p.variants
                      .map((v) => `${v.size} (${v.color})`)
                      .join(" • ")

                    return (
                      <tr
                        key={p.id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-2xl overflow-hidden shrink-0">
                              {p.image && p.image.length > 5 ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={p.image}
                                  alt={p.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span>{p.image || "📦"}</span>
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-foreground">
                                {p.name}
                              </div>
                              <div className="text-[11px] text-muted-foreground dir-ltr text-right">
                                #{p.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-xs font-medium text-muted-foreground">
                          {p.category}
                        </td>
                        <td className="py-4 px-4 font-black text-foreground font-cairo">
                          {formatPrice(p.price)}
                        </td>
                        <td className="py-4 px-4 text-xs font-bold">
                          {p.stock > 0 ? (
                            <span className="text-foreground">
                              {p.stock} قطعة
                            </span>
                          ) : (
                            <span className="text-destructive font-black">
                              خلصان
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-xs text-muted-foreground max-w-xs truncate">
                          {variantsSummary}
                        </td>
                        <td className="py-4 px-4">
                          <Badge variant={badgeVariant}>{p.status}</Badge>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setViewingProduct(p)}
                              title="معاينة تفاصيل المنتج"
                              className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditModal(p)}
                              title="تعديل المنتج والمخزون"
                              className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(p.id, p.name)}
                              title="حذف المنتج"
                              className="p-2 rounded-lg hover:bg-destructive/10 text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* View Modal */}
      {viewingProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card rounded-3xl border border-border max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-base font-bold text-foreground">
                تفاصيل المنتج
              </h3>
              <button
                type="button"
                onClick={() => setViewingProduct(null)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center space-y-2">
              <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center text-4xl mx-auto overflow-hidden">
                {viewingProduct.image && viewingProduct.image.length > 5 ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={viewingProduct.image}
                    alt={viewingProduct.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{viewingProduct.image || "📦"}</span>
                )}
              </div>
              <h4 className="text-lg font-black text-foreground">
                {viewingProduct.name}
              </h4>
              <div className="text-primary font-black text-xl font-cairo">
                {formatPrice(viewingProduct.price)}
              </div>
            </div>

            <div className="space-y-2 text-xs border-t border-border pt-3">
              <div className="flex justify-between text-muted-foreground">
                <span>الفئة:</span>
                <span className="font-bold text-foreground">
                  {viewingProduct.category}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>إجمالي المخزون:</span>
                <span className="font-bold text-foreground">
                  {viewingProduct.stock} قطعة
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>الحالة:</span>
                <Badge variant={PRODUCT_STATUS_BADGE_MAP[viewingProduct.status]}>
                  {viewingProduct.status}
                </Badge>
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="block text-xs font-bold text-foreground">
                تفاصيل المقاسات والألوان بالمخزن:
              </label>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {viewingProduct.variants.map((v, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center p-2 rounded-xl bg-muted/40 text-xs"
                  >
                    <span>
                      مقاس {v.size} • لون {v.color}
                    </span>
                    <span className="font-bold font-cairo">
                      {v.stock} قطعة
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <Button
              className="w-full font-bold mt-2"
              onClick={() => setViewingProduct(null)}
            >
              إغلاق
            </Button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card rounded-3xl border border-border max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-base font-bold text-foreground">
                تعديل بيانات المنتج والمخزون
              </h3>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <Input
                label="اسم المنتج *"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="السعر (ج.م) *"
                  type="number"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  required
                  dir="ltr"
                  className="text-right font-bold"
                />

                <Input
                  label="الفئة *"
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  required
                />
              </div>

              {/* Variants Stock editor */}
              <div className="space-y-2 pt-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-foreground">
                    تعديل كمية المخزون لكل خيار:
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setEditVariants([
                        ...editVariants,
                        { size: "M", color: "افتراضي", stock: 10 },
                      ])
                    }
                    className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة خيار</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {editVariants.map((v, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/40 border border-border"
                    >
                      <input
                        type="text"
                        value={v.size}
                        placeholder="المقاس"
                        onChange={(e) => {
                          const copy = [...editVariants]
                          copy[idx]!.size = e.target.value
                          setEditVariants(copy)
                        }}
                        className="w-20 h-9 px-2 text-xs rounded-lg border border-input bg-background text-center font-bold"
                      />
                      <input
                        type="text"
                        value={v.color}
                        placeholder="اللون"
                        onChange={(e) => {
                          const copy = [...editVariants]
                          copy[idx]!.color = e.target.value
                          setEditVariants(copy)
                        }}
                        className="flex-1 h-9 px-2 text-xs rounded-lg border border-input bg-background text-center font-bold"
                      />
                      <input
                        type="number"
                        value={v.stock}
                        placeholder="الكمية"
                        onChange={(e) => {
                          const copy = [...editVariants]
                          copy[idx]!.stock = Number(e.target.value) || 0
                          setEditVariants(copy)
                        }}
                        className="w-20 h-9 px-2 text-xs rounded-lg border border-input bg-background text-center font-bold dir-ltr"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setEditVariants(
                            editVariants.filter((_, i) => i !== idx)
                          )
                        }
                        className="p-2 text-destructive hover:bg-destructive/10 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingProduct(null)}
                >
                  إلغاء
                </Button>
                <Button type="submit" isLoading={isSaving} className="font-bold">
                  <CheckCircle2 className="w-4 h-4 ml-1.5" />
                  <span>حفظ التعديلات</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
