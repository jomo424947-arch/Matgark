"use client"

import React, { useState, Suspense } from "react"
import Link from "next/link"
import { useCartStore } from "@/stores/cartStore"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Badge } from "@/components/ui/Badge"
import { ThemeToggle } from "@/components/layout/ThemeToggle"
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  X,
  CheckCircle2,
  Phone,
  MapPin,
  MessageCircle,
  Truck,
  ArrowLeft,
  Sparkles,
} from "lucide-react"

function StorefrontContent() {
  const urlParams = useParams()
  const slug = (urlParams?.slug as string) || "cairo-couture"

  // بيانات المتجر التجريبية
  const store = {
    name: "براند كايرو كوتور",
    slug: slug || "cairo-couture",
    slogan: "أحدث صيحات الملابس الشتوية والكاجوال العصرية في مصر",
    phone: "01012345678",
    deliveryFee: 40,
    freeDeliveryAbove: 1000,
  }

  // منتجات المتجر
  const products = [
    {
      id: "prod-1",
      name: "جاكيت شتوي أوفرسايز صوف فاخر",
      price: 850,
      image: "🧥",
      category: "ملابس شتوية",
      sizes: ["M", "L", "XL"],
      colors: ["أسود", "بيج", "زيتي"],
      stock: 12,
    },
    {
      id: "prod-2",
      name: "سنيكرز جلد أبيض مريح",
      price: 620,
      image: "👟",
      category: "أحذية",
      sizes: ["38", "39", "40", "41", "42"],
      colors: ["أبيض"],
      stock: 4,
    },
    {
      id: "prod-3",
      name: "هودي ميلتون مصري مبطن",
      price: 550,
      image: "👕",
      category: "ملابس كاجوال",
      sizes: ["S", "M", "L", "XL"],
      colors: ["رمادي", "كحلي", "نبيتي"],
      stock: 20,
    },
    {
      id: "prod-4",
      name: "بنطلون كارجو قطن بجيوب",
      price: 490,
      image: "👖",
      category: "بناطيل",
      sizes: ["30", "32", "34", "36"],
      colors: ["بيج", "زيتي", "أسود"],
      stock: 8,
    },
  ]

  // Cart Store
  const {
    items,
    isOpen,
    addItem,
    removeItem,
    updateQuantity,
    toggleCart,
    closeCart,
    clearCart,
    totalAmount,
    totalItems,
  } = useCartStore()

  // حالة اختيار المقاس السريع
  const [selectedProduct, setSelectedProduct] = useState<typeof products[0] | null>(null)
  const [selectedSize, setSelectedSize] = useState("")
  const [selectedColor, setSelectedColor] = useState("")

  // حالة الـ Checkout
  const [checkoutStep, setCheckoutStep] = useState<"cart" | "form" | "success">("cart")
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [customerCity, setCustomerCity] = useState("القاهرة")
  const [customerAddress, setCustomerAddress] = useState("")
  const [customerNotes, setCustomerNotes] = useState("")
  const [lastOrderId, setLastOrderId] = useState("")

  const openProductModal = (product: typeof products[0]) => {
    setSelectedProduct(product)
    setSelectedSize(product.sizes[0] || "")
    setSelectedColor(product.colors[0] || "")
  }

  const handleAddToCart = () => {
    if (!selectedProduct) return
    addItem({
      productId: selectedProduct.id,
      name: selectedProduct.name,
      price: selectedProduct.price,
      size: selectedSize,
      color: selectedColor,
      quantity: 1,
    })
    setSelectedProduct(null)
  }

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault()
    const orderId = Math.floor(1000 + Math.random() * 9000).toString()
    setLastOrderId(orderId)
    setCheckoutStep("success")
    clearCart()
  }

  const subtotal = totalAmount()
  const isFreeDelivery = subtotal >= store.freeDeliveryAbove
  const currentDeliveryFee = isFreeDelivery ? 0 : store.deliveryFee
  const grandTotal = subtotal + currentDeliveryFee

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col text-right">
      
      {/* هيدر المتجر الخاص بالتاجر */}
      <header className="sticky top-0 z-30 bg-card/85 backdrop-blur-xl border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground font-black text-xl shadow-md">
              ك
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black text-foreground">
                {store.name}
              </h1>
              <p className="text-[11px] text-muted-foreground hidden sm:block">
                {store.slogan}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />

            {/* زر الواتساب للمتجر */}
            <a
              href={`https://wa.me/2${store.phone}`}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white text-xs font-bold transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>تواصل معنا</span>
            </a>

            {/* زر السلة العائم */}
            <button
              onClick={toggleCart}
              className="relative flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-primary text-primary-foreground font-bold text-xs sm:text-sm shadow-lg shadow-primary/25 hover:scale-105 active:scale-95 transition-all"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>السلة</span>
              {totalItems() > 0 && (
                <span className="w-5 h-5 rounded-full bg-white text-primary text-xs font-black flex items-center justify-center -mr-1">
                  {totalItems()}
                </span>
              )}
            </button>
          </div>

        </div>
      </header>

      {/* تنبيه التوصيل المجاني */}
      <div className="bg-primary/10 border-b border-primary/20 py-2 px-4 text-center text-xs font-bold text-primary flex items-center justify-center gap-2">
        <Truck className="w-4 h-4" />
        <span>
          {isFreeDelivery
            ? "🎉 مبروك! طلبك مؤهل للتوصيل المجاني"
            : `أضف منتجات بقيمة ${store.freeDeliveryAbove - subtotal} ج.م واحصل على توصيل مجاني!`}
        </span>
      </div>

      {/* المنتجات في المتجر */}
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 py-10 w-full space-y-8">
        
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-foreground">
            كل المنتجات المتاحة
          </h2>
          <p className="text-xs text-muted-foreground">
            اختر المنتج ومقاسك ولونك المفضل واطلب مباشرة والدفع عند الاستلام
          </p>
        </div>

        {/* شبكة المنتجات */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((p) => (
            <div
              key={p.id}
              className="group bg-card rounded-3xl border border-border/80 overflow-hidden shadow-sm hover:shadow-xl hover:border-primary/40 transition-all duration-300 flex flex-col justify-between"
            >
              {/* صورة المنتج الافتراضية الأنيقة */}
              <div className="aspect-square bg-gradient-to-br from-secondary/60 to-muted flex items-center justify-center text-6xl relative group-hover:scale-105 transition-transform duration-300">
                <span>{p.image}</span>
                <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-background/80 backdrop-blur-md text-foreground">
                  {p.category}
                </span>
              </div>

              {/* تفاصيل المنتج */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-base font-bold text-foreground line-clamp-1">
                    {p.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                    <span>المقاسات:</span>
                    <span className="font-semibold text-foreground/80">
                      {p.sizes.join(", ")}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/60">
                  <span className="text-lg font-black text-primary font-cairo">
                    {p.price} ج.م
                  </span>
                  <Button
                    size="sm"
                    onClick={() => openProductModal(p)}
                    className="font-bold text-xs rounded-xl"
                  >
                    <Plus className="w-3.5 h-3.5 ml-1" />
                    <span>أضف للسلة</span>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

      </main>

      {/* نافذة اختيار المقاس واللون السريعة Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card rounded-3xl border border-border max-w-sm w-full p-6 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-base font-bold text-foreground">
                اختر المقاس واللون
              </h3>
              <button
                onClick={() => setSelectedProduct(null)}
                className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center space-y-1">
              <div className="text-4xl mb-2">{selectedProduct.image}</div>
              <div className="font-bold text-foreground">{selectedProduct.name}</div>
              <div className="text-primary font-black text-lg font-cairo">
                {selectedProduct.price} ج.م
              </div>
            </div>

            {/* المقاس */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-foreground/80">
                المقاس المتاح:
              </label>
              <div className="flex flex-wrap gap-2">
                {selectedProduct.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(s)}
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

            {/* اللون */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-foreground/80">
                اللون:
              </label>
              <div className="flex flex-wrap gap-2">
                {selectedProduct.colors.map((c) => (
                  <button
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

            <Button
              onClick={handleAddToCart}
              size="lg"
              className="w-full font-bold shadow-lg shadow-primary/25"
            >
              <ShoppingCart className="w-4 h-4 ml-2" />
              <span>تأكيد الإضافة للسلة</span>
            </Button>

          </div>
        </div>
      )}

      {/* درج سلة المشتريات Cart Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-start">
          <div className="bg-card w-full max-w-md h-full flex flex-col justify-between p-6 shadow-2xl animate-in slide-in-from-left duration-200 border-l border-border">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-black text-foreground">
                  سلة المشتريات ({totalItems()})
                </h3>
              </div>
              <button
                onClick={closeCart}
                className="p-2 rounded-xl hover:bg-muted text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* محتوى السلة حسب الخطوة */}
            {checkoutStep === "cart" && (
              <>
                <div className="flex-1 overflow-y-auto py-4 space-y-3">
                  {items.length === 0 ? (
                    <div className="text-center py-16 space-y-3 text-muted-foreground">
                      <div className="text-5xl">🛒</div>
                      <p className="text-sm font-semibold">سلتك فاضية حالياً</p>
                      <Button variant="outline" size="sm" onClick={closeCart}>
                        تصفح المنتجات
                      </Button>
                    </div>
                  ) : (
                    items.map((item) => (
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
                            {item.price * item.quantity} ج.م
                          </div>
                        </div>

                        {/* التحكم في الكمية */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-7 h-7 rounded-lg bg-background border border-border flex items-center justify-center text-foreground hover:bg-muted"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold w-4 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-7 h-7 rounded-lg bg-background border border-border flex items-center justify-center text-foreground hover:bg-muted"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
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

                {items.length > 0 && (
                  <div className="pt-4 border-t border-border space-y-3">
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between text-muted-foreground">
                        <span>المجموع الفرعي:</span>
                        <span className="font-bold font-cairo">{subtotal} ج.م</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>رسوم التوصيل:</span>
                        <span className="font-bold font-cairo">
                          {isFreeDelivery ? "مجاناً 🎉" : `${currentDeliveryFee} ج.م`}
                        </span>
                      </div>
                      <div className="flex justify-between text-base font-black text-foreground pt-2 border-t border-border">
                        <span>المجموع الإجمالي:</span>
                        <span className="text-primary font-cairo">{grandTotal} ج.م</span>
                      </div>
                    </div>

                    <Button
                      size="lg"
                      onClick={() => setCheckoutStep("form")}
                      className="w-full font-bold shadow-xl shadow-primary/25"
                    >
                      <span>متابعة الشراء (الدفع كاش)</span>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                    </Button>
                  </div>
                )}
              </>
            )}

            {/* خطوة إدخال بيانات التوصيل Guest Checkout */}
            {checkoutStep === "form" && (
              <form onSubmit={handlePlaceOrder} className="flex-1 flex flex-col justify-between py-4">
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
                    placeholder="مثال: يرجي الاتصال قبل الوصول بنصف ساعة"
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
                      {grandTotal} ج.م
                    </span>
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full font-bold shadow-xl shadow-primary/25"
                  >
                    <span>تأكيد وإتمام الطلب بنقرة واحدة</span>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                  </Button>
                </div>
              </form>
            )}

            {/* خطوة نجاح الطلب */}
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
                  هيتواصل معاك المتجر على رقم {customerPhone} لتأكيد ميعاد التوصيل.
                </p>

                <div className="w-full p-4 rounded-2xl bg-secondary/50 border border-border text-right text-xs space-y-1.5">
                  <div className="font-bold text-foreground">ملخص الطلب:</div>
                  <div className="text-muted-foreground">الاسم: {customerName}</div>
                  <div className="text-muted-foreground">العنوان: {customerAddress} ({customerCity})</div>
                  <div className="text-foreground font-black pt-1 border-t border-border">
                    المبلغ المطلوب عند الاستلام: {grandTotal} ج.م
                  </div>
                </div>

                <div className="pt-4 w-full space-y-2">
                  <a
                    href={`https://wa.me/2${store.phone}?text=مرحباً، أنا ${customerName}، عملت أوردر رقم #${lastOrderId} من متجركم على المنصة`}
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

      {/* تذييل المتجر */}
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

export default function StorefrontPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background text-primary font-bold">
          جاري تحميل المتجر...
        </div>
      }
    >
      <StorefrontContent />
    </Suspense>
  )
}
