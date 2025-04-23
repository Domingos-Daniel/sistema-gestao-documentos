"use client"

import type React from "react"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { DashboardNav, MobileSidebar } from "@/components/dashboard-nav"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import {
  FileText,
  Upload,
  Search,
  Users,
  BarChart,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Home,
  Folder,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { user, signOut, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login")
    }
  }, [user, loading, router])

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  const navLinks = [
    {
      title: "Início",
      icon: <Home className="h-5 w-5" />,
      variant: "default",
      href: "/dashboard",
    },
    {
      title: "Documentos",
      icon: <FileText className="h-5 w-5" />,
      variant: "default",
      href: "/dashboard/documents",
    },
    {
      title: "Upload",
      icon: <Upload className="h-5 w-5" />,
      variant: "default",
      href: "/dashboard/upload",
    },
    {
      title: "Categorias",
      icon: <Folder className="h-5 w-5" />,
      variant: "default",
      href: "/dashboard/categories",
    },
    {
      title: "Busca",
      icon: <Search className="h-5 w-5" />,
      variant: "default",
      href: "/dashboard/search",
    },
    {
      title: "Usuários",
      icon: <Users className="h-5 w-5" />,
      variant: "default",
      href: "/dashboard/users",
      adminOnly: true,
    },
    {
      title: "Relatórios",
      icon: <BarChart className="h-5 w-5" />,
      variant: "default",
      href: "/dashboard/reports",
      adminOnly: true,
    },
    {
      title: "Configurações",
      icon: <Settings className="h-5 w-5" />,
      variant: "default",
      href: "/dashboard/settings",
    },
  ]

  const userInitials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
    : user.email?.charAt(0).toUpperCase()

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        <div className="flex items-center gap-2">
          <MobileSidebar links={navLinks} />
          <Link href="/" className="flex items-center gap-2">
            <span className="font-bold">Sistema de Gestão de Documentos</span>
          </Link>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{userInitials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.user_metadata?.full_name || "Usuário"}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/profile">Perfil</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings">Configurações</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer" onClick={() => signOut()}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <div className="flex flex-1">
        <aside className={`hidden border-r bg-background md:block ${isCollapsed ? "w-[78px]" : "w-[240px]"}`}>
          <div className="flex h-full flex-col">
            <div className="flex h-14 items-center border-b px-4">
              <Button variant="ghost" size="icon" className="ml-auto" onClick={() => setIsCollapsed(!isCollapsed)}>
                {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                <span className="sr-only">Toggle Sidebar</span>
              </Button>
            </div>
            <DashboardNav links={navLinks} isCollapsed={isCollapsed} />
          </div>
        </aside>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}

