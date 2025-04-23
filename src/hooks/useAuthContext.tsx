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
  const [initialized, setInitialized] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null;
    
    const setupAuth = async () => {
      try {
        console.log("🔑 AuthProvider: Setting up auth state listener");
        
        // Set up auth state listener FIRST
        const { data } = supabase.auth.onAuthStateChange((event, newSession) => {
          console.log(`🔑 AuthProvider: Auth state changed: ${event}`, newSession?.user?.email);
          
          // Update state synchronously
          setSession(newSession);
          setUser(newSession?.user ?? null);
          
          // Update loading state for specific events
          if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
            setIsLoading(false);
          }
        });
        
        subscription = data.subscription;
        
        // THEN check for existing session
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        console.log("🔑 AuthProvider: Checking for existing session", currentSession?.user?.email);
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        // Always set loading to false after session check
        setIsLoading(false);
        setInitialized(true);
      } catch (error) {
        console.error("🔑 AuthProvider: Error in auth setup", error);
        toast({
          title: "Errore di autenticazione",
          description: "Si è verificato un problema nell'inizializzazione dell'autenticazione",
          variant: "destructive",
        });
        // Ensure we don't stay in loading state on error
        setIsLoading(false);
        setInitialized(true);
      }
    };
    
    setupAuth();
    
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

  // Only render children when auth is initialized
  if (!initialized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-2">Inizializzazione in corso...</p>
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
