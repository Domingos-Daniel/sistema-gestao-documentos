import { v4 as uuidv4 } from "uuid"

// Tipos de dados
export interface User {
  id: string
  email: string
  password: string
  name: string
  role: "admin" | "user"
  avatar?: string
  createdAt: string
  lastLogin?: string
}

export interface Document {
  id: string
  title: string
  description: string
  category: string
  tags: string[]
  fileName: string
  fileType: string
  fileSize: number
  version: number
  status: "draft" | "published" | "archived"
  createdBy: string
  createdAt: string
  updatedAt: string
  sharedWith?: string[]
  isPublic: boolean
  parentFolder?: string
}

export interface Category {
  id: string
  name: string
  description: string
  parentId?: string
  createdAt: string
  updatedAt: string
}

export interface Folder {
  id: string
  name: string
  description?: string
  parentId?: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface Comment {
  id: string
  documentId: string
  userId: string
  text: string
  createdAt: string
  updatedAt?: string
}

export interface DocumentVersion {
  id: string
  documentId: string
  version: number
  fileName: string
  fileSize: number
  createdBy: string
  createdAt: string
  notes?: string
}

// Inicialização do localStorage com dados padrão
export const initializeStorage = () => {
  // Verificar se já existe um admin
  if (!localStorage.getItem("users")) {
    const defaultAdmin: User = {
      id: "1",
      email: "admin@example.com",
      password: "admin123", // Em produção, usar hash
      name: "Administrador",
      role: "admin",
      createdAt: new Date().toISOString(),
    }
    localStorage.setItem("users", JSON.stringify([defaultAdmin]))
  }

  // Inicializar documentos se não existirem
  if (!localStorage.getItem("documents")) {
    localStorage.setItem("documents", JSON.stringify([]))
  }

  // Inicializar categorias se não existirem
  if (!localStorage.getItem("categories")) {
    const defaultCategories: Category[] = [
      {
        id: "1",
        name: "Artigos",
        description: "Artigos científicos",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "2",
        name: "Teses",
        description: "Teses e dissertações",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "3",
        name: "Livros",
        description: "Livros e e-books",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "4",
        name: "Relatórios",
        description: "Relatórios técnicos",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]
    localStorage.setItem("categories", JSON.stringify(defaultCategories))
  }

  // Inicializar pastas se não existirem
  if (!localStorage.getItem("folders")) {
    const defaultFolders: Folder[] = [
      {
        id: "1",
        name: "Raiz",
        createdBy: "1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "2",
        name: "Documentos Importantes",
        parentId: "1",
        createdBy: "1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "3",
        name: "Arquivados",
        parentId: "1",
        createdBy: "1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]
    localStorage.setItem("folders", JSON.stringify(defaultFolders))
  }

  // Inicializar comentários se não existirem
  if (!localStorage.getItem("comments")) {
    localStorage.setItem("comments", JSON.stringify([]))
  }

  // Inicializar versões de documentos se não existirem
  if (!localStorage.getItem("document_versions")) {
    localStorage.setItem("document_versions", JSON.stringify([]))
  }
}

// Funções para gerenciar usuários
export const getUsers = (): User[] => {
  const users = localStorage.getItem("users")
  return users ? JSON.parse(users) : []
}

export const getUserByEmail = (email: string): User | undefined => {
  const users = getUsers()
  return users.find((user) => user.email === email)
}

export const getUserById = (id: string): User | undefined => {
  const users = getUsers()
  return users.find((user) => user.id === id)
}

export const addUser = (user: Omit<User, "id" | "createdAt">): User => {
  const users = getUsers()
  const newUser: User = {
    ...user,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
  }
  users.push(newUser)
  localStorage.setItem("users", JSON.stringify(users))
  return newUser
}

export const updateUser = (user: Partial<User> & { id: string }): User | undefined => {
  const users = getUsers()
  const index = users.findIndex((u) => u.id === user.id)
  if (index !== -1) {
    users[index] = { ...users[index], ...user }
    localStorage.setItem("users", JSON.stringify(users))
    return users[index]
  }
  return undefined
}

export const updateUserLastLogin = (userId: string): void => {
  const users = getUsers()
  const index = users.findIndex((u) => u.id === userId)
  if (index !== -1) {
    users[index].lastLogin = new Date().toISOString()
    localStorage.setItem("users", JSON.stringify(users))
  }
}

// Funções para gerenciar documentos
export const getDocuments = (): Document[] => {
  const documents = localStorage.getItem("documents")
  return documents ? JSON.parse(documents) : []
}

export const getDocumentById = (id: string): Document | undefined => {
  const documents = getDocuments()
  return documents.find((doc) => doc.id === id)
}

export const addDocument = (metadata: Omit<Document, "id" | "version" | "createdAt" | "updatedAt">): Document => {
  try {
    // Gerar ID único para o documento
    const docId = uuidv4()

    // Criar o documento
    const newDocument: Document = {
      id: docId,
      ...metadata,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Salvar o documento no localStorage
    const documents = getDocuments()
    documents.push(newDocument)
    localStorage.setItem("documents", JSON.stringify(documents))

    // Criar a primeira versão do documento
    addDocumentVersion({
      documentId: docId,
      version: 1,
      fileName: metadata.fileName,
      fileSize: metadata.fileSize,
      createdBy: metadata.createdBy,
      createdAt: new Date().toISOString(),
    })

    return newDocument
  } catch (error) {
    console.error("Erro ao adicionar documento:", error)
    throw error
  }
}

export const updateDocument = (docId: string, metadata: Partial<Document>): Document | undefined => {
  try {
    const documents = getDocuments()
    const index = documents.findIndex((doc) => doc.id === docId)

    if (index === -1) {
      throw new Error("Documento não encontrado")
    }

    const document = documents[index]
    let newVersion = document.version

    // Se o nome do arquivo foi alterado, incrementar a versão
    if (metadata.fileName && metadata.fileName !== document.fileName) {
      newVersion = document.version + 1

      // Adicionar nova versão do documento
      addDocumentVersion({
        documentId: docId,
        version: newVersion,
        fileName: metadata.fileName || document.fileName,
        fileSize: metadata.fileSize || document.fileSize,
        createdBy: metadata.createdBy || document.createdBy,
        createdAt: new Date().toISOString(),
        notes: metadata.description,
      })
    }

    // Atualizar o documento
    const updatedDocument: Document = {
      ...document,
      ...metadata,
      version: newVersion,
      updatedAt: new Date().toISOString(),
    }

    documents[index] = updatedDocument
    localStorage.setItem("documents", JSON.stringify(documents))

    return updatedDocument
  } catch (error) {
    console.error("Erro ao atualizar documento:", error)
    throw error
  }
}

export const deleteDocument = (id: string): boolean => {
  try {
    const documents = getDocuments()
    const document = documents.find((doc) => doc.id === id)

    if (!document) {
      throw new Error("Documento não encontrado")
    }

    // Excluir comentários do documento
    deleteDocumentComments(id)

    // Excluir o documento do localStorage
    const updatedDocuments = documents.filter((doc) => doc.id !== id)
    localStorage.setItem("documents", JSON.stringify(updatedDocuments))

    // Excluir versões do documento
    deleteDocumentVersions(id)

    return true
  } catch (error) {
    console.error("Erro ao excluir documento:", error)
    return false
  }
}

export const shareDocument = (documentId: string, userIds: string[]): boolean => {
  try {
    const documents = getDocuments()
    const index = documents.findIndex((doc) => doc.id === documentId)

    if (index === -1) {
      throw new Error("Documento não encontrado")
    }

    // Atualizar a lista de compartilhamento
    documents[index].sharedWith = [...new Set([...(documents[index].sharedWith || []), ...userIds])]
    documents[index].updatedAt = new Date().toISOString()

    localStorage.setItem("documents", JSON.stringify(documents))
    return true
  } catch (error) {
    console.error("Erro ao compartilhar documento:", error)
    return false
  }
}

export const makeDocumentPublic = (documentId: string, isPublic: boolean): boolean => {
  try {
    const documents = getDocuments()
    const index = documents.findIndex((doc) => doc.id === documentId)

    if (index === -1) {
      throw new Error("Documento não encontrado")
    }

    // Atualizar a visibilidade do documento
    documents[index].isPublic = isPublic
    documents[index].updatedAt = new Date().toISOString()

    localStorage.setItem("documents", JSON.stringify(documents))
    return true
  } catch (error) {
    console.error("Erro ao alterar visibilidade do documento:", error)
    return false
  }
}

// Funções para gerenciar categorias
export const getCategories = (): Category[] => {
  const categories = localStorage.getItem("categories")
  const parsedCategories = categories ? JSON.parse(categories) : []
  // Filtra categorias com IDs vazios ou undefined
  return parsedCategories.filter((cat) => cat.id && cat.id.trim() !== "")
}

export const getCategoryById = (id: string): Category | undefined => {
  const categories = getCategories()
  return categories.find((cat) => cat.id === id)
}

export const addCategory = (category: Omit<Category, "id" | "createdAt" | "updatedAt">): Category => {
  const categories = getCategories()
  const newCategory: Category = {
    ...category,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  categories.push(newCategory)
  localStorage.setItem("categories", JSON.stringify(categories))
  return newCategory
}

export const updateCategory = (category: Partial<Category> & { id: string }): Category | undefined => {
  const categories = getCategories()
  const index = categories.findIndex((cat) => cat.id === category.id)
  if (index !== -1) {
    categories[index] = {
      ...categories[index],
      ...category,
      updatedAt: new Date().toISOString(),
    }
    localStorage.setItem("categories", JSON.stringify(categories))
    return categories[index]
  }
  return undefined
}

export const deleteCategory = (id: string): boolean => {
  // Verificar se a categoria está em uso
  const documents = getDocuments()
  const isInUse = documents.some((doc) => doc.category && doc.category === id)

  if (isInUse) {
    throw new Error(`Esta categoria está sendo usada por documentos e não pode ser excluída`)
  }

  const categories = getCategories()
  const updatedCategories = categories.filter((cat) => cat.id !== id)
  localStorage.setItem("categories", JSON.stringify(updatedCategories))
  return true
}

// Funções para gerenciar pastas
export const getFolders = (): Folder[] => {
  const folders = localStorage.getItem("folders")
  return folders ? JSON.parse(folders) : []
}

export const getFolderById = (id: string): Folder | undefined => {
  const folders = getFolders()
  return folders.find((folder) => folder.id === id)
}

export const addFolder = (folder: Omit<Folder, "id" | "createdAt" | "updatedAt">): Folder => {
  const folders = getFolders()
  const newFolder: Folder = {
    ...folder,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  folders.push(newFolder)
  localStorage.setItem("folders", JSON.stringify(folders))
  return newFolder
}

export const updateFolder = (folder: Partial<Folder> & { id: string }): Folder | undefined => {
  const folders = getFolders()
  const index = folders.findIndex((f) => f.id === folder.id)
  if (index !== -1) {
    folders[index] = {
      ...folders[index],
      ...folder,
      updatedAt: new Date().toISOString(),
    }
    localStorage.setItem("folders", JSON.stringify(folders))
    return folders[index]
  }
  return undefined
}

export const deleteFolder = (id: string): boolean => {
  // Verificar se a pasta está em uso
  const documents = getDocuments()
  const isInUse = documents.some((doc) => doc.parentFolder && doc.parentFolder === id)

  if (isInUse) {
    throw new Error(`Esta pasta contém documentos e não pode ser excluída`)
  }

  const folders = getFolders()
  const updatedFolders = folders.filter((folder) => folder.id !== id)
  localStorage.setItem("folders", JSON.stringify(updatedFolders))
  return true
}

// Funções para gerenciar comentários
export const getComments = (): Comment[] => {
  const comments = localStorage.getItem("comments")
  return comments ? JSON.parse(comments) : []
}

export const getDocumentComments = (documentId: string): Comment[] => {
  const comments = getComments()
  return comments.filter((comment) => comment.documentId === documentId)
}

export const addComment = (comment: Omit<Comment, "id" | "createdAt">): Comment => {
  const comments = getComments()
  const newComment: Comment = {
    ...comment,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
  }
  comments.push(newComment)
  localStorage.setItem("comments", JSON.stringify(comments))
  return newComment
}

export const updateComment = (comment: Partial<Comment> & { id: string }): Comment | undefined => {
  const comments = getComments()
  const index = comments.findIndex((c) => c.id === comment.id)
  if (index !== -1) {
    comments[index] = {
      ...comments[index],
      ...comment,
      updatedAt: new Date().toISOString(),
    }
    localStorage.setItem("comments", JSON.stringify(comments))
    return comments[index]
  }
  return undefined
}

export const deleteComment = (id: string): boolean => {
  const comments = getComments()
  const updatedComments = comments.filter((comment) => comment.id !== id)
  localStorage.setItem("comments", JSON.stringify(updatedComments))
  return true
}

export const deleteDocumentComments = (documentId: string): boolean => {
  const comments = getComments()
  const updatedComments = comments.filter((comment) => comment.documentId !== documentId)
  localStorage.setItem("comments", JSON.stringify(updatedComments))
  return true
}

// Funções para gerenciar versões de documentos
export const getDocumentVersions = (documentId: string): DocumentVersion[] => {
  const versions = localStorage.getItem("document_versions")
  const allVersions = versions ? JSON.parse(versions) : []
  return allVersions.filter((version: DocumentVersion) => version.documentId === documentId)
}

export const addDocumentVersion = (version: Omit<DocumentVersion, "id">): DocumentVersion => {
  const versions = localStorage.getItem("document_versions")
  const allVersions = versions ? JSON.parse(versions) : []

  const newVersion: DocumentVersion = {
    ...version,
    id: uuidv4(),
  }

  allVersions.push(newVersion)
  localStorage.setItem("document_versions", JSON.stringify(allVersions))
  return newVersion
}

export const deleteDocumentVersions = (documentId: string): boolean => {
  const versions = localStorage.getItem("document_versions")
  const allVersions = versions ? JSON.parse(versions) : []
  const updatedVersions = allVersions.filter((version: DocumentVersion) => version.documentId !== documentId)
  localStorage.setItem("document_versions", JSON.stringify(updatedVersions))
  return true
}

// Função para pesquisa avançada
export const searchDocuments = (
  query: string,
  filters: {
    category?: string
    tags?: string[]
    createdBy?: string
    dateFrom?: string
    dateTo?: string
    status?: "draft" | "published" | "archived"
    folder?: string
  },
): Document[] => {
  let documents = getDocuments()

  // Filtrar por termo de busca
  if (query) {
    const term = query.toLowerCase()
    documents = documents.filter(
      (doc) =>
        (doc.title && doc.title.toLowerCase().includes(term)) ||
        (doc.description && doc.description.toLowerCase().includes(term)) ||
        (doc.tags && doc.tags.some((tag) => tag && tag.toLowerCase().includes(term))) ||
        (doc.fileName && doc.fileName.toLowerCase().includes(term)),
    )
  }

  // Aplicar filtros adicionais
  if (filters.category) {
    documents = documents.filter((doc) => doc.category === filters.category)
  }

  if (filters.tags && filters.tags.length > 0) {
    documents = documents.filter((doc) => doc.tags && filters.tags?.some((tag) => doc.tags.includes(tag)))
  }

  if (filters.createdBy) {
    documents = documents.filter((doc) => doc.createdBy === filters.createdBy)
  }

  if (filters.dateFrom) {
    const fromDate = new Date(filters.dateFrom).getTime()
    documents = documents.filter((doc) => new Date(doc.createdAt).getTime() >= fromDate)
  }

  if (filters.dateTo) {
    const toDate = new Date(filters.dateTo).getTime()
    documents = documents.filter((doc) => new Date(doc.createdAt).getTime() <= toDate)
  }

  if (filters.status) {
    documents = documents.filter((doc) => doc.status === filters.status)
  }

  if (filters.folder) {
    documents = documents.filter((doc) => doc.parentFolder === filters.folder)
  }

  return documents
}

// Função para gerar ID único
export const generateId = (): string => {
  return uuidv4()
}

// Função para obter estatísticas de um documento
export const getDocumentStats = (documentId: string): any => {
  try {
    const statsKey = `doc_stats_${documentId}`
    const stats = localStorage.getItem(statsKey)

    return stats
      ? JSON.parse(stats)
      : {
          views: 0,
          downloads: 0,
          shares: 0,
          lastAccessed: null,
        }
  } catch (error) {
    console.error("Erro ao obter estatísticas do documento:", error)
    return {
      views: 0,
      downloads: 0,
      shares: 0,
      lastAccessed: null,
    }
  }
}

// Função para simular download de documento
export const simulateDocumentDownload = (document: Document): void => {
  // Registrar estatística de download
  const statsKey = `doc_stats_${document.id}`
  const stats = getDocumentStats(document.id)
  stats.downloads += 1
  stats.lastAccessed = new Date().toISOString()
  localStorage.setItem(statsKey, JSON.stringify(stats))

  // Simular download (em um sistema real, isso faria o download do arquivo)
  console.log(`Simulando download do documento: ${document.title}`)

  // Mostrar alerta para o usuário
  if (typeof window !== "undefined") {
    alert(
      `Download simulado: ${document.fileName}\nEsta é uma versão de demonstração sem armazenamento de arquivos reais.`,
    )
  }
}

