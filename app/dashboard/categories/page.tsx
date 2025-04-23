"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { supabase } from "@/lib/supabase"
import { Folder, Plus, Edit, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useRouter } from "next/navigation"

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<any>(null)
  const [categoryName, setCategoryName] = useState("")
  const [categoryDescription, setCategoryDescription] = useState("")
  const { toast } = useToast()
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from("categories").select("*").order("name")

      if (error) {
        throw error
      }

      setCategories(data || [])
    } catch (error: any) {
      toast({
        title: "Erro ao carregar categorias",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const openAddDialog = () => {
    setCategoryName("")
    setCategoryDescription("")
    setIsAddDialogOpen(true)
  }

  const openEditDialog = (category: any) => {
    setSelectedCategory(category)
    setCategoryName(category.name)
    setCategoryDescription(category.description || "")
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (category: any) => {
    setSelectedCategory(category)
    setIsDeleteDialogOpen(true)
  }

  const handleAddCategory = async () => {
    if (!categoryName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, informe um nome para a categoria",
        variant: "destructive",
      })
      return
    }

    try {
      const { data, error } = await supabase
        .from("categories")
        .insert([
          {
            name: categoryName,
            description: categoryDescription,
            created_by: user?.id,
          },
        ])
        .select()

      if (error) {
        throw error
      }

      setCategories([...categories, data[0]])

      toast({
        title: "Categoria adicionada",
        description: "A categoria foi adicionada com sucesso",
      })

      setIsAddDialogOpen(false)
    } catch (error: any) {
      toast({
        title: "Erro ao adicionar categoria",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleEditCategory = async () => {
    if (!categoryName.trim() || !selectedCategory) {
      return
    }

    try {
      const { error } = await supabase
        .from("categories")
        .update({
          name: categoryName,
          description: categoryDescription,
        })
        .eq("id", selectedCategory.id)

      if (error) {
        throw error
      }

      setCategories(
        categories.map((cat) =>
          cat.id === selectedCategory.id ? { ...cat, name: categoryName, description: categoryDescription } : cat,
        ),
      )

      toast({
        title: "Categoria atualizada",
        description: "A categoria foi atualizada com sucesso",
      })

      setIsEditDialogOpen(false)
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar categoria",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleDeleteCategory = async () => {
    if (!selectedCategory) return

    try {
      // Check if category is in use
      const { count, error: countError } = await supabase
        .from("documents")
        .select("*", { count: "exact", head: true })
        .eq("category", selectedCategory.id)

      if (countError) {
        throw countError
      }

      if (count && count > 0) {
        toast({
          title: "Categoria em uso",
          description: `Esta categoria está sendo usada por ${count} documentos e não pode ser excluída`,
          variant: "destructive",
        })
        setIsDeleteDialogOpen(false)
        return
      }

      const { error } = await supabase.from("categories").delete().eq("id", selectedCategory.id)

      if (error) {
        throw error
      }

      setCategories(categories.filter((cat) => cat.id !== selectedCategory.id))

      toast({
        title: "Categoria excluída",
        description: "A categoria foi excluída com sucesso",
      })

      setIsDeleteDialogOpen(false)
    } catch (error: any) {
      toast({
        title: "Erro ao excluir categoria",
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categorias</h1>
          <p className="text-muted-foreground">Gerencie as categorias de documentos</p>
        </div>
        <Button onClick={openAddDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Categoria
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categories.length > 0 ? (
          categories.map((category) => (
            <Card key={category.id}>
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

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
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
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddCategory}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
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
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditCategory}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
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

