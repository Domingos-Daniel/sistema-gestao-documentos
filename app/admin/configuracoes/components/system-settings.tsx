"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"

// Serviço para gerenciar configurações do sistema
const systemSettingsService = {
  getSettings: () => {
    if (typeof window === "undefined") return {}
    const settings = localStorage.getItem("systemSettings")
    return settings
      ? JSON.parse(settings)
      : {
          siteName: "Sistema de Gestão de Documentos",
          siteDescription: "Plataforma para gerenciamento de documentos acadêmicos",
          maxUploadSize: 10,
          allowRegistration: true,
          maintenanceMode: false,
          emailNotifications: true,
          defaultLanguage: "pt-BR",
          itemsPerPage: 10,
        }
  },

  saveSettings: (settings: any) => {
    localStorage.setItem("systemSettings", JSON.stringify(settings))
    return settings
  },
}

export function SystemSettings() {
  const [settings, setSettings] = useState<any>({})
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const loadedSettings = systemSettingsService.getSettings()
    setSettings(loadedSettings)
  }, [])

  const handleSaveSettings = () => {
    setIsLoading(true)

    try {
      systemSettingsService.saveSettings(settings)

      toast({
        title: "Configurações salvas",
        description: "As configurações do sistema foram salvas com sucesso.",
      })
    } catch (error) {
      toast({
        title: "Erro ao salvar configurações",
        description: "Ocorreu um erro ao salvar as configurações do sistema.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (key: string, value: any) => {
    setSettings({ ...settings, [key]: value })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Configurações Gerais</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="siteName">Nome do Site</Label>
            <Input
              id="siteName"
              value={settings.siteName || ""}
              onChange={(e) => handleChange("siteName", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="siteDescription">Descrição do Site</Label>
            <Input
              id="siteDescription"
              value={settings.siteDescription || ""}
              onChange={(e) => handleChange("siteDescription", e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="maxUploadSize">Tamanho Máximo de Upload (MB)</Label>
            <Input
              id="maxUploadSize"
              type="number"
              min="1"
              max="100"
              value={settings.maxUploadSize || 10}
              onChange={(e) => handleChange("maxUploadSize", Number.parseInt(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="itemsPerPage">Itens por Página</Label>
            <Input
              id="itemsPerPage"
              type="number"
              min="5"
              max="100"
              value={settings.itemsPerPage || 10}
              onChange={(e) => handleChange("itemsPerPage", Number.parseInt(e.target.value))}
            />
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Configurações de Acesso</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="allowRegistration">Permitir Registro de Usuários</Label>
              <p className="text-sm text-muted-foreground">Permite que novos usuários se registrem no sistema</p>
            </div>
            <Switch
              id="allowRegistration"
              checked={settings.allowRegistration || false}
              onCheckedChange={(checked) => handleChange("allowRegistration", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="maintenanceMode">Modo de Manutenção</Label>
              <p className="text-sm text-muted-foreground">
                Ativa o modo de manutenção, bloqueando o acesso ao sistema
              </p>
            </div>
            <Switch
              id="maintenanceMode"
              checked={settings.maintenanceMode || false}
              onCheckedChange={(checked) => handleChange("maintenanceMode", checked)}
            />
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Configurações de Notificação</h3>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="emailNotifications">Notificações por Email</Label>
            <p className="text-sm text-muted-foreground">Envia notificações por email para os usuários</p>
          </div>
          <Switch
            id="emailNotifications"
            checked={settings.emailNotifications || false}
            onCheckedChange={(checked) => handleChange("emailNotifications", checked)}
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Configurações Regionais</h3>
        <div className="space-y-2">
          <Label htmlFor="defaultLanguage">Idioma Padrão</Label>
          <select
            id="defaultLanguage"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={settings.defaultLanguage || "pt-BR"}
            onChange={(e) => handleChange("defaultLanguage", e.target.value)}
          >
            <option value="pt-BR">Português (Brasil)</option>
            <option value="en-US">English (United States)</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSaveSettings} disabled={isLoading}>
          {isLoading ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </div>
    </div>
  )
}

