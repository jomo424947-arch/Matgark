"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Copy, Check, ExternalLink, Globe, Share2 } from "lucide-react"
import { toast } from "sonner"
import { useI18n } from "@/components/providers/LanguageProvider"

import { getPublicAppBaseUrl } from "@/lib/appUrl"

interface LiveStoreUrlCardProps {
  slug: string
  storeName: string
  status?: "published" | "draft" | "suspended"
  compact?: boolean
}

export function LiveStoreUrlCard({
  slug,
  storeName,
  status = "published",
  compact = false,
}: LiveStoreUrlCardProps) {
  const { pick } = useI18n()
  const [copied, setCopied] = useState(false)

  const origin =
    typeof window !== "undefined" ? window.location.origin : getPublicAppBaseUrl()
  const relativePath = `/s/${slug}`
  const fullUrl = origin ? `${origin}${relativePath}` : relativePath

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl)
      setCopied(true)
      toast.success(
        pick(
          "تم نسخ رابط متجرك بنجاح! شاركه الآن مع عملائك.",
          "Store URL copied! Share it with your customers."
        )
      )
      setTimeout(() => setCopied(false), 2200)
    } catch {
      toast.info(fullUrl)
    }
  }

  const whatsappShareHref = `https://wa.me/?text=${encodeURIComponent(
    pick(
      `تسوّق أحدث تشكيلة ملابس من ${storeName}: ${fullUrl}`,
      `Shop the latest clothing collection from ${storeName}: ${fullUrl}`
    )
  )}`

  return (
    <div
      className={`rounded-2xl border border-primary/35 bg-card ${
        compact ? "p-4" : "p-5"
      } flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-sm`}
    >
      <div className="flex items-start sm:items-center gap-3.5 min-w-0">
        <div className="w-11 h-11 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
          <Globe className="w-5 h-5" />
        </div>
        <div className="min-w-0 space-y-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-primary">
              {pick("رابط متجرك المباشر للعملاء", "Your Live Storefront URL")}
            </span>
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                status === "published"
                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                  : status === "suspended"
                    ? "bg-rose-500/15 text-rose-700 dark:text-rose-400"
                    : "bg-amber-500/15 text-amber-700 dark:text-amber-400"
              }`}
            >
              {status === "published"
                ? pick("منشور ومتاح للزوار", "Published Live")
                : status === "suspended"
                  ? pick("موقوف", "Suspended")
                  : pick("مسودة — جاهز للنشر", "Draft — Ready to Publish")}
            </span>
          </div>
          <Link
            href={relativePath}
            className="block text-sm sm:text-base font-mono font-bold text-foreground hover:text-primary transition-colors truncate dir-ltr text-start"
          >
            {fullUrl}
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={handleCopy}
          className="h-9 px-3.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold inline-flex items-center gap-1.5 hover:opacity-90 transition-opacity cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>{pick("تم النسخ", "Copied")}</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>{pick("نسخ الرابط", "Copy Link")}</span>
            </>
          )}
        </button>

        <Link
          href={relativePath}
          className="h-9 px-3.5 rounded-xl border border-border bg-background hover:bg-muted text-foreground text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>{pick("فتح المتجر", "Open Store")}</span>
        </Link>

        <a
          href={whatsappShareHref}
          target="_blank"
          rel="noopener noreferrer"
          className="h-9 px-3.5 rounded-xl border border-border bg-background hover:bg-muted text-foreground text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
        >
          <Share2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>{pick("مشاركة واتساب", "WhatsApp")}</span>
        </a>
      </div>
    </div>
  )
}
