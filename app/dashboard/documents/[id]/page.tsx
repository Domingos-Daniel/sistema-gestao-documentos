"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { supabase } from "@/lib/supabase"
import { FileText, Download, ArrowLeft, Clock, User, Calendar } from "lucide-react"
import { DocumentViewer } from "@/components/document-viewer"

export default function DocumentPage({ params }: { params: { id: string } }) {
  const [document, setDocument] = useState<any>(null)
  const [versions, setVersions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    fetchDocument()
  }, [params.id])

  const fetchDocument = async () => {
    setLoading(true)
    try {
      // Fetch document
      const { data, error } = await supabase
        .from("documents")
        .select("*, profiles(full_name)")
        .eq("id", params.id)
        .single()

      if (error) {
        throw error
      }

      setDocument(data)

      // Fetch document versions
      const { data: versionsData, error: versionsError } = await supabase
        .from("document_versions")
        .select("*")
        .eq("document_id", params.id)
        .order("created_at", { ascending: false })

      if (versionsError) {
        throw versionsError
      }

      setVersions(versionsData || [])

      // Log view
      await supabase.from("document_views").insert([
        {
          document_id: params.id,
          user_id: user?.id,
        },
      ])
    } catch (error: any) {
      toast({
        title: "Erro ao carregar documento",
        description: error.message,
        variant: "destructive",
      })
      router.push("/dashboard/documents")
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!document) return

    try {
      const { data, error } = await supabase.storage.from("documents").download(document.file_path)

      if (error) {
        throw error
      }

      // Log download
      await supabase.from("document_downloads").insert([
        {
          document_id: document.id,
          user_id: user?.id,
        },
      ])

      // Create download link
      const url = URL.createObjectURL(data)
      const a = document.createElement("a")
      a.href = url
      a.download = document.file_name
      document.body.appendChild(a)
      a.click()
      URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Download iniciado",
        description: `Baixando ${document.file_name}`,
      })
    } catch (error: any) {
      toast({
        title: "Erro ao baixar documento",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleVersionDownload = async (version: any) => {
    try {
      const { data, error } = await supabase.storage.from("document_versions").download(version.file_path)

      if (error) {
        throw error
      }

      // Create download link
      const url = URL.createObjectURL(data)
      const a = document.createElement("a")
      a.href = url
      a.download = version.file_name
      document.body.appendChild(a)
      a.click()
      URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Download iniciado",
        description: `Baixando versão anterior: ${version.file_name}`,
      })
    } catch (error: any) {
      toast({
        title: "Erro ao baixar versão",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  if (!document) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={() => router.push("/dashboard/documents")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Documentos
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <FileText className="h-10 w-10 text-muted-foreground" />
            <p className="mt-2 text-center text-muted-foreground">Documento não encontrado</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => router.push("/dashboard/documents")}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar para Documentos
      </Button>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{document.title}</CardTitle>
                  <CardDescription>
                    Enviado por {document.profiles?.full_name || "Usuário"} em{" "}
                    {new Date(document.created_at).toLocaleDateString("pt-BR")}
                  </CardDescription>
                </div>
                <Button onClick={handleDownload}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Descrição</h3>
                <p className="text-muted-foreground">{document.description || "Sem descrição"}</p>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">Detalhes</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Autor: {document.profiles?.full_name || "Usuário"}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Data: {new Date(document.created_at).toLocaleDateString("pt-BR")}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Tamanho: {(document.file_size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                </div>
              </div>

              {document.tags && document.tags.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {document.tags.map((tag: string) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <DocumentViewer document={document} />

              {versions.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Versões Anteriores</h3>
                  <div className="space-y-2">
                    {versions.map((version) => (
                      <div key={version.id} className="flex items-center justify-between rounded-lg border p-3">
                        <div className="flex items-center space-x-3">
                          <Clock className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">
                              Versão de {new Date(version.created_at).toLocaleDateString("pt-BR")}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {version.file_name} ({(version.file_size / 1024 / 1024).toFixed(2)} MB)
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => handleVersionDownload(version)}>
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Imagem de Capa</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-muted rounded-md overflow-hidden">
                {document.cover_image_url ? (
                  <img
                    src={document.cover_image_url || "/placeholder.svg"}
                    alt={document.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <FileText className="h-16 w-16 mb-2" />
                    <p className="text-sm">Sem capa</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Informações do Arquivo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium">Nome do arquivo</h4>
                <p className="text-sm text-muted-foreground">{document.file_name}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium">Tipo de arquivo</h4>
                <p className="text-sm text-muted-foreground">{document.file_type}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium">Tamanho</h4>
                <p className="text-sm text-muted-foreground">{(document.file_size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <div>
                <h4 className="text-sm font-medium">Data de upload</h4>
                <p className="text-sm text-muted-foreground">
                  {new Date(document.created_at).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

