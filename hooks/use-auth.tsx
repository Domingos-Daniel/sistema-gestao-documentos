"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from '@/lib/supabase'; // Import Supabase client
import type { AuthError, Session, User } from '@supabase/supabase-js'; // Import Supabase types

// Keep your User type if you need specific metadata structure,
// but Supabase provides its own User type which is often sufficient.
// You might merge them or use Supabase's directly.
// For simplicity, let's use Supabase's User type primarily.

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  // Add signUp, signOut, resetPassword using Supabase methods if needed
  signOut: () => Promise<{ error: AuthError | null }>;
  // Add other methods as required
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  // const router = useRouter(); // Keep if needed for redirects within the provider

  useEffect(() => {
    // No need for initializeStorage with Supabase Auth

    // Check initial session state
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        // Optional: Add logic here if you need to react to specific events like PASSWORD_RECOVERY
      }
    );

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  // --- Supabase Auth Methods ---

  const signIn = async (email: string, password: string) => {
    // setLoading(true); // Optional: manage loading state per operation
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    // setLoading(false);
    // User/session state is updated by the onAuthStateChange listener
    return { error };
  };

  const signOut = async () => {
    // setLoading(true);
    const { error } = await supabase.auth.signOut();
    // setLoading(false);
    // User/session state is updated by the onAuthStateChange listener
    return { error };
  };

  // Add Supabase versions of signUp, resetPassword etc. if needed
  // const signUp = async (email, password, options) => { ... supabase.auth.signUp ... }
  // const resetPassword = async (email) => { ... supabase.auth.resetPasswordForEmail ... }

  const value: AuthContextType = {
    user,
    session,
    loading,
    signIn,
    signOut,
    // Add other methods here
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = (): AuthContextType => { // Return the specific type
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

