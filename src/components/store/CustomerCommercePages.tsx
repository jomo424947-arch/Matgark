"use client"

import { useState } from "react"
import type { CSSProperties, FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, CheckCircle2, Minus, Plus, ShoppingBag, Trash2, Truck } from "lucide-react"
import { toast } from "sonner"
import { useCartStore } from "@/stores/cartStore"
import { placeOrderAction } from "@/server/actions/orders"
import { formatPrice } from "@/lib/utils"
import type { Product, Store } from "@/types/domain"

type Props = { store: Store }

function StoreHeader({ store }: Props) {
  const count = useCartStore((s) => s.totalItems(store.slug))
  const subtotal = useCartStore((s) => s.items.reduce((sum, item) => sum + (item.storeSlug === store.slug || (!item.storeSlug && store.slug === "cairo-couture") ? item.price * item.quantity : 0), 0))
  const freeDeliveryTarget = store.freeAbove
  const remainingForFreeDelivery = freeDeliveryTarget !== null ? Math.max(0, freeDeliveryTarget - subtotal) : null
  return (
    <>
    {freeDeliveryTarget !== null && freeDeliveryTarget > 0 && <div role="status" className="px-4 py-2 text-center text-xs font-bold" style={{ backgroundColor: `${store.themeColor}14`, color: store.themeColor }}>
      {remainingForFreeDelivery === 0 ? "مبروك! طلبك مؤهل للتوصيل المجاني" : `توصيل مجاني للطلبات فوق ${formatPrice(freeDeliveryTarget)} — أضيفي ${formatPrice(remainingForFreeDelivery ?? 0)} للاستفادة من العرض`}
    </div>}
    <header className="sticky top-0 z-30 border-b border-border bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href={`/${store.slug}`} className="flex min-w-0 items-center gap-3" aria-label={`العودة إلى ${store.name}`}>
          {store.logoUrl ? <img src={store.logoUrl} alt={`شعار ${store.name}`} className="h-10 w-10 rounded-xl object-cover" /> : <span className="flex h-10 w-10 items-center justify-center rounded-xl text-lg font-black text-white" style={{ backgroundColor: store.themeColor }}>{store.name.slice(0, 1)}</span>}
          <span className="truncate font-black text-slate-900">{store.name}</span>
        </Link>
        <Link href={`/${store.slug}/cart`} className="relative inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50">
          <ShoppingBag className="h-4 w-4" /> السلة
          {count > 0 && <span className="rounded-full px-2 py-0.5 text-xs text-white" style={{ backgroundColor: store.themeColor }}>{count}</span>}
        </Link>
      </div>
    </header>
    </>
  )
}

export function ProductDetailsPage({ store, product }: Props & { product: Product }) {
  const addItem = useCartStore((s) => s.addItem)
  const router = useRouter()
  const [variantId, setVariantId] = useState(product.variants[0]?.id ?? "")
  const variant = product.variants.find((v) => v.id === variantId)
  const [quantity, setQuantity] = useState(1)
  const hasVariants = product.variants.length > 0
  const soldOut = product.stock <= 0 || (hasVariants && (!variant || variant.stock <= 0))
  const imageIsUrl = Boolean(product.image && /^https?:\/\//i.test(product.image))

  function addToCart() {
    if (soldOut) return
    if (variant && quantity > variant.stock) { toast.error(`المتاح ${variant.stock} قطعة فقط`); return }
    addItem({ storeSlug: store.slug, productId: product.id, variantId: variant?.id, name: product.name, price: product.price, size: variant?.size ?? "قياسي", color: variant?.color ?? "افتراضي", quantity, image: product.image })
    toast.success("تمت إضافة المنتج إلى السلة")
    router.push(`/${store.slug}/cart`)
  }

  return <div dir="rtl" className="min-h-screen bg-white text-slate-900" style={{ "--store-primary": store.themeColor } as CSSProperties}>
    <StoreHeader store={store} />
    <main className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-2 lg:gap-14 lg:py-14">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
        {imageIsUrl ? <img src={product.image} alt={product.name} className="aspect-square w-full object-cover" /> : <div className="flex aspect-square items-center justify-center text-7xl">{product.image || "📦"}</div>}
      </div>
      <section className="flex flex-col justify-center gap-5">
        <Link href={`/${store.slug}`} className="inline-flex w-fit items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900"><ArrowRight className="h-4 w-4" /> العودة للمتجر</Link>
        <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{product.category}</span>
        <h1 className="text-3xl font-black leading-tight sm:text-4xl">{product.name}</h1>
        <p className="text-2xl font-black" style={{ color: store.themeColor }}>{formatPrice(product.price)}</p>
        {product.description && <p className="whitespace-pre-wrap leading-8 text-slate-600">{product.description}</p>}
        <div className="rounded-2xl border border-slate-200 p-4">
          <div className="mb-3 flex items-center justify-between text-sm"><span className="font-bold">التوفر</span><span className={product.stock > 0 ? "font-bold text-emerald-700" : "font-bold text-rose-700"}>{product.stock > 0 ? `متاح (${product.stock})` : "نفد المخزون"}</span></div>
          {product.variants.length > 0 && <label className="block space-y-2 text-sm font-bold"><span>اختار المقاس واللون</span><select value={variantId} onChange={(e) => { setVariantId(e.target.value); setQuantity(1) }} className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-normal"><option value="">اختار المتغير</option>{product.variants.map((v) => <option key={v.id} value={v.id}>{v.size} · {v.color} · المتاح {v.stock}</option>)}</select></label>}
          <div className="mt-4 flex items-center justify-between"><span className="text-sm font-bold">الكمية</span><div className="flex items-center gap-3"><button type="button" aria-label="تقليل الكمية" onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="rounded-lg border p-2"><Minus className="h-4 w-4" /></button><span className="min-w-6 text-center font-black">{quantity}</span><button type="button" aria-label="زيادة الكمية" onClick={() => setQuantity((q) => Math.min(variant?.stock ?? product.stock, q + 1))} className="rounded-lg border p-2"><Plus className="h-4 w-4" /></button></div></div>
        </div>
        <button type="button" disabled={soldOut || (hasVariants && !variant)} onClick={addToCart} className="h-14 rounded-2xl px-6 font-black text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40" style={{ backgroundColor: store.themeColor }}>أضف إلى السلة</button>
      </section>
    </main>
  </div>
}

export function StoreCartPage({ store }: Props) {
  const allItems = useCartStore((s) => s.items)
  const items = allItems.filter((item) => item.storeSlug === store.slug || (!item.storeSlug && store.slug === "cairo-couture"))
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const removeItem = useCartStore((s) => s.removeItem)
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const deliveryFee = items.length === 0 || (store.freeAbove !== null && subtotal >= store.freeAbove) ? 0 : store.flatFee
  return <div dir="rtl" className="min-h-screen bg-white text-slate-900"><StoreHeader store={store} /><main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
    <h1 className="mb-6 text-2xl font-black">سلة المشتريات</h1>
    {items.length === 0 ? <div className="rounded-3xl border border-dashed border-slate-300 py-16 text-center"><ShoppingBag className="mx-auto mb-4 h-10 w-10 text-slate-400" /><h2 className="font-black">السلة فارغة</h2><p className="mt-2 text-sm text-slate-500">ابدأ بإضافة المنتجات التي أعجبتك.</p><Link href={`/${store.slug}`} className="mt-5 inline-flex rounded-xl px-5 py-3 text-sm font-bold text-white" style={{ backgroundColor: store.themeColor }}>تصفح المنتجات</Link></div> : <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-3">{items.map((item) => <article key={item.id} className="flex gap-4 rounded-2xl border border-slate-200 p-4">{item.image && /^https?:\/\//i.test(item.image) ? <img src={item.image} alt="" className="h-20 w-20 rounded-xl object-cover" /> : <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-slate-100 text-3xl">{item.image || "📦"}</div>}<div className="min-w-0 flex-1"><h2 className="font-bold">{item.name}</h2><p className="mt-1 text-xs text-slate-500">{item.size} · {item.color}</p><p className="mt-2 font-black" style={{ color: store.themeColor }}>{formatPrice(item.price)}</p><div className="mt-2 flex items-center gap-3"><button type="button" onClick={() => updateQuantity(item.id, item.quantity - 1)} aria-label={`تقليل كمية ${item.name}`} className="rounded-lg border p-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" ><Minus className="h-3 w-3" /></button><span className="min-w-6 text-center text-sm font-bold" aria-live="polite">{item.quantity}</span><button type="button" onClick={() => updateQuantity(item.id, item.quantity + 1)} aria-label={`زيادة كمية ${item.name}`} className="rounded-lg border p-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"><Plus className="h-3 w-3" /></button></div></div><button type="button" onClick={() => removeItem(item.id)} aria-label="حذف المنتج" className="h-fit rounded-lg p-2 text-rose-600 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button></article>)}</div>
      <aside className="h-fit rounded-2xl border border-slate-200 p-5"><h2 className="font-black">ملخص الطلب</h2><div className="mt-4 flex justify-between text-sm"><span className="text-slate-500">المجموع الفرعي</span><b>{formatPrice(subtotal)}</b></div><div className="mt-3 flex justify-between text-sm"><span className="flex items-center gap-1 text-slate-500"><Truck className="h-4 w-4" /> التوصيل</span><b>{deliveryFee === 0 ? "مجاني" : formatPrice(deliveryFee)}</b></div><div className="my-4 border-t" /><div className="flex justify-between font-black"><span>الإجمالي</span><span style={{ color: store.themeColor }}>{formatPrice(subtotal + deliveryFee)}</span></div><Link href={`/${store.slug}/checkout`} className="mt-5 flex h-12 items-center justify-center rounded-xl text-sm font-black text-white" style={{ backgroundColor: store.themeColor }}>إتمام الطلب</Link><Link href={`/${store.slug}`} className="mt-3 block text-center text-sm font-bold text-slate-500">متابعة التسوق</Link></aside>
    </div>}
  </main></div>
}

export function StoreCheckoutPage({ store }: Props) {
  const router = useRouter()
  const allItems = useCartStore((s) => s.items)
  const items = allItems.filter((item) => item.storeSlug === store.slug || (!item.storeSlug && store.slug === "cairo-couture"))
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const clearCart = useCartStore((s) => s.clearCart)
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [city, setCity] = useState("القاهرة")
  const [address, setAddress] = useState("")
  const [notes, setNotes] = useState("")
  const [honeypot, setHoneypot] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [confirmation, setConfirmation] = useState<{ orderNumber: string; total: number } | null>(null)
  const deliveryFee = items.length === 0 || (store.freeAbove !== null && subtotal >= store.freeAbove) ? 0 : store.deliveryType === "by_city" ? store.cityFees?.[city] ?? store.flatFee : store.flatFee
  const total = subtotal + deliveryFee

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (items.length === 0 || submitting) return
    setSubmitting(true)
    try {
      const result = await placeOrderAction({ storeSlug: store.slug, customerName: name, customerPhone: phone, customerCity: city, customerAddress: address, customerNotes: notes.trim() || undefined, items: items.map((item) => ({ productId: item.productId, variantId: item.variantId, size: item.size, color: item.color, quantity: item.quantity })), honeypot })
      if (!result.ok) { toast.error(result.error || "تعذر إرسال الطلب"); return }
      const orderNumber = result.orderNumber || ""
      const finalTotal = result.total ?? total
      clearCart(store.slug)
      setConfirmation({ orderNumber, total: finalTotal })
    } catch {
      toast.error("حدث خطأ غير متوقع. لم نتمكن من تأكيد الطلب.")
    } finally { setSubmitting(false) }
  }

  return <div dir="rtl" className="min-h-screen bg-white text-slate-900"><StoreHeader store={store} /><main className="mx-auto max-w-4xl px-4 py-8 sm:px-6"><h1 className="mb-6 text-2xl font-black">إتمام الطلب</h1>
    {confirmation ? <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-8 text-center"><CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" /><h2 className="mt-4 text-2xl font-black">تم إرسال طلبك بنجاح</h2><p className="mt-2 text-sm text-slate-600">رقم الطلب: <b>#{confirmation.orderNumber}</b></p><p className="mt-2 font-black">المبلغ عند الاستلام: {formatPrice(confirmation.total)}</p><p className="mt-3 text-xs leading-6 text-slate-500">احتفظ برقم الطلب للتواصل مع المتجر. عرض حالة الطلب إلكترونياً غير متاح حالياً.</p><Link href={`/${store.slug}`} className="mt-6 inline-flex rounded-xl px-5 py-3 text-sm font-bold text-white" style={{ backgroundColor: store.themeColor }}>العودة للمتجر</Link></section> : items.length === 0 ? <section className="rounded-3xl border border-dashed border-slate-300 py-16 text-center"><p className="font-black">لا توجد منتجات لإتمام الطلب</p><Link href={`/${store.slug}`} className="mt-4 inline-block font-bold underline">العودة للمتجر</Link></section> : <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_300px]"><div className="space-y-4 rounded-2xl border border-slate-200 p-5"><h2 className="font-black">بيانات التوصيل</h2><input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} placeholder="الاسم بالكامل" className="h-12 w-full rounded-xl border border-slate-300 px-3 text-sm" /><input value={phone} onChange={(e) => setPhone(e.target.value)} required type="tel" inputMode="tel" pattern="[0-9+()\- ]{8,20}" placeholder="رقم الموبايل" className="h-12 w-full rounded-xl border border-slate-300 px-3 text-left text-sm" dir="ltr" /><select value={city} onChange={(e) => setCity(e.target.value)} className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm"><option>القاهرة</option><option>الجيزة</option><option>الإسكندرية</option><option>القليوبية</option><option>الدقهلية</option><option>الشرقية</option><option>المنوفية</option><option>البحيرة</option><option>محافظة أخرى</option></select><textarea value={address} onChange={(e) => setAddress(e.target.value)} required minLength={8} placeholder="العنوان بالتفصيل" rows={3} className="w-full rounded-xl border border-slate-300 p-3 text-sm" /><textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="ملاحظات إضافية (اختياري)" rows={2} className="w-full rounded-xl border border-slate-300 p-3 text-sm" /><input aria-hidden="true" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} className="hidden" /><div className="rounded-xl bg-slate-50 p-4 text-sm font-bold">طريقة الدفع: نقداً عند الاستلام</div></div><aside className="h-fit rounded-2xl border border-slate-200 p-5"><h2 className="font-black">ملخص الطلب</h2>{items.map((item) => <div key={item.id} className="mt-3 flex justify-between gap-3 text-xs"><span>{item.name} × {item.quantity}</span><b>{formatPrice(item.price * item.quantity)}</b></div>)}<div className="my-4 border-t" /><div className="flex justify-between text-sm"><span>المجموع الفرعي</span><b>{formatPrice(subtotal)}</b></div><div className="mt-2 flex justify-between text-sm"><span>التوصيل</span><b>{deliveryFee === 0 ? "مجاني" : formatPrice(deliveryFee)}</b></div><div className="my-4 border-t" /><div className="flex justify-between font-black"><span>الإجمالي</span><span>{formatPrice(total)}</span></div><button disabled={submitting} className="mt-5 h-12 w-full rounded-xl text-sm font-black text-white disabled:opacity-50" style={{ backgroundColor: store.themeColor }}>{submitting ? "جارٍ إرسال الطلب..." : "تأكيد الطلب والدفع عند الاستلام"}</button><Link href={`/${store.slug}/cart`} className="mt-3 block text-center text-sm font-bold text-slate-500">العودة للسلة</Link></aside></form>}
  </main></div>
}

export function OrderTrackingUnavailable({ store, orderId }: { store: Store; orderId: string }) {
  return <div dir="rtl" className="min-h-screen bg-white text-center text-slate-900"><StoreHeader store={store} /><main className="px-4 py-16"><div className="mx-auto max-w-lg rounded-3xl border border-slate-200 p-8"><Truck className="mx-auto h-10 w-10 text-slate-400" /><h1 className="mt-4 text-2xl font-black">متابعة الطلب</h1><p className="mt-3 text-sm leading-7 text-slate-600">لا يمكن عرض حالة الطلب من هذه الصفحة حالياً؛ نظام المشروع لا يوفر واجهة عامة آمنة للتحقق من ملكية الطلب قبل عرض بياناته.</p><p className="mt-3 text-xs text-slate-500">المرجع المدخل: {orderId}</p><Link href={`/${store.slug}`} className="mt-6 inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white">العودة للمتجر</Link></div></main></div>
}
