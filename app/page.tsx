"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { SimpleCarousel } from "@/components/ui/simple-carousel"

export default function Home() {
  const carouselItems = [
    {
      image: "https://ispk.co.ao/wp-content/uploads/2024/09/banner-3.jpg",
      title: "Repositório Digital Acadêmico",
      description: "Acesse documentos acadêmicos de forma simples e rápida.",
    },
    {
      image: "https://ispk.co.ao/wp-content/uploads/2024/09/banner-1.jpg",
      title: "Conhecimento Acessível",
      description: "Milhares de documentos acadêmicos ao seu alcance.",
    },
    {
      image: "https://ispk.co.ao/wp-content/uploads/2024/09/banner-2.jpg",
      title: "Pesquisa Facilitada",
      description: "Encontre rapidamente o conteúdo que você precisa.",
    },
  ]

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
              <Button className="bg-primary hover:bg-primary/90 text-white">Entrar no Sistema</Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1 top-0">
        {/* --- IMPRESSIONANTE CAROUSEL FULLSCREEN --- */}
        <section className="relative w-full min-h-[100dvh] flex items-center justify-center overflow-hidden top-0">
          <SimpleCarousel>
            {carouselItems.map((item, index) => (
              <div
                key={index}
                className="relative w-full h-[100dvh] flex items-center justify-center top-0"
              >
                {/* Background image with blue overlay and blur */}
                <div
                  className="absolute inset-0 z-0"
                  style={{
                    backgroundImage: `url(${item.image})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <div className="absolute inset-0 bg-blue-900/70 backdrop-blur-xs top-0" />
                </div>
                {/* Content */}
                <div className="relative z-10 flex flex-col items-center justify-center text-center px-4">
                  <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white drop-shadow-lg mb-4 animate-fade-in-up">
                    {item.title}
                  </h1>
                  <p className="text-lg md:text-2xl text-blue-100 mb-8 max-w-2xl mx-auto animate-fade-in-up delay-150">
                    {item.description}
                  </p>
                  <div className="flex flex-col gap-3 min-[400px]:flex-row justify-center animate-fade-in-up delay-300">
                    <Link href="/documentos">
                      <Button size="lg" className="w-full bg-primary hover:bg-primary/90 shadow-xl">
                        Explorar Documentos
                      </Button>
                    </Link>
                    <Link href="/categorias">
                      <Button
                        size="lg"
                        variant="outline"
                        className="w-full border-primary text-primary hover:bg-primary hover:text-white shadow-xl"
                      >
                        Ver Categorias
                      </Button>
                    </Link>
                  </div>
                </div>
                {/* Fancy gradient at bottom for effect */}
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-blue-900/90 to-transparent z-10 pointer-events-none" />
              </div>
            ))}
          </SimpleCarousel>
          {/* Optional: floating shapes or animated elements for extra wow */}
          <div className="pointer-events-none absolute inset-0 z-20">
            <svg className="absolute top-10 left-10 opacity-20 blur-xs" width="200" height="200">
              <circle cx="100" cy="100" r="80" fill="#3b82f6" />
            </svg>
            <svg className="absolute bottom-10 right-10 opacity-20 blur-xs" width="180" height="180">
              <rect width="180" height="180" rx="90" fill="#2563eb" />
            </svg>
          </div>
        </section>
        {/* --- FIM DO CAROUSEL --- */}

        <section className="w-full py-12 md:py-24 lg:py-32 bg-secondary text-white">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-white">
                  Recursos Principais
                </h2>
                <p className="max-w-[900px] text-gray-300 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Nossa plataforma oferece acesso a diversos documentos acadêmicos.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: "Artigos Científicos",
                  description: "Acesse artigos científicos de diversas áreas do conhecimento.",
                },
                {
                  title: "Teses e Dissertações",
                  description: "Consulte teses e dissertações de mestrado e doutorado.",
                },
                {
                  title: "Livros Digitais",
                  description: "Encontre livros e e-books acadêmicos para suas pesquisas.",
                },
                {
                  title: "Organização por Categorias",
                  description: "Navegue por documentos organizados em categorias específicas.",
                },
                {
                  title: "Busca Avançada",
                  description: "Encontre rapidamente o que precisa com nossa busca avançada.",
                },
                {
                  title: "Acesso Gratuito",
                  description: "Todos os documentos são disponibilizados gratuitamente.",
                },
              ].map((feature, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center space-y-2 rounded-lg border border-gray-700 bg-secondary/50 p-4"
                >
                  <div className="p-2 bg-primary rounded-full">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-10 w-10 text-white"
                    >
                      <path d="M12 2L2 7l10 5 10-5-10-5z" />
                      <path d="M2 17l10 5 10-5" />
                      <path d="M2 12l10 5 10-5" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white">{feature.title}</h3>
                  <p className="text-sm text-gray-300">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t py-6 md:py-0 bg-secondary text-white">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <p className="text-center text-sm leading-loose text-gray-300 md:text-left">
            © 2023 Repositório Acadêmico. Todos os direitos reservados.
          </p>
        </div>
      </footer>
      {/* --- ANIMAÇÕES CSS --- */}
      <style jsx global>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 1s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .delay-150 { animation-delay: .15s; }
        .delay-300 { animation-delay: .3s; }
      `}</style>
    </div>
  )
}

