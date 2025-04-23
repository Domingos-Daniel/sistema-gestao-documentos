"use client"

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Loader2, FileText, Search } from "lucide-react"; // Import icons
import { getAllDocuments } from "@/lib/document-service"; // Assuming Document type is exported or define it here
import type { Document } from "@/lib/document-service"; // Import the Document type
import { useToast } from "@/hooks/use-toast";

// Define Document type if not imported (ensure it matches your service)
// interface Document {
//   id: string;
//   title: string;
//   description?: string | null;
//   created_at: string;
//   categories?: { name: string } | null; // Based on your select query
//   // Add other fields as needed
// }

export default function DocumentsPage() {
  // --- Initialize documents state with an empty array ---
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    const loadDocuments = async () => {
      setLoading(true);
      try {
        const fetchedDocuments = await getAllDocuments();
        // Ensure fetchedDocuments is always an array before setting state
        setDocuments(Array.isArray(fetchedDocuments) ? fetchedDocuments : []);
      } catch (error: any) {
        console.error("Erro ao carregar documentos:", error);
        setDocuments([]); // Set to empty array on error
        toast({
          title: "Erro ao carregar documentos",
          description: error.message || "Não foi possível buscar os documentos.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadDocuments();
  }, [toast]); // Add toast as dependency if used inside effect

  // --- Filtering Logic ---
  // Ensure documents is an array before filtering
  const filteredDocuments = Array.isArray(documents) ? documents.filter((doc) => {
    // Check if properties exist before using includes
    const titleMatch = doc.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const descriptionMatch = doc.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const categoryMatch = doc.categories?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    // Add other fields to search if needed (e.g., tags)

    return searchTerm === "" || titleMatch || descriptionMatch || categoryMatch;
  }) : []; // Return empty array if documents is not an array

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Documentos</h2>
        <Button asChild>
          <Link href="/admin/upload">
            <PlusCircle className="mr-2 h-4 w-4" /> Novo Documento
          </Link>
        </Button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar por título, descrição, categoria..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10"
        />
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Document List / Grid */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.length > 0 ? (
            filteredDocuments.map((doc) => (
              <Card key={doc.id} className="overflow-hidden hover:shadow-md transition-shadow">
                {/* Optional: Add cover image here */}
                <CardHeader>
                  <CardTitle className="truncate text-lg" title={doc.title}>
                    <Link href={`/admin/documentos/${doc.id}`} className="hover:underline">
                      <FileText className="inline-block mr-2 h-5 w-5 align-text-bottom text-muted-foreground" />
                      {doc.title}
                    </Link>
                  </CardTitle>
                  {/* Optional: Add category badge */}
                  {doc.categories?.name && (
                    <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                      {doc.categories.name}
                    </span>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {doc.description || "Sem descrição"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Criado em: {new Date(doc.created_at).toLocaleDateString()}
                  </p>
                </CardContent>
                {/* Optional: Add CardFooter with actions */}
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-10 text-muted-foreground">
              {searchTerm ? "Nenhum documento encontrado para sua busca." : "Nenhum documento cadastrado ainda."}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

