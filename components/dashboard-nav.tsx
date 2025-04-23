"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useAuth } from "@/hooks/use-auth"
import { useState } from "react"
import { Menu } from "lucide-react"

interface NavProps {
  isCollapsed: boolean
  links: {
    title: string
    label?: string
    icon: React.ReactNode
    variant: "default" | "ghost"
    href: string
    adminOnly?: boolean
  }[]
}

export function DashboardNav({ links, isCollapsed }: NavProps) {
  const pathname = usePathname()
  const { user } = useAuth()
  const isAdmin = user?.user_metadata?.role === "admin"

  return (
    <div data-collapsed={isCollapsed} className="group flex flex-col gap-4 py-2 data-[collapsed=true]:py-2">
      <nav className="grid gap-1 px-2 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2">
        {links
          .filter((link) => !link.adminOnly || isAdmin)
          .map((link, index) => (
            <Link
              key={index}
              href={link.href}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                pathname === link.href ? "bg-accent text-accent-foreground" : "transparent",
                isCollapsed ? "justify-center" : "",
              )}
            >
              {link.icon}
              {!isCollapsed && <span>{link.title}</span>}
              {!isCollapsed && link.label && <span className="ml-auto text-xs">{link.label}</span>}
            </Link>
          ))}
      </nav>
    </div>
  )
}

export function MobileSidebar({ links }: { links: NavProps["links"] }) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="pr-0">
        <ScrollArea className="my-4 h-[calc(100vh-8rem)] pb-10">
          <div className="flex flex-col gap-2">
            <DashboardNav links={links} isCollapsed={false} />
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

