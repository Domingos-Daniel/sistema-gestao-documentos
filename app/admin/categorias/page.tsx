"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Folder, Plus, Edit, Trash2, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
// Import Supabase functions instead of local storage functions
import {
  getAllCategories,
  addCategory as addCategorySupabase, // Rename to avoid conflict
  updateCategory as updateCategorySupabase, // Rename
  deleteCategory as deleteCategorySupabase, // Rename
} from "@/lib/category-service"
import { getAllDocuments } from "@/lib/document-service" // For checking usage

// Define the Category type based on your Supabase table
interface Category {
  id: string;
  name: string;
  description?: string | null; // Match Supabase schema (can be null)
  created_at?: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]) // Use the Category type
  const [isLoading, setIsLoading] = useState(true) // Add loading state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null) // Use Category type
  const [categoryName, setCategoryName] = useState("")
  const [categoryDescription, setCategoryDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false) // Add this state
  const { toast } = useToast()

  useEffect(() => {
    loadCategories()
  }, [])

  // Make loadCategories async
  const loadCategories = async () => {
    setIsLoading(true)
    try {
      const cats = await getAllCategories()
      setCategories(cats || [])
    } catch (error) {
      console.error("Failed to load categories:", error)
      toast({
        title: "Erro ao carregar categorias",
        description: "Não foi possível buscar as categorias.",
        variant: "destructive",
      })
      setCategories([])
    } finally {
      setIsLoading(false)
    }
  }

  const openAddDialog = () => {
    setCategoryName("")
    setCategoryDescription("")
    setIsAddDialogOpen(true)
  }

  const openEditDialog = (category: Category) => { // Use Category type
    setSelectedCategory(category)
    setCategoryName(category.name)
    setCategoryDescription(category.description || "")
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (category: Category) => { // Use Category type
    setSelectedCategory(category)
    setIsDeleteDialogOpen(true)
  }

  // Make handleAddCategory async
  const handleAddCategory = async () => {
    if (!categoryName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, informe um nome para a categoria",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true) // Set loading true
    try {
      // Supabase handles ID generation
      const newCategoryData = {
        name: categoryName.trim(),
        description: categoryDescription.trim() || null, // Send null if empty
      }

      await addCategorySupabase(newCategoryData) // Call Supabase function
      await loadCategories() // Reload categories from Supabase

      toast({
        title: "Categoria adicionada",
        description: "A categoria foi adicionada com sucesso",
      })

      setIsAddDialogOpen(false)
    } catch (error: any) {
      console.error("Error adding category:", error)
      toast({
        title: "Erro ao adicionar categoria",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false) // Set loading false
    }
  }

  // Make handleEditCategory async
  const handleEditCategory = async () => {
    if (!categoryName.trim() || !selectedCategory) {
      return
    }

    setIsSubmitting(true) // Set loading true
    try {
      const updatedCategoryData = {
        name: categoryName.trim(),
        description: categoryDescription.trim() || null, // Send null if empty
      }

      await updateCategorySupabase(selectedCategory.id, updatedCategoryData) // Call Supabase function
      await loadCategories() // Reload

      toast({
        title: "Categoria atualizada",
        description: "A categoria foi atualizada com sucesso",
      })

      setIsEditDialogOpen(false)
      setSelectedCategory(null) // Clear selection
    } catch (error: any) {
      console.error("Error updating category:", error)
      toast({
        title: "Erro ao atualizar categoria",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false) // Set loading false
    }
  }

  // Make handleDeleteCategory async
  const handleDeleteCategory = async () => {
    if (!selectedCategory) return

    try {
      // Check if the category is in use by querying Supabase documents
      const documents = await getAllDocuments()
      const inUse = documents.some((doc: any) => doc.category_id === selectedCategory.id)

      if (inUse) {
        toast({
          title: "Categoria em uso",
          description: "Esta categoria está sendo usada por documentos e não pode ser excluída",
          variant: "destructive",
        })
        setIsDeleteDialogOpen(false)
        return
      }

      await deleteCategorySupabase(selectedCategory.id) // Call Supabase function
      await loadCategories() // Reload

      toast({
        title: "Categoria excluída",
        description: "A categoria foi excluída com sucesso",
      })

      setIsDeleteDialogOpen(false)
      setSelectedCategory(null) // Clear selection
    } catch (error: any) {
      console.error("Error deleting category:", error)
      toast({
        title: "Erro ao excluir categoria",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      })
    }
  }

  // --- Render Logic (Add loading state handling) ---
  return (
    <div className="space-y-6">
      {/* ... (Header and Add Button remain the same) ... */}
       <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categorias</h1>
          <p className="text-muted-foreground">Gerencie as categorias de documentos</p>
        </div>
        <Button onClick={openAddDialog} className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          Nova Categoria
        </Button>
      </div>

      {isLoading ? (
         <p>Carregando categorias...</p> // Show loading indicator
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {categories.length > 0 ? (
            categories.map((category) => (
              <Card key={category.id}>
                {/* ... Card content remains the same ... */}
                 <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <CardTitle>{category.name}</CardTitle>
                        <CardDescription>{category.description || "Sem descrição"}</CardDescription>
                    </div>
                    <div className="flex items-center">
                        <Folder className="h-5 w-5 text-muted-foreground" />
                    </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-4">
                    <div className="flex justify-end space-x-2">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(category)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openDeleteDialog(category)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                    </Button>
                    </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="col-span-full">
               {/* ... Empty state remains the same ... */}
               <CardContent className="flex flex-col items-center justify-center py-10">
                <Folder className="h-10 w-10 text-muted-foreground" />
                <p className="mt-2 text-center text-muted-foreground">Nenhuma categoria encontrada</p>
                <Button onClick={openAddDialog} className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Categoria
                </Button>
                </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* --- Dialogs (remain mostly the same, ensure button handlers call the async functions) --- */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
         {/* ... Add Dialog content ... */}
          <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Categoria</DialogTitle>
            <DialogDescription>Crie uma nova categoria para organizar documentos</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" value={categoryName} onChange={(e) => setCategoryName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                value={categoryDescription}
                onChange={(e) => setCategoryDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button onClick={handleAddCategory} disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
         {/* ... Edit Dialog content ... */}
          <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Categoria</DialogTitle>
            <DialogDescription>Atualize as informações da categoria</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome</Label>
              <Input id="edit-name" value={categoryName} onChange={(e) => setCategoryName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Descrição</Label>
              <Input
                id="edit-description"
                value={categoryDescription}
                onChange={(e) => setCategoryDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button onClick={handleEditCategory} disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
         {/* ... Delete Dialog content ... */}
          <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a categoria &quot;{selectedCategory?.name}&quot;? Esta ação não pode ser
              desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteCategory}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

