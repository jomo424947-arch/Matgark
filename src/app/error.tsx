"use client"

import React, { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { AlertCircle, RotateCcw, Home } from "lucide-react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Global Next.js Application Error:", error)
  }, [error])

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-6 text-center">
      <div className="max-w-md w-full bg-card p-8 rounded-3xl border border-border shadow-xl space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>

        <h1 className="text-xl font-black text-foreground">
          حدث خطأ غير متوقع
        </h1>

        <p className="text-xs text-muted-foreground leading-relaxed">
          نعتذر عن هذا الخطأ. يمكنك إعادة المحاولة الآن أو العودة للصفحة
          الرئيسية.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row gap-2.5 justify-center">
          <Button
            onClick={() => reset()}
            className="w-full sm:w-auto font-bold gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>إعادة المحاولة</span>
          </Button>

          <Link href="/">
            <Button
              variant="outline"
              className="w-full sm:w-auto font-bold gap-2"
            >
              <Home className="w-4 h-4" />
              <span>الرئيسية</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
