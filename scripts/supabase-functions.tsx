"use client"
import { useToast } from "@/hooks/use-toast"

export default function SupabaseFunctions() {
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copiado para a área de transferência',
      description: 'O código SQL foi copiado com sucesso',
    });
  };

  const sqlFunctions = `
-- Função para criar a tabela de perfis
CREATE OR REPLACE FUNCTION create_profiles_table()
RETURNS void AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'student',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Trigger para atualizar o campo updated_at
  CREATE OR REPLACE FUNCTION update_profiles_updated_at()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  DROP TRIGGER IF EXISTS update_profiles_updated_at_trigger ON profiles;
  CREATE TRIGGER update_profiles_updated_at_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_profiles_updated_at();
END;
$$ LANGUAGE plpgsql;

-- Função para criar a tabela de categorias
CREATE OR REPLACE FUNCTION create_categories_table()
RETURNS void AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Trigger para atualizar o campo updated_at
  CREATE OR REPLACE FUNCTION update_categories_updated_at()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  DROP TRIGGER IF EXISTS update_categories_updated_at_trigger ON categories;
  CREATE TRIGGER update_categories_updated_at_trigger
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_categories_updated_at();
END;
$$ LANGUAGE plpgsql;

-- Função para criar a tabela de documentos
CREATE OR REPLACE FUNCTION create_documents_table()
RETURNS void AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    tags TEXT[],
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Trigger para atualizar o campo updated_at
  CREATE OR REPLACE FUNCTION update_documents_updated_at()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  DROP TRIGGER IF EXISTS update_documents_updated_at_trigger ON documents;
  CREATE TRIGGER update_documents_updated_at_trigger
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_documents_updated_at();

  -- Trigger para criar versão anterior ao atualizar documento
  CREATE OR REPLACE FUNCTION create_document_version()
  RETURNS TRIGGER AS $$
  BEGIN
    INSERT INTO document_versions (
      document_id, 
      file_path, 
      file_name, 
      file_type, 
      file_size, 
      user_id
    )
    VALUES (
      OLD.id, 
      OLD.file_path, 
      OLD.file_name, 
      OLD.file_type, 
      OLD.file_size, 
      OLD.user_id
    );
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  DROP TRIGGER IF EXISTS create_document_version_trigger ON documents;
  CREATE TRIGGER create_document_version_trigger
  BEFORE UPDATE OF file_path, file_name, file_type, file_size ON documents
  FOR EACH ROW
  EXECUTE FUNCTION create_document_version();
END;
$$ LANGUAGE plpgsql;

-- Função para criar a tabela de versões de documentos
CREATE OR REPLACE FUNCTION create_document_versions_table()
RETURNS void AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS document_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE NOT NULL,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
END;
$$ LANGUAGE plpgsql;

-- Função para criar a tabela de downloads de documentos
CREATE OR REPLACE FUNCTION create_document_downloads_table()
RETURNS void AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS document_downloads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
END;
$$ LANGUAGE plpgsql;

-- Função para criar a tabela de visualizações de documentos
CREATE OR REPLACE

