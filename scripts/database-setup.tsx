"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { Play } from "lucide-react"

export default function DatabaseSetup() {
  const [isRunning, setIsRunning] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const { toast } = useToast()

  const setupDatabase = async () => {
    setIsRunning(true)
    setLogs([])

    try {
      addLog("Iniciando configuração do banco de dados...")

      // Create profiles table
      addLog("Criando tabela de perfis...")
      const { error: profilesError } = await supabase.rpc("create_profiles_table")

      if (profilesError) {
        throw profilesError
      }

      addLog("Tabela de perfis criada com sucesso.")

      // Create categories table
      addLog("Criando tabela de categorias...")
      const { error: categoriesError } = await supabase.rpc("create_categories_table")

      if (categoriesError) {
        throw categoriesError
      }

      addLog("Tabela de categorias criada com sucesso.")

      // Create documents table
      addLog("Criando tabela de documentos...")
      const { error: documentsError } = await supabase.rpc("create_documents_table")

      if (documentsError) {
        throw documentsError
      }

      addLog("Tabela de documentos criada com sucesso.")

      // Create document_versions table
      addLog("Criando tabela de versões de documentos...")
      const { error: versionsError } = await supabase.rpc("create_document_versions_table")

      if (versionsError) {
        throw versionsError
      }

      addLog("Tabela de versões de documentos criada com sucesso.")

      // Create document_downloads table
      addLog("Criando tabela de downloads de documentos...")
      const { error: downloadsError } = await supabase.rpc("create_document_downloads_table")

      if (downloadsError) {
        throw downloadsError
      }

      addLog("Tabela de downloads de documentos criada com sucesso.")

      // Create document_views table
      addLog("Criando tabela de visualizações de documentos...")
      const { error: viewsError } = await supabase.rpc("create_document_views_table")

      if (viewsError) {
        throw viewsError
      }

      addLog("Tabela de visualizações de documentos criada com sucesso.")

      // Create user_preferences table
      addLog("Criando tabela de preferências de usuário...")
      const { error: preferencesError } = await supabase.rpc("create_user_preferences_table")

      if (preferencesError) {
        throw preferencesError
      }

      addLog("Tabela de preferências de usuário criada com sucesso.")

      // Create user_integrations table
      addLog("Criando tabela de integrações de usuário...")
      const { error: integrationsError } = await supabase.rpc("create_user_integrations_table")

      if (integrationsError) {
        throw integrationsError
      }

      addLog("Tabela de integrações de usuário criada com sucesso.")

      // Create storage buckets
      addLog("Criando buckets de armazenamento...")
      const { error: storageError } = await supabase.rpc("create_storage_buckets")

      if (storageError) {
        throw storageError
      }

      addLog("Buckets de armazenamento criados com sucesso.")

      // Create RLS policies
      addLog("Configurando políticas de segurança...")
      const { error: rlsError } = await supabase.rpc("setup_rls_policies")

      if (rlsError) {
        throw rlsError
      }

      addLog("Políticas de segurança configuradas com sucesso.")

      addLog("Configuração do banco de dados concluída com sucesso!")

      toast({
        title: "Configuração concluída",
        description: "O banco de dados foi configurado com sucesso",
      })
    } catch (error: any) {
      addLog(`Erro: ${error.message}`)

      toast({
        title: "Erro na configuração",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsRunning(false)
    }
  }

  const addLog = (message: string) => {
    setLogs((prevLogs) => [...prevLogs, message])
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuração do Banco de Dados</CardTitle>
        <CardDescription>Execute este script para configurar o banco de dados do Supabase</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="rounded-md bg-muted p-4">
            <pre className="text-sm">
              <code>
                {`-- Este script irá criar as seguintes tabelas:
-- profiles: Perfis de usuários
-- categories: Categorias de documentos
-- documents: Documentos
-- document_versions: Versões de documentos
-- document_downloads: Registro de downloads
-- document_views: Registro de visualizações
-- user_preferences: Preferências de usuário
-- user_integrations: Integrações de usuário

-- Também irá configurar:
-- Buckets de armazenamento para documentos
-- Políticas de segurança (RLS)
`}
              </code>
            </pre>
          </div>

          {logs.length > 0 && (
            <div className="max-h-60 overflow-y-auto rounded-md bg-black p-4">
              {logs.map((log, index) => (
                <div key={index} className="text-sm text-white">
                  {log}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={setupDatabase} disabled={isRunning}>
          {isRunning ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
              Executando...
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Executar Script
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

