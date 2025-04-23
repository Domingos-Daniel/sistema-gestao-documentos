"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, RefreshCw, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Serviço para gerenciar logs do sistema
const logService = {
  getLogs: () => {
    if (typeof window === "undefined") return []
    const logs = localStorage.getItem("systemLogs")
    return logs ? JSON.parse(logs) : []
  },

  addLog: (action: string, details: string, level: "info" | "warning" | "error" = "info") => {
    const logs = logService.getLogs()
    const newLog = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      action,
      details,
      level,
    }
    logs.unshift(newLog) // Adicionar no início

    // Manter apenas os últimos 1000 logs
    const trimmedLogs = logs.slice(0, 1000)
    localStorage.setItem("systemLogs", JSON.stringify(trimmedLogs))
    return newLog
  },

  clearLogs: () => {
    localStorage.setItem("systemLogs", JSON.stringify([]))
  },
}

// Adicionar alguns logs de exemplo se não existirem
const initializeLogs = () => {
  const logs = logService.getLogs()
  if (logs.length === 0) {
    logService.addLog("Sistema Iniciado", "O sistema foi iniciado com sucesso", "info")
    logService.addLog("Usuário Criado", "Um novo usuário foi criado: admin@example.com", "info")
    logService.addLog("Tentativa de Login", "Tentativa de login falhou para user@example.com", "warning")
    logService.addLog("Erro de Sistema", "Falha ao conectar com o serviço de armazenamento", "error")
  }
}

export function SystemLogs() {
  const [logs, setLogs] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    initializeLogs()
    loadLogs()
  }, [])

  const loadLogs = () => {
    setIsLoading(true)
    const loadedLogs = logService.getLogs()
    setLogs(loadedLogs)
    setIsLoading(false)
  }

  const handleClearLogs = () => {
    if (window.confirm("Tem certeza que deseja limpar todos os logs? Esta ação não pode ser desfeita.")) {
      logService.clearLogs()
      setLogs([])
      toast({
        title: "Logs limpos",
        description: "Todos os logs do sistema foram limpos.",
      })
    }
  }

  const filteredLogs = logs.filter(
    (log) =>
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getLevelBadge = (level: string) => {
    switch (level) {
      case "info":
        return <Badge className="bg-blue-500">Info</Badge>
      case "warning":
        return <Badge className="bg-yellow-500">Aviso</Badge>
      case "error":
        return <Badge className="bg-red-500">Erro</Badge>
      default:
        return <Badge>{level}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar logs..."
              className="pl-8 w-[300px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={loadLogs} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
          <Button variant="destructive" onClick={handleClearLogs}>
            <Trash2 className="mr-2 h-4 w-4" />
            Limpar Logs
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data/Hora</TableHead>
              <TableHead>Ação</TableHead>
              <TableHead>Detalhes</TableHead>
              <TableHead>Nível</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.length > 0 ? (
              filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-xs">{new Date(log.timestamp).toLocaleString()}</TableCell>
                  <TableCell className="font-medium">{log.action}</TableCell>
                  <TableCell>{log.details}</TableCell>
                  <TableCell>{getLevelBadge(log.level)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  Nenhum log encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

