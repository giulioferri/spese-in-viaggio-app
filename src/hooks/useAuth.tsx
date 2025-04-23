
import { useEffect, useState, createContext, useContext, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    console.log("🔐 Setting up auth listener");
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log(`🔐 Auth state changed: ${event}`, newSession?.user?.email);
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        if (newSession?.user) {
          setTimeout(() => {
            console.log("🔐 User session updated:", newSession.user.id, newSession.user.email);
          }, 0);
        } else {
          console.log("🔐 No active user session");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      console.log("🔐 Initial session check:", currentSession?.user?.email || "No session");
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      console.log("🔐 Cleaning up auth listener");
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log("🔐 Attempting sign in with email:", email);
      setIsLoading(true);
      const { error, data } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        console.error("🔐 Sign in error:", error);
        toast({
          title: "Errore di accesso",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      
      console.log("🔐 Sign in successful:", data?.user?.email);
      navigate("/");
    } catch (error) {
      console.error("🔐 Unexpected error during sign in:", error);
      toast({
        title: "Errore di accesso",
        description: "Si è verificato un errore durante il login",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      console.log("🔐 Attempting sign up with email:", email);
      setIsLoading(true);
      const { error, data } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: window.location.origin,
        }
      });
      
      if (error) {
        console.error("🔐 Sign up error:", error);
        toast({
          title: "Errore di registrazione",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      
      console.log("🔐 Sign up successful:", data?.user?.email);
      toast({
        title: "Registrazione completata",
        description: "Controlla la tua email per confermare la registrazione",
      });
    } catch (error) {
      console.error("🔐 Unexpected error during sign up:", error);
      toast({
        title: "Errore di registrazione",
        description: "Si è verificato un errore durante la registrazione",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      console.log("🔐 Signing out");
      await supabase.auth.signOut();
      console.log("🔐 Sign out successful");
      navigate("/login");
    } catch (error) {
      console.error("🔐 Error during sign out:", error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante il logout",
        variant: "destructive",
      });
    }
  };

  const signInWithGoogle = async () => {
    setIsLoading(true);
    console.log("🔐 Attempting Google sign in");
    try {
      const { error, data } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) {
        console.error("🔐 Google sign in error:", error);
        toast({
          title: "Errore di accesso (Google)",
          description: error.message,
          variant: "destructive",
        });
        setIsLoading(false);
      } else {
        console.log("🔐 Google auth initiated, redirecting...", data);
      }
    } catch (error) {
      console.error("🔐 Unexpected error during Google sign in:", error);
      toast({
        title: "Errore di accesso (Google)",
        description: "Si è verificato un errore durante il login con Google",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

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
