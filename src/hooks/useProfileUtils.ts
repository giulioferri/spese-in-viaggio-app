
import { UserProfile } from "./useProfile";

export const PROFILE_KEY = "spese-trasferta-profile";

// UUIDs: Always parse and expect userId as a string UUID
export function getStoredProfile(): UserProfile {
  try {
    const data = localStorage.getItem(PROFILE_KEY);
    if (data) {
      try {
        const raw = JSON.parse(data);
        // Validate palette and ensure id is a string (uuid)
        return {
          ...raw,
          palette: validatePalette(raw.palette),
          id: typeof raw.id === "string" ? raw.id : undefined,
        };
      } catch (e) {
        console.error("Error parsing profile from localStorage:", e);
      }
    }
  } catch (e) {
    console.error("Error accessing localStorage:", e);
  }
  return { palette: "default" };
}

// Generate or reuse the logged-in user id (as UUID string)
export function getOrCreateUserId(): string {
  try {
    let userId = localStorage.getItem('anonymous_user_id');

    // Check if it's a valid uuid (at least basic pattern)
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (userId && uuidPattern.test(userId)) {
      return userId;
    }
    
    // Generate a new UUID if none exists or it's invalid
    userId = crypto.randomUUID();
    console.log("Generated new UUID for user:", userId);
    localStorage.setItem('anonymous_user_id', userId);
    return userId;
  } catch (e) {
    console.error("Error with user ID:", e);
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
