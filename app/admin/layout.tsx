"use client"

import type React from "react"
import { useEffect } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth" // Your authentication hook
import { FileText, Upload, Loader2, FolderPlus, Settings, LogOut, LayoutDashboard } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Helper function to get initials
const getInitials = (name: string | null | undefined): string => {
  if (!name) return "?";
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Use your authentication hook to get user status and loading state
  const { user, signOut, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname() // Get the current path

  // --- Authentication Check ---
  useEffect(() => {
    if (!loading) {
      if (!user && pathname !== "/admin/login") {
        // Redirects unauthenticated users to login (if not already there)
        console.log("AdminLayout: No user found, redirecting to login.");
        router.push("/admin/login");
      }
      // Consider adding this logic if it's commented out or missing:
      else if (user && pathname === "/admin/login") {
        // Redirects authenticated users away from login
        console.log("AdminLayout: User logged in, redirecting from login to dashboard.");
        router.push("/admin/dashboard");
      }
    }
  }, [user, loading, router, pathname]);

  // --- Loading State ---
  // While checking authentication status, show a loading indicator
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // --- Render Login Page or Redirect ---
  // If we are on the login page, just render the login component itself
  // If a user IS logged in, the useEffect above might redirect them away shortly
  if (pathname === "/admin/login") {
    // Only render children (the login page) if no user is logged in yet
    // If a user IS logged in, the useEffect above might redirect them away shortly
    return <>{!user ? children : null}</>;
  }

  // --- Authenticated User State ---
  // If not loading, and we are not on the login page, but there's still no user
  // (e.g., during the brief moment before redirection), render nothing.
  if (!user) {
    console.log("AdminLayout: No user, rendering null while redirecting...");
    return null;
  }

  // --- Navigation Links ---
  const navLinks = [
    { title: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" />, href: "/admin/dashboard" },
    { title: "Documentos", icon: <FileText className="h-5 w-5" />, href: "/admin/documentos" },
    { title: "Upload", icon: <Upload className="h-5 w-5" />, href: "/admin/upload" },
    { title: "Categorias", icon: <FolderPlus className="h-5 w-5" />, href: "/admin/categorias" },
    { title: "Configurações", icon: <Settings className="h-5 w-5" />, href: "/admin/configuracoes" },
  ];

  // --- User Display Info ---
  const userName = user?.user_metadata?.full_name;
  const userEmail = user?.email;
  const userAvatarUrl = user?.user_metadata?.avatar_url;
  const userInitials = getInitials(userName || userEmail);
  const userDisplayName = userName || userEmail || "Usuário";

  // --- Logout Handler ---
  const handleLogout = async () => {
    await signOut();
    router.push("/"); // Redirect to home page after logout
  };

  // --- Render Admin Layout for Authenticated User ---
  return (
    <div className="flex min-h-screen bg-muted/40">
      {/* --- Sidebar --- */}
      <aside className="hidden w-64 flex-col border-r bg-background sm:flex">
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/admin/dashboard" className="flex items-center gap-2 font-semibold text-primary">
            <span className="h-6 w-6 bg-primary rounded-full" /> {/* Placeholder Logo */}
            <span>Painel Admin</span>
          </Link>
        </div>
        <nav className="flex-1 overflow-auto py-4">
          <ul className="grid items-start px-4 text-sm font-medium">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
                    // Highlight link if the current path starts with the link's href
                    pathname.startsWith(link.href)
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {link.icon}
                  <span>{link.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* --- Main Content Area --- */}
      <div className="flex flex-1 flex-col">
        {/* --- Header --- */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background px-4 md:px-6">
          <div className="flex-1">
            {/* Optional: Breadcrumbs or Search Bar */}
          </div>

          {/* --- User Menu --- */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-9 w-9 border">
                  {userAvatarUrl && <AvatarImage src={userAvatarUrl} alt={userDisplayName} />}
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{userName || "Usuário"}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {userEmail}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* --- Page Content --- */}
        {/* Render the specific page component passed as children */}
        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

