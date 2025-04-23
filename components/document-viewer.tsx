"use client"

import { useState, useEffect } from 'react';
import { getDocumentSignedUrl } from '@/lib/document-service'; // Import the new function
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, Download, FileWarning } from 'lucide-react';

// Define the expected structure of the document prop
interface Document {
  id: string;
  title: string;
  file_path: string; // Path in Supabase Storage
  // Add other relevant properties if needed
}

interface DocumentViewerProps {
  document: Document | null;
}

export function DocumentViewer({ document }: DocumentViewerProps) {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileExtension, setFileExtension] = useState<string | null>(null);

  useEffect(() => {
    // Reset state when document changes or is null
    setFileUrl(null);
    setIsLoading(true);
    setError(null);
    setFileExtension(null);

    // --- Add Logging ---
    console.log("DocumentViewer - Received document:", document);

    if (document?.file_path) {
      const path = document.file_path;
      console.log("DocumentViewer - File path:", path); // Log the path

      // Extract file extension
      const extension = path.split('.').pop()?.toLowerCase() || '';
      console.log("DocumentViewer - Extracted extension:", extension); // Log the extension
      setFileExtension(extension);

      const fetchUrl = async () => {
        try {
          console.log("DocumentViewer - Fetching signed URL for:", path); // Log before fetch
          const url = await getDocumentSignedUrl(path);
          console.log("DocumentViewer - Fetched URL:", url); // Log the result URL

          if (url) {
            setFileUrl(url);
          } else {
            setError('Não foi possível obter o URL seguro para o arquivo.');
            console.error("DocumentViewer - getDocumentSignedUrl returned null or undefined");
          }
        } catch (err: any) {
          console.error("DocumentViewer - Error fetching signed URL:", err);
          setError(err.message || 'Erro ao buscar URL do arquivo.');
        } finally {
          setIsLoading(false);
        }
      };
      fetchUrl();
    } else {
      console.log("DocumentViewer - No document or file_path provided.");
      setIsLoading(false); // No document or path provided
      // Optionally set an error or message if document/path is expected but missing
      // setError('Informações do documento ou caminho do arquivo ausentes.');
    }
  }, [document]); // Dependency array: re-run effect if document changes

  // --- Render Loading State ---
  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Carregando visualização...
      </div>
    );
  }

  // --- Render Error State ---
  if (error) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-md border border-destructive/50 bg-destructive/10 p-6 text-center text-destructive">
        <AlertTriangle className="mb-2 h-8 w-8" />
        <p className="font-semibold">Erro ao carregar documento</p>
        <p className="text-sm">{error}</p>
        {/* Optionally offer download if URL might exist despite error */}
        {document?.file_path && (
             <Button variant="destructive" size="sm" asChild className="mt-4">
                <a href={fileUrl || '#'} download={document?.title || 'documento'}>
                    <Download className="mr-2 h-4 w-4" /> Tentar Download
                </a>
            </Button>
        )}
      </div>
    );
  }

  // --- Add Logging before the check ---
  console.log("DocumentViewer - Rendering check: fileUrl=", fileUrl, "fileExtension=", fileExtension);

  // --- Render No File State ---
  if (!fileUrl || !fileExtension) {
    return (
      <div className="flex h-64 items-center justify-center rounded-md border border-dashed text-muted-foreground">
        Nenhum arquivo para visualizar ou tipo de arquivo não determinado.
      </div>
    );
  }

  // --- Render Based on File Type ---
  switch (fileExtension) {
    case 'pdf':
      console.log("DocumentViewer - Rendering PDF iframe for:", fileUrl); // Log before rendering PDF
      return (
        <iframe
          src={fileUrl}
          className="h-[75vh] w-full border rounded-md" // Added border and rounded corners
          title={`Visualizador: ${document?.title}`}
          // Consider adding sandbox attribute for enhanced security if embedding external PDFs
          // sandbox="allow-scripts allow-same-origin"
        />
      );

    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'webp':
    case 'svg':
      // Render images directly
      return (
        <div className="flex justify-center p-4 border rounded-md bg-muted/20">
          <img
            src={fileUrl}
            alt={`Pré-visualização de ${document?.title}`}
            className="max-h-[75vh] max-w-full rounded object-contain"
          />
        </div>
      );

    case 'docx':
    case 'doc':
    case 'pptx':
    case 'ppt':
    case 'xlsx':
    case 'xls':
      // Fallback for Office documents: Message + Download link
      return (
        <div className="flex h-64 flex-col items-center justify-center rounded-md border border-dashed p-6 text-center">
          <FileWarning className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="mb-1 font-medium">Pré-visualização Indisponível</p>
          <p className="mb-4 text-sm text-muted-foreground">
            A pré-visualização para arquivos <span className='font-mono text-xs bg-muted px-1 py-0.5 rounded'>.{fileExtension}</span> não é suportada diretamente.
          </p>
          <Button variant="default" size="sm" asChild>
            <a href={fileUrl} download={document?.title || `documento.${fileExtension}`}>
              <Download className="mr-2 h-4 w-4" /> Baixar Arquivo (.
              {fileExtension})
            </a>
          </Button>
        </div>
      );

    default:
      // Fallback for other unsupported types
      return (
        <div className="flex h-64 flex-col items-center justify-center rounded-md border border-dashed p-6 text-center">
           <FileWarning className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="mb-1 font-medium">Tipo de Arquivo Não Suportado</p>
          <p className="mb-4 text-sm text-muted-foreground">
            Não há pré-visualização disponível para arquivos do tipo <span className='font-mono text-xs bg-muted px-1 py-0.5 rounded'>.{fileExtension}</span>.
          </p>
          <Button variant="outline" size="sm" asChild>
            <a href={fileUrl} download={document?.title || `documento.${fileExtension}`}>
              <Download className="mr-2 h-4 w-4" /> Baixar Arquivo (.
              {fileExtension})
            </a>
          </Button>
        </div>
      );
  }
}

