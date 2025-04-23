"use client"

import type React from "react"
import { useState, useEffect } from "react" // Import useEffect
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  // Get user and loading state from useAuth
  const { signIn, user, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  // <<< Add useEffect for redirection >>>
  useEffect(() => {
    // Wait until the auth state is determined
    if (!authLoading) {
      // If user is logged in, redirect to dashboard
      if (user) {
        console.log("LoginPage: User already logged in, redirecting to dashboard.");
        router.push("/admin/dashboard");
      }
    }
  }, [user, authLoading, router]); // Depend on user, loading state, and router

  const handleSubmit = async (e: React.FormEvent) => {
    // ... (handleSubmit function remains the same) ...
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
          title: "Erro de Autenticação",
          description: description,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Login bem-sucedido!",
          description: "Redirecionando...",
        })
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
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-12">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Entrar no Sistema</CardTitle>
          <CardDescription>Use seu email e senha para acessar</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 pt-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

