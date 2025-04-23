"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { X, ImageIcon, FileText, ArrowLeft } from "lucide-react"
import { getDocumentById, updateDocument, getCategories, getCategoryById } from "@/lib/storage"
import { SimpleTabs, SimpleTabsList, SimpleTabsTrigger, SimpleTabsContent } from "@/components/ui/simple-tabs"

export default function EditDocumentPage({ params }: { params: { id: string } }) {
  const [document, setDocument] = useState<any>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [currentTag, setCurrentTag] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const coverImageInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const router = useRouter()
  const categories = getCategories()

  useEffect(() => {
    loadDocument()
  }, [params.id])

  const loadDocument = () => {
    try {
      const doc = getDocumentById(params.id)

      if (!doc) {
        throw new Error("Documento não encontrado")
      }

      // Adicionar nome da categoria
      const category = getCategoryById(doc.category)

      const documentWithCategory = {
        ...doc,
        categoryName: category ? category.name : "Sem categoria",
      }

      setDocument(documentWithCategory)
      setTitle(documentWithCategory.title)
      setDescription(documentWithCategory.description || "")
      setCategory(documentWithCategory.category)
      setTags(documentWithCategory.tags || [])
      setCoverImagePreview(documentWithCategory.coverImage || null)
    } catch (error: any) {
      toast({
        title: "Erro ao carregar documento",
        description: error.message,
        variant: "destructive",
      })
      router.push("/admin/documentos")
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]

      // Check file size (limit to 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "O tamanho máximo permitido é 10MB",
          variant: "destructive",
        })
        return
      }

      setFile(selectedFile)
    }
  }

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]

      // Check if it's an image
      if (!selectedFile.type.startsWith("image/")) {
        toast({
          title: "Tipo de arquivo inválido",
          description: "Por favor, selecione uma imagem para a capa",
          variant: "destructive",
        })
        return
      }

      // Check file size (limit to 2MB)
      if (selectedFile.size > 2 * 1024 * 1024) {
        toast({
          title: "Imagem muito grande",
          description: "O tamanho máximo permitido é 2MB",
          variant: "destructive",
        })
        return
      }

      setCoverImage(selectedFile)

      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setCoverImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(selectedFile)
    }
  }

  const addTag = () => {
    if (currentTag && !tags.includes(currentTag)) {
      setTags([...tags, currentTag])
      setCurrentTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUploading(true)

    try {
      // Se tiver um novo arquivo, converter para base64
      if (file) {
        const fileReader = new FileReader()
        fileReader.readAsDataURL(file)

        fileReader.onload = () => {
          const fileContent = fileReader.result as string

          // Processar imagem de capa se existir
          if (coverImage) {
            const coverReader = new FileReader()
            coverReader.readAsDataURL(coverImage)

            coverReader.onload = () => {
              const coverContent = coverReader.result as string

              // Atualizar documento com novo arquivo e capa
              updateDocumentWithChanges(fileContent, coverContent)
            }

            coverReader.onerror = (error) => {
              throw new Error("Erro ao ler a imagem de capa")
            }
          } else {
            // Atualizar documento com novo arquivo e capa existente
            updateDocumentWithChanges(fileContent, coverImagePreview || undefined)
          }
        }

        fileReader.onerror = (error) => {
          throw new Error("Erro ao ler o arquivo")
        }
      } else {
        // Se tiver uma nova capa, mas não um novo arquivo
        if (coverImage) {
          const coverReader = new FileReader()
          coverReader.readAsDataURL(coverImage)

          coverReader.onload = () => {
            const coverContent = coverReader.result as string

            // Atualizar documento com arquivo existente e nova capa
            updateDocumentWithChanges(document.fileContent, coverContent)
          }

          coverReader.onerror = (error) => {
            throw new Error("Erro ao ler a imagem de capa")
          }
        } else {
          // Atualizar documento apenas com os metadados
          updateDocumentWithChanges(document.fileContent, coverImagePreview || undefined)
        }
      }
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar documento",
        description: error.message || "Ocorreu um erro ao atualizar o documento",
        variant: "destructive",
      })
      setIsUploading(false)
    }
  }

  const updateDocumentWithChanges = (fileContent: string, coverContent?: string) => {
    try {
      // Criar documento atualizado
      const updatedDocument = {
        ...document,
        title,
        description,
        category,
        tags,
        fileContent,
        coverImage: coverContent,
        fileName: file ? file.name : document.fileName,
        fileType: file ? file.type : document.fileType,
        fileSize: file ? file.size : document.fileSize,
        updatedAt: new Date().toISOString(),
      }

      // Salvar no localStorage
      updateDocument(updatedDocument)

      toast({
        title: "Documento atualizado",
        description: "O documento foi atualizado com sucesso",
      })

      router.push(`/admin/documentos/${document.id}`)
    } catch (error: any) {
      toast({
        title: "Erro ao salvar documento",
        description: error.message || "Ocorreu um erro ao salvar o documento",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  if (!document) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={() => router.push("/admin/documentos")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Documentos
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <FileText className="h-10 w-10 text-muted-foreground" />
            <p className="mt-2 text-center text-muted-foreground">Documento não encontrado</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Button variant="outline" onClick={() => router.push(`/admin/documentos/${document.id}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para o Documento
        </Button>
        <h1 className="text-3xl font-bold tracking-tight mt-4">Editar Documento</h1>
        <p className="text-muted-foreground">Atualize as informações do documento</p>
      </div>
      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Informações do Documento</CardTitle>
            <CardDescription>Atualize os detalhes do documento</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories
                      .filter((cat) => cat.id && cat.id.trim() !== "")
                      .map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Etiquetas (Tags)</Label>
              <div className="flex space-x-2">
                <Input
                  id="tags"
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  placeholder="Adicione etiquetas"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addTag()
                    }
                  }}
                />
                <Button type="button" onClick={addTag} variant="outline">
                  Adicionar
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <SimpleTabs defaultValue="document" className="w-full">
              <SimpleTabsList className="grid w-full grid-cols-2">
                <SimpleTabsTrigger value="document">Documento</SimpleTabsTrigger>
                <SimpleTabsTrigger value="cover">Imagem de Capa</SimpleTabsTrigger>
              </SimpleTabsList>
              <SimpleTabsContent value="document" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="file">Arquivo do Documento (Opcional)</Label>
                  <div className="flex items-center justify-center w-full">
                    <label
                      htmlFor="file"
                      className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {file ? (
                          <>
                            <FileText className="w-12 h-12 mb-2 text-primary" />
                            <p className="mb-2 text-sm font-medium">{file.name}</p>
                            <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                          </>
                        ) : (
                          <>
                            <FileText className="w-10 h-10 mb-2 text-muted-foreground" />
                            <p className="mb-2 text-sm text-muted-foreground">
                              <span className="font-semibold">Arquivo atual:</span> {document.fileName}
                            </p>
                            <p className="text-xs text-muted-foreground">Clique para substituir o arquivo (Opcional)</p>
                          </>
                        )}
                      </div>
                      <Input id="file" ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
                    </label>
                  </div>
                  {file && (
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setFile(null)
                          if (fileInputRef.current) {
                            fileInputRef.current.value = ""
                          }
                        }}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancelar substituição
                      </Button>
                    </div>
                  )}
                </div>
              </SimpleTabsContent>
              <SimpleTabsContent value="cover" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="coverImage">Imagem de Capa (Opcional)</Label>
                  <div className="flex items-center justify-center w-full">
                    <label
                      htmlFor="coverImage"
                      className="flex flex-col items-center justify-center w-full h-60 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted"
                    >
                      {coverImagePreview ? (
                        <div className="relative w-full h-full">
                          <img
                            src={coverImagePreview || "/placeholder.svg"}
                            alt="Capa do documento"
                            className="object-contain w-full h-full p-2"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute top-2 right-2 bg-background/80 hover:bg-background"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              setCoverImage(null)
                              setCoverImagePreview(null)
                              if (coverImageInputRef.current) {
                                coverImageInputRef.current.value = ""
                              }
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <ImageIcon className="w-10 h-10 mb-2 text-muted-foreground" />
                          <p className="mb-2 text-sm text-muted-foreground">
                            <span className="font-semibold">Clique para adicionar uma capa</span> ou arraste e solte
                          </p>
                          <p className="text-xs text-muted-foreground">Suporta JPG, PNG, GIF (Máx: 2MB)</p>
                        </div>
                      )}
                      <Input
                        id="coverImage"
                        ref={coverImageInputRef}
                        type="file"
                        className="hidden"
                        onChange={handleCoverImageChange}
                        accept="image/*"
                      />
                    </label>
                  </div>
                </div>
              </SimpleTabsContent>
            </SimpleTabs>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => router.push(`/admin/documentos/${document.id}`)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={isUploading}>
              {isUploading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  Salvando...
                </>
              ) : (
                <>Salvar Alterações</>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

