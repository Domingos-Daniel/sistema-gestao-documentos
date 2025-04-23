"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { supabase } from "@/lib/supabase"
import { Upload, X, FileText, ImageIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { SimpleTabs, SimpleTabsList, SimpleTabsTrigger, SimpleTabsContent } from "@/components/ui/simple-tabs"
import { uploadFileToStorage, isAllowedFileType, isImageFile } from "@/lib/file-upload-service"

export default function UploadPage() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [currentTag, setCurrentTag] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const coverImageInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const { user } = useAuth()
  const router = useRouter()

  const [categories, setCategories] = useState([
    { id: "course", name: "Curso" },
    { id: "discipline", name: "Disciplina" },
    { id: "research", name: "Pesquisa" },
    { id: "article", name: "Artigo" },
    { id: "thesis", name: "Tese" },
    { id: "other", name: "Outro" },
  ])

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

      // Check file type
      if (!isAllowedFileType(selectedFile)) {
        toast({
          title: "Tipo de arquivo não permitido",
          description: "Por favor, selecione um arquivo PDF, Word ou Excel",
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
      if (!isImageFile(selectedFile)) {
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

    if (!file) {
      toast({
        title: "Arquivo não selecionado",
        description: "Por favor, selecione um arquivo para upload",
        variant: "destructive",
      })
      return
    }

    if (!title || !category) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)

    try {
      // Upload do arquivo principal para o Supabase Storage
      const fileResult = await uploadFileToStorage(file, "documents", user?.id)

      // Upload da imagem de capa (se existir)
      let coverImagePath = null
      let coverImageUrl = null

      if (coverImage) {
        const coverResult = await uploadFileToStorage(coverImage, "covers", user?.id)
        coverImagePath = coverResult.path
        coverImageUrl = coverResult.url
      }

      // Criar documento no banco de dados
      const { data, error } = await supabase
        .from("documents")
        .insert([
          {
            title,
            description,
            category,
            tags,
            file_path: fileResult.path,
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
            file_url: fileResult.url,
            cover_image_path: coverImagePath,
            cover_image_url: coverImageUrl,
            user_id: user?.id,
          },
        ])
        .select()

      if (error) {
        throw error
      }

      toast({
        title: "Upload concluído",
        description: "Seu documento foi enviado com sucesso",
      })

      router.push("/dashboard/documents")
    } catch (error: any) {
      toast({
        title: "Erro no upload",
        description: error.message || "Ocorreu um erro ao enviar o documento",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Upload de Documento</h1>
        <p className="text-muted-foreground">Envie um novo documento para o repositório</p>
      </div>
      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Informações do Documento</CardTitle>
            <CardDescription>Preencha os detalhes do documento que você está enviando</CardDescription>
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
                    {categories.map((cat) => (
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
                  <Label htmlFor="file">Arquivo do Documento</Label>
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
                            <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                            <p className="mb-2 text-sm text-muted-foreground">
                              <span className="font-semibold">Clique para fazer upload</span> ou arraste e solte
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Formatos aceitos: PDF, Word, Excel (Máx: 10MB)
                            </p>
                          </>
                        )}
                      </div>
                      <Input
                        id="file"
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={handleFileChange}
                        required
                      />
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
                        Remover arquivo
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
            <Button type="button" variant="outline" onClick={() => router.push("/dashboard/documents")}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isUploading}>
              {isUploading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  Enviando...
                </>
              ) : (
                "Enviar Documento"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

