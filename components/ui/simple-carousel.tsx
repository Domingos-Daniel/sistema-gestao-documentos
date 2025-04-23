"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface SimpleCarouselProps {
  children: React.ReactNode[]
  autoPlay?: boolean
  interval?: number
  className?: string
}

export function SimpleCarousel({ children, autoPlay = true, interval = 5000, className }: SimpleCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  const updateIndex = (newIndex: number) => {
    if (newIndex < 0) {
      newIndex = React.Children.count(children) - 1
    } else if (newIndex >= React.Children.count(children)) {
      newIndex = 0
    }

    setActiveIndex(newIndex)
  }

  useEffect(() => {
    if (autoPlay && !isPaused) {
      const timer = setInterval(() => {
        updateIndex(activeIndex + 1)
      }, interval)

      return () => {
        clearInterval(timer)
      }
    }
  }, [autoPlay, activeIndex, interval, isPaused])

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div
        className="whitespace-nowrap transition-transform duration-500"
        style={{ transform: `translateX(-${activeIndex * 100}%)` }}
      >
        {React.Children.map(children, (child, index) => (
          <div className="inline-block w-full whitespace-normal">{child}</div>
        ))}
      </div>

      <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
        {React.Children.map(children, (_, index) => (
          <button
            onClick={() => updateIndex(index)}
            className={`h-2 w-2 rounded-full ${index === activeIndex ? "bg-primary" : "bg-gray-300"}`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      <Button
        variant="outline"
        size="icon"
        className="absolute left-4 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full bg-white/80"
        onClick={() => updateIndex(activeIndex - 1)}
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="sr-only">Previous slide</span>
      </Button>

      <Button
        variant="outline"
        size="icon"
        className="absolute right-4 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full bg-white/80"
        onClick={() => updateIndex(activeIndex + 1)}
      >
        <ArrowRight className="h-4 w-4" />
        <span className="sr-only">Next slide</span>
      </Button>
    </div>
  )
}

