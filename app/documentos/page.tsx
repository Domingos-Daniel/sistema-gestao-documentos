"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Download, Eye, Search, ImageIcon, Loader2, AlertTriangle } from "lucide-react"
import PublicLayout from "@/components/public-layout"
import { supabase } from "@/lib/supabase"

// Define interfaces matching lib/document-service.ts
interface Category {
  id: string;
  name: string;
}

interface Document {
  id: string;
  title: string;
  description?: string | null;
  tags?: string[] | null;
  file_path: string | null; 
  file_size?: number | null;
  cover_image_path?: string | null; // <<< Use cover_image_path
  category_id: string;
  created_at: string;
  // Joined data from categories table
  categories: {
    name: string;
  } | null;
  // Add other fields from lib/document-service if needed for display
  // e.g., updated_at, views, downloads, status etc.
}

// Helper function to get public URL for cover images (assuming 'covers' bucket is public)
const getCoverImageUrl = (path: string | null | undefined): string | null => {
  if (!path) return null;
  try {
    const { data } = supabase.storage.from('covers').getPublicUrl(path);
    return data?.publicUrl || null;
  } catch (error) {
    console.error("Error getting public URL for cover:", error);
    return null;
  }
};

// <<< MOVA A FUNÇÃO getFileIcon PARA CÁ >>>
const getFileIcon = (filePath: string | null | undefined) => {
  if (!filePath) return <FileText className="h-5 w-5 text-muted-foreground" />;
  const extension = filePath.split('.').pop()?.toLowerCase();
  if (extension === "pdf") {
     return <FileText className="h-5 w-5 text-red-500" />
  } else if (extension === "docx" || extension === "doc") {
     return <FileText className="h-5 w-5 text-blue-500" />
  } else if (extension === "xlsx" || extension === "xls") {
     return <FileText className="h-5 w-5 text-green-500" />
  } else if (extension === "pptx" || extension === "ppt") {
     return <FileText className="h-5 w-5 text-orange-500" />
  } else if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension || "")) {
     return <ImageIcon className="h-5 w-5 text-purple-500" />
  } else {
    return <FileText className="h-5 w-5 text-muted-foreground" />
  }
}


export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [categories, setCategories] = useState<Category[]>([])
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    filterDocuments()
  }, [categoryFilter, searchTerm, documents])

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name')
        .order('name', { ascending: true });

      if (categoriesError) throw categoriesError;
      setCategories([{ id: "all", name: "Todas as categorias" }, ...categoriesData]);

      // Fetch documents - select file_path and cover_image_path
      const { data: documentsData, error: documentsError } = await supabase
        .from('documents')
        .select(`
          id,
          title,
          description,
          tags,
          file_path,         
          cover_image_path,  
          category_id,
          created_at,
          categories ( name )
          -- Add other fields if needed (e.g., views, downloads)
        `)
        .order('created_at', { ascending: false });

      if (documentsError) throw documentsError;

      setDocuments(documentsData as Document[]);
      setFilteredDocuments(documentsData as Document[]);

    } catch (err: any) {
      console.error("Error loading data:", err);
      // Check for specific Supabase errors if needed
      if (err.message?.includes("column") && err.message?.includes("does not exist")) {
         setError(`Erro de configuração: A coluna ${err.message.split('"')[1]} não existe na tabela 'documents'. Verifique o banco de dados.`);
      } else {
         setError("Não foi possível carregar os dados. Tente novamente mais tarde.");
      }
      setDocuments([]);
      setFilteredDocuments([]);
      setCategories([{ id: "all", name: "Todas as categorias" }]);
    } finally {
      setLoading(false);
    }
  }

  const filterDocuments = () => {
    let filtered = [...documents]

    if (categoryFilter && categoryFilter !== "all") {
      filtered = filtered.filter((doc) => doc.category_id === categoryFilter)
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (doc) =>
          doc.title.toLowerCase().includes(term) ||
          (doc.description && doc.description.toLowerCase().includes(term)) ||
          (doc.tags && doc.tags.some((tag) => tag.toLowerCase().includes(term))) ||
          (doc.categories?.name && doc.categories.name.toLowerCase().includes(term))
      )
    }

    setFilteredDocuments(filtered)
  }

  const handleSearch = () => {
    filterDocuments()
  }

  // --- Download Handler using file_path and Signed URL ---
  const handleDownload = async (doc: Document) => {
    if (!doc.file_path) {
        alert("Arquivo não encontrado para este documento.");
        return;
    }

    try {
        // Generate a signed URL (assuming 'documents' bucket is private or requires auth)
        const expiresIn = 60 * 5; // URL valid for 5 minutes
        const { data, error: urlError } = await supabase.storage
          .from('documents') // Use the correct bucket name
          .createSignedUrl(doc.file_path, expiresIn);

        if (urlError) throw urlError;
        if (!data?.signedUrl) throw new Error("Não foi possível gerar URL de download.");

        const downloadUrl = data.signedUrl;

        // Fetch the file as a blob using the signed URL
        const response = await fetch(downloadUrl);
        if (!response.ok) throw new Error(`Falha ao buscar o arquivo: ${response.statusText}`);
        const blob = await response.blob();

        // Create a temporary link to trigger download
        const link = window.document.createElement('a');
        link.href = URL.createObjectURL(blob);

        // Try to get a filename from the path
        const filename = doc.file_path.substring(doc.file_path.lastIndexOf('/') + 1) || `document-${doc.id}`;
        link.download = filename;

        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
        URL.revokeObjectURL(link.href);

    } catch (error: any) {
        console.error("Download failed:", error);
        alert(`Falha no download do arquivo: ${error.message}`);
    }
  }

  // --- Render Logic ---
  return (
    <PublicLayout title="Documentos" description="Explore nossa coleção de documentos acadêmicos">
      {/* --- Filter/Search UI --- */}
      {/* ... (Filter/Search UI remains the same) ... */}
       <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">Documentos</h2>
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("grid")}
            className="px-2.5"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="7" height="7" x="3" y="3" rx="1" />
              <rect width="7" height="7" x="14" y="3" rx="1" />
              <rect width="7" height="7" x="14" y="14" rx="1" />
              <rect width="7" height="7" x="3" y="14" rx="1" />
            </svg>
            <span className="ml-2">Grid</span>
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
            className="px-2.5"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
            <span className="ml-2">Lista</span>
          </Button>
        </div>
      </div>
      <Card className="mb-6">
        <CardContent className="pt-6">
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

      {/* --- Loading State --- */}
      {/* ... (Loading state remains the same) ... */}
       {loading && (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Carregando documentos...</span>
        </div>
      )}

      {/* --- Error State --- */}
      {/* ... (Error state remains the same) ... */}
       {error && !loading && (
         <Card>
          <CardContent className="flex flex-col items-center justify-center py-10 text-destructive">
            <AlertTriangle className="h-10 w-10" />
            <p className="mt-2 text-center font-medium">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* --- Content Display (Grid/List) --- */}
      {!loading && !error && filteredDocuments.length > 0 ? (
        viewMode === "grid" ? (
          // --- Grid View ---
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredDocuments.map((doc) => {
              // Get the public URL for the cover image
              const coverUrl = getCoverImageUrl(doc.cover_image_path);
              return (
                <Card key={doc.id} className="overflow-hidden flex flex-col h-full">
                  <div className="aspect-video relative bg-muted">
                    {/* Use generated coverUrl */}
                    {coverUrl ? (
                      <img
                        src={coverUrl}
                        alt={doc.title}
                        className="object-cover w-full h-full"
                        onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full bg-secondary/10">
                        {getFileIcon(doc.file_path)}
                        <span className="ml-2 text-sm font-medium">{doc.file_type?.split("/")[1]?.toUpperCase() || 'Arquivo'}</span>
                      </div>
                    )}
                  </div>
                  {/* ... (CardHeader, CardContent with title, description, tags remain the same) ... */}
                   <CardHeader className="pb-2">
                    <div className="space-y-1">
                      <CardTitle className="line-clamp-1">{doc.title}</CardTitle>
                      <CardDescription>Categoria: {doc.categories?.name || "Sem categoria"}</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2 flex-grow">
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
                  <CardContent className="pt-0 pb-4">
                    <div className="flex justify-between items-center">
                      {/* Corrigido para tratar valores nulos/undefined de file_size */}
                      <div className="text-xs text-muted-foreground">
                        {doc.file_size ? `${(doc.file_size / 1024 / 1024).toFixed(2)} MB` : 'Tamanho desconhecido'}
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleDownload(doc)} disabled={!doc.file_path}>
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/documentos/${doc.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            Visualizar
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          // --- List View ---
          <div className="space-y-4">
            {filteredDocuments.map((doc) => {
              // Get the public URL for the cover image
              const coverUrl = getCoverImageUrl(doc.cover_image_path);
              return (
                <div key={doc.id} className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50">
                  <div className="flex items-center space-x-4">
                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                      {/* Use generated coverUrl */}
                      {coverUrl ? (
                        <img
                          src={coverUrl}
                          alt={doc.title}
                          className="h-full w-full object-cover"
                          onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-secondary/10">
                          {getFileIcon(doc.file_path)}
                        </div>
                      )}
                    </div>
                    {/* ... (Rest of the list item content remains the same, using doc.title, doc.description, doc.categories.name, doc.file_size, doc.tags) ... */}
                     <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{doc.title}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-1">{doc.description || "Sem descrição"}</p>
                      <div className="flex items-center text-xs text-muted-foreground mt-1 flex-wrap gap-x-2">
                        <span className="truncate">{doc.categories?.name || "Sem categoria"}</span>
                        <span className="hidden sm:inline">•</span>
                        {/* Corrigido para tratar valores nulos/undefined de file_size */}
                        <span>{doc.file_size ? `${(doc.file_size / 1024 / 1024).toFixed(2)} MB` : 'Tamanho desconhecido'}</span>
                        {doc.tags && doc.tags.length > 0 && (
                          <>
                            <span className="hidden sm:inline">•</span>
                            <div className="flex gap-1">
                              {doc.tags.slice(0, 2).map((tag: string) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {doc.tags.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{doc.tags.length - 2}
                                </Badge>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleDownload(doc)} disabled={!doc.file_path}>
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/documentos/${doc.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        Visualizar
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      // --- No Results State ---
      ) : !loading && !error && (
        // ... (No results state remains the same) ...
         <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <FileText className="h-10 w-10 text-muted-foreground" />
            <p className="mt-2 text-center text-muted-foreground">
              {searchTerm || categoryFilter !== 'all' ? 'Nenhum documento encontrado para os filtros aplicados.' : 'Nenhum documento disponível no momento.'}
            </p>
          </CardContent>
        </Card>
      )}
    </PublicLayout>
  )
}

