"use client"

import { useState, useEffect } from "react" 
import { useRouter } from "next/navigation"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Settings, Database, FileText, Shield, UserCircle } from "lucide-react"

// Import components
import { UserManagement } from "./components/user-management"
import { SystemSettings } from "./components/system-settings"
import { BackupSettings } from "./components/backup-settings"
import { SecuritySettings } from "./components/security-settings"
import ProfileSettings from "./components/profile-settings" 

import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"

// Simple placeholder for SystemLogs
function SystemLogs() {
  return <div>Logs do sistema não estão disponíveis no momento.</div>
}

export default function ConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState("perfil")
  const { user, loading } = useAuth()
  const { toast } = useToast()

  // --- Debug logging only, no redirects ---
  useEffect(() => {
    console.log("ConfiguracoesPage - Loading State:", loading);
    console.log("ConfiguracoesPage - User Object:", user);
    if (user) {
      console.log("ConfiguracoesPage - User Metadata:", user.user_metadata);
    }
  }, [loading, user]);

  // Simple loading indicator
  if (loading) {
    return <div className="p-8 text-center">Carregando configurações...</div>;
  }

  // --- Render the settings page without role checks ---
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Configurações</h2>
        <p className="text-muted-foreground">Gerencie seu perfil, usuários e configurações do sistema.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6">
          <TabsTrigger value="perfil" className="flex items-center gap-2">
            <UserCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Meu Perfil</span>
          </TabsTrigger>
          <TabsTrigger value="usuarios" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Usuários</span>
          </TabsTrigger>
          <TabsTrigger value="sistema" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Sistema</span>
          </TabsTrigger>
          <TabsTrigger value="backup" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <span className="hidden sm:inline">Backup</span>
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Logs</span>
          </TabsTrigger>
          <TabsTrigger value="seguranca" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Segurança</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="perfil" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Meu Perfil</CardTitle>
              <CardDescription>Atualize suas informações pessoais.</CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileSettings />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usuarios" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Usuários</CardTitle>
              <CardDescription>Adicione, edite ou remova usuários e gerencie suas permissões.</CardDescription>
            </CardHeader>
            <CardContent>
              <UserManagement />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sistema" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Sistema</CardTitle>
              <CardDescription>Configure as opções gerais do sistema.</CardDescription>
            </CardHeader>
            <CardContent>
              <SystemSettings />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Backup e Restauração</CardTitle>
              <CardDescription>Gerencie backups e restaure dados do sistema.</CardDescription>
            </CardHeader>
            <CardContent>
              <BackupSettings />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Logs do Sistema</CardTitle>
              <CardDescription>Visualize os logs de atividades do sistema.</CardDescription>
            </CardHeader>
            <CardContent>
              <SystemLogs />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seguranca" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Segurança</CardTitle>
              <CardDescription>Configure opções de segurança e permissões.</CardDescription>
            </CardHeader>
            <CardContent>
              <SecuritySettings />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

