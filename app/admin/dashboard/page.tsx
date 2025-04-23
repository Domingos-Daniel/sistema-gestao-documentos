"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/hooks/use-auth" // Assuming you might need user info
import { supabase } from "@/lib/supabase"
import { FileText, FolderKanban, Clock, Loader2, Inbox, ArrowRight, AlertCircle } from "lucide-react" // Changed FolderPlus to FolderKanban
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

// --- Define Types ---
interface AdminDocument {
  id: string;
  title: string;
  created_at: string;
  // Optional: Add author profile if you join it
  profiles?: {
    full_name: string | null;
    avatar_url?: string | null;
  } | null;
}

interface AdminDashboardStats {
  totalDocuments: number;
  recentDocuments: number; // Count of recent docs
  totalCategories: number;
}

export default function AdminDashboardPage() {
  const { user } = useAuth(); // Get user if needed for RLS or display
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentDocuments, setRecentDocuments] = useState<AdminDocument[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAdminStats = async () => {
      setLoading(true);
      setError(null);
      console.log("Admin Dashboard: Starting data fetch...");

      try {
        // --- Fetch Counts Concurrently ---
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const [
          docCountResult,
          recentDocCountResult,
          categoryCountResult,
          recentDocsResult // This is the one causing the error
        ] = await Promise.allSettled([
          supabase.from("documents").select("*", { count: "exact", head: true }),
          supabase.from("documents").select("*", { count: "exact", head: true }).gte("created_at", sevenDaysAgo.toISOString()),
          supabase.from("categories").select("*", { count: "exact", head: true }),
          // --- Modify this select query ---
          supabase.from("documents")
            .select(`
              id,
              title,
              created_at
            `)
            .order("created_at", { ascending: false })
            .limit(5)
          // --- End of modification ---
        ]);

        // --- Process Results ---
        let documentsCount = 0;
        if (docCountResult.status === 'fulfilled' && !docCountResult.value.error) {
          documentsCount = docCountResult.value.count || 0;
          console.log("Admin Dashboard: Fetched documents count:", documentsCount);
        } else if (docCountResult.status === 'rejected' || docCountResult.value.error) {
          throw new Error(`Docs Count: ${docCountResult.status === 'rejected' ? docCountResult.reason : docCountResult.value.error?.message}`);
        }

        let recentDocumentsCount = 0;
        if (recentDocCountResult.status === 'fulfilled' && !recentDocCountResult.value.error) {
          recentDocumentsCount = recentDocCountResult.value.count || 0;
          console.log("Admin Dashboard: Fetched recent documents count:", recentDocumentsCount);
        } else if (recentDocCountResult.status === 'rejected' || recentDocCountResult.value.error) {
          throw new Error(`Recent Docs Count: ${recentDocCountResult.status === 'rejected' ? recentDocCountResult.reason : recentDocCountResult.value.error?.message}`);
        }

        let categoriesCount = 0;
        if (categoryCountResult.status === 'fulfilled' && !categoryCountResult.value.error) {
          categoriesCount = categoryCountResult.value.count || 0;
          console.log("Admin Dashboard: Fetched categories count:", categoriesCount);
        } else if (categoryCountResult.status === 'rejected' || categoryCountResult.value.error) {
          // Log warning instead of throwing if categories are less critical
          console.warn("Admin Dashboard: Could not fetch categories count:", categoryCountResult.status === 'rejected' ? categoryCountResult.reason : categoryCountResult.value.error?.message);
        }

        let fetchedRecentDocs: AdminDocument[] = [];
        if (recentDocsResult.status === 'fulfilled' && !recentDocsResult.value.error) {
          fetchedRecentDocs = (recentDocsResult.value.data as AdminDocument[]) || [];
          console.log("Admin Dashboard: Fetched recent documents list:", fetchedRecentDocs);
        } else if (recentDocsResult.status === 'rejected' || recentDocsResult.value.error) {
          throw new Error(`Recent Docs List: ${recentDocsResult.status === 'rejected' ? recentDocsResult.reason : recentDocsResult.value.error?.message}`);
        }

        // --- Update State ---
        const fetchedStats = {
          totalDocuments: documentsCount,
          recentDocuments: recentDocumentsCount,
          totalCategories: categoriesCount,
        };
        setStats(fetchedStats);
        setRecentDocuments(fetchedRecentDocs);
        console.log("Admin Dashboard: State updated.");

      } catch (err: any) {
        console.error("Admin Dashboard: Error fetching data:", err);
        setError(err.message || "Falha ao carregar dados do dashboard.");
        setStats(null);
        setRecentDocuments([]);
      } finally {
        setLoading(false);
        console.log("Admin Dashboard: Fetch finished.");
      }
    };

    fetchAdminStats();

  }, []); // Empty dependency array to run once on mount

  const getInitials = (name: string | null | undefined): string => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  // --- Loading State UI ---
  if (loading) {
    return (
      <div className="flex flex-col gap-8 p-4 md:p-6 animate-pulse">
        {/* Header Skeleton */}
        <div>
          <Skeleton className="h-8 w-48 mb-2 bg-muted" />
          <Skeleton className="h-4 w-72 bg-muted" />
        </div>
        {/* Stats Cards Skeleton */}
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="bg-card border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24 bg-muted" />
                <Skeleton className="h-5 w-5 bg-muted rounded-sm" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-1 bg-muted" />
                <Skeleton className="h-3 w-32 bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
        {/* Recent Documents Skeleton */}
        <Card className="bg-card border">
          <CardHeader>
            <Skeleton className="h-6 w-40 mb-1 bg-muted" />
            <Skeleton className="h-4 w-56 bg-muted" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-full hidden sm:block bg-muted" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-48 bg-muted" />
                      <Skeleton className="h-3 w-24 bg-muted" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-20 bg-muted" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- Error State UI ---
   if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-150px)] text-center p-6 bg-background">
        <AlertCircle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2 text-foreground">Erro ao Carregar Dashboard</h2>
        <p className="text-muted-foreground mb-4 max-w-md">{error}</p>
        <Button onClick={() => window.location.reload()}>Tentar Novamente</Button>
      </div>
    );
  }

  // --- Main Dashboard UI ---
  return (
    <div className="flex flex-col gap-6 md:gap-8 p-4 md:p-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Dashboard Administrativo</h1>
        <p className="text-muted-foreground">
          Visão geral e gestão do Repositório Acadêmico.
        </p>
      </div>

      {/* Stats Cards Grid */}
      {stats !== null ? (
        <div className="grid gap-4 md:grid-cols-3">
          {/* Total Documents Card */}
          <Card className="bg-blue-50 border border-blue-100 dark:bg-blue-950 dark:border-blue-900 group transition-transform duration-200 ease-out hover:scale-[1.02]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Total de Documentos</CardTitle>
              <FileText className="h-5 w-5 text-blue-500 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">{stats.totalDocuments}</div>
              <p className="text-xs text-blue-600 dark:text-blue-400">Documentos no sistema</p>
            </CardContent>
             <CardFooter className="text-xs text-blue-600 dark:text-blue-400 pt-2">
               <Link href="/admin/documentos" className="flex items-center hover:underline">
                 Gerenciar Documentos <ArrowRight className="ml-1 h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity"/>
               </Link>
             </CardFooter>
          </Card>

          {/* Recent Documents Card */}
          <Card className="bg-green-50 border border-green-100 dark:bg-green-950 dark:border-green-900 group transition-transform duration-200 ease-out hover:scale-[1.02]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">Documentos Recentes</CardTitle>
              <Clock className="h-5 w-5 text-green-500 dark:text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-900 dark:text-green-100">{stats.recentDocuments}</div>
              <p className="text-xs text-green-600 dark:text-green-400">Adicionados nos últimos 7 dias</p>
            </CardContent>
             <CardFooter className="text-xs text-green-600 dark:text-green-400 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
               <span className="flex items-center">
                 Atividade recente
               </span>
             </CardFooter>
          </Card>

          {/* Total Categories Card */}
          <Card className="bg-purple-50 border border-purple-100 dark:bg-purple-950 dark:border-purple-900 group transition-transform duration-200 ease-out hover:scale-[1.02]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">Total de Categorias</CardTitle>
              <FolderKanban className="h-5 w-5 text-purple-500 dark:text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">{stats.totalCategories}</div>
               <p className="text-xs text-purple-600 dark:text-purple-400">Categorias definidas</p>
            </CardContent>
            <CardFooter className="text-xs text-purple-600 dark:text-purple-400 pt-2">
              <Link href="/admin/categorias" className="flex items-center hover:underline"> {/* Adjust link if needed */}
                Gerenciar Categorias <ArrowRight className="ml-1 h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity"/>
              </Link>
            </CardFooter>
          </Card>
        </div>
      ) : (
         !loading && !error && (
            <div className="text-center text-muted-foreground py-10">
                Não foi possível carregar as estatísticas.
            </div>
         )
      )}

      {/* Recent Documents List */}
      <Card className="border dark:border-border/50">
        <CardHeader>
          <CardTitle className="text-foreground">Documentos Adicionados Recentemente</CardTitle>
          <CardDescription>Os últimos 5 documentos carregados no sistema.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-b dark:border-border/30">
                {/* Optional: Add Avatar if joining profiles */}
                {/* <TableHead className="w-[60px] hidden sm:table-cell pl-6"></TableHead> */}
                <TableHead className="pl-6">Título</TableHead>
                <TableHead className="text-right pr-6">Adicionado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentDocuments.length > 0 ? (
                recentDocuments.map((doc) => (
                  <TableRow key={doc.id} className="hover:bg-muted/50 dark:hover:bg-muted/20 transition-colors border-none">
                    {/* Optional: Avatar Cell */}
                    {/* <TableCell className="hidden sm:table-cell pl-6 py-3">
                      <Avatar className="h-9 w-9 border dark:border-border/30">
                        <AvatarImage src={doc.profiles?.avatar_url || undefined} alt={doc.profiles?.full_name || 'Usuário'} />
                        <AvatarFallback className="text-xs bg-muted dark:bg-muted/40 text-muted-foreground dark:text-foreground/70">{getInitials(doc.profiles?.full_name)}</AvatarFallback>
                      </Avatar>
                    </TableCell> */}
                    <TableCell className="py-3 pl-6">
                      <Link
                        href={`/admin/documentos/${doc.id}`} // Link to document detail page
                        className="font-semibold text-foreground hover:text-primary hover:underline"
                      >
                        {doc.title}
                      </Link>
                      {/* Optional: Author Name */}
                      {/* <div className="text-sm text-muted-foreground">
                        por {doc.profiles?.full_name || "Desconhecido"}
                      </div> */}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground pr-6 py-3">
                      {formatDistanceToNow(new Date(doc.created_at), { addSuffix: true, locale: ptBR })}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={2} className="h-48 text-center"> {/* Adjusted colSpan */}
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <Inbox className="h-12 w-12" />
                      <p className="font-medium">Nenhum documento recente.</p>
                      <p className="text-sm">Adicione documentos para vê-los aqui.</p>
                      <Button size="sm" asChild className="mt-3">
                        <Link href="/admin/upload">Adicionar Documento</Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        {recentDocuments.length > 0 && (
            <CardFooter className="justify-end border-t dark:border-border/30 pt-4 pb-4 pr-6">
                <Button variant="outline" size="sm" asChild>
                    <Link href="/admin/documentos">Ver Todos Documentos</Link>
                </Button>
            </CardFooter>
        )}
      </Card>
    </div>
  );
}

