"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { SimpleTabs, SimpleTabsContent, SimpleTabsList, SimpleTabsTrigger } from "@/components/ui/simple-tabs"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { supabase } from "@/lib/supabase"
import { Settings, Lock, BellRing, LinkIcon } from "lucide-react"

export default function SettingsPage() {
  const { user } = useAuth()
  const { toast } = useToast()

  // Profile settings
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || "")
  const [email, setEmail] = useState(user?.email || "")
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)

  // Password settings
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [documentUpdates, setDocumentUpdates] = useState(true)
  const [newUploads, setNewUploads] = useState(false)
  const [isUpdatingNotifications, setIsUpdatingNotifications] = useState(false)

  // Integration settings
  const [moodleUrl, setMoodleUrl] = useState("")
  const [moodleApiKey, setMoodleApiKey] = useState("")
  const [googleDriveEnabled, setGoogleDriveEnabled] = useState(false)
  const [isUpdatingIntegrations, setIsUpdatingIntegrations] = useState(false)

  const handleUpdateProfile = async () => {
    setIsUpdatingProfile(true)
    try {
      const { error } = await supabase.auth.updateUser({
        email,
        data: { full_name: fullName },
      })

      if (error) {
        throw error
      }

      // Update profile in database
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ full_name: fullName, email })
        .eq("id", user?.id)

      if (profileError) {
        throw profileError
      }

      toast({
        title: "Perfil atualizado",
        description: "Suas informações de perfil foram atualizadas com sucesso",
      })
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar perfil",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Erro de validação",
        description: "As senhas não coincidem",
        variant: "destructive",
      })
      return
    }

    setIsUpdatingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) {
        throw error
      }

      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")

      toast({
        title: "Senha atualizada",
        description: "Sua senha foi atualizada com sucesso",
      })
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar senha",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  const handleUpdateNotifications = async () => {
    setIsUpdatingNotifications(true)
    try {
      // Save notification preferences to database
      const { error } = await supabase.from("user_preferences").upsert({
        user_id: user?.id,
        email_notifications: emailNotifications,
        document_updates: documentUpdates,
        new_uploads: newUploads,
      })

      if (error) {
        throw error
      }

      toast({
        title: "Preferências atualizadas",
        description: "Suas preferências de notificação foram atualizadas",
      })
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar preferências",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsUpdatingNotifications(false)
    }
  }

  const handleUpdateIntegrations = async () => {
    setIsUpdatingIntegrations(true)
    try {
      // Save integration settings to database
      const { error } = await supabase.from("user_integrations").upsert({
        user_id: user?.id,
        moodle_url: moodleUrl,
        moodle_api_key: moodleApiKey,
        google_drive_enabled: googleDriveEnabled,
      })

      if (error) {
        throw error
      }

      toast({
        title: "Integrações atualizadas",
        description: "Suas configurações de integração foram atualizadas",
      })
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar integrações",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsUpdatingIntegrations(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">Gerencie suas preferências e configurações</p>
      </div>

      <SimpleTabs defaultValue="profile" className="space-y-4">
        <SimpleTabsList>
          <SimpleTabsTrigger value="profile">
            <Settings className="mr-2 h-4 w-4" />
            Perfil
          </SimpleTabsTrigger>
          <SimpleTabsTrigger value="password">
            <Lock className="mr-2 h-4 w-4" />
            Senha
          </SimpleTabsTrigger>
          <SimpleTabsTrigger value="notifications">
            <BellRing className="mr-2 h-4 w-4" />
            Notificações
          </SimpleTabsTrigger>
          <SimpleTabsTrigger value="integrations">
            <LinkIcon className="mr-2 h-4 w-4" />
            Integrações
          </SimpleTabsTrigger>
        </SimpleTabsList>

        <SimpleTabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Perfil</CardTitle>
              <CardDescription>Atualize suas informações pessoais</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome completo</Label>
                <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleUpdateProfile} disabled={isUpdatingProfile}>
                {isUpdatingProfile ? "Salvando..." : "Salvar alterações"}
              </Button>
            </CardFooter>
          </Card>
        </SimpleTabsContent>

        <SimpleTabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle>Alterar Senha</CardTitle>
              <CardDescription>Atualize sua senha regularmente para maior segurança</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Senha atual</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nova senha</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleUpdatePassword} disabled={isUpdatingPassword}>
                {isUpdatingPassword ? "Atualizando..." : "Atualizar senha"}
              </Button>
            </CardFooter>
          </Card>
        </SimpleTabsContent>

        <SimpleTabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Preferências de Notificação</CardTitle>
              <CardDescription>Configure como deseja receber notificações</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="emailNotifications">Notificações por email</Label>
                  <p className="text-sm text-muted-foreground">Receba notificações por email</p>
                </div>
                <Switch id="emailNotifications" checked={emailNotifications} onCheckedChange={setEmailNotifications} />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="documentUpdates">Atualizações de documentos</Label>
                  <p className="text-sm text-muted-foreground">Seja notificado quando documentos forem atualizados</p>
                </div>
                <Switch id="documentUpdates" checked={documentUpdates} onCheckedChange={setDocumentUpdates} />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="newUploads">Novos uploads</Label>
                  <p className="text-sm text-muted-foreground">
                    Seja notificado quando novos documentos forem enviados
                  </p>
                </div>
                <Switch id="newUploads" checked={newUploads} onCheckedChange={setNewUploads} />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleUpdateNotifications} disabled={isUpdatingNotifications}>
                {isUpdatingNotifications ? "Salvando..." : "Salvar preferências"}
              </Button>
            </CardFooter>
          </Card>
        </SimpleTabsContent>

        <SimpleTabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle>Integrações</CardTitle>
              <CardDescription>Configure integrações com outros sistemas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="moodleUrl">URL do Moodle</Label>
                <Input
                  id="moodleUrl"
                  placeholder="https://moodle.suainstituicao.edu.br"
                  value={moodleUrl}
                  onChange={(e) => setMoodleUrl(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="moodleApiKey">Chave de API do Moodle</Label>
                <Input
                  id="moodleApiKey"
                  type="password"
                  value={moodleApiKey}
                  onChange={(e) => setMoodleApiKey(e.target.value)}
                />
              </div>
              <div className="flex items-center justify-between pt-2">
                <div className="space-y-0.5">
                  <Label htmlFor="googleDriveEnabled">Integração com Google Drive</Label>
                  <p className="text-sm text-muted-foreground">Permitir acesso ao Google Drive</p>
                </div>
                <Switch id="googleDriveEnabled" checked={googleDriveEnabled} onCheckedChange={setGoogleDriveEnabled} />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleUpdateIntegrations} disabled={isUpdatingIntegrations}>
                {isUpdatingIntegrations ? "Salvando..." : "Salvar integrações"}
              </Button>
            </CardFooter>
          </Card>
        </SimpleTabsContent>
      </SimpleTabs>
    </div>
  )
}

