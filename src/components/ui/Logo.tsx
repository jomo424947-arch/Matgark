"use client"

import React from "react"
import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"

export const MATGARAK_LOGO_SRC = "/images/matgarak-bag-logo.png"

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

const BAG_SIZE_MAP = {
  xs: { box: "h-7 w-7", sizes: "56px" },
  sm: { box: "h-8 w-8", sizes: "64px" },
  md: { box: "h-10 w-10", sizes: "80px" },
  lg: { box: "h-12 w-12", sizes: "96px" },
  xl: { box: "h-16 w-16", sizes: "128px" },
}

export function LogoIcon({
  className,
  size = 36,
}: {
  className?: string
  size?: number
}) {
  return (
    <span
      style={{ width: size, height: size }}
      className={cn(
        "relative inline-flex items-center justify-center shrink-0 select-none",
        className
      )}
    >
      <Image
        src={MATGARAK_LOGO_SRC}
        alt="متجرك — Matgarak"
        fill
        sizes={`${size * 2}px`}
        referrerPolicy="no-referrer"
        className="object-contain"
      />
    </span>
  )
}

export function Logo({
  className,
  size = "md",
  withSlogan = false,
  href = "/",
  surface = "auto",
  priority = false,
}: LogoProps) {
  const dims = BAG_SIZE_MAP[size]

  const darkAccentFrame =
    surface === "dark"
      ? "rounded-xl p-1 bg-[#FAF6F1]/[0.07] ring-1 ring-[#D9B58C]/25"
      : "dark:rounded-xl dark:p-0.5 dark:bg-[#FAF6F1]/[0.06] dark:ring-1 dark:ring-[#D9B58C]/20"

  const content = (
    <div
      className={cn(
        "inline-flex items-center gap-2.5 select-none group shrink-0",
        className
      )}
    >
      <span
        className={cn(
          "relative inline-flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-[1.04]",
          dims.box,
          darkAccentFrame
        )}
      >
        <Image
          src={MATGARAK_LOGO_SRC}
          alt="متجرك — Matgarak"
          fill
          priority={priority}
          sizes={dims.sizes}
          referrerPolicy="no-referrer"
          className="object-contain drop-shadow-[0_1px_2px_rgba(61,38,22,0.12)]"
        />
      </span>

      {withSlogan && (
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
        className="inline-flex items-center hover:opacity-95 transition-opacity shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-xl"
      >
        {content}
      </Link>
    )
  }

  return content
}
