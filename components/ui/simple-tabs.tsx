"use client"

import React, { useState } from "react"
import { cn } from "@/lib/utils"

interface SimpleTabsProps {
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  className?: string
  children: React.ReactNode
}

interface SimpleTabsListProps {
  className?: string
  children: React.ReactNode
}

interface SimpleTabsTriggerProps {
  value: string
  className?: string
  children: React.ReactNode
  onClick?: React.MouseEventHandler<HTMLButtonElement>
}

interface SimpleTabsContentProps {
  value: string
  className?: string
  children: React.ReactNode
}

const SimpleTabsContext = React.createContext<{
  value: string
  onValueChange: (value: string) => void
} | null>(null)

export function SimpleTabs({ defaultValue, value, onValueChange, className, children, ...props }: SimpleTabsProps) {
  const [tabValue, setTabValue] = useState(value || defaultValue || "")

  const handleValueChange = (newValue: string) => {
    if (onValueChange) {
      onValueChange(newValue)
    } else {
      setTabValue(newValue)
    }
  }

  return (
    <SimpleTabsContext.Provider value={{ value: value || tabValue, onValueChange: handleValueChange }}>
      <div className={cn("w-full", className)} {...props}>
        {children}
      </div>
    </SimpleTabsContext.Provider>
  )
}

export function SimpleTabsList({ className, children }: SimpleTabsListProps) {
  return <div className={cn("flex space-x-1 rounded-md bg-muted p-1", className)}>{children}</div>
}

export function SimpleTabsTrigger({ value, className, children, ...props }: SimpleTabsTriggerProps) {
  const context = React.useContext(SimpleTabsContext)

  if (!context) {
    throw new Error("SimpleTabsTrigger must be used within SimpleTabs")
  }

  const isActive = context.value === value

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      data-state={isActive ? "active" : "inactive"}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        isActive
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
        className,
      )}
      onClick={() => context.onValueChange(value)}
      {...props}
    >
      {children}
    </button>
  )
}

export function SimpleTabsContent({ value, className, children, ...props }: SimpleTabsContentProps) {
  const context = React.useContext(SimpleTabsContext)

  if (!context) {
    throw new Error("SimpleTabsContent must be used within SimpleTabs")
  }

  const isActive = context.value === value

  if (!isActive) return null

  return (
    <div
      role="tabpanel"
      data-state={isActive ? "active" : "inactive"}
      className={cn(
        "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

