
import { supabase } from "@/integrations/supabase/client";

// Utility for validating authentication
export const validateAuth = async () => {
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    console.error("Errore: utente non autenticato");
    throw new Error("Utente non autenticato");
  }
  console.log("Using authenticated user ID:", data.session.user.id);
  return data.session;
};
