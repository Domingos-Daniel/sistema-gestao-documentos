import { supabase } from "@/lib/supabase"
import { v4 as uuidv4 } from "uuid"

// Interface para metadados do arquivo
export interface FileUploadResult {
  id: string
  name: string
  size: number
  type: string
  path: string
  url: string
}

/**
 * Faz upload de um arquivo para o Supabase Storage
 * @param file Arquivo a ser enviado
 * @param bucket Nome do bucket no Supabase Storage
 * @param folder Pasta dentro do bucket (opcional)
 * @returns Metadados do arquivo enviado
 */
export const uploadFileToStorage = async (file: File, bucket = "documents", folder = ""): Promise<FileUploadResult> => {
  try {
    // Gerar um nome de arquivo único para evitar colisões
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
      console.error("Erro no upload para o Supabase Storage:", error)
      throw new Error(`Erro ao fazer upload: ${error.message}`)
    }

    if (!data) {
      throw new Error("Falha no upload: nenhum dado retornado")
    }

    // Obter a URL pública do arquivo
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path)

    return {
      id: uuidv4(),
      name: file.name,
      size: file.size,
      type: file.type,
      path: data.path,
      url: urlData.publicUrl,
    }
  } catch (error) {
    console.error("Erro ao fazer upload do arquivo:", error)
    throw error
  }
}

/**
 * Verifica se o tipo de arquivo é permitido
 * @param file Arquivo a ser verificado
 * @returns true se o tipo de arquivo for permitido, false caso contrário
 */
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
  ]

  return allowedTypes.includes(file.type)
}

/**
 * Verifica se o tipo de arquivo é uma imagem
 * @param file Arquivo a ser verificado
 * @returns true se o arquivo for uma imagem, false caso contrário
 */
export const isImageFile = (file: File): boolean => {
  return file.type.startsWith("image/")
}

/**
 * Exclui um arquivo do Supabase Storage
 * @param filePath Caminho do arquivo no bucket
 * @param bucket Nome do bucket
 * @returns true se o arquivo foi excluído com sucesso
 */
export const deleteFileFromStorage = async (filePath: string, bucket = "documents"): Promise<boolean> => {
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

