
import { useEffect, useState, createContext, useContext, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useAuthActions } from "./useAuthActions";
import { AuthContextType } from "./useAuth.types";

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log("🔒 AuthProvider: Initializing");
    
    // First set up the auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log("🔒 AuthProvider: Auth state changed:", event);
        setSession(newSession);
        setUser(newSession?.user ?? null);
      }
    );
    
    // Then check for existing session
    console.log("🔒 AuthProvider: Checking for existing session");
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      console.log("🔒 AuthProvider: Session check complete", !!currentSession);
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setIsLoading(false);
    });
    
    return () => {
      console.log("🔒 AuthProvider: Cleaning up auth subscription");
      subscription.unsubscribe();
    };
  }, []);

  const { signIn, signUp, signOut, signInWithGoogle } = useAuthActions({
    setUser,
    setSession,
    setIsLoading,
  });

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        signIn,
        signUp,
        signOut,
        signInWithGoogle,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
