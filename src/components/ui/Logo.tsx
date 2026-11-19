"use client"

import React from "react"
import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"

export const MATGARAK_LOGO_SRC =
  "/assets/aistudio/1C267C07-7500-4591-A387-7508834DCD4F_5711fd30.png"

interface LogoProps {
  className?: string
  iconOnly?: boolean
  size?: "xs" | "sm" | "md" | "lg" | "xl"
  withSlogan?: boolean
  href?: string
  /** Use "dark" when rendered on an always-dark surface (e.g. Admin sidebar/login). */
  surface?: "auto" | "dark"
  priority?: boolean
}

const FULL_SIZE_MAP = {
  xs: { box: "h-7 w-[78px]", sizes: "80px" },
  sm: { box: "h-8 w-[92px]", sizes: "96px" },
  md: { box: "h-10 w-[114px]", sizes: "120px" },
  lg: { box: "h-12 w-[138px]", sizes: "144px" },
  xl: { box: "h-16 w-[184px]", sizes: "192px" },
}

const ICON_SIZE_MAP = {
  xs: { box: "h-7 w-7", sizes: "64px" },
  sm: { box: "h-8 w-8", sizes: "72px" },
  md: { box: "h-10 w-10", sizes: "88px" },
  lg: { box: "h-12 w-12", sizes: "104px" },
  xl: { box: "h-16 w-16", sizes: "140px" },
}

export function LogoIcon({
  className,
  size = 32,
}: {
  className?: string
  size?: number
}) {
  return (
    <span
      style={{ width: size, height: size }}
      className={cn(
        "relative inline-block overflow-hidden rounded-lg shrink-0 bg-[#FEFCFA]",
        className
      )}
    >
      <Image
        src={MATGARAK_LOGO_SRC}
        alt="Matgarak — متجرك"
        fill
        sizes={`${size * 2}px`}
        referrerPolicy="no-referrer"
        className="object-cover object-left scale-[1.15] mix-blend-multiply"
      />
    </span>
  )
}

export function Logo({
  className,
  iconOnly = false,
  size = "md",
  withSlogan = false,
  href = "/",
  surface = "auto",
  priority = false,
}: LogoProps) {
  const dims = iconOnly ? ICON_SIZE_MAP[size] : FULL_SIZE_MAP[size]

  const frameClasses =
    surface === "dark"
      ? "bg-[#FAF6F1] px-2.5 py-1 rounded-xl border border-[#D9B58C]/30 shadow-sm"
      : "dark:bg-[#FAF6F1] dark:px-2.5 dark:py-1 dark:rounded-xl dark:border dark:border-[#D9B58C]/25 dark:shadow-sm"

  const content = (
    <div
      className={cn(
        "inline-flex items-center gap-2.5 select-none group shrink-0",
        className
      )}
    >
      <div
        className={cn(
          "inline-flex items-center justify-center transition-transform duration-200 group-hover:scale-[1.02]",
          frameClasses
        )}
      >
        <span className={cn("relative block overflow-hidden", dims.box)}>
          <Image
            src={MATGARAK_LOGO_SRC}
            alt="متجرك — Matgarak"
            fill
            priority={priority}
            sizes={dims.sizes}
            referrerPolicy="no-referrer"
            className={cn(
              "object-cover mix-blend-multiply",
              iconOnly
                ? "object-left scale-[1.16]"
                : "object-center scale-[1.08]"
            )}
          />
        </span>
      </div>

      {withSlogan && !iconOnly && (
        <span className="hidden sm:inline text-xs font-medium text-muted-foreground border-s border-border ps-2.5">
          من البراندات الصغيرة .. إلى بيتك
        </span>
      )}
    </div>
  )

  if (href) {
    return (
      <Link
        href={href}
        aria-label="متجرك — Matgarak"
        className="inline-flex items-center hover:opacity-95 transition-opacity shrink-0"
      >
        {content}
      </Link>
    )
  }

  return content
}
