"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { Download, Upload, RefreshCw, Database } from "lucide-react"

export function BackupSettings() {
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [backupFile, setBackupFile] = useState<File | null>(null)
  const { toast } = useToast()

  const handleExportData = () => {
    setIsExporting(true)

    try {
      // Coletar todos os dados do localStorage
      const data = {
        users: JSON.parse(localStorage.getItem("users") || "[]"),
        documents: JSON.parse(localStorage.getItem("documents") || "[]"),
        categories: JSON.parse(localStorage.getItem("categories") || "[]"),
        systemSettings: JSON.parse(localStorage.getItem("systemSettings") || "{}"),
      }

      // Converter para JSON
      const jsonData = JSON.stringify(data, null, 2)

      // Criar blob e link para download
      const blob = new Blob([jsonData], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `backup-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(link)
      link.click()

      // Limpar
      URL.revokeObjectURL(url)
      document.body.removeChild(link)

      toast({
        title: "Backup exportado",
        description: "Os dados foram exportados com sucesso.",
      })
    } catch (error) {
      toast({
        title: "Erro ao exportar dados",
        description: "Ocorreu um erro ao exportar os dados do sistema.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleImportData = async () => {
    if (!backupFile) {
      toast({
        title: "Nenhum arquivo selecionado",
        description: "Por favor, selecione um arquivo de backup para importar.",
        variant: "destructive",
      })
      return
    }

    setIsImporting(true)

    try {
      // Ler o arquivo
      const fileContent = await backupFile.text()
      const data = JSON.parse(fileContent)

      // Validar dados
      if (!data.users || !data.documents || !data.categories) {
        throw new Error("Arquivo de backup inválido")
      }

      // Importar dados
      localStorage.setItem("users", JSON.stringify(data.users))
      localStorage.setItem("documents", JSON.stringify(data.documents))
      localStorage.setItem("categories", JSON.stringify(data.categories))

      if (data.systemSettings) {
        localStorage.setItem("systemSettings", JSON.stringify(data.systemSettings))
      }

      toast({
        title: "Backup importado",
        description: "Os dados foram importados com sucesso.",
      })

      // Limpar
      setBackupFile(null)
    } catch (error) {
      toast({
        title: "Erro ao importar dados",
        description: "O arquivo de backup é inválido ou está corrompido.",
        variant: "destructive",
      })
    } finally {
      setIsImporting(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setBackupFile(e.target.files[0])
    }
  }

  const handleResetSystem = () => {
    if (
      window.confirm(
        "ATENÇÃO: Esta ação irá resetar todos os dados do sistema. Esta ação não pode ser desfeita. Deseja continuar?",
      )
    ) {
      // Manter apenas usuários admin
      const users = JSON.parse(localStorage.getItem("users") || "[]")
      const adminUsers = users.filter((user: any) => user.user_metadata?.role === "admin")

      // Limpar dados
      localStorage.removeItem("documents")
      localStorage.removeItem("categories")
      localStorage.removeItem("systemSettings")

      // Manter apenas admins
      localStorage.setItem("users", JSON.stringify(adminUsers))

      toast({
        title: "Sistema resetado",
        description: "Todos os dados do sistema foram resetados, exceto usuários administradores.",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <Database className="h-12 w-12 text-primary" />
              <div>
                <h3 className="text-lg font-medium">Exportar Dados</h3>
                <p className="text-sm text-muted-foreground">Exporte todos os dados do sistema para um arquivo JSON</p>
              </div>
              <Button onClick={handleExportData} disabled={isExporting} className="w-full">
                {isExporting ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Exportando...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Exportar Backup
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <Upload className="h-12 w-12 text-primary" />
              <div>
                <h3 className="text-lg font-medium">Importar Dados</h3>
                <p className="text-sm text-muted-foreground">Importe dados de um arquivo de backup</p>
              </div>
              <div className="w-full">
                <Label htmlFor="backupFile" className="sr-only">
                  Arquivo de Backup
                </Label>
                <Input id="backupFile" type="file" accept=".json" onChange={handleFileChange} className="mb-2" />
                <Button onClick={handleImportData} disabled={isImporting || !backupFile} className="w-full">
                  {isImporting ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Importando...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Importar Backup
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Resetar Sistema</h3>
        <p className="text-sm text-muted-foreground">
          Esta ação irá resetar todos os dados do sistema, exceto usuários administradores. Esta ação não pode ser
          desfeita.
        </p>
        <Button variant="destructive" onClick={handleResetSystem}>
          Resetar Sistema
        </Button>
      </div>
    </div>
  )
}

