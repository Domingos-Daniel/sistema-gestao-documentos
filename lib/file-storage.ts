import { supabase } from "@/lib/supabase"
import { v4 as uuidv4 } from "uuid"

// Interface para metadados do arquivo
export interface FileMetadata {
  id: string
  name: string
  size: number
  type: string
  path: string
  url: string
  createdAt: string
  updatedAt: string
}

// Função para fazer upload de um arquivo para o Supabase Storage
export const uploadFile = async (file: File, bucket = "documents", folder = ""): Promise<FileMetadata> => {
  try {
    // Gerar um nome de arquivo único
    const fileExt = file.name.split(".").pop()
    const fileName = `${uuidv4()}.${fileExt}`

    // Definir o caminho do arquivo
    const filePath = folder ? `${folder}/${fileName}` : fileName

    // Fazer upload do arquivo para o Supabase Storage
    const { data, error } = await supabase.storage.from(bucket).upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    })

    if (error) {
      throw error
    }

    // Obter a URL pública do arquivo
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath)

    // Retornar os metadados do arquivo
    return {
      id: uuidv4(),
      name: file.name,
      size: file.size,
      type: file.type,
      path: data.path,
      url: urlData.publicUrl,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  } catch (error) {
    console.error("Erro ao fazer upload do arquivo:", error)
    throw error
  }
}

// Função para excluir um arquivo do Supabase Storage
export const deleteFile = async (filePath: string, bucket = "documents"): Promise<boolean> => {
  try {
    const { error } = await supabase.storage.from(bucket).remove([filePath])

    if (error) {
      throw error
    }

    return true
  } catch (error) {
    console.error("Erro ao excluir arquivo:", error)
    throw error
  }
}

// Função para obter a URL pública de um arquivo
export const getFileUrl = (filePath: string, bucket = "documents"): string => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath)
  return data.publicUrl
}

// Função para fazer download de um arquivo
export const downloadFile = async (filePath: string, bucket = "documents"): Promise<Blob> => {
  try {
    const { data, error } = await supabase.storage.from(bucket).download(filePath)

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    console.error("Erro ao fazer download do arquivo:", error)
    throw error
  }
}

// Verifica se o tipo de arquivo é permitido
export const isAllowedFileType = (file: File): boolean => {
  // Lista de tipos MIME permitidos
  const allowedTypes = [
    // PDF
    "application/pdf",
    // Word
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    // Excel
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    // PowerPoint
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    // Texto
    "text/plain",
    // Imagens (para capas)
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
  ]

  return allowedTypes.includes(file.type)
}

// Verifica se o tipo de arquivo é uma imagem
export const isImageFile = (file: File): boolean => {
  return file.type.startsWith("image/")
}

// Função para obter a extensão de um arquivo a partir do tipo MIME
export const getFileExtension = (mimeType: string): string => {
  const mimeToExt: Record<string, string> = {
    "application/pdf": "pdf",
    "application/msword": "doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/vnd.ms-excel": "xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
    "application/vnd.ms-powerpoint": "ppt",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
    "text/plain": "txt",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
  }

  return mimeToExt[mimeType] || "bin"
}

