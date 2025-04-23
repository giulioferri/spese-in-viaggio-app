
import { UserProfile } from "./useProfile";

// Chiave interna per il profilo utente
export const PROFILE_KEY = "spese-trasferta-profile";

// Recupera il profilo dal localStorage come fallback
export function getStoredProfile(): UserProfile {
  try {
    const data = localStorage.getItem(PROFILE_KEY);
    if (data) {
      try {
        const raw = JSON.parse(data);
        // Forza la palette a un valore valido
        return {
          ...raw,
          palette: validatePalette(raw.palette),
        };
      } catch (e) {
        console.error("Error parsing profile from localStorage:", e);
      }
    }
  } catch (e) {
    console.error("Error accessing localStorage:", e);
  }
  // Return default profile if anything goes wrong
  return { palette: "default" };
}

// Genera/Riprende id unico anonimo
export function getOrCreateUserId(): string {
  try {
    let userId = localStorage.getItem('anonymous_user_id');
    if (!userId) {
      userId = crypto.randomUUID();
      localStorage.setItem('anonymous_user_id', userId);
    }
    return userId;
  } catch (e) {
    console.error("Error with user ID:", e);
    // Fallback to a random ID that won't persist
    return crypto.randomUUID();
  }
}

// Validazione palette
export function validatePalette(palette?: string): "default" | "green" | "red" {
  if (palette === "default" || palette === "green" || palette === "red") {
    return palette;
  }
  return "default";
}
