
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
    console.log("🔒 AuthProvider: Initializing");
    
    // Set up auth state listener FIRST
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log(`🔒 AuthProvider: Auth state changed: ${event}`);
        setSession(currentSession);
        setUser(currentSession?.user || null);
      }
    );
    
    // THEN check for existing session
    const checkSession = async () => {
      try {
        console.log("🔒 AuthProvider: Checking for existing session");
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("🔒 AuthProvider: Error getting session", error);
        } else {
          console.log("🔒 AuthProvider: Session check complete", !!data.session);
          setSession(data.session);
          setUser(data.session?.user || null);
        }
      } catch (e) {
        console.error("🔒 AuthProvider: Unexpected error", e);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkSession();
    
    // Cleanup listener when component unmounts
    return () => {
      console.log("🔒 AuthProvider: Cleaning up auth subscription");
      authListener.subscription.unsubscribe();
    };
  }, []);

  const { signIn, signUp, signOut, signInWithGoogle } = useAuthActions({
    setUser,
    setSession,
    setIsLoading,
  });

  const value = {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
  };

  return (
    <AuthContext.Provider value={value}>
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
