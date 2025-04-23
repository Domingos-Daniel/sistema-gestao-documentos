"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react" // Add useEffect here
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { FileText, X, Upload, ImageIcon, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/use-auth"
import { createDocument, uploadDocumentFile, uploadCoverImage } from "@/lib/document-service"
import { getAllCategories } from "@/lib/category-service"
import {
  Tabs as SimpleTabs,
  TabsContent as SimpleTabsContent,
  TabsList as SimpleTabsList,
  TabsTrigger as SimpleTabsTrigger,
} from "@/components/ui/tabs"

export default function UploadPage() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const { toast } = useToast()
  const router = useRouter()
  const { user } = useAuth()

  const [category, setCategory] = useState("")
  const [currentTag, setCurrentTag] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const coverImageInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const fetchedCategories = await getAllCategories();
        setCategories(fetchedCategories || []); // Set the actual array data
      } catch (error) {
        console.error("Failed to fetch categories:", error);
        toast({
          title: "Erro ao carregar categorias",
          description: "Não foi possível buscar as categorias do banco de dados.",
          variant: "destructive",
        });
        setCategories([]); // Set to empty array on error
      }
    };

    fetchCategories();
  }, [toast]); // Add toast to dependency array if used inside useEffect

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()])
      setNewTag("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // --- Prevent multiple submissions ---
    if (isUploading || !file) { // Ensure file exists
      console.log("Submission already in progress, preventing duplicate.");
      return; // Exit if already submitting
    }
    // --- End prevention ---

    // Basic validation (add file check)
    if (!title || !description || !categoryId || !file) { // Ensure file is checked
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios e selecione o arquivo do documento.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true); // Set loading state immediately

    try {
      // --- Sanitize the filename ---
      const originalFileName = file.name;
      // Replace spaces with underscores and remove potentially problematic characters
      // This is a basic sanitization, you might need a more robust function
      const sanitizedFileName = originalFileName
        .replace(/ /g, '_') // Replace spaces with underscores
        .replace(/[^a-zA-Z0-9._-]/g, ''); // Remove characters not alphanumeric, dot, underscore, hyphen

      // --- Use the sanitized name in the path ---
      const filePath = `${user?.id || 'unknown'}/${Date.now()}-${sanitizedFileName}`;
      console.log("Uploading document with path:", filePath); // Log the sanitized path

      await uploadDocumentFile(file, filePath);
      console.log("Document file uploaded:", filePath);

      // 2. Upload Cover Image (if exists) - Sanitize cover image name too
      let coverPath: string | null = null;
      if (coverImage) {
        const originalCoverName = coverImage.name;
        const sanitizedCoverName = originalCoverName
          .replace(/ /g, '_')
          .replace(/[^a-zA-Z0-9._-]/g, '');
        coverPath = `${user?.id || 'unknown'}/covers/${Date.now()}-${sanitizedCoverName}`;
        console.log("Uploading cover with path:", coverPath);
        await uploadCoverImage(coverImage, coverPath);
        console.log("Cover image uploaded:", coverPath);
      }

      // --- Ensure filePath and coverPath are passed here ---
      const newDocumentData = {
        title,
        description,
        category_id: categoryId,
        tags,
        author_id: user?.id,
        file_path: filePath, // Pass the storage path
        cover_image_path: coverPath, // Pass the cover image path
        // ... other fields
      };

      await createDocument(newDocumentData); // Call the service function

      // 3. Create Document Record in Database
      console.log("Creating document record in DB...");
      const newDocument = await createDocument({
        title,
        description,
        category_id: categoryId,
        tags,
        author_id: user?.id, // Use the actual logged-in user's ID
        file_path: filePath, // Store the path from Supabase Storage
        cover_image_path: coverPath, // Store the cover path
        // Add other relevant fields like status, version etc. if needed
      });
      console.log("Document record created:", newDocument);

      toast({
        title: "Documento criado",
        description: "O documento foi enviado e registrado com sucesso.",
      });

      // Clear form or redirect
      // Example: Reset state variables
      // setTitle("");
      // setDescription("");
      // setCategoryId("");
      // setTags([]);
      // setFile(null);
      // setCoverImage(null);
      // setFilePreview(null);
      // setCoverImagePreview(null);

      // Example: Redirect to document list or detail page
      router.push(`/admin/documentos`); // Adjust path as needed

    } catch (error: any) {
      console.error("Erro ao criar documento:", error);
      toast({
        title: "Erro ao criar documento",
        description: error.message || "Ocorreu um erro ao processar o envio. Verifique os logs.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false); // Reset loading state regardless of success or error
    }
  }

  const addTag = () => {
    if (currentTag.trim() !== "") {
      setTags([...tags, currentTag.trim()])
      setCurrentTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files && event.target.files[0]
    if (selectedFile) {
      setFile(selectedFile)
    }
  }

  const handleCoverImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files && event.target.files[0]
    if (selectedFile) {
      setCoverImage(selectedFile)
      const reader = new FileReader()
      reader.onloadend = () => {
        setCoverImagePreview(reader.result as string)
      }
      reader.readAsDataURL(selectedFile)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Criar Documento</h2>
        <p className="text-muted-foreground">Adicione um novo documento ao sistema</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Informações do Documento</CardTitle>
            <CardDescription>Preencha os campos abaixo com as informações do documento</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Select value={categoryId} onValueChange={setCategoryId} required>
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

            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-md border border-blue-200 dark:border-blue-800">
              <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Como fazer upload de arquivos:</h3>
              <p className="text-sm text-blue-700 dark:text-blue-400 mb-2">1. Preencha as informações acima primeiro</p>
              <p className="text-sm text-blue-700 dark:text-blue-400 mb-2">
                2. Use as abas abaixo para fazer upload do documento e da imagem de capa
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                3. Clique em "Enviar Documento" quando terminar
              </p>
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
          <CardFooter className="flex justify-end">
            <Button type="submit" disabled={isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" /> Criar Documento
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}

