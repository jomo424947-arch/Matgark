"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useCartStore } from "@/stores/cartStore"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { buildWhatsAppLink } from "@/lib/whatsapp"
import { placeOrderAction } from "@/server/actions/orders"
import { formatPrice } from "@/lib/utils"
import type { Store, Product, ProductVariant } from "@/types/domain"
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  X,
  CheckCircle2,
  Phone,
  MessageCircle,
  Truck,
  ArrowLeft,
  AlertCircle,
} from "lucide-react"
import { toast } from "sonner"

export function StorefrontClient({
  store,
  products,
}: {
  store: Store
  products: Product[]
}) {
  const {
    isOpen,
    addItem,
    removeItem,
    updateQuantity,
    toggleCart,
    closeCart,
    clearCart,
    getItemsByStore,
    totalAmount,
    totalItems,
  } = useCartStore()

  const cartItems = getItemsByStore(store.slug)
  const cartSubtotal = totalAmount(store.slug)
  const cartCount = totalItems(store.slug)

  // Modal selection state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedSize, setSelectedSize] = useState("")
  const [selectedColor, setSelectedColor] = useState("")

  // Checkout form state
  const [checkoutStep, setCheckoutStep] = useState<"cart" | "form" | "success">(
    "cart"
  )
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [customerCity, setCustomerCity] = useState("القاهرة")
  const [customerAddress, setCustomerAddress] = useState("")
  const [customerNotes, setCustomerNotes] = useState("")
  const [honeypot, setHoneypot] = useState("")
  const [lastOrderId, setLastOrderId] = useState("")
  const [lastOrderTotal, setLastOrderTotal] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Free delivery calculations
  const isFreeDelivery =
    store.freeAbove !== null && cartSubtotal >= store.freeAbove

  let currentDeliveryFee = store.flatFee
  if (isFreeDelivery) {
    currentDeliveryFee = 0
  } else if (store.deliveryType === "by_city" && store.cityFees) {
    currentDeliveryFee = store.cityFees[customerCity] ?? store.flatFee
  }

  const grandTotal = cartSubtotal + currentDeliveryFee

  const openProductModal = (product: Product) => {
    setSelectedProduct(product)
    const firstVariant = product.variants[0]
    setSelectedSize(firstVariant ? firstVariant.size : "قياسي")
    setSelectedColor(firstVariant ? firstVariant.color : "افتراضي")
  }

  const getSelectedVariant = (): ProductVariant | undefined => {
    if (!selectedProduct) return undefined
    return selectedProduct.variants.find(
      (v) => v.size === selectedSize && v.color === selectedColor
    )
  }

  const handleAddToCart = () => {
    if (!selectedProduct) return
    const variant = getSelectedVariant()

    if (variant && variant.stock <= 0) {
      toast.error("عذراً، هذا المقاس واللون غير متوفر حالياً في المخزن.")
      return
    }

    addItem({
      storeSlug: store.slug,
      productId: selectedProduct.id,
      variantId: variant?.id,
      name: selectedProduct.name,
      price: selectedProduct.price,
      size: selectedSize,
      color: selectedColor,
      quantity: 1,
      image: selectedProduct.image,
    })

    toast.success(`تمت إضافة "${selectedProduct.name}" إلى السلة`)
    setSelectedProduct(null)
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (cartItems.length === 0) return

    setIsSubmitting(true)

    const res = await placeOrderAction({
      storeSlug: store.slug,
      customerName,
      customerPhone,
      customerCity,
      customerAddress,
      customerNotes: customerNotes.trim() || undefined,
      items: cartItems.map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
      })),
      honeypot,
    })

    setIsSubmitting(false)

    if (!res.ok) {
      toast.error(res.error || "حدث خطأ أثناء تأكيد الطلب، يرجى المحاولة مرة أخرى")
      return
    }

    setLastOrderId(res.orderNumber || "1001")
    setLastOrderTotal(res.total || grandTotal)
    setCheckoutStep("success")
    clearCart(store.slug)
    toast.success("تم إرسال طلبك إلى المتجر بنجاح!")
  }

  const availableSizes = selectedProduct
    ? Array.from(new Set(selectedProduct.variants.map((v) => v.size)))
    : []

  const availableColors = selectedProduct
    ? Array.from(
        new Set(
          selectedProduct.variants
            .filter((v) => v.size === selectedSize)
            .map((v) => v.color)
        )
      )
    : []

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col text-right">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-card/85 backdrop-blur-xl border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {store.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={store.logoUrl}
                alt={store.name}
                className="w-11 h-11 rounded-2xl object-cover border border-border shadow-md"
              />
            ) : (
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center text-primary-foreground font-black text-xl shadow-md"
                style={{ backgroundColor: store.themeColor }}
              >
                {store.name.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-base sm:text-lg font-black text-foreground">
                {store.name}
              </h1>
              {store.slogan && (
                <p className="text-[11px] text-muted-foreground hidden sm:block">
                  {store.slogan}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />

            {/* WhatsApp Contact */}
            <a
              href={buildWhatsAppLink(
                store.whatsapp,
                `مرحباً، أود الاستفسار عن منتجات متجر ${store.name}`
              )}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white text-xs font-bold transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>تواصل معنا</span>
            </a>

            {/* Cart Trigger Button */}
            <button
              type="button"
              onClick={toggleCart}
              className="relative flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-primary text-primary-foreground font-bold text-xs sm:text-sm shadow-lg shadow-primary/25 hover:scale-105 active:scale-95 transition-all"
              style={{ backgroundColor: store.themeColor }}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>السلة</span>
              {cartCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-white text-foreground text-xs font-black flex items-center justify-center -mr-1 shadow-sm">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Free Delivery Banner */}
      {store.freeAbove !== null && (
        <div className="bg-primary/10 border-b border-primary/20 py-2 px-4 text-center text-xs font-bold text-primary flex items-center justify-center gap-2">
          <Truck className="w-4 h-4" />
          <span>
            {isFreeDelivery
              ? "🎉 مبروك! طلبك مؤهل للتوصيل المجاني"
              : `أضف منتجات بقيمة ${formatPrice(store.freeAbove - cartSubtotal)} واحصل على توصيل مجاني!`}
          </span>
        </div>
      )}

      {/* Main Content: Products */}
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 py-10 w-full space-y-8">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-foreground">
            كل المنتجات المتاحة
          </h2>
          <p className="text-xs text-muted-foreground">
            اختر المنتج ومقاسك ولونك المفضل واطلب مباشرة والدفع عند الاستلام
          </p>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-20 space-y-3 bg-card border border-border rounded-3xl p-8">
            <div className="text-5xl">🛍️</div>
            <h3 className="text-base font-bold text-foreground">
              لا توجد منتجات معروضة حالياً
            </h3>
            <p className="text-xs text-muted-foreground">
              المتجر يقوم بتجهيز تشكيلة المنتجات قريباً!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((p) => {
              const isOutOfStock = p.stock <= 0
              return (
                <div
                  key={p.id}
                  className="group bg-card rounded-3xl border border-border/80 overflow-hidden shadow-sm hover:shadow-xl hover:border-primary/40 transition-all duration-300 flex flex-col justify-between"
                >
                  <div className="aspect-square bg-gradient-to-br from-secondary/60 to-muted flex items-center justify-center text-6xl relative group-hover:scale-105 transition-transform duration-300">
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
                    <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-background/80 backdrop-blur-md text-foreground">
                      {p.category}
                    </span>
                    {isOutOfStock && (
                      <span className="absolute top-3 left-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-destructive text-destructive-foreground">
                        نفذ المخزون
                      </span>
                    )}
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <h3 className="text-base font-bold text-foreground line-clamp-1">
                        {p.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                        <span>المقاسات:</span>
                        <span className="font-semibold text-foreground/80">
                          {p.variants.map((v) => v.size).filter((v, i, a) => a.indexOf(v) === i).join(", ")}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border/60">
                      <span className="text-lg font-black text-primary font-cairo">
                        {formatPrice(p.price)}
                      </span>
                      <Button
                        size="sm"
                        disabled={isOutOfStock}
                        onClick={() => openProductModal(p)}
                        className="font-bold text-xs rounded-xl"
                        style={{ backgroundColor: store.themeColor }}
                      >
                        <Plus className="w-3.5 h-3.5 ml-1" />
                        <span>{isOutOfStock ? "خلصان" : "أضف للسلة"}</span>
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Quick Select Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card rounded-3xl border border-border max-w-sm w-full p-6 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-base font-bold text-foreground">
                اختر المقاس واللون
              </h3>
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center space-y-1">
              <div className="text-4xl mb-2">
                {selectedProduct.image || "📦"}
              </div>
              <div className="font-bold text-foreground">
                {selectedProduct.name}
              </div>
              <div className="text-primary font-black text-lg font-cairo">
                {formatPrice(selectedProduct.price)}
              </div>
            </div>

            {/* Sizes */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-foreground/80">
                المقاس المتاح:
              </label>
              <div className="flex flex-wrap gap-2">
                {availableSizes.map((s) => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => {
                      setSelectedSize(s)
                      const matchingColors = selectedProduct.variants
                        .filter((v) => v.size === s)
                        .map((v) => v.color)
                      if (!matchingColors.includes(selectedColor)) {
                        setSelectedColor(matchingColors[0] || "")
                      }
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                      selectedSize === s
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : "border-border hover:bg-muted text-foreground"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Colors */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-foreground/80">
                اللون:
              </label>
              <div className="flex flex-wrap gap-2">
                {availableColors.map((c) => (
                  <button
                    type="button"
                    key={c}
                    onClick={() => setSelectedColor(c)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                      selectedColor === c
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : "border-border hover:bg-muted text-foreground"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Stock status indicator */}
            {(() => {
              const v = getSelectedVariant()
              if (!v || v.stock <= 0) {
                return (
                  <div className="text-xs text-destructive font-bold flex items-center gap-1.5 bg-destructive/10 p-2 rounded-xl">
                    <AlertCircle className="w-4 h-4" />
                    <span>نفذ المخزون من هذا المقاس واللون</span>
                  </div>
                )
              }
              if (v.stock < 5) {
                return (
                  <div className="text-xs text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1.5 bg-amber-500/10 p-2 rounded-xl">
                    <AlertCircle className="w-4 h-4" />
                    <span>متبقي في المخزن {v.stock} قطع فقط!</span>
                  </div>
                )
              }
              return (
                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>متوفر في المخزن ({v.stock} قطعة)</span>
                </div>
              )
            })()}

            <Button
              onClick={handleAddToCart}
              size="lg"
              className="w-full font-bold shadow-lg shadow-primary/25"
              style={{ backgroundColor: store.themeColor }}
              disabled={!getSelectedVariant() || (getSelectedVariant()?.stock ?? 0) <= 0}
            >
              <ShoppingCart className="w-4 h-4 ml-2" />
              <span>تأكيد الإضافة للسلة</span>
            </Button>
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-start">
          <div className="bg-card w-full max-w-md h-full flex flex-col justify-between p-6 shadow-2xl animate-in slide-in-from-left duration-200 border-l border-border">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-black text-foreground">
                  سلة المشتريات ({cartCount})
                </h3>
              </div>
              <button
                type="button"
                onClick={closeCart}
                className="p-2 rounded-xl hover:bg-muted text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Steps */}
            {checkoutStep === "cart" && (
              <>
                <div className="flex-1 overflow-y-auto py-4 space-y-3">
                  {cartItems.length === 0 ? (
                    <div className="text-center py-16 space-y-3 text-muted-foreground">
                      <div className="text-5xl">🛒</div>
                      <p className="text-sm font-semibold">سلتك فاضية حالياً</p>
                      <Button variant="outline" size="sm" onClick={closeCart}>
                        تصفح المنتجات
                      </Button>
                    </div>
                  ) : (
                    cartItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-muted/30 border border-border/60"
                      >
                        <div className="flex-1">
                          <h4 className="text-xs font-bold text-foreground">
                            {item.name}
                          </h4>
                          <div className="text-[11px] text-muted-foreground mt-0.5">
                            مقاس {item.size} • لون {item.color}
                          </div>
                          <div className="text-xs font-extrabold text-primary font-cairo mt-1">
                            {formatPrice(item.price * item.quantity)}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity - 1)
                            }
                            className="w-7 h-7 rounded-lg bg-background border border-border flex items-center justify-center text-foreground hover:bg-muted"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold w-4 text-center">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                            className="w-7 h-7 rounded-lg bg-background border border-border flex items-center justify-center text-foreground hover:bg-muted"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="p-1.5 text-muted-foreground hover:text-destructive mr-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {cartItems.length > 0 && (
                  <div className="pt-4 border-t border-border space-y-3">
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between text-muted-foreground">
                        <span>المجموع الفرعي:</span>
                        <span className="font-bold font-cairo">
                          {formatPrice(cartSubtotal)}
                        </span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>رسوم التوصيل:</span>
                        <span className="font-bold font-cairo">
                          {isFreeDelivery
                            ? "مجاناً 🎉"
                            : formatPrice(currentDeliveryFee)}
                        </span>
                      </div>
                      <div className="flex justify-between text-base font-black text-foreground pt-2 border-t border-border">
                        <span>المجموع الإجمالي:</span>
                        <span className="text-primary font-cairo">
                          {formatPrice(grandTotal)}
                        </span>
                      </div>
                    </div>

                    <Button
                      size="lg"
                      onClick={() => setCheckoutStep("form")}
                      className="w-full font-bold shadow-xl shadow-primary/25"
                      style={{ backgroundColor: store.themeColor }}
                    >
                      <span>متابعة الشراء (الدفع كاش)</span>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                    </Button>
                  </div>
                )}
              </>
            )}

            {/* Step 2: Form */}
            {checkoutStep === "form" && (
              <form
                onSubmit={handlePlaceOrder}
                className="flex-1 flex flex-col justify-between py-4"
              >
                <div className="space-y-4 overflow-y-auto">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-foreground">
                      بيانات التوصيل (Guest Checkout)
                    </h4>
                    <button
                      type="button"
                      onClick={() => setCheckoutStep("cart")}
                      className="text-xs text-primary font-bold hover:underline"
                    >
                      تعديل السلة
                    </button>
                  </div>

                  {/* Honeypot field for anti-spam */}
                  <input
                    type="text"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                    className="hidden"
                    tabIndex={-1}
                    autoComplete="off"
                  />

                  <Input
                    label="الاسم بالكامل *"
                    placeholder="مثال: أحمد محمد"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                  />

                  <Input
                    label="رقم الموبايل *"
                    type="tel"
                    placeholder="01012345678"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    required
                    dir="ltr"
                    className="text-right"
                    startIcon={<Phone className="w-4 h-4" />}
                  />

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-foreground/80">
                      المحافظة *
                    </label>
                    <select
                      value={customerCity}
                      onChange={(e) => setCustomerCity(e.target.value)}
                      className="w-full h-11 rounded-xl border border-input bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-right"
                    >
                      <option value="القاهرة">القاهرة</option>
                      <option value="الجيزة">الجيزة</option>
                      <option value="الإسكندرية">الإسكندرية</option>
                      <option value="القليوبية">القليوبية</option>
                      <option value="الدقهلية">الدقهلية</option>
                      <option value="الشرقية">الشرقية</option>
                      <option value="المنوفية">المنوفية</option>
                      <option value="البحيرة">البحيرة</option>
                      <option value="محافظة أخرى">محافظة أخرى</option>
                    </select>
                  </div>

                  <Input
                    label="العنوان بالتفصيل *"
                    placeholder="اسم الشارع، رقم العمارة، رقم الشقة أو علامة مميزة"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    required
                  />

                  <Input
                    label="ملاحظات إضافية للتوصيل (اختياري)"
                    placeholder="مثال: يرجى الاتصال قبل الوصول بنصف ساعة"
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                  />

                  <div className="p-3 rounded-xl bg-muted/40 border border-border text-xs text-muted-foreground flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>طريقة الدفع: الدفع نقداً عند استلام الأوردر</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-border space-y-2">
                  <div className="flex justify-between items-center text-sm font-black">
                    <span>المجموع الإجمالي:</span>
                    <span className="text-primary text-base font-cairo">
                      {formatPrice(grandTotal)}
                    </span>
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    isLoading={isSubmitting}
                    className="w-full font-bold shadow-xl shadow-primary/25"
                    style={{ backgroundColor: store.themeColor }}
                  >
                    <span>تأكيد وإتمام الطلب بنقرة واحدة</span>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                  </Button>
                </div>
              </form>
            )}

            {/* Step 3: Success */}
            {checkoutStep === "success" && (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 p-4">
                <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center animate-bounce">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black text-foreground">
                  تم استلام طلبك بنجاح! 🎉
                </h3>
                <p className="text-xs text-muted-foreground max-w-xs">
                  شكراً لتسوقك من {store.name}. رقم أوردرك هو{" "}
                  <strong className="text-foreground">#{lastOrderId}</strong>.
                  هيتواصل معاك المتجر على رقم {customerPhone} لتأكيد ميعاد
                  التوصيل.
                </p>

                <div className="w-full p-4 rounded-2xl bg-secondary/50 border border-border text-right text-xs space-y-1.5">
                  <div className="font-bold text-foreground">ملخص الطلب:</div>
                  <div className="text-muted-foreground">
                    الاسم: {customerName}
                  </div>
                  <div className="text-muted-foreground">
                    العنوان: {customerAddress} ({customerCity})
                  </div>
                  <div className="text-foreground font-black pt-1 border-t border-border">
                    المبلغ المطلوب عند الاستلام: {formatPrice(lastOrderTotal)}
                  </div>
                </div>

                <div className="pt-4 w-full space-y-2">
                  <a
                    href={buildWhatsAppLink(
                      store.whatsapp,
                      `مرحباً، أنا ${customerName}، عملت أوردر رقم #${lastOrderId} بمبلغ ${formatPrice(lastOrderTotal)} من متجركم على المنصة.`
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-emerald-500 text-white font-bold text-xs hover:bg-emerald-600 transition-colors shadow-md"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>مراسلة المتجر على واتساب الآن</span>
                  </a>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setCheckoutStep("cart")
                      closeCart()
                    }}
                  >
                    العودة للتسوق
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-border py-8 bg-card text-center text-xs text-muted-foreground space-y-2">
        <p>جميع الحقوق محفوظة © {store.name} 2026</p>
        <p className="text-[11px] text-muted-foreground/70">
          مدعوم بواسطة{" "}
          <Link href="/" className="font-bold text-primary hover:underline">
            منصة متجرك (Matgarak)
          </Link>
        </p>
      </footer>
    </div>
  )
}
