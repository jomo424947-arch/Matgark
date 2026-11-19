"use client"

import React from "react"
import type { CatalogProduct } from "@/types/saas"
import { cn } from "@/lib/utils"

interface ProductVisualProps {
  type: CatalogProduct["visualType"]
  palette?: [string, string]
  toneOverride?: string
  className?: string
  label?: string
}

/**
 * Curated architectural studio product artwork rendered with crisp vector geometry
 * so every product and gallery thumbnail stays sharp and resilient with zero broken external images.
 */
export function ProductVisual({
  type,
  palette = ["#18181B", "#52525B"],
  toneOverride,
  className,
  label,
}: ProductVisualProps) {
  const primary = toneOverride || palette[0]
  const secondary = palette[1]

  return (
    <div
      className={cn(
        "relative w-full h-full flex items-center justify-center overflow-hidden select-none",
        className
      )}
      style={{
        background: `radial-gradient(circle at 30% 20%, ${secondary}18 0%, ${primary}0A 65%, transparent 100%), linear-gradient(160deg, #F6F5F2 0%, #ECEAE4 100%)`,
      }}
      role="img"
      aria-label={label || type}
    >
      {/* Subtle studio pedestal floor shadow */}
      <div
        className="absolute bottom-[14%] w-1/2 h-3 rounded-full blur-md opacity-25"
        style={{ backgroundColor: primary }}
      />

      <svg
        viewBox="0 0 200 200"
        className="w-[70%] h-[70%] drop-shadow-sm transition-transform duration-300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {type === "hoodie" && (
          <g>
            <path
              d="M68 42C68 30 82 22 100 22C118 22 132 30 132 42L140 54L168 72L156 154L138 150L138 168H62V150L44 154L32 72L60 54L68 42Z"
              fill={primary}
            />
            <path
              d="M78 44C84 54 116 54 122 44"
              stroke="#FFFFFF"
              strokeOpacity="0.35"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path
              d="M74 116H126L130 144H70L74 116Z"
              fill="#FFFFFF"
              fillOpacity="0.12"
            />
            <line x1="92" y1="54" x2="90" y2="82" stroke="#FFFFFF" strokeOpacity="0.55" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="108" y1="54" x2="110" y2="82" stroke="#FFFFFF" strokeOpacity="0.55" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        )}

        {type === "coat" && (
          <g>
            <path
              d="M65 36L100 28L135 36L164 68L152 156L134 152L134 176H66V152L48 156L36 68L65 36Z"
              fill={primary}
            />
            <path d="M84 32L100 84L116 32" fill="#FFFFFF" fillOpacity="0.16" />
            <line x1="100" y1="84" x2="100" y2="176" stroke="#FFFFFF" strokeOpacity="0.25" strokeWidth="2" />
            <circle cx="92" cy="100" r="3" fill="#FFFFFF" fillOpacity="0.55" />
            <circle cx="92" cy="122" r="3" fill="#FFFFFF" fillOpacity="0.55" />
            <circle cx="108" cy="100" r="3" fill="#FFFFFF" fillOpacity="0.55" />
            <circle cx="108" cy="122" r="3" fill="#FFFFFF" fillOpacity="0.55" />
          </g>
        )}

        {type === "trousers" && (
          <g>
            <path
              d="M62 34H138L146 174H110L100 88L90 174H54L62 34Z"
              fill={primary}
            />
            <rect x="62" y="34" width="76" height="12" fill={secondary} fillOpacity="0.5" />
            <line x1="80" y1="50" x2="76" y2="164" stroke="#FFFFFF" strokeOpacity="0.22" strokeWidth="2" />
            <line x1="120" y1="50" x2="124" y2="164" stroke="#FFFFFF" strokeOpacity="0.22" strokeWidth="2" />
          </g>
        )}

        {(type === "tshirt" || type === "dress") && (
          <g>
            <path
              d={
                type === "dress"
                  ? "M74 36L100 44L126 36L146 66L130 78L146 172H54L70 78L54 66L74 36Z"
                  : "M68 42C80 54 120 54 132 42L166 66L150 96L134 86V166H66V86L50 96L34 66L68 42Z"
              }
              fill={primary}
              stroke={secondary}
              strokeOpacity="0.25"
              strokeWidth="2"
            />
          </g>
        )}

        {type === "bag" && (
          <g>
            <path
              d="M72 68V48C72 34 84 24 100 24C116 24 128 34 128 48V68"
              stroke={primary}
              strokeWidth="8"
              strokeLinecap="round"
            />
            <rect x="44" y="66" width="112" height="100" rx="8" fill={primary} />
            <rect x="44" y="96" width="112" height="2" fill="#FFFFFF" fillOpacity="0.2" />
            <rect x="88" y="88" width="24" height="14" rx="3" fill={secondary} />
          </g>
        )}

        {type === "sneakers" && (
          <g>
            <path
              d="M36 122C36 106 54 96 74 90L96 68C104 78 122 86 146 92C162 96 170 108 170 122V134H36V122Z"
              fill={primary}
              stroke={secondary}
              strokeWidth="2.5"
            />
            <rect x="34" y="132" width="138" height="16" rx="6" fill={secondary} />
            <line x1="88" y1="84" x2="104" y2="92" stroke={secondary} strokeWidth="3" strokeLinecap="round" />
            <line x1="80" y1="92" x2="96" y2="100" stroke={secondary} strokeWidth="3" strokeLinecap="round" />
          </g>
        )}

        {type === "serum" && (
          <g>
            <rect x="92" y="28" width="16" height="22" rx="6" fill="#27272A" />
            <rect x="84" y="48" width="32" height="16" rx="3" fill="#D4D4D8" />
            <rect x="66" y="64" width="68" height="106" rx="14" fill={primary} />
            <rect x="74" y="88" width="52" height="58" rx="4" fill="#FFFFFF" fillOpacity="0.88" />
            <rect x="82" y="102" width="36" height="4" rx="2" fill={primary} />
            <rect x="86" y="114" width="28" height="3" rx="1.5" fill={primary} fillOpacity="0.45" />
            <rect x="90" y="124" width="20" height="3" rx="1.5" fill={primary} fillOpacity="0.35" />
          </g>
        )}

        {(type === "cream" || type === "palette") && (
          <g>
            <rect x="52" y="64" width="96" height="22" rx="6" fill={secondary} />
            <rect x="48" y="84" width="104" height="80" rx="14" fill={primary} />
            <rect x="64" y="104" width="72" height="40" rx="4" fill="#FFFFFF" fillOpacity="0.82" />
            <rect x="78" y="118" width="44" height="4" rx="2" fill={secondary} />
            <rect x="86" y="128" width="28" height="3" rx="1.5" fill={secondary} fillOpacity="0.5" />
          </g>
        )}

        {type === "perfume" && (
          <g>
            <rect x="86" y="28" width="28" height="26" rx="4" fill={primary} />
            <rect x="92" y="54" width="16" height="12" fill="#D4D4D8" />
            <rect x="56" y="66" width="88" height="104" rx="10" fill={secondary} fillOpacity="0.85" stroke={primary} strokeWidth="2" />
            <rect x="70" y="92" width="60" height="52" rx="2" fill="#FAF8F5" />
            <rect x="80" y="110" width="40" height="4" fill={primary} />
            <rect x="86" y="122" width="28" height="3" fill={primary} fillOpacity="0.45" />
          </g>
        )}

        {type === "headphones" && (
          <g>
            <path
              d="M46 112V94C46 62 70 38 100 38C130 38 154 62 154 94V112"
              stroke={primary}
              strokeWidth="12"
              strokeLinecap="round"
            />
            <rect x="34" y="102" width="28" height="54" rx="14" fill={primary} />
            <rect x="138" y="102" width="28" height="54" rx="14" fill={primary} />
            <rect x="44" y="112" width="10" height="34" rx="5" fill={secondary} />
            <rect x="146" y="112" width="10" height="34" rx="5" fill={secondary} />
          </g>
        )}

        {type === "keyboard" && (
          <g>
            <rect x="26" y="68" width="148" height="72" rx="10" fill={primary} />
            {[0, 1, 2, 3].map((row) =>
              [0, 1, 2, 3, 4, 5, 6, 7].map((col) => (
                <rect
                  key={`${row}-${col}`}
                  x={36 + col * 16}
                  y={78 + row * 14}
                  width={row === 3 && col === 2 ? 44 : 12}
                  height="10"
                  rx="2"
                  fill={row === 0 && col === 0 ? secondary : "#F8FAFC"}
                  fillOpacity={row === 3 && (col === 3 || col === 4) ? 0 : 0.9}
                />
              ))
            )}
          </g>
        )}

        {(type === "watch" || type === "speaker") && (
          <g>
            <rect x="82" y="26" width="36" height="148" rx="10" fill={secondary} />
            <rect x="64" y="60" width="72" height="80" rx="18" fill={primary} />
            <rect x="72" y="68" width="56" height="64" rx="12" fill="#0F172A" />
            <circle cx="100" cy="100" r="18" stroke="#38BDF8" strokeWidth="2.5" />
            <line x1="100" y1="100" x2="100" y2="88" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="100" y1="100" x2="110" y2="104" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />
          </g>
        )}
      </svg>
    </div>
  )
}
