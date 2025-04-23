import { supabase } from './supabase';

// Tipos
export interface Document {
  id: string
  title: string
  description: string
  category_id: string
  created_at: string
  updated_at: string
  tags?: string[]
  views?: number
  downloads?: number
  status?: "draft" | "published" | "archived"
  version?: number
  author_id?: string
  shared_with?: string[]
  comments?: Comment[]
  file_path: string | null; // <<< Ensure this is part of the type
  cover_image_path?: string | null; // <<< Ensure this is part of the type
  categories?: { name: string } | null; // For joined data
}

export interface DocumentVersion {
  version: number
  updated_at: string
  changes: string
}

export interface Comment {
  id: string
  user_id: string
  text: string
  created_at: string
}

// Inicializar o storage
const initializeDocumentStorage = () => {
  if (typeof window === "undefined") return

  if (!localStorage.getItem("documents")) {
    localStorage.setItem("documents", JSON.stringify([]))
  }
}

// Obter todos os documentos
export async function getAllDocuments() {
  const { data, error } = await supabase
    .from('documents')
    .select(`
      *,
      categories:category_id (name)
    `)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Erro ao buscar documentos:', error);
    return [];
  }
  
  return data || [];
}

// Obter documento por ID
export async function getDocumentById(id: string) {
  const { data, error } = await supabase
    .from('documents')
    .select(`
      id,
      title,
      description,
      file_path,
      cover_image_path,
      tags,
      created_at,
      updated_at,
      author_id,
      category_id,
      categories ( name )
    `)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error(`Erro ao buscar documento ${id}:`, error);
    throw new Error(error.message);
  }
  return data;
}

// Criar documento
export async function createDocument(docData: Omit<Document, 'id' | 'created_at' | 'updated_at' | 'categories'>) {
  // docData should contain file_path and cover_image_path from the upload page
  console.log("Inserting document data:", docData); // Add log to check data before insert
  const { data, error } = await supabase
    .from('documents')
    .insert([{ ...docData }]) // Insert the object containing the paths
    .select(`
      *,
      categories ( name )
    `)
    .single();

  if (error) {
    console.error('Erro ao criar documento no DB:', error);
    throw new Error(error.message);
  }
  return data;
}

// Atualizar documento
export async function updateDocument(id: string, updates: Partial<Omit<Document, 'id' | 'created_at' | 'updated_at' | 'categories'>>) {
  console.log(`Updating document ${id} with data:`, updates);
  // Add logic here if file replacement is needed (see notes above)

  const { data, error } = await supabase
    .from('documents')
    .update(updates)
    .eq('id', id)
    .select(`
      *,
      categories ( name )
    `)
    .single();

  if (error) {
    console.error(`Erro ao atualizar documento ${id}:`, error);
    throw new Error(error.message);
  }
  console.log(`Documento ${id} atualizado com sucesso.`);
  return data;
}

// Excluir documento (incluindo arquivos no Storage)
export async function deleteDocument(id: string) {
  console.log(`Attempting to delete document with ID: ${id}`);

  // 1. Get the document record to find file paths
  const documentToDelete = await getDocumentById(id);

  if (!documentToDelete) {
    console.warn(`Document with ID ${id} not found for deletion.`);
    // Optionally throw an error or return indicating not found
    // throw new Error(`Documento com ID ${id} não encontrado.`);
    return; // Or handle as appropriate
  }

  const { file_path, cover_image_path } = documentToDelete;
  console.log(`Found paths for deletion: file_path=${file_path}, cover_image_path=${cover_image_path}`);

  // 2. Attempt to delete files from Storage (use Promise.allSettled to try both)
  const storageDeletionPromises = [];
  if (file_path) {
    console.log(`Adding file deletion promise for: ${file_path}`);
    storageDeletionPromises.push(supabase.storage.from('documents').remove([file_path]));
  }
  if (cover_image_path) {
    console.log(`Adding cover deletion promise for: ${cover_image_path}`);
    storageDeletionPromises.push(supabase.storage.from('covers').remove([cover_image_path]));
  }

  if (storageDeletionPromises.length > 0) {
    const results = await Promise.allSettled(storageDeletionPromises);
    results.forEach((result, index) => {
      const path = index === 0 && file_path ? file_path : cover_image_path; // Identify which path corresponds to the result
      if (result.status === 'rejected') {
        console.error(`Erro ao deletar arquivo do Storage (${path}):`, result.reason);
        // Decide if you want to stop the process or just log the error
        // For now, we'll log and continue to delete the DB record
      } else {
        console.log(`Arquivo deletado do Storage com sucesso: ${path}`);
      }
    });
  } else {
    console.log("Nenhum arquivo associado encontrado no Storage para deletar.");
  }

  // 3. Delete the document record from the database
  console.log(`Deleting document record from database: ${id}`);
  const { error: dbError } = await supabase
    .from('documents')
    .delete()
    .eq('id', id);

  if (dbError) {
    console.error(`Erro ao deletar documento do banco de dados (ID: ${id}):`, dbError);
    throw new Error(dbError.message);
  }

  console.log(`Documento (ID: ${id}) e arquivos associados (se existiam) deletados com sucesso.`);
  // No return needed, or return status if desired
}

// Registrar download
export const registerDownload = (id: string): void => {
  const document = getDocumentById(id)

  if (document) {
    document.downloads = (document.downloads || 0) + 1
    updateDocument(document)
  }
}

// Adicionar comentário
export const addComment = (documentId: string, userId: string, text: string): Comment | null => {
  const document = getDocumentById(documentId)

  if (document) {
    const comment = {
      id: Date.now().toString(),
      user_id: userId,
      text,
      created_at: new Date().toISOString(),
    }

    document.comments = [...(document.comments || []), comment]
    updateDocument(document)

    return comment
  }

  return null
}

// Compartilhar documento
export const shareDocument = (documentId: string, userEmail: string): boolean => {
  const document = getDocumentById(documentId)

  if (document) {
    // Buscar usuário pelo email
    const users = JSON.parse(localStorage.getItem("users") || "[]")
    const user = users.find((u: any) => u.email === userEmail)

    if (user) {
      // Inicializar shared_with se não existir
      if (!document.shared_with) {
        document.shared_with = []
      }

      // Adicionar usuário à lista de compartilhamento se ainda não estiver
      if (!document.shared_with.includes(user.id)) {
        document.shared_with.push(user.id)
        updateDocument(document)
      }
      return true
    }
  }

  return false
}

// Buscar documentos por termo
export const searchDocuments = (term: string): Document[] => {
  const documents = getAllDocuments()

  if (!term) return documents

  const lowerTerm = term.toLowerCase()
  return documents.filter(
    (doc) =>
      (doc.title && doc.title.toLowerCase().includes(lowerTerm)) ||
      (doc.description && doc.description.toLowerCase().includes(lowerTerm)) ||
      (doc.tags && doc.tags.some((tag) => tag && tag.toLowerCase().includes(lowerTerm))),
  )
}

// Buscar documentos por categoria
export const getDocumentsByCategory = (categoryId: string): Document[] => {
  const documents = getAllDocuments()
  return documents.filter((doc) => doc.category_id === categoryId)
}

// Buscar documentos por autor
export const getDocumentsByAuthor = (authorId: string): Document[] => {
  const documents = getAllDocuments()
  return documents.filter((doc) => doc.author_id === authorId)
}

// Buscar documentos compartilhados com o usuário
export const getSharedDocuments = (userId: string): Document[] => {
  const documents = getAllDocuments()
  return documents.filter((doc) => doc.shared_with && doc.shared_with.includes(userId))
}

export async function uploadDocumentFile(file: File, path: string) {
  const { data, error } = await supabase.storage
    .from('documents')
    .upload(path, file);
  
  if (error) {
    console.error('Erro ao fazer upload do arquivo:', error);
    throw new Error(error.message);
  }
  
  return data;
}

export async function uploadCoverImage(file: File, path: string) {
  const { data, error } = await supabase.storage
    .from('covers') // <--- This bucket is not found
    .upload(path, file);

  if (error) {
    console.error('Erro ao fazer upload da imagem de capa:', error);
    throw new Error(error.message); // Error: Bucket not found
  }

  return data;
}

// Function to get a temporary signed URL for a file in storage
export async function getDocumentSignedUrl(filePath: string): Promise<string | null> {
  if (!filePath) return null;

  // Determine bucket based on path (optional, assumes path includes bucket structure or you know it)
  // For simplicity, assuming it's always the 'documents' bucket here. Adjust if needed.
  const bucketName = 'documents'; // Or 'covers' if applicable

  const expiresIn = 60 * 30; // URL valid for 30 minutes
  const { data, error } = await supabase.storage
    .from(bucketName)
    .createSignedUrl(filePath, expiresIn);

  if (error) {
    console.error(`Error generating signed URL for ${filePath}:`, error);
    return null;
  }
  return data?.signedUrl || null;
}

// You might need a similar one specifically for covers if used elsewhere
// export async function getCoverImageSignedUrl(filePath: string): Promise<string | null> { ... }

