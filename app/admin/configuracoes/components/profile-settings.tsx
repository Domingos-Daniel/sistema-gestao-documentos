"use client"

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar"; // Removed AvatarImage
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react"; // Removed Upload

// Schema for profile update (only name)
const profileSchema = z.object({
  full_name: z.string().min(2, { message: "Nome deve ter pelo menos 2 caracteres." }),
});

type ProfileFormData = z.infer<typeof profileSchema>;

// Helper function to get initials
const getInitials = (name: string | null | undefined): string => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
};

export function ProfileSettings() {
  // --- Add this console log ---
  const authHookValue = useAuth();
  console.log("Value returned by useAuth():", authHookValue);
  // --- End of console log ---

  // Now destructure from the logged value
  const { user, loading: authLoading, refreshUser } = authHookValue;

  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Removed avatar file/preview/URL states

  const {
    register,
    handleSubmit,
    setValue, // Keep setValue to populate the form
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: "",
    },
  });

  // Load current profile data (only name)
  useEffect(() => {
    if (user) {
      setValue("full_name", user.user_metadata?.full_name || "");
    }
  }, [user, setValue]);

  // Removed handleAvatarChange function

  const onSubmit = async (data: ProfileFormData) => {
    if (!user) return;
    setIsSubmitting(true);

    try {
      // Update user metadata (only name)
      console.log("Updating user metadata with:", { full_name: data.full_name });
      const { data: updatedUser, error: updateError } = await supabase.auth.updateUser({
        data: {
          full_name: data.full_name,
          // No avatar_url update needed
        },
      });

      if (updateError) {
          console.error("Metadata Update Error:", updateError);
          throw new Error(`Falha ao atualizar metadados: ${updateError.message}`);
      }
      console.log("User metadata updated:", updatedUser);

      // Optionally update profiles table if you store data there too
      // const { error: profileError } = await supabase
      //   .from('profiles')
      //   .update({ full_name: data.full_name }) // Only update name
      //   .eq('id', user.id);
      // if (profileError) console.warn("Could not update profiles table:", profileError);

      toast({ title: "Perfil atualizado com sucesso!" });

      // --- Check if refreshUser exists before calling ---
      if (typeof refreshUser === 'function') {
        await refreshUser();
      } else {
        console.error("refreshUser is NOT a function in this component instance:", refreshUser);
        toast({
          title: "Erro interno",
          description: "Não foi possível atualizar os dados da sessão automaticamente.",
          variant: "warning",
        });
      }
      // --- End of check ---

    }  finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return <div className="flex items-center justify-center p-10"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-lg">
      {/* Avatar Display (Non-editable) */}
      <div className="space-y-2">
        <Label>Avatar</Label>
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20 border">
            {/* Removed AvatarImage */}
            <AvatarFallback className="text-2xl bg-primary text-primary-foreground"> {/* Changed background */}
              {getInitials(user?.user_metadata?.full_name || user?.email)}
            </AvatarFallback>
          </Avatar>
          {/* Removed Upload Button and Input */}
        </div>
      </div>

      {/* Full Name */}
      <div className="space-y-2">
        <Label htmlFor="full_name">Nome Completo</Label>
        <Input
          id="full_name"
          {...register("full_name")}
          disabled={isSubmitting}
        />
        {errors.full_name && (
          <p className="text-sm text-destructive">{errors.full_name.message}</p>
        )}
      </div>

      {/* Email (Read-only) */}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={user?.email || ""}
          readOnly
          disabled
          className="bg-muted/50 cursor-not-allowed"
        />
         <p className="text-xs text-muted-foreground">O email não pode ser alterado aqui.</p>
      </div>

      {/* Submit Button */}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Salvar Alterações
      </Button>
    </form>
  );
}

// Ensure default export exists
export default ProfileSettings;