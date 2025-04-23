
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { getOrCreateUserId } from "./useProfileUtils";

// Accept setters and dependencies as parameters for state management
export function useAuthActions({
  setUser,
  setSession,
  setIsLoading,
}: {
  setUser: (u: any) => void;
  setSession: (s: any) => void;
  setIsLoading: (l: boolean) => void;
}) {
  const { toast } = useToast();
  const navigate = useNavigate();

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      console.log("🔑 Attempting login with email:", email);
      
      // Salviamo l'ID anonimo prima del login
      const anonymousId = localStorage.getItem('anonymous_user_id');
      
      const { error, data } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error("🔑 Login error:", error.message);
        toast({
          title: "Errore di accesso",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      
      console.log("🔑 Login successful, user:", data.user?.email);
      
      // Gestiamo la migrazione del profilo anonimo se necessario
      if (anonymousId && data.user) {
        console.log("🔑 Migrating anonymous profile:", anonymousId, "to authenticated user:", data.user.id);
        try {
          // Quando si implementerà la migrazione, fare attenzione a non violare le RLS
          // Potrebbe essere necessario una funzione serverless o SQL per gestire correttamente questa migrazione
        } catch (migrationError) {
          console.error("🔑 Profile migration error:", migrationError);
        }
      }
      
      navigate("/");
    } catch (e) {
      console.error("🔑 Unexpected login error:", e);
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
      setIsLoading(true);
      console.log("🔑 Attempting signup with email:", email);
      
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      
      if (error) {
        console.error("🔑 Signup error:", error.message);
        toast({
          title: "Errore di registrazione",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      
      console.log("🔑 Signup successful:", data);
      toast({
        title: "Registrazione completata",
        description: "Controlla la tua email per confermare la registrazione",
      });
    } catch (e) {
      console.error("🔑 Unexpected signup error:", e);
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
      console.log("🔑 Signing out");
      await supabase.auth.signOut();
      navigate("/login");
    } catch (e) {
      console.error("🔑 Signout error:", e);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante il logout",
        variant: "destructive",
      });
    }
  };

  const signInWithGoogle = async () => {
    setIsLoading(true);
    try {
      console.log("🔑 Starting Google OAuth login");
      console.log("🔑 Redirect URL:", window.location.origin);
      
      const { error, data } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin },
      });
      
      if (error) {
        console.error("🔑 Google OAuth error:", error.message);
        toast({
          title: "Errore di accesso (Google)",
          description: error.message,
          variant: "destructive",
        });
        setIsLoading(false);
      } else {
        console.log("🔑 Google OAuth initiated:", data);
      }
    } catch (e) {
      console.error("🔑 Unexpected Google OAuth error:", e);
      toast({
        title: "Errore di accesso (Google)",
        description: "Si è verificato un errore durante il login con Google",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return { signIn, signUp, signOut, signInWithGoogle };
}
