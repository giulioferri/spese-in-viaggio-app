
import { UserProfile } from "./useProfile";
import { supabase } from "@/integrations/supabase/client";

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

// Determine whether to use logged in user ID or anonymous ID
export async function getOrCreateUserId(): Promise<string> {
  try {
    // First check if there's an authenticated user
    const { data: { session } } = await supabase.auth.getSession();
    const authUserId = session?.user?.id;
    
    if (authUserId) {
      console.log("Using authenticated user ID:", authUserId);
      return authUserId;
    }
    
    // If no authenticated user, use/create anonymous ID
    let anonymousId = localStorage.getItem('anonymous_user_id');

    // Check if it's a valid uuid (at least basic pattern)
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (anonymousId && uuidPattern.test(anonymousId)) {
      console.log("Using existing anonymous ID:", anonymousId);
      return anonymousId;
    }
    
    // Generate a new UUID if none exists or it's invalid
    anonymousId = crypto.randomUUID();
    console.log("Generated new anonymous UUID:", anonymousId);
    localStorage.setItem('anonymous_user_id', anonymousId);
    return anonymousId;
  } catch (e) {
    console.error("Error with user ID:", e);
    const fallbackId = crypto.randomUUID();
    localStorage.setItem('anonymous_user_id', fallbackId);
    return fallbackId;
  }
}

// Validazione palette
export function validatePalette(palette?: string): "default" | "green" | "red" | "ochre" {
  if (palette === "default" || palette === "green" || palette === "red" || palette === "ochre") {
    return palette;
  }
  return "default";
}
