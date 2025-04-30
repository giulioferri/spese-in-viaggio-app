
import { supabase } from "@/integrations/supabase/client";
import { Trip, QueryDebugInfo } from "./types";
import { validateAuth } from "./auth";
import { debugQuery } from "../tripStorageDebug";

// Fetch all trips (with expenses)
export const getTrips = async (): Promise<[Trip[], QueryDebugInfo]> => {
  try {
    // Verifica autenticazione
    const session = await validateAuth();
    const userId = session.user.id;
    
    // Debug informazioni - aggiungiamo il filtro per user_id in modo esplicito nella descrizione
    const debugInfo = await debugQuery(
      `SELECT * FROM trips WHERE user_id = '${userId}' + SELECT * FROM expenses PER TRIP`, 
      async () => {
        // RLS garantirà che vengano restituiti solo i trip dell'utente autenticato
        return await supabase
          .from('trips')
          .select('id, location, date, user_id, expenses:expenses(id, amount, comment, photo_url, photo_path, timestamp)')
          .eq('user_id', userId)  // Aggiungiamo un filtro esplicito per user_id
          .order('date', { ascending: false });
      }
    );
    
    if (debugInfo.error) {
      console.error("Errore nel recupero trasferte:", debugInfo.error);
      return [[], debugInfo];
    }

    // Log per debug: verificare quali dati vengono restituiti
    console.log("Dati trasferte recuperati:", debugInfo.results ? debugInfo.results.length : 0, "trasferte");
    
    const trips = (debugInfo.results || []).map((trip: any) => ({
      ...trip,
      expenses: (trip.expenses || []).map((exp: any) => ({
        id: exp.id,
        amount: Number(exp.amount),
        comment: exp.comment || "",
        photoUrl: exp.photo_url,
        photoPath: exp.photo_path,
        timestamp: typeof exp.timestamp === "string" ? new Date(exp.timestamp).getTime() : exp.timestamp
      }))
    }));

    return [trips, debugInfo];
  } catch (err) {
    console.error("Errore durante il recupero delle trasferte:", err);
    return [[], { error: String(err) }];
  }
};

// Get a single trip and its expenses
export const getTrip = async (location: string, date: string): Promise<[Trip | undefined, QueryDebugInfo]> => {
  try {
    // Verifica autenticazione
    const session = await validateAuth();
    
    // Debug informazioni
    const debugInfo = await debugQuery(
      `SELECT * FROM trips WHERE location='${location}' AND date='${date}' AND user_id='${session.user.id}'`, 
      async () => {
        // Ora aggiungiamo esplicitamente il filtro per user_id per garantire che l'utente veda solo i propri dati
        return await supabase
          .from('trips')
          .select('id, location, date, user_id, expenses:expenses(id, amount, comment, photo_url, photo_path, timestamp)')
          .eq('location', location)
          .eq('date', date)
          .eq('user_id', session.user.id) // Filtro esplicito per user_id
          .maybeSingle();
      }
    );
    
    if (debugInfo.error) {
      console.error("Errore nel recupero trasferta:", debugInfo.error);
      return [undefined, debugInfo];
    }
    
    if (!debugInfo.results) return [undefined, debugInfo];

    // Log per debug: verificare i dettagli della trasferta recuperata
    console.log("Dettagli trasferta recuperata:", 
      debugInfo.results.id, 
      debugInfo.results.location, 
      debugInfo.results.date,
      "User ID:", debugInfo.results.user_id,
      "Session User ID:", session.user.id
    );

    const trip = {
      ...debugInfo.results,
      expenses: (debugInfo.results.expenses || []).map((exp: any) => ({
        id: exp.id,
        amount: Number(exp.amount),
        comment: exp.comment || "",
        photoUrl: exp.photo_url,
        photoPath: exp.photo_path,
        timestamp: typeof exp.timestamp === "string" ? new Date(exp.timestamp).getTime() : exp.timestamp
      })),
    };

    return [trip, debugInfo];
  } catch (err) {
    console.error("Errore durante il recupero della trasferta:", err);
    return [undefined, { error: String(err) }];
  }
};

// Save a trip (insert or update if exists)
export const saveTrip = async (trip: Omit<Trip, "expenses">): Promise<[string | null, QueryDebugInfo]> => {
  try {
    // Verifica autenticazione
    await validateAuth();
    
    // Debug informazioni
    const debugInfo = await debugQuery(
      `UPSERT INTO trips (id, location, date) VALUES ('${trip.id || "new"}', '${trip.location}', '${trip.date}')`, 
      async () => {
        // Il trigger set_user_id_on_trip_insert imposterà automaticamente user_id
        return await supabase
          .from('trips')
          .upsert({
            id: trip.id,
            location: trip.location,
            date: trip.date, // ISO "yyyy-MM-dd"
            // Non specificare user_id qui, il trigger lo imposterà automaticamente
          }, { onConflict: "location,date" })
          .select()
          .maybeSingle();
      }
    );
    
    if (debugInfo.error) {
      console.error("Errore salvataggio trasferta:", debugInfo.error);
      return [null, debugInfo];
    }

    // Log per debug
    console.log("Trasferta salvata con ID:", debugInfo.results?.id);
    
    return [debugInfo.results?.id || null, debugInfo];
  } catch (err) {
    console.error("Errore durante il salvataggio della trasferta:", err);
    return [null, { error: String(err) }];
  }
};

// Remove all photos from a trip (utilities, not strictly needed)
export const removeTripPhotos = async (trip: Trip) => {
  for (const expense of trip.expenses) {
    if (expense.photoPath) {
      await supabase.storage.from("expense_photos").remove([expense.photoPath]);
    }
  }
};

// Delete a whole trip and all related expenses/photos
export const deleteTrip = async (location: string, date: string): Promise<[void, QueryDebugInfo]> => {
  try {
    // Verifica autenticazione
    await validateAuth();

    const [trip] = await getTrip(location, date);
    if (!trip) return [undefined, { error: "Trasferta non trovata" }];
    
    // Remove photos of all expenses
    await removeTripPhotos(trip);
    
    // Debug informazioni
    const debugInfo = await debugQuery(
      `DELETE FROM trips WHERE location = '${location}' AND date = '${date}'`, 
      async () => {
        // Remove trip (will cascade and delete all expenses) - RLS garantirà che solo l'utente proprietario possa eliminare
        return await supabase.from('trips').delete().match({ location, date });
      }
    );
    
    if (debugInfo.error) {
      console.error("Errore eliminazione trasferta:", debugInfo.error);
      throw new Error(`Errore nell'eliminare la trasferta: ${debugInfo.error}`);
    } else {
      console.log("Trasferta eliminata:", location, date);
    }
    
    return [undefined, debugInfo];
  } catch (err) {
    console.error("Errore durante l'eliminazione della trasferta:", err);
    return [undefined, { error: String(err) }];
  }
};
