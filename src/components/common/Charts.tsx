"use client"

import React from "react"
import { cn } from "@/lib/utils"

interface SeriesPoint {
  label: string
  value: number
  secondary?: number
}

interface BarAreaChartProps {
  data: SeriesPoint[]
  accentColor?: string
  height?: number
  formatValue?: (val: number) => string
  className?: string
}

/**
 * Lightweight, responsive SVG chart with tabular numeral axes and accessible tooltips.
 */
export function BarAreaChart({
  data,
  accentColor = "hsl(var(--primary))",
  height = 200,
  formatValue = (v) => v.toLocaleString("en-US"),
  className,
}: BarAreaChartProps) {
  const maxVal = Math.max(...data.map((d) => d.value), 1)
  const width = 560
  const padX = 20
  const padTop = 18
  const padBottom = 28
  const chartW = width - padX * 2
  const chartH = height - padTop - padBottom
  const barGap = 10
  const barW = Math.max(12, (chartW - barGap * (data.length - 1)) / Math.max(data.length, 1))

  return (
    <div className={cn("w-full overflow-x-auto", className)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto min-w-[340px]"
        role="img"
        aria-label="Performance chart"
      >
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = padTop + chartH * (1 - ratio)
          return (
            <line
              key={ratio}
              x1={padX}
              y1={y}
              x2={width - padX}
              y2={y}
              stroke="currentColor"
              strokeOpacity="0.08"
              strokeDasharray={ratio === 0 ? undefined : "3 3"}
            />
          )
        })}

        {data.map((point, idx) => {
          const h = Math.max(4, (point.value / maxVal) * chartH)
          const x = padX + idx * (barW + barGap)
          const y = padTop + chartH - h
          return (
            <g key={point.label} className="group">
              <rect
                x={x}
                y={y}
                width={barW}
                height={h}
                rx={4}
                fill={accentColor}
                fillOpacity="0.85"
                className="transition-opacity duration-150 group-hover:opacity-100"
              >
                <title>
                  {point.label}: {formatValue(point.value)}
                </title>
              </rect>
              <text
                x={x + barW / 2}
                y={height - 8}
                textAnchor="middle"
                className="fill-muted-foreground text-[10px] tabular-nums"
              >
                {point.label}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

interface HorizontalBreakdownProps {
  items: { label: string; value: number; displayValue: string; color?: string }[]
  className?: string
}

export function HorizontalBreakdown({
  items,
  className,
}: HorizontalBreakdownProps) {
  const max = Math.max(...items.map((i) => i.value), 1)
  return (
    <div className={cn("space-y-3", className)}>
      {items.map((item) => (
        <div key={item.label} className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-foreground truncate">{item.label}</span>
            <span className="font-mono tabular-nums text-muted-foreground shrink-0">
              {item.displayValue}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${Math.max(4, Math.round((item.value / max) * 100))}%`,
                backgroundColor: item.color || "hsl(var(--primary))",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
