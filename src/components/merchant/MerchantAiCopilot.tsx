"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
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
  Brain,
  Database,
  MessageSquarePlus,
  History,
  Plus,
  Users,
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
import { buildPublicStoreUrl } from "@/lib/appUrl"

interface MemorySavedBadge {
  id?: string
  key: string
  value: string
  category: string
}

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  actions?: ExecutedActionReceipt[]
  memoriesSaved?: MemorySavedBadge[]
  streaming?: boolean
}

interface ConversationSummary {
  id: string
  storeId: string
  title: string
  summary?: string
  createdAt: string
  updatedAt: string
}

interface LongTermMemoryItem {
  id: string
  storeId: string
  memoryKey: string
  memoryValue: string
  category: string
  importance: number
  updatedAt: string
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
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [memories, setMemories] = useState<LongTermMemoryItem[]>([])
  const [sidebarTab, setSidebarTab] = useState<"chats" | "memory" | "live">("chats")
  const [newMemoryText, setNewMemoryText] = useState("")
  const [savingMemory, setSavingMemory] = useState(false)

  const [input, setInput] = useState("")
  const [streaming, setStreaming] = useState(false)
  const [loadingInitial, setLoadingInitial] = useState(true)
  const [engineStatus, setEngineStatus] = useState<{
    groqConfigured: boolean
    dbConnected: boolean
    memoryBackend: string
    model: string
    dbStoreName?: string | null
    dbStoreSlug?: string | null
    dbSummary?: {
      productsCount: number
      ordersCount: number
      customersCount: number
      totalRevenue: number
      pendingOrders: number
    } | null
  }>({
    groqConfigured: false,
    dbConnected: false,
    memoryBackend: "memory_ephemeral",
    model: "qwen/qwen3.8-27b",
  })

  const abortRef = useRef<AbortController | null>(null)
  const scrollEndRef = useRef<HTMLDivElement | null>(null)
  const msgSeqRef = useRef(0)

  const mapServerMessages = useCallback(
    (
      rows: Array<{
        id: string
        role: "user" | "assistant"
        content: string
        actions?: Array<{
          id: string
          type: string
          titleAr: string
          titleEn: string
          href?: string
          dbPersisted?: boolean
        }>
        memoriesSaved?: MemorySavedBadge[]
      }>
    ): ChatMessage[] =>
      rows.map((r) => ({
        id: r.id,
        role: r.role,
        content: r.content,
        actions: (r.actions || []).map((a) => ({
          id: a.id,
          type: a.type as ExecutedActionReceipt["type"],
          ok: true,
          titleAr: a.titleAr,
          titleEn: a.titleEn,
          href: a.href,
          dbPersisted: a.dbPersisted,
        })),
        memoriesSaved: r.memoriesSaved || [],
      })),
    []
  )

  useEffect(() => {
    let cancelled = false
    fetch("/api/merchant-assistant", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data?.ok) return
        setEngineStatus({
          groqConfigured: Boolean(data.groqConfigured),
          dbConnected: Boolean(data.dbConnected),
          memoryBackend: data.memoryBackend || "memory_ephemeral",
          model: data.model || "qwen/qwen3.8-27b",
          dbStoreName: data.dbStoreName,
          dbStoreSlug: data.dbStoreSlug,
          dbSummary: data.dbSummary || null,
        })
        if (Array.isArray(data.conversations)) {
          setConversations(data.conversations)
        }
        if (Array.isArray(data.memories)) {
          setMemories(data.memories)
        }
        if (typeof data.activeConversationId === "string" || data.activeConversationId === null) {
          setActiveConversationId(data.activeConversationId)
        }
        if (Array.isArray(data.messages)) {
          setMessages(mapServerMessages(data.messages))
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingInitial(false)
      })
    return () => {
      cancelled = true
    }
  }, [mapServerMessages])

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
  const effectiveSlug = engineStatus.dbStoreSlug || store.slug
  const fullLiveUrl = buildPublicStoreUrl(effectiveSlug)

  const quickPrompts = [
    {
      ar: "اعرض ملخص مبيعات اليوم والمنتجات والعملاء من قاعدة البيانات",
      en: "Show live database summary of sales, products & customers",
    },
    {
      ar: "افتكر أن الشحن المجاني لعملاء VIP فوق 2000 ج.م وتركيزنا على مقاسات L و XL",
      en: "Remember that VIP free shipping is over 2000 EGP and our focus is sizes L & XL",
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
      ar: "إنت فاكر إيه عن تفضيلات متجري وقواعد الشغل؟",
      en: "What do you remember about my store preferences & rules?",
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

  const handleStartNewChat = async () => {
    stopStreaming()
    setActiveConversationId(null)
    setMessages([])
    try {
      const res = await fetch("/api/merchant-assistant/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_conversation",
          title: pick("محادثة جديدة", "New Conversation"),
        }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data?.conversation) {
          setActiveConversationId(data.conversation.id)
          setConversations((prev) => [data.conversation, ...prev])
        }
      }
    } catch {
      // Starting fresh conversation lazily on first message
    }
  }

  const handleSelectConversation = async (convId: string) => {
    if (convId === activeConversationId || streaming) return
    setActiveConversationId(convId)
    try {
      const res = await fetch(
        `/api/merchant-assistant/memory?conversationId=${encodeURIComponent(convId)}`,
        { cache: "no-store" }
      )
      if (res.ok) {
        const data = await res.json()
        setMessages(mapServerMessages(data.messages || []))
      }
    } catch {
      toast.error(pick("تعذر تحميل المحادثة.", "Failed to load conversation."))
    }
  }

  const handleDeleteConversation = async (convId: string) => {
    try {
      await fetch("/api/merchant-assistant/memory", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: "conversation", id: convId }),
      })
      setConversations((prev) => prev.filter((c) => c.id !== convId))
      if (activeConversationId === convId) {
        setActiveConversationId(null)
        setMessages([])
      }
      toast.success(pick("تم حذف المحادثة", "Conversation deleted"))
    } catch {
      toast.error(pick("تعذر حذف المحادثة", "Could not delete conversation"))
    }
  }

  const handleAddManualMemory = async (e: React.FormEvent) => {
    e.preventDefault()
    const clean = newMemoryText.trim()
    if (clean.length < 3 || savingMemory) return
    setSavingMemory(true)
    try {
      const key = `rule_${Date.now().toString(36)}`
      const res = await fetch("/api/merchant-assistant/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_memory",
          key,
          value: clean,
          category: "preference",
          importance: 5,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data?.memory) {
          setMemories((prev) => [data.memory, ...prev])
          setNewMemoryText("")
          toast.success(pick("تم الحفظ في ذاكرة Supabase الدائمة", "Saved to Supabase memory"))
        }
      }
    } finally {
      setSavingMemory(false)
    }
  }

  const handleDeleteMemory = async (memId: string) => {
    try {
      await fetch("/api/merchant-assistant/memory", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: "memory", id: memId }),
      })
      setMemories((prev) => prev.filter((m) => m.id !== memId))
      toast.success(pick("تم حذف المعلومة من الذاكرة", "Memory removed"))
    } catch {
      toast.error(pick("تعذر حذف المعلومة", "Failed to remove memory"))
    }
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
      memoriesSaved: [],
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

    let resolvedConvId = activeConversationId

    try {
      const response = await fetch("/api/merchant-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          conversationId: activeConversationId || undefined,
          locale,
          messages: nextHistory.slice(-16).map((m) => ({
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
          if (ev.type === "conversation" && ev.conversationId) {
            resolvedConvId = ev.conversationId
            setActiveConversationId(ev.conversationId)
            if (typeof ev.dbConnected === "boolean") {
              setEngineStatus((prev) => ({
                ...prev,
                dbConnected: ev.dbConnected ?? prev.dbConnected,
                memoryBackend: ev.memoryBackend || prev.memoryBackend,
              }))
            }
          } else if (ev.type === "meta" && ev.model) {
            setEngineStatus((prev) => ({
              ...prev,
              model: ev.model || prev.model,
            }))
          } else if (ev.type === "token" && ev.delta) {
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
              const enrichedReceipt: ExecutedActionReceipt = {
                ...receipt,
                dbPersisted: Boolean(ev.dbPersisted),
                titleAr: ev.dbDetailAr || receipt.titleAr,
                titleEn: ev.dbDetailEn || receipt.titleEn,
              }
              toast.success(pick(enrichedReceipt.titleAr, enrichedReceipt.titleEn))
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, actions: [...(m.actions || []), enrichedReceipt] }
                    : m
                )
              )
            }
          } else if (ev.type === "memory" && ev.memory) {
            const mem = ev.memory
            toast.success(
              pick(
                `تم الحفظ في ذاكرة المتجر: ${mem.value.slice(0, 60)}`,
                `Saved to store memory: ${mem.value.slice(0, 60)}`
              )
            )
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, memoriesSaved: [...(m.memoriesSaved || []), mem] }
                  : m
              )
            )
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

      // Sync fresh conversation list, long-term memories & live DB metrics from Supabase
      try {
        const syncRes = await fetch(
          `/api/merchant-assistant${resolvedConvId ? `?conversationId=${encodeURIComponent(resolvedConvId)}` : ""}`,
          { cache: "no-store" }
        )
        if (syncRes.ok) {
          const syncData = await syncRes.json()
          if (Array.isArray(syncData.conversations)) setConversations(syncData.conversations)
          if (Array.isArray(syncData.memories)) setMemories(syncData.memories)
          if (syncData.dbSummary) {
            setEngineStatus((prev) => ({ ...prev, dbSummary: syncData.dbSummary }))
          }
        }
      } catch {
        // Non-blocking
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
        mode === "full" ? "h-[calc(100vh-11rem)] min-h-[580px]" : "h-full border-0 rounded-none"
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
            <p className="text-[11px] text-muted-foreground flex flex-wrap items-center gap-1.5 truncate">
              <Cpu className="w-3 h-3 text-primary shrink-0" />
              <span>
                {engineStatus.groqConfigured
                  ? `Python · Groq (${engineStatus.model})`
                  : pick(
                      "Python Engine · استريمنج وتنفيذ فوري",
                      "Python Engine · Live Streaming & Actions"
                    )}
              </span>
              {engineStatus.dbConnected && (
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                  · <Database className="w-3 h-3" /> Supabase DB
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => void handleStartNewChat()}
            title={pick("محادثة جديدة (مع الاحتفاظ بذاكرة المتجر)", "New chat (keeps long-term memory)")}
            className="h-8 px-2.5 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-muted inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <MessageSquarePlus className="w-3.5 h-3.5 text-primary" />
            <span className="hidden sm:inline">{pick("محادثة جديدة", "New Chat")}</span>
          </button>
        </div>
      </div>

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
        {loadingInitial ? (
          <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
            {pick("جاري مزامنة المحادثات والذاكرة من Supabase...", "Syncing chats & memory from Supabase...")}
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col justify-center max-w-xl mx-auto py-4 space-y-6">
            <div className="space-y-2 text-center">
              <div className="w-12 h-12 rounded-2xl bg-primary/15 text-primary flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold tracking-tight text-foreground">
                {pick(
                  `أهلاً بك! تحكّم في ${storeName} بالكامل بذاكرة دائمة`,
                  `Control ${storeName} with live DB & persistent memory`
                )}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {pick(
                  "متصل مباشرة بقاعدة بيانات Supabase الخاصة بمتجرك، ويحفظ محادثاتك وتفضيلاتك تلقائياً ليتذكرها في نفس الشات وفي أي شات جديد لاحقاً — بالعربية أو الإنجليزية.",
                  "Connected directly to your store's Supabase database with automatic intra-chat and cross-chat memory — in Arabic or English."
                )}
              </p>
              {memories.length > 0 && (
                <p className="text-xs font-semibold text-primary inline-flex items-center gap-1.5 justify-center">
                  <Brain className="w-3.5 h-3.5" />
                  <span>
                    {pick(
                      `الذاكرة النشطة الآن: ${memories.length} معلومة محفوظة لمتجرك عبر كل المحادثات`,
                      `Active cross-chat memory: ${memories.length} saved facts for your store`
                    )}
                  </span>
                </p>
              )}
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

                  {/* Persistent Memory Saved Badges */}
                  {msg.memoriesSaved && msg.memoriesSaved.length > 0 && (
                    <div className="space-y-1.5">
                      {msg.memoriesSaved.map((mem, idx) => (
                        <div
                          key={`${mem.key}-${idx}`}
                          className="rounded-xl border border-primary/35 bg-primary/10 px-3.5 py-2 flex items-center gap-2 text-xs"
                        >
                          <Brain className="w-4 h-4 text-primary shrink-0" />
                          <span className="font-semibold text-foreground">
                            {pick("تم الحفظ في ذاكرة Supabase الدائمة:", "Saved to Supabase Memory:")}
                          </span>
                          <span className="text-muted-foreground truncate">{mem.value}</span>
                        </div>
                      ))}
                    </div>
                  )}

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
                            {act.dbPersisted && (
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 shrink-0">
                                Supabase DB
                              </span>
                            )}
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
            "اكتب سؤالك أو أمرك هنا، أو قل «افتكر أن...» لحفظه في الذاكرة الدائمة...",
            "Ask about your store, command any DB action, or say 'Remember that...'..."
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
              "متصل مباشرة بـ Groq API وقاعدة بيانات Supabase الخاصة بمتجرك مع ذاكرة دائمة داخل نفس الشات وبين كل المحادثات.",
              "Connected live to Groq API and your store's Supabase database with intra-chat and cross-chat persistent memory."
            )}
          </p>
        </div>
        <Link
          href={`/s/${effectiveSlug}`}
          className="h-9 px-3.5 rounded-xl border border-border bg-card text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-muted transition-colors"
        >
          <span>{pick("معاينة المتجر الحي", "View Live Store")}</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8">{chatPane}</div>

        {/* Right/End Panel: Multi-Chat History + Long-Term Supabase Memory + Live DB Stats */}
        <aside className="lg:col-span-4 space-y-4">
          {/* Switchable Tabs */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="grid grid-cols-3 border-b border-border text-xs font-semibold">
              <button
                type="button"
                onClick={() => setSidebarTab("chats")}
                className={`py-3 flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  sidebarTab === "chats"
                    ? "bg-primary/10 text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>{pick("المحادثات", "Chats")}</span>
                <span className="text-[10px] opacity-75">({conversations.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setSidebarTab("memory")}
                className={`py-3 flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  sidebarTab === "memory"
                    ? "bg-primary/10 text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Brain className="w-3.5 h-3.5" />
                <span>{pick("الذاكرة", "Memory")}</span>
                <span className="text-[10px] opacity-75">({memories.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setSidebarTab("live")}
                className={`py-3 flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  sidebarTab === "live"
                    ? "bg-primary/10 text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                <span>{pick("البيانات", "Live DB")}</span>
              </button>
            </div>

            <div className="p-4 max-h-[420px] overflow-y-auto">
              {sidebarTab === "chats" && (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => void handleStartNewChat()}
                    className="w-full h-9 rounded-xl bg-primary text-primary-foreground text-xs font-semibold inline-flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity cursor-pointer"
                  >
                    <MessageSquarePlus className="w-3.5 h-3.5" />
                    <span>{pick("بدء محادثة جديدة", "Start New Conversation")}</span>
                  </button>

                  {conversations.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-6">
                      {pick(
                        "ستظهر جميع محادثاتك المحفوظة في Supabase هنا للرجوع إليها في أي وقت.",
                        "Your Supabase-saved conversations will appear here."
                      )}
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {conversations.map((conv) => {
                        const active = conv.id === activeConversationId
                        return (
                          <div
                            key={conv.id}
                            className={`group flex items-center justify-between gap-2 p-2.5 rounded-xl border text-xs transition-colors ${
                              active
                                ? "bg-primary/10 border-primary/40 text-foreground"
                                : "bg-background border-border hover:bg-muted/50 text-foreground"
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => void handleSelectConversation(conv.id)}
                              className="flex-1 text-start min-w-0 cursor-pointer"
                            >
                              <p className="font-semibold truncate">{conv.title}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                {new Date(conv.updatedAt).toLocaleDateString(
                                  locale === "ar" ? "ar-EG" : "en-US",
                                  { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }
                                )}
                              </p>
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDeleteConversation(conv.id)}
                              aria-label={pick("حذف المحادثة", "Delete conversation")}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {sidebarTab === "memory" && (
                <div className="space-y-3">
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {pick(
                      "يحتفظ المساعد بهذه المعلومات في Supabase ويتذكرها تلقائياً داخل كل المحادثات الجديدة والقديمة.",
                      "Stored persistently in Supabase and automatically recalled across all new and existing chats."
                    )}
                  </p>

                  <form onSubmit={handleAddManualMemory} className="flex gap-1.5">
                    <input
                      type="text"
                      value={newMemoryText}
                      onChange={(e) => setNewMemoryText(e.target.value)}
                      placeholder={pick("أضف قاعدة أو معلومة للذاكرة...", "Add a store memory rule...")}
                      className="flex-1 h-9 rounded-lg border border-input bg-background px-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <button
                      type="submit"
                      disabled={savingMemory || newMemoryText.trim().length < 3}
                      className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold inline-flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </form>

                  {memories.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-5">
                      {pick(
                        "لا توجد ذكريات محفوظة بعد — اكتب للمساعد «افتكر أن...» أو أضف قاعدة أعلاه.",
                        "No long-term memories yet — tell Copilot 'Remember that...' or add one above."
                      )}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {memories.map((mem) => (
                        <div
                          key={mem.id}
                          className="p-2.5 rounded-xl border border-border bg-background flex items-start justify-between gap-2 text-xs"
                        >
                          <div className="min-w-0 space-y-0.5">
                            <span className="inline-block text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold">
                              {mem.category}
                            </span>
                            <p className="text-foreground leading-relaxed break-words">
                              {mem.memoryValue}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => void handleDeleteMemory(mem.id)}
                            aria-label={pick("حذف الذاكرة", "Delete memory")}
                            className="p-1 rounded-md text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 cursor-pointer shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {sidebarTab === "live" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground">
                      {pick("حالة قاعدة البيانات", "Database Status")}
                    </span>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                        engineStatus.dbConnected
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                          : "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                      }`}
                    >
                      {engineStatus.dbConnected
                        ? pick("متصل بـ Supabase", "Supabase Live")
                        : pick("محلي", "Local")}
                    </span>
                  </div>

                  <p className="text-[11px] font-mono text-primary bg-muted/50 px-2.5 py-1.5 rounded-lg truncate dir-ltr text-start">
                    {fullLiveUrl}
                  </p>

                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    <div className="p-2.5 rounded-xl bg-muted/50 border border-border">
                      <p className="text-muted-foreground">{pick("المبيعات", "Sales")}</p>
                      <p className="text-sm font-bold tabular-nums mt-0.5">
                        {formatCurrency(
                          engineStatus.dbSummary?.ordersCount
                            ? engineStatus.dbSummary.totalRevenue
                            : metrics.totalSales,
                          currency
                        )}
                      </p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-muted/50 border border-border">
                      <p className="text-muted-foreground flex items-center gap-1">
                        <ShoppingBag className="w-3 h-3 text-primary" />
                        <span>{pick("الطلبات", "Orders")}</span>
                      </p>
                      <p className="text-sm font-bold tabular-nums mt-0.5">
                        {engineStatus.dbSummary?.ordersCount || metrics.totalOrders}
                      </p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-muted/50 border border-border">
                      <p className="text-muted-foreground flex items-center gap-1">
                        <Package className="w-3 h-3 text-primary" />
                        <span>{pick("المنتجات", "Products")}</span>
                      </p>
                      <p className="text-sm font-bold tabular-nums mt-0.5">
                        {engineStatus.dbSummary?.productsCount || storeProducts.length}
                      </p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-muted/50 border border-border">
                      <p className="text-muted-foreground flex items-center gap-1">
                        <Users className="w-3 h-3 text-primary" />
                        <span>{pick("العملاء", "Customers")}</span>
                      </p>
                      <p className="text-sm font-bold tabular-nums mt-0.5">
                        {engineStatus.dbSummary?.customersCount ?? 0}
                      </p>
                    </div>
                  </div>

                  {lowStockCount > 0 && (
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300 font-medium">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>
                        {pick(
                          `يوجد ${lowStockCount} منتج بمخزون منخفض`,
                          `${lowStockCount} low-stock item(s)`
                        )}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Compact Store Telemetry Summary */}
          <div className="bg-card border border-border rounded-2xl p-4 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-foreground flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-primary" />
                <span>{pick("قدرات التحكم المباشر + الذاكرة", "Live DB Control & Memory")}</span>
              </h3>
            </div>
            <ul className="space-y-1 text-muted-foreground text-[11px]">
              <li>• {pick("اتصال مباشر بقاعدة بيانات Supabase لمتجرك فقط (عزل كامل)", "Direct isolated Supabase DB access for your store only")}</li>
              <li>• {pick("ذاكرة داخل نفس المحادثة + ذاكرة دائمة بين كل المحادثات", "Intra-chat & cross-chat persistent memory in Supabase")}</li>
              <li>• {pick("إضافة وتعديل المنتجات والأسعار والمخزون والطلبات مباشرة", "Direct DB mutations for products, stock, prices & orders")}</li>
              <li>• {pick("استريمنج مباشر عبر بايثون + Groq بالعربية والإنجليزية", "Real-time Python + Groq streaming in Arabic & English")}</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}
