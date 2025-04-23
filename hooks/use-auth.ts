import React, { useState, useEffect, createContext, useContext, useMemo } from 'react'; // Import React and useMemo
import { supabase } from '@/lib/supabase';
import type { AuthError, Session, User } from '@supabase/supabase-js';

// Define context type
interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  refreshUser: () => Promise<void>;
}

// Create the context with 'undefined' initially to distinguish from 'null' value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Function to fetch and update user and session state
  const fetchUserAndSession = async () => {
    try {
      // Fetch both user and session concurrently
      const [{ data: { user: currentUser }, error: userError }, { data: { session: currentSession }, error: sessionError }] = await Promise.all([
        supabase.auth.getUser(),
        supabase.auth.getSession()
      ]);

      if (userError) throw userError;
      if (sessionError) throw sessionError; // Or handle differently if session isn't critical

      setUser(currentUser ?? null);
      setSession(currentSession ?? null);
      return { user: currentUser, session: currentSession };
    } catch (error) {
      console.error("Error fetching user/session:", error);
      setUser(null);
      setSession(null);
      return { user: null, session: null };
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchUserAndSession().finally(() => setLoading(false)); // Initial fetch

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session);
      setSession(session);
      setUser(session?.user ?? null);
      // Ensure loading is false after auth state change confirmation
      setLoading(false);
    });

    // Cleanup listener on unmount
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  // Refresh function using the combined fetch
  const refreshUser = async () => {
    console.log("Refreshing user data...");
    setLoading(true);
    try {
      await fetchUserAndSession(); // Re-fetch user and session
    } catch (error) {
      console.error("Failed to refresh user:", error);
    } finally {
      setLoading(false);
    }
  };

  // Sign In function
  const signIn = async (email: string, password: string) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    // State updates are handled by onAuthStateChange
    // setLoading(false); // Let onAuthStateChange handle setting loading to false
    return { error };
  };

  // Sign Out function
  const signOut = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    // State updates are handled by onAuthStateChange
    // setLoading(false); // Let onAuthStateChange handle setting loading to false
    return { error };
  };

  // Memoize the context value to prevent unnecessary re-renders of consumers
  // unless these specific values change
  const value = useMemo(() => ({
    user,
    session,
    loading,
    signIn,
    signOut,
    refreshUser
  }), [user, session, loading]); // Add dependencies used in the value object

  // Provide the memoized value to the context
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook with improved type checking
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  // Check if the context is undefined (meaning hook is used outside the provider)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};