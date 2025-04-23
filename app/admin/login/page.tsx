"use client"

import type React from "react"
// Import useEffect
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
// Import Loader2 for loading states
import { Loader2 } from "lucide-react"
import { usePathname } from "next/navigation"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  // Get user and loading state from useAuth
  const { signIn, user, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const pathname = usePathname();

  // <<< Add useEffect for redirection >>>
  useEffect(() => {
    // Wait until the auth state is determined
    if (!authLoading) {
      // If user is logged in, redirect to dashboard
      if (user) {
        console.log("Admin LoginPage: User already logged in, redirecting to dashboard.");
        router.push("/admin/dashboard");
      }
    }
  }, [user, authLoading, router]); // Depend on user, loading state, and router

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha o email e a senha.",
        variant: "destructive",
      })
      return
    }
    setIsLoading(true)

    try {
      const { error } = await signIn(email, password)

      if (error) {
         let description = "Ocorreu um erro ao tentar fazer login. Verifique suas credenciais."
        if (error.message.includes("Invalid login credentials")) {
            description = "Email ou senha inválidos."
        } else if (error.message.includes("Email not confirmed")) {
            description = "Por favor, confirme seu email antes de fazer login."
        }
        toast({
          title: "Erro ao fazer login",
          description: description,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Login realizado com sucesso",
          description: "Bem-vindo ao painel administrativo",
        })
        // Redirect to dashboard after successful login
        router.push("/admin/dashboard")
      }
    } catch (error) {
      console.error("Login process error:", error)
      toast({
        title: "Erro Inesperado",
        description: "Ocorreu um erro inesperado. Tente novamente mais tarde.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // --- Optional: Show loading indicator while checking auth state ---
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // --- Render login form only if user is not logged in ---
  // (The useEffect above handles redirection if user is logged in)
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-12"> {/* Added background */}
      <Card className="w-full max-w-md shadow-lg"> {/* Added shadow */}
        <CardHeader className="space-y-1 text-center"> {/* Centered header */}
          <CardTitle className="text-2xl font-bold">Área Administrativa</CardTitle>
          <CardDescription>Entre com suas credenciais</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading} // Disable input while loading
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="********" // Added placeholder
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading} // Disable input while loading
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 pt-4"> {/* Added padding top */}
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
              {/* Add loader to button */}
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
            <div className="text-center text-sm">
              <Link href="/" className="text-primary underline-offset-4 hover:underline">
                Voltar para o site
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

