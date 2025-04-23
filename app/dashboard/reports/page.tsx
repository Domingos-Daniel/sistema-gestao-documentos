"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { supabase } from "@/lib/supabase"
import { BarChart, Download, FileText, Users, Calendar } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function ReportsPage() {
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState("month")
  const [documentStats, setDocumentStats] = useState<any[]>([])
  const [userStats, setUserStats] = useState<any[]>([])
  const [downloadStats, setDownloadStats] = useState<any[]>([])
  const [topDocuments, setTopDocuments] = useState<any[]>([])
  const { toast } = useToast()
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Check if user is admin
    if (user && user.user_metadata?.role !== "admin") {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para acessar esta página",
        variant: "destructive",
      })
      router.push("/dashboard")
      return
    }

    fetchStats()
  }, [user, period, router])

  const fetchStats = async () => {
    setLoading(true)
    try {
      // Get date range based on period
      const endDate = new Date()
      const startDate = new Date()

      if (period === "week") {
        startDate.setDate(endDate.getDate() - 7)
      } else if (period === "month") {
        startDate.setMonth(endDate.getMonth() - 1)
      } else if (period === "year") {
        startDate.setFullYear(endDate.getFullYear() - 1)
      }

      // Fetch document uploads by date
      const { data: documentData, error: documentError } = await supabase
        .from("documents")
        .select("created_at")
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString())

      if (documentError) {
        throw documentError
      }

      // Fetch user registrations by date
      const { data: userData, error: userError } = await supabase
        .from("profiles")
        .select("created_at")
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString())

      if (userError) {
        throw userError
      }

      // Fetch downloads by date
      const { data: downloadData, error: downloadError } = await supabase
        .from("document_downloads")
        .select("created_at")
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString())

      if (downloadError) {
        throw downloadError
      }

      // Fetch top downloaded documents
      const { data: topDocsData, error: topDocsError } = await supabase
        .from("document_downloads")
        .select("document_id, documents(id, title, file_name)")
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString())

      if (topDocsError) {
        throw topDocsError
      }

      // Process document stats
      const docStats = processDateStats(documentData || [], period)
      setDocumentStats(docStats)

      // Process user stats
      const usrStats = processDateStats(userData || [], period)
      setUserStats(usrStats)

      // Process download stats
      const dlStats = processDateStats(downloadData || [], period)
      setDownloadStats(dlStats)

      // Process top documents
      const topDocs = processTopDocuments(topDocsData || [])
      setTopDocuments(topDocs)
    } catch (error: any) {
      toast({
        title: "Erro ao carregar estatísticas",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const processDateStats = (data: any[], period: string) => {
    const stats: any = {}

    data.forEach((item) => {
      let dateKey
      const date = new Date(item.created_at)

      if (period === "week") {
        // Group by day of week
        dateKey = date.toLocaleDateString("pt-BR", { weekday: "long" })
      } else if (period === "month") {
        // Group by day of month
        dateKey = date.getDate().toString()
      } else if (period === "year") {
        // Group by month
        dateKey = date.toLocaleDateString("pt-BR", { month: "long" })
      }

      if (dateKey) {
        stats[dateKey] = (stats[dateKey] || 0) + 1
      }
    })

    // Convert to array format for easier rendering
    return Object.entries(stats).map(([label, count]) => ({
      label,
      count,
    }))
  }

  const processTopDocuments = (data: any[]) => {
    const docCounts: any = {}

    data.forEach((item) => {
      const docId = item.document_id
      docCounts[docId] = {
        count: (docCounts[docId]?.count || 0) + 1,
        title: item.documents?.title || "Documento desconhecido",
        file_name: item.documents?.file_name || "",
      }
    })

    // Convert to array and sort by count
    return Object.entries(docCounts)
      .map(([id, info]: [string, any]) => ({
        id,
        title: info.title,
        file_name: info.file_name,
        count: info.count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5) // Top 5
  }

  const exportToCsv = (data: any[], filename: string) => {
    // Convert data to CSV format
    const csvContent = [
      // Header row
      Object.keys(data[0]).join(","),
      // Data rows
      ...data.map((row) => Object.values(row).join(",")),
    ].join("\n")

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `${filename}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Relatórios e Estatísticas</h1>
        <p className="text-muted-foreground">Visualize dados de uso do sistema</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Período de Análise</CardTitle>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Selecione um período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Última semana</SelectItem>
                <SelectItem value="month">Último mês</SelectItem>
                <SelectItem value="year">Último ano</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Uploads de Documentos</CardTitle>
                <CardDescription>Documentos enviados por período</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => exportToCsv(documentStats, "uploads-documentos")}>
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {documentStats.length > 0 ? (
              <div className="space-y-4">
                {documentStats.map((stat, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{stat.label}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="h-2 w-24 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{
                            width: `${(stat.count / Math.max(...documentStats.map((s) => s.count))) * 100}%`,
                          }}
                        />
                      </div>
                      <span>{stat.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10">
                <FileText className="h-10 w-10 text-muted-foreground" />
                <p className="mt-2 text-center text-muted-foreground">
                  Nenhum dado disponível para o período selecionado
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Registros de Usuários</CardTitle>
                <CardDescription>Novos usuários por período</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => exportToCsv(userStats, "registros-usuarios")}>
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {userStats.length > 0 ? (
              <div className="space-y-4">
                {userStats.map((stat, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{stat.label}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="h-2 w-24 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{
                            width: `${(stat.count / Math.max(...userStats.map((s) => s.count))) * 100}%`,
                          }}
                        />
                      </div>
                      <span>{stat.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10">
                <Users className="h-10 w-10 text-muted-foreground" />
                <p className="mt-2 text-center text-muted-foreground">
                  Nenhum dado disponível para o período selecionado
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Downloads de Documentos</CardTitle>
                <CardDescription>Downloads realizados por período</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => exportToCsv(downloadStats, "downloads-documentos")}>
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {downloadStats.length > 0 ? (
              <div className="space-y-4">
                {downloadStats.map((stat, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{stat.label}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="h-2 w-24 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{
                            width: `${(stat.count / Math.max(...downloadStats.map((s) => s.count))) * 100}%`,
                          }}
                        />
                      </div>
                      <span>{stat.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10">
                <Download className="h-10 w-10 text-muted-foreground" />
                <p className="mt-2 text-center text-muted-foreground">
                  Nenhum dado disponível para o período selecionado
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Documentos Mais Baixados</CardTitle>
                <CardDescription>Top 5 documentos por número de downloads</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => exportToCsv(topDocuments, "top-documentos")}>
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {topDocuments.length > 0 ? (
              <div className="space-y-4">
                {topDocuments.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate max-w-[200px]">{doc.title}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="h-2 w-24 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{
                            width: `${(doc.count / Math.max(...topDocuments.map((d) => d.count))) * 100}%`,
                          }}
                        />
                      </div>
                      <span>{doc.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10">
                <BarChart className="h-10 w-10 text-muted-foreground" />
                <p className="mt-2 text-center text-muted-foreground">
                  Nenhum dado disponível para o período selecionado
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

