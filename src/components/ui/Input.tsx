import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  startIcon?: React.ReactNode
  endIcon?: React.ReactNode
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { className, type, label, error, helperText, startIcon, endIcon, id, ...props },
    ref
  ) => {
    const inputId = id || React.useId()

    return (
      <div className="w-full space-y-2">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-semibold text-foreground/90"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {startIcon && (
            <div className="absolute right-3.5 flex items-center pointer-events-none text-muted-foreground">
              {startIcon}
            </div>
          )}
          <input
            id={inputId}
            type={type}
            ref={ref}
            className={cn(
              "flex h-12 w-full rounded-2xl border border-input bg-background/60 px-4 py-2 text-sm text-foreground transition-all duration-200 placeholder:text-muted-foreground/60 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary disabled:cursor-not-allowed disabled:opacity-50",
              startIcon && "pr-11",
              endIcon && "pl-11",
              error && "border-destructive focus:ring-destructive/30",
              className
            )}
            {...props}
          />
          {endIcon && (
            <div className="absolute left-3.5 flex items-center text-muted-foreground">
              {endIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="text-xs text-destructive font-medium">{error}</p>
        )}
        {!error && helperText && (
          <p className="text-xs text-muted-foreground">{helperText}</p>
        )}
      </div>
    )
  }
)

Input.displayName = "Input"

