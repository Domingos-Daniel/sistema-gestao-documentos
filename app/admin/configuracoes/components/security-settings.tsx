"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { Shield, Lock, Key } from "lucide-react"

// Serviço para gerenciar configurações de segurança
const securitySettingsService = {
  getSettings: () => {
    if (typeof window === "undefined") return {}
    const settings = localStorage.getItem("securitySettings")
    return settings
      ? JSON.parse(settings)
      : {
          passwordMinLength: 8,
          passwordRequireUppercase: true,
          passwordRequireNumbers: true,
          passwordRequireSpecial: false,
          maxLoginAttempts: 5,
          sessionTimeout: 30,
          twoFactorAuth: false,
          ipRestriction: false,
          allowedIPs: "",
        }
  },

  saveSettings: (settings: any) => {
    localStorage.setItem("securitySettings", JSON.stringify(settings))
    return settings
  },
}

export function SecuritySettings() {
  const [settings, setSettings] = useState<any>({})
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const loadedSettings = securitySettingsService.getSettings()
    setSettings(loadedSettings)
  }, [])

  const handleSaveSettings = () => {
    setIsLoading(true)

    try {
      securitySettingsService.saveSettings(settings)

      toast({
        title: "Configurações salvas",
        description: "As configurações de segurança foram salvas com sucesso.",
      })
    } catch (error) {
      toast({
        title: "Erro ao salvar configurações",
        description: "Ocorreu um erro ao salvar as configurações de segurança.",
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
        <div className="flex items-center">
          <Lock className="mr-2 h-5 w-5 text-primary" />
          <h3 className="text-lg font-medium">Política de Senhas</h3>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="passwordMinLength">Comprimento Mínimo da Senha</Label>
            <Input
              id="passwordMinLength"
              type="number"
              min="6"
              max="20"
              value={settings.passwordMinLength || 8}
              onChange={(e) => handleChange("passwordMinLength", Number.parseInt(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxLoginAttempts">Máximo de Tentativas de Login</Label>
            <Input
              id="maxLoginAttempts"
              type="number"
              min="1"
              max="10"
              value={settings.maxLoginAttempts || 5}
              onChange={(e) => handleChange("maxLoginAttempts", Number.parseInt(e.target.value))}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="passwordRequireUppercase">Exigir Letras Maiúsculas</Label>
              <p className="text-sm text-muted-foreground">Exige pelo menos uma letra maiúscula na senha</p>
            </div>
            <Switch
              id="passwordRequireUppercase"
              checked={settings.passwordRequireUppercase || false}
              onCheckedChange={(checked) => handleChange("passwordRequireUppercase", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="passwordRequireNumbers">Exigir Números</Label>
              <p className="text-sm text-muted-foreground">Exige pelo menos um número na senha</p>
            </div>
            <Switch
              id="passwordRequireNumbers"
              checked={settings.passwordRequireNumbers || false}
              onCheckedChange={(checked) => handleChange("passwordRequireNumbers", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="passwordRequireSpecial">Exigir Caracteres Especiais</Label>
              <p className="text-sm text-muted-foreground">Exige pelo menos um caractere especial na senha</p>
            </div>
            <Switch
              id="passwordRequireSpecial"
              checked={settings.passwordRequireSpecial || false}
              onCheckedChange={(checked) => handleChange("passwordRequireSpecial", checked)}
            />
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="flex items-center">
          <Key className="mr-2 h-5 w-5 text-primary" />
          <h3 className="text-lg font-medium">Autenticação e Sessão</h3>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sessionTimeout">Tempo Limite da Sessão (minutos)</Label>
          <Input
            id="sessionTimeout"
            type="number"
            min="5"
            max="240"
            value={settings.sessionTimeout || 30}
            onChange={(e) => handleChange("sessionTimeout", Number.parseInt(e.target.value))}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="twoFactorAuth">Autenticação de Dois Fatores</Label>
            <p className="text-sm text-muted-foreground">
              Habilita a autenticação de dois fatores para todos os usuários
            </p>
          </div>
          <Switch
            id="twoFactorAuth"
            checked={settings.twoFactorAuth || false}
            onCheckedChange={(checked) => handleChange("twoFactorAuth", checked)}
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="flex items-center">
          <Shield className="mr-2 h-5 w-5 text-primary" />
          <h3 className="text-lg font-medium">Restrições de Acesso</h3>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="ipRestriction">Restrição de IP</Label>
            <p className="text-sm text-muted-foreground">Restringe o acesso a IPs específicos</p>
          </div>
          <Switch
            id="ipRestriction"
            checked={settings.ipRestriction || false}
            onCheckedChange={(checked) => handleChange("ipRestriction", checked)}
          />
        </div>

        {settings.ipRestriction && (
          <div className="space-y-2">
            <Label htmlFor="allowedIPs">IPs Permitidos</Label>
            <Input
              id="allowedIPs"
              placeholder="Ex: 192.168.1.1, 10.0.0.1"
              value={settings.allowedIPs || ""}
              onChange={(e) => handleChange("allowedIPs", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Separe múltiplos IPs com vírgulas</p>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSaveSettings} disabled={isLoading}>
          {isLoading ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </div>
    </div>
  )
}

