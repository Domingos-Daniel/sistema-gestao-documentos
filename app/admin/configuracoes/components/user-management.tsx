"use client"

import React, { useState, useEffect } from "react"; // Added React import
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreHorizontal, UserPlus, Loader2, Trash2, Edit, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import type { User as SupabaseUser } from '@supabase/supabase-js';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; // Add DropdownMenu imports

// --- Types and Constants ---
interface ManagedUser extends SupabaseUser {} // Extend if needed later
const ROLES = ["admin", "editor", "viewer"]; // Define your roles

// Schema for adding/inviting a user
const userSchema = z.object({
  email: z.string().email({ message: "Email inválido." }),
  role: z.enum(ROLES as [string, ...string[]], { required_error: "Selecione uma função." }),
});
type UserFormData = z.infer<typeof userSchema>;

// Helper function to get initials
const getInitials = (name: string | null | undefined, email?: string | null | undefined): string => {
    if (name) {
        return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    }
    if (email) {
        return email[0].toUpperCase();
    }
    return "?";
};

export function UserManagement() {
  // --- State Variables ---
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false); // For button loading states
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<ManagedUser | null>(null);
  const [userToEdit, setUserToEdit] = useState<ManagedUser | null>(null);
  const [editingRole, setEditingRole] = useState<string | undefined>(undefined);

  const { toast } = useToast();

  // Form hook setup (we'll use this in Step 3)
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: { email: "", role: undefined }
  });

  // --- Fetch Users (Read) ---
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      // Chama a rota de API local
      const response = await fetch("/api/admin-users");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erro ao buscar usuários");
      setUsers(data.users);
    } catch (err: any) {
      setError(err.message || "Não foi possível carregar a lista de usuários.");
      setUsers([]);
      toast({ title: "Erro ao buscar usuários", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // --- Edit User Role (Update) ---
   const handleEditUserRole = async () => {
    if (!userToEdit || !editingRole) return;
    setIsProcessing(true);
    console.log(`Updating role for ${userToEdit.id} to ${editingRole}`);
    try {
        // !!! SECURITY WARNING: Requires admin privileges on the client or use a backend function !!!
        const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
            userToEdit.id,
            { user_metadata: { ...userToEdit.user_metadata, role: editingRole } } // Merge role
        );
        if (updateError) throw updateError;
        console.log("Role update successful:", updatedUser);
        toast({ title: "Função atualizada!", description: `A função de ${userToEdit.email || userToEdit.id} foi alterada.` });
        setUserToEdit(null); // Close dialog
        await fetchUsers(); // Refresh list
    } catch (err: any) {
        console.error("Erro ao atualizar função:", err);
        toast({ title: "Erro ao atualizar função", description: err.message, variant: "destructive" });
    } finally {
        setIsProcessing(false);
    }
  };

  // --- Delete User (Delete) ---
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsProcessing(true);
    console.log(`Deleting user ${userToDelete.id}`);
    try {
      // !!! SECURITY WARNING: Requires admin privileges on the client or use a backend function !!!
      const { error: deleteError } = await supabase.auth.admin.deleteUser(userToDelete.id);
      if (deleteError) throw deleteError;
      console.log("Delete successful");
      toast({ title: "Usuário excluído", description: `${userToDelete.email || userToDelete.id} foi removido.` });
      setUserToDelete(null); // Close confirmation
      await fetchUsers(); // Refresh list
    } catch (err: any) {
      console.error("Erro ao excluir usuário:", err);
      toast({ title: "Erro ao excluir usuário", description: err.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  // --- Initial Fetch ---
  useEffect(() => {
    fetchUsers();
  }, []); // Empty dependency array means run once on mount

  // --- Render Logic ---
  if (loading) {
    return <div className="flex justify-center items-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  if (error) {
    return <div className="text-center text-destructive py-10">{error}</div>;
  }

  // Main component return (will be expanded)
  return (
    <div className="space-y-4">
        {/* Add User Button will go here */}

        {/* Users Table */}
        <div className="rounded-md border">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead className="w-[80px] hidden sm:table-cell">Avatar</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Função</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {users.length > 0 ? (
                users.map((user) => (
                    <TableRow key={user.id}>
                    <TableCell className="hidden sm:table-cell">
                        <Avatar className="h-9 w-9">
                        <AvatarImage src={user.user_metadata?.avatar_url || undefined} alt={user.user_metadata?.full_name || user.email} />
                        <AvatarFallback>{getInitials(user.user_metadata?.full_name, user.email)}</AvatarFallback>
                        </Avatar>
                    </TableCell>
                    <TableCell>
                        <div className="font-medium">{user.user_metadata?.full_name || "Sem nome"}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                    </TableCell>
                    <TableCell>
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-muted capitalize">
                            {user.user_metadata?.role || "N/D"}
                        </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/D'}
                    </TableCell>
                    <TableCell className="text-right">
                        {/* Actions Dropdown */}
                        <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Ações</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            {/* Edit Role Action */}
                            <DropdownMenuItem
                            onClick={() => {
                                setUserToEdit(user);
                                setEditingRole(user.user_metadata?.role || undefined); // Pre-fill role
                            }}
                            className="cursor-pointer"
                            >
                            <Edit className="mr-2 h-4 w-4" /> Editar Função
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {/* Delete User Action */}
                            <DropdownMenuItem
                                className="text-destructive focus:text-destructive cursor-pointer"
                                onClick={() => setUserToDelete(user)} // Set user for delete confirmation
                            >
                            <Trash2 className="mr-2 h-4 w-4" /> Excluir Usuário
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                    </TableRow>
                ))
                ) : (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                    Nenhum usuário encontrado.
                    </TableCell>
                </TableRow>
                )}
            </TableBody>
            </Table>
        </div>

        {/* Edit User Role Dialog */}
        <Dialog open={!!userToEdit} onOpenChange={(isOpen) => !isOpen && setUserToEdit(null)}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Editar Função do Usuário</DialogTitle>
                    <DialogDescription>
                        Alterar a função para {userToEdit?.email}.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-role" className="text-right">Função</Label>
                        <Select value={editingRole} onValueChange={setEditingRole}>
                            <SelectTrigger id="edit-role" className="col-span-3">
                                <SelectValue placeholder="Selecione uma função" />
                            </SelectTrigger>
                            <SelectContent>
                                {ROLES.map(role => (
                                    <SelectItem key={role} value={role} className="capitalize">{role}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setUserToEdit(null)}>Cancelar</Button>
                    <Button onClick={handleEditUserRole} disabled={isProcessing || !editingRole || editingRole === userToEdit?.user_metadata?.role}>
                        {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Salvar Alteração
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!userToDelete} onOpenChange={(isOpen) => !isOpen && setUserToDelete(null)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><AlertTriangle className="text-destructive"/> Tem certeza?</DialogTitle>
                    <DialogDescription>
                        Esta ação não pode ser desfeita. Isso excluirá permanentemente o usuário{" "}
                        <strong>{userToDelete?.email || userToDelete?.id}</strong>.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setUserToDelete(null)} disabled={isProcessing}>
                        Cancelar
                    </Button>
                    <Button variant="destructive" onClick={handleDeleteUser} disabled={isProcessing}>
                        {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Sim, Excluir Usuário
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}

export default UserManagement;

