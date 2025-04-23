import { supabase } from './supabase';

// Tipos
export interface Category {
  id: string
  name: string
  description?: string | null
  parent_id?: string | null
  created_at: string
  updated_at: string
  icon?: string
  color?: string
}

// Inicializar o storage
const initializeCategoryStorage = () => {
  if (typeof window === "undefined") return

  if (!localStorage.getItem("categories")) {
    localStorage.setItem(
      "categories",
      JSON.stringify([
        {
          id: "1",
          name: "Documentos Gerais",
          description: "Documentos gerais do sistema",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          icon: "file-text",
          color: "#4CAF50",
        },
        {
          id: "2",
          name: "Relatórios",
          description: "Relatórios e análises",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          icon: "bar-chart",
          color: "#2196F3",
        },
        {
          id: "3",
          name: "Manuais",
          description: "Manuais e guias",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          icon: "book",
          color: "#FF9800",
        },
      ]),
    )
  }
}

// Obter todas as categorias
export async function getAllCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');
  
  if (error) {
    console.error('Erro ao buscar categorias:', error);
    return [];
  }
  
  return data || [];
}

// Obter categoria por ID
export async function getCategoryById(id: string) {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error('Erro ao buscar categoria:', error);
    return null;
  }
  
  return data;
}

// Criar categoria
export const createCategory = (category: Omit<Category, "id" | "created_at" | "updated_at">): Category => {
  const categories = getAllCategories()

  const newCategory: Category = {
    ...category,
    id: Date.now().toString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  categories.push(newCategory)
  localStorage.setItem("categories", JSON.stringify(categories))

  return newCategory
}

// Atualizar categoria
export async function updateCategory(id: string, updates: Partial<Omit<Category, 'id' | 'created_at'>>) {
  const { data, error } = await supabase
    .from('categories')
    .update({ ...updates, updated_at: new Date().toISOString() }) // Add updated_at timestamp
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erro ao atualizar categoria:', error);
    throw new Error(error.message);
  }

  return data;
}

// Excluir categoria
export async function deleteCategory(id: string) {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erro ao excluir categoria:', error);
    throw new Error(error.message);
  }

  return true; // Indicate success
}

// Obter subcategorias
export async function getSubcategories(parentId: string): Promise<Category[]> {
  const categories = await getAllCategories(); // Await the result
  return categories.filter((cat) => cat.parent_id === parentId);
}

// Obter categorias raiz (sem parent_id)
export async function getRootCategories(): Promise<Category[]> {
  const categories = await getAllCategories(); // Await the result
  return categories.filter((cat) => !cat.parent_id);
}

// Ensure this function is exported
export async function addCategory(categoryData: { name: string; description?: string | null }) {
  const { data, error } = await supabase
    .from('categories')
    .insert([categoryData]) // Pass the category data object
    .select()
    .single(); // Use single() if you expect one row back

  if (error) {
    console.error('Erro ao adicionar categoria:', error);
    throw new Error(error.message);
  }

  return data; // Return the newly created category data
}

