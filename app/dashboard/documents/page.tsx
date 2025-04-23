"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { supabase } from "@/lib/supabase"
import { FileText, Download, Eye, Trash2, Upload, Search } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [documentToDelete, setDocumentToDelete] = useState<any>(null)
  const { toast } = useToast()
  const { user } = useAuth()

  const [categories, setCategories] = useState([
    { id: "", name: "Todas as categorias" },
    { id: "course", name: "Curso" },
    { id: "discipline", name: "Disciplina" },
    { id: "research", name: "Pesquisa" },
    { id: "article", name: "Artigo" },
    { id: "thesis", name: "Tese" },
    { id: "other", name: "Outro" },
  ])

  useEffect(() => {
    fetchDocuments()
  }, [categoryFilter])

  const fetchDocuments = async () => {
    setLoading(true)
    try {
      let query = supabase.from("documents").select("*, profiles(full_name)")

      if (categoryFilter) {
        query = query.eq("category", categoryFilter)
      }

      const { data, error } = await query.order("created_at", { ascending: false })

      if (error) {
        throw error
      }

      setDocuments(data || [])
    } catch (error: any) {
      toast({
        title: "Erro ao carregar documentos",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      fetchDocuments()
      return
    }

    const filtered = documents.filter(
      (doc) =>
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.tags?.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase())),
    )

    setDocuments(filtered)
  }

  const handleDownload = async (document: any) => {
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

  const confirmDelete = (document: any) => {
    setDocumentToDelete(document)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!documentToDelete) return

    try {
      // Delete file from storage
      const { error: storageError } = await supabase.storage.from("documents").remove([documentToDelete.file_path])

      if (storageError) {
        throw storageError
      }

      // Delete document record
      const { error: dbError } = await supabase.from("documents").delete().eq("id", documentToDelete.id)

      if (dbError) {
        throw dbError
      }

      setDocuments(documents.filter((doc) => doc.id !== documentToDelete.id))

      toast({
        title: "Documento excluído",
        description: "O documento foi excluído com sucesso",
      })
    } catch (error: any) {
      toast({
        title: "Erro ao excluir documento",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
      setDocumentToDelete(null)
    }
  }

  const canDeleteDocument = (document: any) => {
    return user?.id === document.user_id || user?.user_metadata?.role === "admin"
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documentos</h1>
          <p className="text-muted-foreground">Gerencie os documentos do repositório</p>
        </div>
        <Link href="/dashboard/upload">
          <Button>
            <Upload className="mr-2 h-4 w-4" />
            Novo Documento
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Busque e filtre os documentos do repositório</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4 md:flex-row md:space-x-4 md:space-y-0">
            <div className="flex w-full md:w-1/2">
              <Input
                placeholder="Buscar por título, descrição ou tags"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="rounded-r-none"
              />
              <Button onClick={handleSearch} className="rounded-l-none" variant="secondary">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <div className="w-full md:w-1/2">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      ) : documents.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => (
            <Card key={doc.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="line-clamp-1">{doc.title}</CardTitle>
                    <CardDescription>
                      Enviado por {doc.profiles?.full_name || "Usuário"} em{" "}
                      {new Date(doc.created_at).toLocaleDateString("pt-BR")}
                    </CardDescription>
                  </div>
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <p className="line-clamp-2 text-sm text-muted-foreground">{doc.description || "Sem descrição"}</p>
                {doc.tags && doc.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {doc.tags.map((tag: string) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardContent className="flex items-center justify-between pt-0">
                <div className="text-xs text-muted-foreground">{(doc.file_size / 1024 / 1024).toFixed(2)} MB</div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      Ações
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleDownload(doc)}>
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/documents/${doc.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        Visualizar
                      </Link>
                    </DropdownMenuItem>
                    {canDeleteDocument(doc) && (
                      <DropdownMenuItem onClick={() => confirmDelete(doc)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <FileText className="h-10 w-10 text-muted-foreground" />
            <p className="mt-2 text-center text-muted-foreground">Nenhum documento encontrado</p>
            <Link href="/dashboard/upload" className="mt-4">
              <Button>
                <Upload className="mr-2 h-4 w-4" />
                Enviar Documento
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o documento &quot;
              {documentToDelete?.title}&quot;? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

