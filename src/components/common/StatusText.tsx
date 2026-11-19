"use client"

import React from "react"
import { cn } from "@/lib/utils"
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Truck,
  PackageCheck,
  RotateCcw,
} from "lucide-react"

export type SemanticTone =
  | "neutral"
  | "success"
  | "warning"
  | "danger"
  | "info"

interface StatusTextProps {
  tone: SemanticTone
  label: string
  icon?: "check" | "clock" | "warn" | "x" | "truck" | "box" | "return"
  className?: string
}

/**
 * Clean unboxed semantic status indicator: conveys state with both text and icon,
 * avoiding heavy rounded pill clutter.
 */
export function StatusText({ tone, label, icon, className }: StatusTextProps) {
  const toneClasses: Record<SemanticTone, string> = {
    neutral: "text-muted-foreground",
    success: "text-emerald-700 dark:text-emerald-400",
    warning: "text-amber-700 dark:text-amber-400",
    danger: "text-rose-700 dark:text-rose-400",
    info: "text-sky-700 dark:text-sky-400",
  }

  const IconComp =
    icon === "check"
      ? CheckCircle2
      : icon === "clock"
        ? Clock
        : icon === "warn"
          ? AlertTriangle
          : icon === "x"
            ? XCircle
            : icon === "truck"
              ? Truck
              : icon === "box"
                ? PackageCheck
                : icon === "return"
                  ? RotateCcw
                  : null

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap",
        toneClasses[tone],
        className
      )}
    >
      {IconComp && <IconComp className="w-3.5 h-3.5 shrink-0" />}
      <span>{label}</span>
    </span>
  )
}
