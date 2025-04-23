
import { useEffect, useState, createContext, useContext, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useAuthActions } from "./useAuthActions";
import { AuthContextType } from "./useAuth.types";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Impostazione iniziale per verificare la sessione esistente
    const checkSession = async () => {
      try {
        console.log("🔑 AuthProvider: Checking for existing session");
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("🔑 AuthProvider: Error getting session", error);
          setIsLoading(false);
          return;
        }
        
        setSession(data.session);
        setUser(data.session?.user || null);
        console.log("🔑 AuthProvider: Session check complete", !!data.session);
      } catch (e) {
        console.error("🔑 AuthProvider: Unexpected error", e);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Imposta il listener per i cambiamenti di autenticazione
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log(`🔑 AuthProvider: Auth state changed: ${event}`);
        setSession(currentSession);
        setUser(currentSession?.user || null);
      }
    );
    
    checkSession();
    
    // Pulizia del listener quando il componente viene smontato
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [toast]);

  const { signIn, signUp, signOut, signInWithGoogle } = useAuthActions({
    setUser,
    setSession,
    setIsLoading,
  });

  // Mostra il loader solo durante il caricamento iniziale
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-2">Caricamento...</p>
      </div>
    );
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
