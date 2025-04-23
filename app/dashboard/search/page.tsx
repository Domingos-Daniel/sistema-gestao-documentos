"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { FileText, Download, Eye } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { DatePicker } from "@/components/ui/date-picker"

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined)
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined)
  const [searchInTitle, setSearchInTitle] = useState(true)
  const [searchInDescription, setSearchInDescription] = useState(true)
  const [searchInTags, setSearchInTags] = useState(true)
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const [categories, setCategories] = useState([
    { id: "", name: "Todas as categorias" },
    { id: "course", name: "Curso" },
    { id: "discipline", name: "Disciplina" },
    { id: "research", name: "Pesquisa" },
    { id: "article", name: "Artigo" },
    { id: "thesis", name: "Tese" },
    { id: "other", name: "Outro" },
  ])

  const handleSearch = async () => {
    if (!searchTerm.trim() && !categoryFilter && !dateFrom && !dateTo) {
      toast({
        title: "Critérios de busca vazios",
        description: "Por favor, informe pelo menos um critério de busca",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      let query = supabase.from("documents").select("*, profiles(full_name)")

      // Apply category filter
      if (categoryFilter) {
        query = query.eq("category", categoryFilter)
      }

      // Apply date filters
      if (dateFrom) {
        const fromDate = new Date(dateFrom)
        fromDate.setHours(0, 0, 0, 0)
        query = query.gte("created_at", fromDate.toISOString())
      }

      if (dateTo) {
        const toDate = new Date(dateTo)
        toDate.setHours(23, 59, 59, 999)
        query = query.lte("created_at", toDate.toISOString())
      }

      // Get results
      const { data, error } = await query.order("created_at", { ascending: false })

      if (error) {
        throw error
      }

      // Filter by search term if provided
      let filteredResults = data || []

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase()
        filteredResults = filteredResults.filter((doc) => {
          const matchesTitle = searchInTitle && doc.title.toLowerCase().includes(term)
          const matchesDescription = searchInDescription && doc.description?.toLowerCase().includes(term)
          const matchesTags = searchInTags && doc.tags?.some((tag: string) => tag.toLowerCase().includes(term))

          return matchesTitle || matchesDescription || matchesTags
        })
      }

      setResults(filteredResults)

      toast({
        title: `${filteredResults.length} resultados encontrados`,
        description:
          filteredResults.length > 0
            ? "Resultados da busca abaixo"
            : "Nenhum documento corresponde aos critérios de busca",
      })
    } catch (error: any) {
      toast({
        title: "Erro na busca",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
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
          user_id: document.user_id,
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Busca Avançada</h1>
        <p className="text-muted-foreground">Encontre documentos usando critérios específicos</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Critérios de Busca</CardTitle>
          <CardDescription>Defina os critérios para encontrar documentos específicos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="searchTerm">Termo de busca</Label>
            <Input
              id="searchTerm"
              placeholder="Digite palavras-chave para buscar"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Buscar em</Label>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="searchInTitle"
                  checked={searchInTitle}
                  onCheckedChange={(checked) => setSearchInTitle(checked === true)}
                />
                <Label htmlFor="searchInTitle" className="font-normal">
                  Título
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="searchInDescription"
                  checked={searchInDescription}
                  onCheckedChange={(checked) => setSearchInDescription(checked === true)}
                />
                <Label htmlFor="searchInDescription" className="font-normal">
                  Descrição
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="searchInTags"
                  checked={searchInTags}
                  onCheckedChange={(checked) => setSearchInTags(checked === true)}
                />
                <Label htmlFor="searchInTags" className="font-normal">
                  Tags
                </Label>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Selecione uma categoria" />
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

            <div className="space-y-2">
              <Label>Data de início</Label>
              <DatePicker date={dateFrom} setDate={setDateFrom} />
            </div>

            <div className="space-y-2">
              <Label>Data de fim</Label>
              <DatePicker date={dateTo} setDate={setDateTo} />
            </div>
          </div>

          <Button onClick={handleSearch} disabled={loading} className="w-full">
            {loading ? "Buscando..." : "Buscar Documentos"}
          </Button>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Resultados da Busca</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {results.map((doc) => (
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
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

