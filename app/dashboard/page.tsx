"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/hooks/use-auth"
import { supabase } from "@/lib/supabase"
import { FileText, Users, Clock, Download, Loader2, Inbox, ArrowRight, AlertCircle } from "lucide-react" // Added AlertCircle
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
import { cn } from "@/lib/utils" // Import cn for conditional classes

// Types (assuming they are correct)
interface RecentDocument {
  id: string;
  title: string;
  created_at: string;
  profiles: {
    full_name: string | null;
    avatar_url?: string | null;
  } | null;
}

interface DashboardStats {
  totalDocuments: number;
  recentUploads: number;
  totalUsers: number;
  totalDownloads: number;
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true)
  const [recentDocuments, setRecentDocuments] = useState<RecentDocument[]>([])
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      console.log("Dashboard: Starting data fetch..."); // Log start

      try {
        // Fetch total documents count
        const { count: documentsCount, error: docError } = await supabase
          .from("documents")
          .select("*", { count: "exact", head: true });
        if (docError) throw new Error(`Docs Count: ${docError.message}`);
        console.log("Dashboard: Fetched documents count:", documentsCount);

        // Fetch recent uploads count (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const { count: recentUploadsCount, error: recentError } = await supabase
          .from("documents")
          .select("*", { count: "exact", head: true })
          .gte("created_at", sevenDaysAgo.toISOString());
        if (recentError) throw new Error(`Recent Uploads: ${recentError.message}`);
        console.log("Dashboard: Fetched recent uploads count:", recentUploadsCount);

        // Fetch total users count (conditionally for admin)
        let usersCount = 0;
        const userRole = user?.user_metadata?.role; // Ensure role is read correctly
        console.log("Dashboard: User role:", userRole);
        if (userRole === "admin") {
          const { count: profilesCount, error: profilesError } = await supabase
            .from("profiles")
            .select("*", { count: "exact", head: true });
          if (profilesError) throw new Error(`Users Count: ${profilesError.message}`);
          usersCount = profilesCount || 0;
          console.log("Dashboard: Fetched users count (admin):", usersCount);
        }

        // Fetch total downloads count
        let downloadsCount = 0;
        // Check if the table exists or if RLS prevents access before querying
        const { count: dlCount, error: downloadsError } = await supabase
          .from("document_downloads") // Double-check this table name and RLS policies
          .select("*", { count: "exact", head: true });
        if (downloadsError) {
            console.warn("Dashboard: Could not fetch download count:", downloadsError.message);
            // Optionally set a specific state to indicate downloads couldn't be fetched
        } else {
            downloadsCount = dlCount || 0;
            console.log("Dashboard: Fetched downloads count:", downloadsCount);
        }

        const fetchedStats = {
          totalDocuments: documentsCount || 0,
          recentUploads: recentUploadsCount || 0,
          totalUsers: usersCount,
          totalDownloads: downloadsCount,
        };
        setStats(fetchedStats);
        console.log("Dashboard: Stats state updated:", fetchedStats);

        // Fetch recent documents
        const { data: recentDocsData, error: recentDocsError } = await supabase
          .from("documents")
          .select(`
            id,
            title,
            created_at,
            profiles ( full_name, avatar_url )
          `)
          .order("created_at", { ascending: false })
          .limit(5);
        if (recentDocsError) throw new Error(`Recent Docs: ${recentDocsError.message}`);

        const fetchedRecentDocs = (recentDocsData as RecentDocument[]) || [];
        setRecentDocuments(fetchedRecentDocs);
        console.log("Dashboard: Recent documents state updated:", fetchedRecentDocs);

      } catch (err: any) {
        console.error("Dashboard: Error fetching data:", err);
        setError(err.message || "Falha ao carregar dados do dashboard.");
        setStats(null);
        setRecentDocuments([]);
      } finally {
        setLoading(false);
        console.log("Dashboard: Fetch finished, loading set to false.");
      }
    };

    // Only fetch if user is loaded
    if (user) {
        fetchStats();
    } else {
        // If user is null after auth check, stop loading
        // This assumes useAuth sets user to null initially or after logout
        console.log("Dashboard: No user found, skipping fetch.");
        setLoading(false);
    }

  }, [user]); // Dependency array includes user

  const getInitials = (name: string | null | undefined): string => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  // --- Loading State UI ---
  if (loading) {
    // ... (Skeleton loading UI remains the same) ...
     return (
      <div className="flex flex-col gap-8 p-4 md:p-6 animate-pulse">
        {/* Header Skeleton */}
        <div>
          <Skeleton className="h-8 w-48 mb-2 bg-muted" />
          <Skeleton className="h-4 w-64 bg-muted" />
        </div>
        {/* Stats Cards Skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
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
                      <Skeleton className="h-3 w-32 sm:hidden bg-muted" /> {/* Author on mobile */}
                       <Skeleton className="h-3 w-24 hidden sm:block bg-muted" /> {/* Author on desktop */}
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
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral do seu sistema de gestão de documentos.
        </p>
      </div>

      {/* Stats Cards Grid - Check if stats is not null */}
      {stats !== null ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Documents Card */}
          <Card className="bg-blue-50 border border-blue-100 dark:bg-blue-950 dark:border-blue-900 group transition-transform duration-200 ease-out hover:scale-[1.02]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Total de Documentos</CardTitle>
              <FileText className="h-5 w-5 text-blue-500 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">{stats.totalDocuments}</div>
            </CardContent>
             <CardFooter className="text-xs text-blue-600 dark:text-blue-400 pt-2">
               <Link href="/admin/documentos" className="flex items-center hover:underline">
                 Ver todos <ArrowRight className="ml-1 h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity"/>
               </Link>
             </CardFooter>
          </Card>

          {/* Recent Uploads Card */}
          <Card className="bg-green-50 border border-green-100 dark:bg-green-950 dark:border-green-900 group transition-transform duration-200 ease-out hover:scale-[1.02]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">Uploads Recentes</CardTitle>
              <Clock className="h-5 w-5 text-green-500 dark:text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-900 dark:text-green-100">{stats.recentUploads}</div>
              <p className="text-xs text-green-600 dark:text-green-400">Nos últimos 7 dias</p>
            </CardContent>
             <CardFooter className="text-xs text-green-600 dark:text-green-400 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
               <span className="flex items-center">
                 Atualizado
               </span>
             </CardFooter>
          </Card>

          {/* Total Users Card (Admin Only) */}
          {user?.user_metadata?.role === "admin" && (
            <Card className="bg-purple-50 border border-purple-100 dark:bg-purple-950 dark:border-purple-900 group transition-transform duration-200 ease-out hover:scale-[1.02]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">Total de Usuários</CardTitle>
                <Users className="h-5 w-5 text-purple-500 dark:text-purple-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">{stats.totalUsers}</div>
              </CardContent>
              <CardFooter className="text-xs text-purple-600 dark:text-purple-400 pt-2">
                <Link href="/admin/users" className="flex items-center hover:underline">
                  Gerenciar <ArrowRight className="ml-1 h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity"/>
                </Link>
              </CardFooter>
            </Card>
          )}

          {/* Total Downloads Card */}
          <Card className="bg-orange-50 border border-orange-100 dark:bg-orange-950 dark:border-orange-900 group transition-transform duration-200 ease-out hover:scale-[1.02]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">Total de Downloads</CardTitle>
              <Download className="h-5 w-5 text-orange-500 dark:text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-900 dark:text-orange-100">{stats.totalDownloads}</div>
            </CardContent>
             <CardFooter className="text-xs text-orange-600 dark:text-orange-400 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
               <span className="flex items-center">
                 Todos os documentos
               </span>
             </CardFooter>
          </Card>
        </div>
      ) : (
         // Render something if stats is null but not loading and no error (e.g., user not admin, no data yet)
         !loading && !error && (
            <div className="text-center text-muted-foreground py-10">
                Não foi possível carregar as estatísticas.
            </div>
         )
      )}

      {/* Recent Documents Section */}
      <Card className="border dark:border-border/50">
        <CardHeader>
          <CardTitle className="text-foreground">Documentos Recentes</CardTitle>
          <CardDescription>Últimos documentos adicionados ao sistema.</CardDescription>
        </CardHeader>
        <CardContent className="p-0"> {/* Remove padding to allow table full width */}
          <Table>
            <TableHeader>
              {/* Add subtle border */}
              <TableRow className="border-b dark:border-border/30">
                <TableHead className="w-[60px] hidden sm:table-cell pl-6"></TableHead> {/* Avatar */}
                <TableHead>Título / Autor</TableHead>
                <TableHead className="text-right pr-6">Adicionado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentDocuments.length > 0 ? (
                recentDocuments.map((doc, index) => (
                  // Remove borders between rows for cleaner look, add hover
                  <TableRow key={doc.id} className="hover:bg-muted/50 dark:hover:bg-muted/20 transition-colors border-none">
                    <TableCell className="hidden sm:table-cell pl-6 py-3">
                      <Avatar className="h-9 w-9 border dark:border-border/30">
                        <AvatarImage src={doc.profiles?.avatar_url || undefined} alt={doc.profiles?.full_name || 'Usuário'} />
                        <AvatarFallback className="text-xs bg-muted dark:bg-muted/40 text-muted-foreground dark:text-foreground/70">{getInitials(doc.profiles?.full_name)}</AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="py-3">
                      <Link
                        href={`/admin/documentos/${doc.id}`}
                        className="font-semibold text-foreground hover:text-primary hover:underline"
                      >
                        {doc.title}
                      </Link>
                      <div className="text-sm text-muted-foreground">
                        por {doc.profiles?.full_name || "Desconhecido"}
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground pr-6 py-3">
                      {formatDistanceToNow(new Date(doc.created_at), { addSuffix: true, locale: ptBR })}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="h-48 text-center"> {/* Increased height */}
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <Inbox className="h-12 w-12" />
                      <p className="font-medium">Nenhum documento recente.</p>
                      <p className="text-sm">Comece adicionando um novo documento.</p>
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

