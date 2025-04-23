"use client"

// Import 'use' from React
import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Pencil, ArrowLeft, Trash2, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { DocumentViewer } from "@/components/document-viewer"
import { getDocumentById, deleteDocument } from "@/lib/document-service"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface Document {
  id: string;
  title: string;
  description?: string | null;
  file_path: string;
  cover_image_path?: string | null;
  category_id?: string;
  author_id?: string;
  tags?: string[];
  created_at: string;
  updated_at?: string;
  categories?: { name: string } | null;
}

// Accept the Promise<params> type
export default function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  // --- Unwrap params using React.use ---
  const resolvedParams = use(params);
  const documentId = resolvedParams.id; // Get the id from the resolved params

  const [document, setDocument] = useState<Document | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // Use the resolved documentId directly
    console.log("DocumentPage useEffect - ID:", documentId, "Type:", typeof documentId);

    const fetchDocument = async () => {
      if (!documentId || typeof documentId !== 'string') {
        console.error("Invalid or missing document ID:", documentId);
        toast({ title: "ID inválido", description: "O ID do documento é inválido ou está faltando.", variant: "destructive" });
        router.push("/admin/documentos");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        console.log("Fetching document with ID:", documentId);
        // Use the resolved documentId
        const doc = await getDocumentById(documentId);

        if (!doc) {
          toast({
            title: "Documento não encontrado",
            description: "O documento solicitado não existe ou foi removido.",
            variant: "destructive",
          })
          router.push("/admin/documentos")
          return;
        }
        setDocument(doc as Document)
      } catch (error: any) {
        console.error("Erro ao buscar documento:", error)
        toast({
          title: "Erro ao carregar documento",
          description: error.message || "Ocorreu um erro ao carregar os detalhes do documento.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    };

    fetchDocument();

  // Update dependency array to use the resolved documentId
  }, [documentId, router, toast]);

  const handleDelete = async () => {
    // ... (handleDelete logic remains the same, using document.id) ...
    if (!document) return;

    setIsDeleting(true);
    try {
      await deleteDocument(document.id) // Use document.id here

      toast({
        title: "Documento excluído",
        description: `"${document.title}" foi excluído com sucesso.`,
      })
      router.push("/admin/documentos")

    } catch (error: any) {
      console.error("Erro ao excluir documento:", error)
      toast({
        title: "Erro ao excluir documento",
        description: error.message || "Ocorreu um erro inesperado ao tentar excluir o documento.",
        variant: "destructive",
      })
      setIsDeleting(false);
    }
  }

  // --- Render Logic (remains the same) ---
  if (loading) {
    // ... loading JSX ...
    return (
        <div className="flex h-[calc(100vh-200px)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )
  }

  if (!document) {
    // ... not found JSX ...
    return (
        <div className="space-y-6">
          <Button variant="outline" size="icon" asChild>
            <Link href="/admin/documentos">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Voltar</span>
            </Link>
          </Button>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <p className="mt-2 text-center text-muted-foreground">Documento não encontrado ou erro ao carregar.</p>
            </CardContent>
          </Card>
        </div>
      )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/admin/documentos">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Voltar</span>
            </Link>
          </Button>
          <h2 className="text-2xl font-bold truncate" title={document.title}>{document.title}</h2>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" asChild>
            {/* Use resolved documentId or document.id */}
            <Link href={`/admin/documentos/edit/${document.id}`}>
              <Pencil className="mr-2 h-4 w-4" /> Editar
            </Link>
          </Button>
          {/* Delete Dialog */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isDeleting}>
                {isDeleting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Excluir
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. Isso excluirá permanentemente o documento &quot;{document.title}&quot;.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                  {isDeleting ? "Excluindo..." : "Excluir"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Document Viewer */}
      <Card>
        <CardContent className="p-0 md:p-6">
          <DocumentViewer document={document} />
        </CardContent>
        {/* Details */}
        <CardContent className="p-6 border-t">
            <h3 className="font-semibold mb-2">Detalhes</h3>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {document.description && (
                    <div>
                        <dt className="text-muted-foreground">Descrição</dt>
                        <dd>{document.description}</dd>
                    </div>
                )}
                 {document.categories && (
                    <div>
                        <dt className="text-muted-foreground">Categoria</dt>
                        <dd>{document.categories.name}</dd>
                    </div>
                )}
                {document.tags && document.tags.length > 0 && (
                     <div>
                        <dt className="text-muted-foreground">Tags</dt>
                        <dd className="flex flex-wrap gap-1">
                            {document.tags.map(tag => <span key={tag} className="px-2 py-0.5 bg-muted text-muted-foreground rounded text-xs">{tag}</span>)}
                        </dd>
                    </div>
                )}
                 <div>
                    <dt className="text-muted-foreground">Criado em</dt>
                    <dd>{new Date(document.created_at).toLocaleDateString()}</dd>
                </div>
                 {document.updated_at && (
                    <div>
                        <dt className="text-muted-foreground">Atualizado em</dt>
                        <dd>{new Date(document.updated_at).toLocaleDateString()}</dd>
                    </div>
                 )}
            </dl>
        </CardContent>
      </Card>
    </div>
  )
}

