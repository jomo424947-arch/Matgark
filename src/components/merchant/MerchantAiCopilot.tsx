"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import Markdown from "react-markdown"
import {
  Bot,
  Send,
  Square,
  Sparkles,
  CheckCircle2,
  ArrowUpRight,
  Trash2,
  Package,
  ShoppingBag,
  Tag,
  AlertTriangle,
  Cpu,
  User,
} from "lucide-react"
import { toast } from "sonner"
import { useActiveMerchantStore } from "@/components/merchant/useActiveMerchantStore"
import { usePlatformStore } from "@/stores/platformStore"
import { useAuthStore } from "@/stores/authStore"
import { useI18n } from "@/components/providers/LanguageProvider"
import { computeStoreOrderMetrics, getStockLevelStatus } from "@/lib/commerce/engine"
import {
  buildStoreAiContext,
  executeAssistantAction,
  parseAssistantSseEvents,
  type ExecutedActionReceipt,
} from "@/lib/ai/assistantActions"

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  actions?: ExecutedActionReceipt[]
  streaming?: boolean
}

interface MerchantAiCopilotProps {
  mode?: "full" | "drawer"
}

export function MerchantAiCopilot({ mode = "full" }: MerchantAiCopilotProps) {
  const { locale, pick, formatCurrency } = useI18n()
  const merchantSession = useAuthStore((s) => s.merchantSession)
  const {
    store,
    storeProducts,
    storeCategories,
    storeOrders,
    storeDiscounts,
  } = useActiveMerchantStore()

  const createProduct = usePlatformStore((s) => s.createProduct)
  const updateProduct = usePlatformStore((s) => s.updateProduct)
  const adjustVariantStock = usePlatformStore((s) => s.adjustVariantStock)
  const createDiscount = usePlatformStore((s) => s.createDiscount)
  const updateDiscount = usePlatformStore((s) => s.updateDiscount)
  const updateOrderStatus = usePlatformStore((s) => s.updateOrderStatus)
  const updateStoreStatus = usePlatformStore((s) => s.updateStoreStatus)
  const updateStore = usePlatformStore((s) => s.updateStore)
  const updateDraftTheme = usePlatformStore((s) => s.updateDraftTheme)
  const applyThemePresetToDraft = usePlatformStore((s) => s.applyThemePresetToDraft)
  const publishStoreDesign = usePlatformStore((s) => s.publishStoreDesign)
  const createCategory = usePlatformStore((s) => s.createCategory)

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [streaming, setStreaming] = useState(false)
  const [engineStatus, setEngineStatus] = useState<{
    groqConfigured: boolean
    model: string
  }>({ groqConfigured: false, model: "llama-3.3-70b-versatile" })

  const abortRef = useRef<AbortController | null>(null)
  const scrollEndRef = useRef<HTMLDivElement | null>(null)
  const msgSeqRef = useRef(0)

  useEffect(() => {
    fetch("/api/merchant-assistant")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && typeof data.groqConfigured === "boolean") {
          setEngineStatus({
            groqConfigured: data.groqConfigured,
            model: data.model || "llama-3.3-70b-versatile",
          })
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const metrics = useMemo(() => computeStoreOrderMetrics(storeOrders), [storeOrders])
  const lowStockCount = useMemo(
    () =>
      storeProducts.filter((p) => {
        const st = getStockLevelStatus(p)
        return st === "low_stock" || st === "out_of_stock"
      }).length,
    [storeProducts]
  )

  if (!store) return null

  const storeName = pick(store.nameAr, store.nameEn)
  const currency = store.localization.currency

  const quickPrompts = [
    {
      ar: "اعرض ملخص مبيعات اليوم والمقاسات اللي قربت تخلص",
      en: "Show live sales summary & low-stock sizes",
    },
    {
      ar: "اعمل كود خصم CLUB20 بنسبة 20% لكل الملابس",
      en: "Create 20% promo code CLUB20 for all items",
    },
    {
      ar: "أضف منتج جديد: بليزر كتان بيج بسعر 1650 ومقاسات M, L, XL",
      en: "Add product Beige Linen Blazer price 1650 sizes M, L, XL",
    },
    {
      ar: "أكد أحدث طلب قيد الانتظار في المتجر",
      en: "Confirm the latest pending order",
    },
    {
      ar: "غيّر لون المتجر الأساسي إلى كحلي فاخر #1E293B",
      en: "Change primary store theme color to Navy #1E293B",
    },
  ]

  const stopStreaming = () => {
    abortRef.current?.abort()
    abortRef.current = null
    setStreaming(false)
    setMessages((prev) =>
      prev.map((m) => (m.streaming ? { ...m, streaming: false } : m))
    )
  }

  const sendMessage = async (rawText: string) => {
    const cleanText = rawText.trim()
    if (!cleanText || streaming) return

    msgSeqRef.current += 1
    const userMsg: ChatMessage = {
      id: `u-${msgSeqRef.current}`,
      role: "user",
      content: cleanText,
    }
    msgSeqRef.current += 1
    const assistantId = `a-${msgSeqRef.current}`
    const assistantPlaceholder: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      actions: [],
      streaming: true,
    }

    const nextHistory = [...messages, userMsg]
    setMessages([...nextHistory, assistantPlaceholder])
    setInput("")
    setStreaming(true)

    const controller = new AbortController()
    abortRef.current = controller

    const storeContext = buildStoreAiContext({
      store,
      products: storeProducts,
      categories: storeCategories,
      orders: storeOrders,
      discounts: storeDiscounts,
    })

    try {
      const response = await fetch("/api/merchant-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          locale,
          messages: nextHistory.slice(-12).map((m) => ({
            role: m.role,
            content: m.content,
          })),
          storeContext,
        }),
      })

      if (!response.ok || !response.body) {
        const errData = await response.json().catch(() => null)
        throw new Error(
          errData?.error ||
            pick(
              "تعذر الاتصال بالمساعد الذكي حالياً.",
              "Could not reach the AI Copilot right now."
            )
        )
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const { events, remainder } = parseAssistantSseEvents(buffer)
        buffer = remainder

        for (const ev of events) {
          if (ev.type === "token" && ev.delta) {
            const delta = ev.delta
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, content: m.content + delta } : m
              )
            )
          } else if (ev.type === "action" && ev.action) {
            const receipt = executeAssistantAction(ev.action, {
              store,
              categories: storeCategories,
              products: storeProducts,
              orders: storeOrders,
              discounts: storeDiscounts,
              actorName: merchantSession?.name || "AI Copilot",
              createProduct,
              updateProduct,
              adjustVariantStock,
              createDiscount,
              updateDiscount,
              updateOrderStatus,
              updateStoreStatus,
              updateStore,
              updateDraftTheme,
              applyThemePresetToDraft,
              publishStoreDesign,
              createCategory,
            })
            if (receipt) {
              toast.success(pick(receipt.titleAr, receipt.titleEn))
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, actions: [...(m.actions || []), receipt] }
                    : m
                )
              )
            }
          } else if (ev.type === "error" && ev.message) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: m.content || ev.message || "" }
                  : m
              )
            )
          }
        }
      }
    } catch (err) {
      if ((err as Error)?.name !== "AbortError") {
        const msg =
          err instanceof Error
            ? err.message
            : pick("حدث خطأ أثناء الاتصال بالمساعد.", "Assistant connection error.")
        toast.error(msg)
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: m.content || msg, streaming: false }
              : m
          )
        )
      }
    } finally {
      abortRef.current = null
      setStreaming(false)
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, streaming: false } : m))
      )
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    void sendMessage(input)
  }

  const chatPane = (
    <div
      className={`flex flex-col bg-card border border-border rounded-2xl overflow-hidden ${
        mode === "full" ? "h-[calc(100vh-11rem)] min-h-[560px]" : "h-full border-0 rounded-none"
      }`}
    >
      {/* Top Bar */}
      <div className="px-4 sm:px-5 py-3.5 border-b border-border flex items-center justify-between gap-3 bg-card">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-foreground truncate">
              {pick(`مساعد متجر ${storeName} الذكي`, `${storeName} AI Store Copilot`)}
            </h2>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 truncate">
              <Cpu className="w-3 h-3 text-primary shrink-0" />
              <span>
                {engineStatus.groqConfigured
                  ? `Python · Groq (${engineStatus.model})`
                  : pick(
                      "Python Engine · جاهز لمفتاح Groq API (استريمنج وتنفيذ فوري)",
                      "Python Engine · Groq API Ready (Live Streaming & Actions)"
                    )}
              </span>
            </p>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            type="button"
            onClick={() => {
              stopStreaming()
              setMessages([])
            }}
            title={pick("مسح المحادثة", "Clear conversation")}
            className="h-8 px-2.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-muted inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{pick("مسح", "Clear")}</span>
          </button>
        )}
      </div>

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col justify-center max-w-xl mx-auto py-4 space-y-6">
            <div className="space-y-2 text-center">
              <div className="w-12 h-12 rounded-2xl bg-primary/15 text-primary flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold tracking-tight text-foreground">
                {pick(
                  `أهلاً بك! تحكّم في ${storeName} بالكامل عبر المحادثة`,
                  `Control ${storeName} completely through conversation`
                )}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {pick(
                  "اسأل عن المبيعات والمقاسات الناقصة والطلبات، أو اطلب مني مباشرة إضافة منتجات، إنشاء أكواد خصم، تأكيد الطلبات، أو تغيير ألوان المتجر — بالعربية أو الإنجليزية.",
                  "Ask about sales, low-stock sizes, and orders, or command me directly to add products, create promo codes, update orders, or recolor your store — in Arabic or English."
                )}
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-2.5">
              {quickPrompts.slice(0, mode === "drawer" ? 4 : 5).map((q, idx) => {
                const promptText = pick(q.ar, q.en)
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => void sendMessage(promptText)}
                    className="text-start p-3 rounded-xl border border-border bg-background hover:border-primary/50 hover:bg-muted/50 transition-colors text-xs font-medium text-foreground leading-relaxed cursor-pointer"
                  >
                    {promptText}
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === "user"
            const hasArabic = /[\u0600-\u06FF]/.test(msg.content)
            const hasLatin = /[A-Za-z]/.test(msg.content)
            const msgDir: "rtl" | "ltr" = hasArabic
              ? "rtl"
              : hasLatin
                ? "ltr"
                : locale === "ar"
                  ? "rtl"
                  : "ltr"
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    isUser
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-primary border border-border"
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div
                  className={`max-w-[85%] space-y-2.5 ${
                    isUser ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    dir={msgDir}
                    className={`rounded-2xl px-4 py-3 text-sm leading-relaxed text-start ${
                      isUser
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/55 border border-border text-foreground"
                    }`}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <div className="space-y-2 [&_h3]:text-sm [&_h3]:font-bold [&_h3]:mb-1 [&_ul]:list-disc [&_ul]:ps-5 [&_ul]:space-y-1 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:bg-background [&_code]:border [&_code]:border-border [&_code]:font-mono [&_code]:text-xs [&_strong]:font-bold">
                        <Markdown>{msg.content || (msg.streaming ? "..." : "")}</Markdown>
                        {msg.streaming && (
                          <span className="inline-block w-2 h-4 bg-primary animate-pulse rounded-xs align-middle ms-1" />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Executed Live Store Action Receipts */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="space-y-2">
                      {msg.actions.map((act) => (
                        <div
                          key={act.id}
                          className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span className="font-semibold text-foreground truncate">
                              {pick(act.titleAr, act.titleEn)}
                            </span>
                          </div>
                          {act.href && (
                            <Link
                              href={act.href}
                              className="inline-flex items-center gap-1 font-semibold text-primary hover:underline shrink-0"
                            >
                              <span>{pick("عرض", "View")}</span>
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </Link>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
        <div ref={scrollEndRef} />
      </div>

      {/* Composer */}
      <form
        onSubmit={handleSubmit}
        className="p-3 sm:p-4 border-t border-border bg-card flex items-end gap-2.5"
      >
        <textarea
          rows={1}
          dir="auto"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              void sendMessage(input)
            }
          }}
          placeholder={pick(
            "اكتب سؤالك أو أمرك هنا (بالعربية أو الإنجليزية)...",
            "Ask about your store or command any action (Arabic or English)..."
          )}
          className="flex-1 min-h-[44px] max-h-32 resize-none rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
        {streaming ? (
          <button
            type="button"
            onClick={stopStreaming}
            className="h-11 px-4 rounded-xl bg-rose-600 text-white text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-rose-700 transition-colors cursor-pointer shrink-0"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>{pick("إيقاف", "Stop")}</span>
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim()}
            className="h-11 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-semibold inline-flex items-center gap-1.5 hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer shrink-0"
          >
            <Send className="w-4 h-4" />
            <span>{pick("إرسال", "Send")}</span>
          </button>
        )}
      </form>
    </div>
  )

  if (mode === "drawer") {
    return chatPane
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {pick("المساعد الذكي لإدارة المتجر (AI Copilot)", "AI Store Management Copilot")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {pick(
              "مدعوم بمحرك بايثون + Groq API مع استريمنج مباشر وتحكم كامل في المنتجات والطلبات والخصومات والتصميم.",
              "Powered by Python + Groq API with real-time streaming and full control over products, orders, discounts, and design."
            )}
          </p>
        </div>
        <Link
          href={`/s/${store.slug}`}
          className="h-9 px-3.5 rounded-xl border border-border bg-card text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-muted transition-colors"
        >
          <span>{pick("معاينة المتجر الحي", "View Live Store")}</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8">{chatPane}</div>

        {/* Live Store Telemetry Context Card */}
        <aside className="lg:col-span-4 space-y-4">
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold">
                {pick("البيانات المتصلة بالمساعد الآن", "Live Store Context")}
              </h2>
              <span className="text-[11px] font-mono text-primary font-semibold dir-ltr">
                /s/{store.slug}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-muted/50 border border-border">
                <p className="text-muted-foreground">{pick("المبيعات", "Sales")}</p>
                <p className="text-base font-bold tabular-nums mt-0.5">
                  {formatCurrency(metrics.totalSales, currency)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-muted/50 border border-border">
                <p className="text-muted-foreground flex items-center gap-1">
                  <ShoppingBag className="w-3 h-3 text-primary" />
                  <span>{pick("الطلبات", "Orders")}</span>
                </p>
                <p className="text-base font-bold tabular-nums mt-0.5">
                  {metrics.totalOrders} ({metrics.pendingCount} {pick("معلّق", "pending")})
                </p>
              </div>
              <div className="p-3 rounded-xl bg-muted/50 border border-border">
                <p className="text-muted-foreground flex items-center gap-1">
                  <Package className="w-3 h-3 text-primary" />
                  <span>{pick("المنتجات", "Products")}</span>
                </p>
                <p className="text-base font-bold tabular-nums mt-0.5">
                  {storeProducts.length}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-muted/50 border border-border">
                <p className="text-muted-foreground flex items-center gap-1">
                  <Tag className="w-3 h-3 text-primary" />
                  <span>{pick("أكواد الخصم", "Coupons")}</span>
                </p>
                <p className="text-base font-bold tabular-nums mt-0.5">
                  {storeDiscounts.filter((d) => d.active).length}
                </p>
              </div>
            </div>

            {lowStockCount > 0 && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300 font-medium">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>
                  {pick(
                    `يوجد ${lowStockCount} منتج بمخزون منخفض — اطلب من المساعد مراجعته`,
                    `${lowStockCount} low-stock item(s) — ask Copilot to review`
                  )}
                </span>
              </div>
            )}
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 space-y-2.5 text-xs">
            <h3 className="font-bold text-foreground">
              {pick("قدرات التحكم المباشر المتاحة", "Supported Live Control Actions")}
            </h3>
            <ul className="space-y-1.5 text-muted-foreground">
              <li>• {pick("إضافة منتجات ملابس جديدة بالمقاسات والألوان", "Add new clothing items with sizes & colors")}</li>
              <li>• {pick("تعديل الأسعار والمخزون لكل مقاس", "Update prices and per-size stock")}</li>
              <li>• {pick("إنشاء وتفعيل أو إيقاف أكواد الخصم", "Create, enable, or disable promo codes")}</li>
              <li>• {pick("تحديث حالات الطلبات (تأكيد / شحن / تسليم)", "Update order statuses (confirm / ship / deliver)")}</li>
              <li>• {pick("تغيير ألوان وقالب المتجر ونشره فوراً", "Update & publish store colors & templates")}</li>
              <li>• {pick("تعديل أسعار الشحن ونشر أو إيقاف المتجر", "Update shipping fees & store publish status")}</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}
