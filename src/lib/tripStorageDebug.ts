
import { supabase } from "@/integrations/supabase/client";

/**
 * Funzione di debug per verificare le RLS policies e le associazioni ID utente
 */
export const debugRlsPolicies = async () => {
  try {
    // 1. Verifica l'utente corrente
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error("🔍 DEBUG - Errore nel recupero della sessione:", sessionError);
      return { success: false, error: "Sessione non disponibile" };
    }

    if (!sessionData.session) {
      console.log("🔍 DEBUG - Nessuna sessione attiva");
      return { success: false, error: "Nessuna sessione attiva" };
    }

    const currentUserId = sessionData.session.user.id;
    console.log("🔍 DEBUG - Utente autenticato:", currentUserId);
    console.log("🔍 DEBUG - Email:", sessionData.session.user.email);

    // 2. Verifica della connessione a Supabase e dei token
    console.log("🔍 DEBUG - Token di accesso:", sessionData.session.access_token?.substring(0, 10) + "...");
    
    // 3. Recupera TUTTI i trips senza filtri (per debug)
    const { data: allTripsData, error: allTripsError } = await supabase.rpc('debug_get_all_trips');
    
    if (allTripsError) {
      console.error("🔍 DEBUG - Errore nella funzione RPC debug_get_all_trips:", allTripsError);
      return { success: false, error: "Errore nel recupero di tutti i trips" };
    }

    // 4. Recupera i trips dell'utente corrente secondo RLS
    const { data: userTripsData, error: userTripsError } = await supabase
      .from('trips')
      .select('id, location, date, user_id')
      .order('date', { ascending: false });

    if (userTripsError) {
      console.error("🔍 DEBUG - Errore nel recupero dei trips dell'utente:", userTripsError);
      return { success: false, error: "Errore nel recupero dei trips dell'utente" };
    }

    // 5. Stampa risultati di debug
    console.log("🔍 DEBUG - Tutti i trips nel database:", allTripsData);
    console.log("🔍 DEBUG - Trips filtrati da RLS:", userTripsData);
    
    // 6. Verifica dei user_id nei trips
    const problemiUserIds = allTripsData.filter(trip => !trip.user_id || trip.user_id === null);
    if (problemiUserIds.length > 0) {
      console.warn("⚠️ DEBUG - Trovati trips senza user_id:", problemiUserIds);
    }

    // 7. Compara i risultati
    const trovatiTripsFiltrati = userTripsData.length;
    const totaleTrips = allTripsData.length;
    
    console.log(`🔍 DEBUG - Trips trovati: ${trovatiTripsFiltrati} su ${totaleTrips} totali`);
    
    if (trovatiTripsFiltrati === totaleTrips) {
      console.error("❌ DEBUG - PROBLEMA RLS: l'utente vede tutti i trips!");
    } else {
      console.log("✅ DEBUG - RLS funzionante: l'utente vede solo i propri trips");
    }

    return { 
      success: true, 
      totalTrips: totaleTrips,
      userTrips: trovatiTripsFiltrati,
      problemiUserIds: problemiUserIds.length
    };
    
  } catch (err) {
    console.error("🔍 DEBUG - Errore generale:", err);
    return { success: false, error: String(err) };
  }
};

// Funzione per correggere i dati esistenti assegnando l'utente corrente come proprietario
export const fixOrphanedData = async () => {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      return { success: false, error: "Utente non autenticato" };
    }
    
    const currentUserId = session.session.user.id;
    
    // Chiamata alla funzione RPC di Supabase che aggiorna i dati
    const { data, error } = await supabase.rpc('fix_orphaned_trips_for_user', {
      current_user_id: currentUserId
    });
    
    if (error) {
      console.error("Errore nella correzione dei dati orfani:", error);
      return { success: false, error: error.message };
    }
    
    console.log("✅ Correzione dati orfani completata:", data);
    return { success: true, updatedTrips: data };
    
  } catch (err) {
    console.error("Errore generale nella correzione dei dati:", err);
    return { success: false, error: String(err) };
  }
};
