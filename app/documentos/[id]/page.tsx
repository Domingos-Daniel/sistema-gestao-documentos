"use client"

import { useEffect, useState } from "react"
// Import useParams
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Download, ArrowLeft, Calendar, Loader2, AlertTriangle, ImageIcon, Sheet, FileSpreadsheet } from "lucide-react"
import PublicLayout from "@/components/public-layout"
import { getDocumentById, getDocumentSignedUrl } from "@/lib/document-service" // <<< Re-add getDocumentSignedUrl for handleDownload
import { supabase } from "@/lib/supabase"
import { DocumentViewer } from "@/components/document-viewer"
import type { Document as DocumentType } from "@/lib/document-service"

// Helper function to get public URL for cover images
const getCoverImageUrl = (path: string | null | undefined): string | null => {
  console.log("Tentando obter URL para o caminho:", path); // Log do caminho recebido
  if (!path) return null;
  try {
    const { data } = supabase.storage.from('covers').getPublicUrl(path);
    console.log("URL pública gerada:", data?.publicUrl); // Log da URL gerada
    return data?.publicUrl || null;
  } catch (error) {
    console.error("Erro ao obter URL pública da capa:", error); // Log de erro
    return null;
  }
};

// Helper function to get file icon based on path extension
const getFileIcon = (filePath: string | null | undefined) => {
    if (!filePath) return <FileText className="h-5 w-5 text-muted-foreground" />;
    const extension = filePath.split('.').pop()?.toLowerCase();
    if (extension === "pdf") {
        return <FileText className="h-5 w-5 text-red-500" />
    } else if (extension === "docx" || extension === "doc") {
        return <FileText className="h-5 w-5 text-blue-500" />
    } else if (extension === "xlsx" || extension === "xls") {
        return <FileSpreadsheet className="h-5 w-5 text-green-500" /> // Use specific icon for sheets
    } else if (extension === "pptx" || extension === "ppt") {
        return <Sheet className="h-5 w-5 text-orange-500" /> // Use specific icon for presentations
    } else if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension || "")) {
        return <ImageIcon className="h-5 w-5 text-purple-500" />
    } else {
        return <FileText className="h-5 w-5 text-muted-foreground" />
    }
}


// Remove params prop from function signature
export default function DocumentPage() {
  // Use the hook to get params
  const params = useParams<{ id: string }>(); // Specify the expected type
  const id = params.id; // Extract id from the hook's result

  const [document, setDocument] = useState<DocumentType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null); // Add error state
  const [isDownloading, setIsDownloading] = useState(false); // State for download button loading
  const router = useRouter()

  useEffect(() => {
    // Check if id is available before loading
    if (id) {
      loadDocument()
    } else {
      // Handle case where id might not be immediately available (optional)
      setError("ID do documento não encontrado na URL.");
      setLoading(false);
    }
  }, [id]) // Depend on id from useParams

  const loadDocument = async () => { // Make it async
    setLoading(true);
    setError(null);
    setDocument(null); // Reset document state
    try {
      // Ensure id is a string before passing
      if (typeof id !== 'string') {
          throw new Error("ID inválido.");
      }
      const doc = await getDocumentById(id); // <<< Use a variável 'id' aqui

      if (!doc) {
        throw new Error("Documento não encontrado");
      }

      console.log("Documento carregado:", doc); // Log document data
      console.log("Caminho da capa:", doc?.cover_image_path); // Log cover path
      setDocument(doc); // Set the document fetched from Supabase

    } catch (err: any) {
      console.error("Error loading document:", err);
      setError(err.message || "Não foi possível carregar o documento.");
      // Optional: Redirect after a delay or show error message permanently
      // setTimeout(() => router.push("/documentos"), 3000);
    } finally {
      setLoading(false);
    }
  }

  // Updated download handler using signed URL
  const handleDownload = async () => {
    if (!document?.file_path || isDownloading) return;

    setIsDownloading(true); // Set downloading state
    try {
        const url = await getDocumentSignedUrl(document.file_path);
        if (!url) throw new Error("Não foi possível obter URL para download.");

        // Fetch the file as a blob using the signed URL
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Falha ao buscar o arquivo: ${response.statusText}`);
        const blob = await response.blob();

        // Create a temporary link to trigger download
        const link = window.document.createElement('a');
        link.href = URL.createObjectURL(blob);

        // Try to get a filename from the path
        const filename = document.file_path.substring(document.file_path.lastIndexOf('/') + 1) || `document-${document.id}`;
        link.download = filename;

        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
        URL.revokeObjectURL(link.href);

    } catch (error: any) {
        console.error("Download failed:", error);
        alert(`Falha no download: ${error.message}`); // Inform user
    } finally {
        setIsDownloading(false); // Reset downloading state
    }
  }

  // --- Loading State ---
  if (loading) {
    return (
      <PublicLayout title="Carregando documento...">
        <div className="flex h-60 items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </PublicLayout>
    )
  }

  // --- Error State ---
  if (error) {
     return (
      <PublicLayout title="Erro">
        <Button variant="outline" onClick={() => router.push("/documentos")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Documentos
        </Button>
        <Card className="mt-4">
          <CardContent className="flex flex-col items-center justify-center py-10 text-destructive">
            <AlertTriangle className="h-10 w-10" />
            <p className="mt-2 text-center font-medium">{error}</p>
          </CardContent>
        </Card>
      </PublicLayout>
    )
  }

  // --- Document Not Found (after loading and no error) ---
  if (!document && !loading) { // Adjusted condition for clarity
    return (
      <PublicLayout title="Documento não encontrado">
        <Button variant="outline" onClick={() => router.push("/documentos")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Documentos
        </Button>
        <Card className="mt-4">
          <CardContent className="flex flex-col items-center justify-center py-10">
            <FileText className="h-10 w-10 text-muted-foreground" />
            <p className="mt-2 text-center text-muted-foreground">O documento solicitado não foi encontrado ou o ID é inválido.</p>
          </CardContent>
        </Card>
      </PublicLayout>
    )
  }

  // --- Render Document Details ---
  // Generate cover image URL using the helper
  const coverUrl = getCoverImageUrl(document.cover_image_path);
  // Get category name from joined data
  const categoryName = document.categories?.name || "Sem categoria";
  // Get filename from path
  const fileName = document.file_path?.substring(document.file_path.lastIndexOf('/') + 1) || "Nome indisponível";
  // Get file size (assuming it exists, otherwise add fallback)
  const fileSizeMB = document.file_size ? (document.file_size / 1024 / 1024).toFixed(2) : "N/D";
  const fileExtension = document.file_path?.split('.').pop()?.toLowerCase();

  // Determine if the file type is viewable
  const isViewable = fileExtension === 'pdf' || fileExtension === 'docx' || fileExtension === 'doc';
  const isSpreadsheet = fileExtension === 'xlsx' || fileExtension === 'xls';

  // Keep this log if helpful for debugging viewer logic
  console.log("Extensão do arquivo:", fileExtension, "É visualizável:", isViewable);

  return (
    <PublicLayout title={document.title} description={`Categoria: ${categoryName}`}>
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" onClick={() => router.push("/documentos")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Documentos
        </Button>
        {/* Disable download if no file path */}
        <Button onClick={handleDownload} disabled={!document.file_path || isDownloading} className="bg-primary hover:bg-primary/90">
          {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
          Download
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div>
                <CardTitle className="text-2xl">{document.title}</CardTitle>
                {/* Use category name from joined data */}
                <CardDescription>Categoria: {categoryName}</CardDescription>
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
                    {/* Use getFileIcon with file_path */}
                    {getFileIcon(document.file_path)}
                    {/* Use filename derived from file_path */}
                    <span className="text-sm truncate" title={fileName}>Arquivo: {fileName}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {/* Use created_at from Supabase */}
                    <span className="text-sm">Data: {new Date(document.created_at).toLocaleDateString("pt-BR")}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    {/* Use file_size from Supabase */}
                    <span className="text-sm">Tamanho: {fileSizeMB} MB</span>
                  </div>
                </div>
              </div>

              {/* Use tags from Supabase */}
              {document.tags && document.tags.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {document.tags.map((tag: string, index: number) => (
                      <Badge key={index} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* --- Conditional Document Viewer --- */}
          {document.file_path ? (
             // SIMPLIFICADO: Apenas renderize DocumentViewer se houver um file_path.
             // Passe o objeto 'document' completo. O viewer cuidará do resto.
             <DocumentViewer document={document} />
          ) : (
            // Mensagem se não houver file_path
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <FileText className="h-10 w-10" />
                <p className="mt-2 text-center">Nenhum arquivo associado a este documento.</p>
              </CardContent>
            </Card>
          )}

        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Capa do Documento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-[3/4] bg-muted rounded-md overflow-hidden">
                {/* Use the generated coverUrl */}
                {coverUrl ? (
                  <img
                    src={coverUrl}
                    alt={document.title}
                    className="w-full h-full object-cover"
                    onError={(e) => (e.currentTarget.src = "/placeholder.svg")} // Fallback
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <ImageIcon className="h-16 w-16 mb-2" /> {/* Use ImageIcon */}
                    <p className="text-sm">Sem capa</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Informações Adicionais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Example: Display file type inferred from icon/path */}
              {/* <div>
                <h4 className="text-sm font-medium">Tipo de Arquivo</h4>
                <p className="text-sm text-muted-foreground">{document.file_path?.split('.').pop()?.toUpperCase() || 'N/D'}</p>
              </div> */}
              <div>
                <h4 className="text-sm font-medium">Data de Publicação</h4>
                <p className="text-sm text-muted-foreground">
                  {new Date(document.created_at).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </p>
              </div>
              {/* Add other fields like views, downloads if fetched */}
            </CardContent>
          </Card>
        </div>
      </div>
    </PublicLayout>
  )
}

