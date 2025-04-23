
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

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
      const { error, data } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast({
          title: "Errore di accesso",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      navigate("/");
    } catch {
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
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) {
        toast({
          title: "Errore di registrazione",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Registrazione completata",
        description: "Controlla la tua email per confermare la registrazione",
      });
    } catch {
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
      await supabase.auth.signOut();
      navigate("/login");
    } catch {
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
      const { error, data } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin },
      });
      if (error) {
        toast({
          title: "Errore di accesso (Google)",
          description: error.message,
          variant: "destructive",
        });
        setIsLoading(false);
      }
    } catch {
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
