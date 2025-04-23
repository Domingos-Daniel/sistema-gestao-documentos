"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Folder, Loader2, AlertTriangle } from "lucide-react" // Add Loader2 and AlertTriangle
import PublicLayout from "@/components/public-layout"
import { supabase } from "@/lib/supabase" // Import Supabase client

// Interface for Category data from Supabase
interface Category {
  id: string;
  name: string;
  description?: string | null; // Make description optional
  created_at: string;
  // Add other fields if they exist in your 'categories' table
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true); // Add loading state
  const [error, setError] = useState<string | null>(null); // Add error state

  useEffect(() => {
    loadCategories()
  }, [])

  // Fetch categories from Supabase
  const loadCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('categories') // Your categories table name
        .select('*')        // Select all columns or specify needed ones: 'id, name, description'
        .order('name', { ascending: true }); // Order alphabetically by name

      if (error) {
        throw error;
      }

      setCategories(data || []); // Set fetched data or empty array

    } catch (err: any) {
      console.error("Error loading categories:", err);
      setError("Não foi possível carregar as categorias.");
    } finally {
      setLoading(false);
    }
  }

  // --- Loading State ---
  if (loading) {
    return (
      <PublicLayout title="Carregando Categorias..." description="Buscando categorias...">
        <div className="flex h-60 items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </PublicLayout>
    )
  }

  // --- Error State ---
  if (error) {
     return (
      <PublicLayout title="Erro" description="Falha ao carregar">
        <Card className="col-span-full">
          <CardContent className="flex flex-col items-center justify-center py-10 text-destructive">
            <AlertTriangle className="h-10 w-10" />
            <p className="mt-2 text-center font-medium">{error}</p>
            <Button variant="outline" size="sm" onClick={loadCategories} className="mt-4">
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </PublicLayout>
    )
  }

  return (
    <PublicLayout title="Categorias" description="Explore documentos por categorias">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"> {/* Adjusted grid for responsiveness */}
        {categories.length > 0 ? (
          categories.map((category) => (
            <Card key={category.id} className="flex flex-col justify-between hover:shadow-md transition-shadow"> {/* Added hover effect */}
              <CardHeader className="pb-3"> {/* Adjusted padding */}
                <div className="flex items-start justify-between space-x-4">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-lg">{category.name}</CardTitle> {/* Slightly larger title */}
                    <CardDescription className="text-sm line-clamp-2"> {/* Limit description lines */}
                      {category.description || "Sem descrição"}
                    </CardDescription>
                  </div>
                  <Folder className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
                </div>
              </CardHeader>
              <CardContent>
                {/* Removed document count as it's not fetched here */}
                <Button variant="outline" size="sm" className="w-full" asChild>
                  {/* Link to documents page, filtering by category ID */}
                  <Link href={`/documentos?category=${category.id}`}>
                    Ver Documentos
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))
        ) : (
          // --- No Categories Found State ---
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-16"> {/* Increased padding */}
              <Folder className="h-12 w-12 text-muted-foreground mb-3" /> {/* Larger icon */}
              <p className="text-center text-muted-foreground">Nenhuma categoria encontrada.</p>
              <p className="text-sm text-center text-muted-foreground">Crie categorias no painel de administração.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </PublicLayout>
  )
}

