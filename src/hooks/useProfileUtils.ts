
import { UserProfile } from "./useProfile";

// Chiave interna per il profilo utente
export const PROFILE_KEY = "spese-trasferta-profile";

// Recupera il profilo dal localStorage come fallback
export function getStoredProfile(): UserProfile {
  const data = localStorage.getItem(PROFILE_KEY);
  if (data) {
    try {
      const raw = JSON.parse(data);
      // Forza la palette a un valore valido
      return {
        ...raw,
        palette: validatePalette(raw.palette),
      };
    } catch {
      //
    }
  }
  return { palette: "default" };
}

// Genera/Riprende id unico anonimo
export function getOrCreateUserId(): string {
  let userId = localStorage.getItem('anonymous_user_id');
  if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem('anonymous_user_id', userId);
  }
  return userId;
}

// Validazione palette
export function validatePalette(palette?: string): "default" | "green" | "red" {
  if (palette === "default" || palette === "green" || palette === "red") {
    return palette;
  }
  return "default";
}
