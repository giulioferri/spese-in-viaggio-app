
import { useEffect, useState, createContext, useContext, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useAuthActions } from "./useAuthActions";
import { AuthContextType } from "./useAuth.types";
import { useToast } from "@/hooks/use-toast";

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null;
    
    try {
      console.log("🔑 AuthProvider: Setting up auth state listener");
      
      // Set up auth state listener FIRST
      const { data } = supabase.auth.onAuthStateChange(
        (event, newSession) => {
          console.log(`🔑 AuthProvider: Auth state changed: ${event}`, newSession?.user?.email);
          
          // Handle state changes safely
          if (event === 'SIGNED_OUT') {
            setSession(null);
            setUser(null);
            console.log("🔑 AuthProvider: User signed out");
          } else {
            setSession(newSession);
            setUser(newSession?.user ?? null);
            
            if (event === 'SIGNED_IN') {
              console.log("🔑 AuthProvider: User signed in", newSession?.user?.email);
            } else if (event === 'USER_UPDATED') {
              console.log("🔑 AuthProvider: User updated");
            }
          }
        }
      );
      
      subscription = data.subscription;
      
      // THEN check for existing session
      supabase.auth.getSession()
        .then(({ data: { session: currentSession } }) => {
          console.log("🔑 AuthProvider: Checking for existing session", currentSession?.user?.email);
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
        })
        .catch(error => {
          console.error("🔑 AuthProvider: Error getting session", error);
          toast({
            title: "Errore di autenticazione",
            description: "Si è verificato un problema nel recupero della sessione",
            variant: "destructive",
          });
        })
        .finally(() => {
          setIsLoading(false);
          setInitialized(true);
        });
    } catch (error) {
      console.error("🔑 AuthProvider: Unexpected error in auth setup", error);
      toast({
        title: "Errore di autenticazione",
        description: "Si è verificato un errore durante l'inizializzazione dell'autenticazione",
        variant: "destructive",
      });
      setIsLoading(false);
      setInitialized(true);
    }
    
    return () => {
      console.log("🔑 AuthProvider: Cleaning up auth subscription");
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [toast]);

  const { signIn, signUp, signOut, signInWithGoogle } = useAuthActions({
    setUser,
    setSession,
    setIsLoading,
  });

  // Only render children when auth is initialized to prevent flashing
  if (!initialized) {
    return null;
  }

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
    throw new Error("useAuth deve essere utilizzato all'interno di un AuthProvider");
  }
  return context;
};
