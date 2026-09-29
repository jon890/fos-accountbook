"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--color-bg-elev)",
          "--normal-text": "var(--color-fg)",
          "--normal-border": "var(--color-border)",
          "--success-bg": "var(--color-bg-elev)",
          "--success-text": "var(--color-fg)",
          "--success-border": "var(--color-brand-500)",
          "--error-bg": "var(--color-bg-elev)",
          "--error-text": "var(--color-fg)",
          "--error-border": "var(--color-expense)",
          "--warning-bg": "var(--color-bg-elev)",
          "--warning-text": "var(--color-fg)",
          "--warning-border": "var(--color-warning)",
          "--info-bg": "var(--color-bg-elev)",
          "--info-text": "var(--color-fg)",
          "--info-border": "var(--color-brand-400)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
