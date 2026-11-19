"use client"

import React, { useState } from "react"
import { usePlatformStore } from "@/stores/platformStore"
import { useI18n } from "@/components/providers/LanguageProvider"
import { StatusText } from "@/components/common/StatusText"
import { Send, Megaphone } from "lucide-react"
import { toast } from "sonner"

export default function AdminSupportPage() {
  const { pick, t } = useI18n()
  const tickets = usePlatformStore((s) => s.tickets)
  const announcements = usePlatformStore((s) => s.announcements)
  const updateTicketStatus = usePlatformStore((s) => s.updateTicketStatus)
  const publishAnnouncement = usePlatformStore((s) => s.publishAnnouncement)

  const [selectedTicketId, setSelectedTicketId] = useState(tickets[0]?.id ?? "")
  const [replyText, setReplyText] = useState("")
  const [annTitleEn, setAnnTitleEn] = useState("")
  const [annTitleAr, setAnnTitleAr] = useState("")
  const [annBodyEn, setAnnBodyEn] = useState("")
  const [annBodyAr, setAnnBodyAr] = useState("")

  const activeTicket = tickets.find((tk) => tk.id === selectedTicketId) ?? tickets[0]

  const handleReply = (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeTicket || !replyText.trim()) return
    updateTicketStatus(activeTicket.id, "in_progress", replyText)
    setReplyText("")
    toast.success(pick("تم إرسال الرد للتاجر", "Reply sent to merchant"))
  }

  const handlePublishAnnouncement = (e: React.FormEvent) => {
    e.preventDefault()
    if (!annTitleEn.trim() && !annTitleAr.trim()) return
    publishAnnouncement({
      titleEn: annTitleEn.trim() || annTitleAr.trim(),
      titleAr: annTitleAr.trim() || annTitleEn.trim(),
      bodyEn: annBodyEn.trim() || annBodyAr.trim(),
      bodyAr: annBodyAr.trim() || annBodyEn.trim(),
      audience: "all_merchants",
    })
    setAnnTitleAr("")
    setAnnTitleEn("")
    setAnnBodyAr("")
    setAnnBodyEn("")
    toast.success(pick("تم نشر الإعلان لجميع التجار", "Platform announcement published"))
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          {t.admin.support}
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          {pick(
            "إدارة طلبات دعم التجار ونشر إعلانات المنصة الرسمية.",
            "Manage merchant support tickets, communication history, and platform-wide announcements."
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Ticket List */}
        <div className="lg:col-span-5 border border-border rounded-xl bg-card divide-y divide-border overflow-hidden">
          <div className="p-4 bg-muted/40 text-xs font-bold text-foreground">
            {pick("تذاكر دعم التجار", "Merchant Support Queue")} ({tickets.length})
          </div>
          {tickets.map((tk) => (
            <button
              key={tk.id}
              type="button"
              onClick={() => setSelectedTicketId(tk.id)}
              className={`w-full text-start p-4 space-y-1.5 transition-colors cursor-pointer ${
                activeTicket?.id === tk.id ? "bg-primary/5" : "hover:bg-muted/30"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-foreground truncate">{tk.storeName}</span>
                <StatusText
                  tone={
                    tk.status === "resolved"
                      ? "success"
                      : tk.status === "in_progress"
                        ? "info"
                        : "warning"
                  }
                  label={tk.status}
                />
              </div>
              <div className="text-xs text-foreground/90 line-clamp-1">{tk.subject}</div>
              <div className="text-[11px] text-muted-foreground">
                {tk.merchantName} · {tk.priority}
              </div>
            </button>
          ))}
        </div>

        {/* Ticket Thread */}
        <div className="lg:col-span-7 border border-border rounded-xl bg-card p-5 flex flex-col justify-between space-y-4">
          {activeTicket ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border">
                <div>
                  <h2 className="text-sm font-bold text-foreground">{activeTicket.subject}</h2>
                  <p className="text-xs text-muted-foreground">
                    {activeTicket.storeName} · {activeTicket.merchantName}
                  </p>
                </div>
                <select
                  aria-label="Ticket status"
                  value={activeTicket.status}
                  onChange={(e) => {
                    updateTicketStatus(
                      activeTicket.id,
                      e.target.value as "open" | "in_progress" | "resolved"
                    )
                    toast.success(pick("تم تحديث حالة التذكرة", "Ticket status updated"))
                  }}
                  className="h-9 px-3 rounded-lg border border-border bg-background text-xs font-semibold"
                >
                  <option value="open">open</option>
                  <option value="in_progress">in_progress</option>
                  <option value="resolved">resolved</option>
                </select>
              </div>

              <div className="space-y-3 max-h-72 overflow-y-auto py-2">
                {activeTicket.messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-lg text-xs max-w-[85%] ${
                      msg.sender === "admin"
                        ? "ms-auto bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    <div className="font-semibold mb-1 opacity-80">
                      {msg.sender === "admin" ? "Platform Support" : activeTicket.merchantName}
                    </div>
                    <p className="leading-relaxed">{msg.text}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleReply} className="flex gap-2 pt-3 border-t border-border">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={pick("اكتب رداً للتاجر...", "Write a response to merchant...")}
                  className="flex-1 h-10 px-3 rounded-lg border border-border bg-background text-xs"
                />
                <button
                  type="submit"
                  className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{pick("إرسال", "Send")}</span>
                </button>
              </form>
            </>
          ) : (
            <div className="text-xs text-muted-foreground">{t.common.noResults}</div>
          )}
        </div>
      </div>

      {/* Platform Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form
          onSubmit={handlePublishAnnouncement}
          className="lg:col-span-6 border border-border rounded-xl bg-card p-5 space-y-4 text-xs"
        >
          <div className="flex items-center gap-2 font-bold text-sm text-foreground">
            <Megaphone className="w-4 h-4 text-primary" />
            <span>{pick("نشر إعلان جديد للتجار", "Publish Platform Announcement")}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              value={annTitleAr}
              onChange={(e) => setAnnTitleAr(e.target.value)}
              placeholder={pick("عنوان الإعلان (عربي)", "Title (Arabic)")}
              className="h-9 px-3 rounded-lg border border-border bg-background"
            />
            <input
              value={annTitleEn}
              onChange={(e) => setAnnTitleEn(e.target.value)}
              placeholder={pick("عنوان الإعلان (إنجليزي)", "Title (English)")}
              className="h-9 px-3 rounded-lg border border-border bg-background"
            />
          </div>
          <textarea
            rows={3}
            value={annBodyEn}
            onChange={(e) => setAnnBodyEn(e.target.value)}
            placeholder={pick("محتوى الإعلان...", "Announcement message...")}
            className="w-full p-3 rounded-lg border border-border bg-background"
          />
          <button
            type="submit"
            className="h-9 px-4 rounded-lg bg-primary text-primary-foreground font-semibold cursor-pointer"
          >
            {pick("نشر الإعلان", "Broadcast Announcement")}
          </button>
        </form>

        <div className="lg:col-span-6 border border-border rounded-xl bg-card p-5 space-y-3">
          <h2 className="text-sm font-bold text-foreground">
            {pick("الإعلانات المنشورة", "Published Announcements")}
          </h2>
          <div className="divide-y divide-border">
            {announcements.map((a) => (
              <div key={a.id} className="py-3 first:pt-0 space-y-1">
                <div className="text-xs font-bold text-foreground">
                  {pick(a.titleAr, a.titleEn)}
                </div>
                <p className="text-xs text-muted-foreground">{pick(a.bodyAr, a.bodyEn)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
