"use client"

import React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  iconOnly?: boolean
  size?: "sm" | "md" | "lg" | "xl"
  withSlogan?: boolean
  href?: string
}

export function LogoIcon({ className, size = 32 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("transition-transform duration-200", className)}
    >
      {/* شنطة التسوق - الإطار الخارجي واليد */}
      {/* يد الشنطة (Handle) */}
      <path
        d="M36 32V24C36 17.37 41.37 12 48 12H52C58.63 12 64 17.37 64 24V32"
        stroke="currentColor"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* جسم الشنطة المنحني */}
      <path
        d="M22 34C22.6 30 25 28 29 28H71C75 28 77.4 30 78 34L86 80C86.8 84.5 83.5 88 79 88H21C16.5 88 13.2 84.5 14 80L22 34Z"
        stroke="currentColor"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* الحرف M المدمج مع اللوجو بلون التيراكوتا / البرتقالي المميز */}
      {/* الجناح الأيسر لـ M */}
      <path
        d="M30 76L46 48L50 56"
        stroke="currentColor"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* الجناح الأيمن لـ M باللون البرتقالي البارز #E8732A */}
      <path
        d="M50 56L54 48L70 76"
        stroke="#E8732A"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="50" cy="56" r="3" fill="#E8732A" />
    </svg>
  )
}

export function Logo({
  className,
  iconOnly = false,
  size = "md",
  withSlogan = false,
  href = "/",
}: LogoProps) {
  const sizeMap = {
    sm: { icon: 28, text: "text-lg", slogan: "text-[9px]" },
    md: { icon: 38, text: "text-2xl", slogan: "text-[11px]" },
    lg: { icon: 48, text: "text-3xl", slogan: "text-xs" },
    xl: { icon: 64, text: "text-5xl", slogan: "text-sm" },
  }

  const currentSize = sizeMap[size]

  const content = (
    <div className={cn("inline-flex items-center gap-2.5 select-none text-foreground group", className)}>
      {/* الأيقونة داخل كارت ناعم مثل الـ App Icon في الهوية */}
      <div className="relative flex items-center justify-center p-1.5 rounded-2xl bg-foreground/5 dark:bg-foreground/10 group-hover:scale-105 transition-all duration-300">
        <LogoIcon size={currentSize.icon} className="text-foreground" />
      </div>

      {!iconOnly && (
        <div className="flex flex-col text-right">
          <div className="flex items-baseline gap-1.5">
            <span className={cn("font-black tracking-tight text-foreground font-cairo", currentSize.text)}>
              مَتجَرَك
            </span>
            <span className="text-[10px] tracking-widest uppercase font-semibold text-primary/90 hidden sm:inline">
              Matgarak
            </span>
          </div>
          {withSlogan && (
            <span className={cn("text-muted-foreground font-medium font-cairo -mt-1", currentSize.slogan)}>
              من البراندات الصغيرة .. إلى بيتك
            </span>
          )}
        </div>
      )}
    </div>
  )

  if (href) {
    return <Link href={href} className="inline-block hover:opacity-95 transition-opacity">{content}</Link>
  }

  return content
}

