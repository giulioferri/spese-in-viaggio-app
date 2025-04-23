
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type Trip = Database['public']['Tables']['trips']['Row'];

export const debugRlsPolicies = async () => {
  try {
    // 1. Verify current session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error("🔍 DEBUG - Session error:", sessionError);
      return { success: false, error: "Session not available" };
    }

    if (!sessionData.session) {
      console.log("🔍 DEBUG - No active session");
      return { success: false, error: "No active session" };
    }

    const currentUserId = sessionData.session.user.id;
    console.log("🔍 DEBUG - Authenticated user:", currentUserId);
    console.log("🔍 DEBUG - Email:", sessionData.session.user.email);

    // 2. Check auth tokens
    console.log("🔍 DEBUG - Access token:", sessionData.session.access_token?.substring(0, 10) + "...");
    
    // 3. Get ALL trips without RLS filter (debug function)
    const { data: allTripsData, error: allTripsError } = await supabase.rpc('debug_get_all_trips');
    
    if (allTripsError) {
      console.error("🔍 DEBUG - RPC debug_get_all_trips error:", allTripsError);
      return { success: false, error: "Error fetching all trips" };
    }

    // 4. Get user's trips with RLS
    const { data: userTripsData, error: userTripsError } = await supabase
      .from('trips')
      .select('id, location, date, user_id')
      .order('date', { ascending: false });

    if (userTripsError) {
      console.error("🔍 DEBUG - User trips error:", userTripsError);
      return { success: false, error: "Error fetching user trips" };
    }

    // 5. Print debug results
    console.log("🔍 DEBUG - All trips in database:", allTripsData || []);
    console.log("🔍 DEBUG - RLS filtered trips:", userTripsData);
    
    // 6. Check for trips without user_id
    const problemiUserIds = (allTripsData || []).filter(trip => !trip.user_id);
    if (problemiUserIds.length > 0) {
      console.warn("⚠️ DEBUG - Found trips without user_id:", problemiUserIds);
    }

    // 7. Compare results
    const trovatiTripsFiltrati = userTripsData?.length || 0;
    const totaleTrips = allTripsData?.length || 0;
    
    console.log(`🔍 DEBUG - Found trips: ${trovatiTripsFiltrati} of ${totaleTrips} total`);
    
    return { 
      success: true, 
      totalTrips: totaleTrips,
      userTrips: trovatiTripsFiltrati,
      problemiUserIds: problemiUserIds.length
    };
    
  } catch (err) {
    console.error("🔍 DEBUG - General error:", err);
    return { success: false, error: String(err) };
  }
};

export const fixOrphanedData = async () => {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      return { success: false, error: "User not authenticated" };
    }
    
    const { data, error } = await supabase.rpc('fix_orphaned_trips_for_user', {
      current_user_id: session.session.user.id
    });
    
    if (error) {
      console.error("Error fixing orphaned data:", error);
      return { success: false, error: error.message };
    }
    
    console.log("✅ Orphaned data fix completed:", data);
    return { success: true, updatedTrips: data };
    
  } catch (err) {
    console.error("General error fixing data:", err);
    return { success: false, error: String(err) };
  }
};
