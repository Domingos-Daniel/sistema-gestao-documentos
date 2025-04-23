import type React from "react"
import Link from "next/link"

export default function PublicLayout({
  children,
  title,
  description,
}: {
  children: React.ReactNode
  title: string
  description?: string
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-secondary text-white backdrop-blur supports-[backdrop-filter]:bg-secondary/95">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <span className="font-bold text-white">Repositório Acadêmico</span>
            </Link>
          </div>
          <div className="flex flex-1 items-center space-x-4">
            <nav className="flex-1 flex items-center">
              <Link href="/documentos" className="text-sm font-medium mx-4 text-white hover:text-primary">
                Documentos
              </Link>
              <Link href="/categorias" className="text-sm font-medium mx-4 text-white hover:text-primary">
                Categorias
              </Link>
              <Link href="/sobre" className="text-sm font-medium mx-4 text-white hover:text-primary">
                Sobre
              </Link>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/admin/login">
              <button className="text-sm font-medium bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90">
                Área Administrativa
              </button>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="container py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            {description && <p className="text-muted-foreground mt-2">{description}</p>}
          </div>
          {children}
        </div>
      </main>
      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            © 2023 Repositório Acadêmico. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}

