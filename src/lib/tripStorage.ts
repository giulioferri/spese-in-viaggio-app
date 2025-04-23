import { supabase } from "@/integrations/supabase/client";
import { debugQuery } from "./tripStorageDebug";

export interface Expense {
  id: string;
  amount: number;
  comment: string;
  photoUrl: string;
  photoPath?: string;
  timestamp: number;
}

export interface Trip {
  id: string;
  location: string;
  date: string; // ISO date string (yyyy-MM-dd)
  expenses: Expense[];
}

export interface QueryDebugInfo {
  query?: string;
  params?: any;
  results?: any;
  error?: any;
  userId?: string;
}

// Utility per validare l'autenticazione
const validateAuth = async () => {
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    console.error("Errore: utente non autenticato");
    throw new Error("Utente non autenticato");
  }
  console.log("Using authenticated user ID:", data.session.user.id);
  return data.session;
};

// Fetch all trips (with expenses)
export const getTrips = async (): Promise<[Trip[], QueryDebugInfo]> => {
  try {
    // Verifica autenticazione
    await validateAuth();
    
    // Debug informazioni
    const debugInfo = await debugQuery(
      "SELECT * FROM trips + SELECT * FROM expenses PER TRIP", 
      async () => {
        // RLS garantirà che vengano restituiti solo i trip dell'utente autenticato
        return await supabase
          .from('trips')
          .select('id, location, date, user_id, expenses:expenses(id, amount, comment, photo_url, photo_path, timestamp)')
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
      `SELECT * FROM trips WHERE location='${location}' AND date='${date}'`, 
      async () => {
        // RLS garantirà che vengano restituiti solo i trip dell'utente autenticato
        return await supabase
          .from('trips')
          .select('id, location, date, user_id, expenses:expenses(id, amount, comment, photo_url, photo_path, timestamp)')
          .eq('location', location)
          .eq('date', date)
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

// Add an expense to a trip
export const addExpense = async (
  location: string,
  date: string,
  expense: Expense
): Promise<[void, QueryDebugInfo]> => {
  try {
    // Verifica autenticazione
    await validateAuth();

    // Step 1: Ensure trip exists/get id
    let [trip, tripDebugInfo] = await getTrip(location, date);
    let tripId = trip?.id;
    if (!trip) {
      // Insert trip if not exists
      const [newTripId, saveDebugInfo] = await saveTrip({
        id: undefined as any,
        location,
        date
      });
      tripId = newTripId as string;
    }
    
    // Step 2: Add expense
    if (!tripId) {
      const error = "Impossibile salvare la spesa: nessuna trasferta trovata";
      return [undefined, { error }];
    }
    
    // Debug informazioni
    const debugInfo = await debugQuery(
      `INSERT INTO expenses (id, amount, comment, photo_url, trip_id) VALUES (...)`, 
      async () => {
        // Il trigger set_user_id_on_expense_insert imposterà automaticamente user_id
        return await supabase
          .from("expenses")
          .insert({
            id: expense.id,
            amount: expense.amount,
            comment: expense.comment,
            photo_url: expense.photoUrl,
            photo_path: expense.photoPath ?? null,
            timestamp: new Date(expense.timestamp).toISOString(),
            trip_id: tripId
            // Non specificare user_id qui, il trigger lo imposterà automaticamente
          });
      }
    );

    if (debugInfo.error) {
      console.error("Errore salvataggio spesa:", debugInfo.error);
      throw new Error(`Errore nel salvare la spesa: ${debugInfo.error}`);
    }

    // Log per debug
    console.log("Spesa aggiunta con ID:", expense.id, "alla trasferta:", tripId);
    return [undefined, debugInfo];
  } catch (err) {
    console.error("Errore durante il salvataggio della spesa:", err);
    return [undefined, { error: String(err) }];
  }
};

// Remove an expense from a trip (and delete its photo in storage)
export const removeExpense = async (
  location: string,
  date: string,
  expenseId: string
): Promise<[void, QueryDebugInfo]> => {
  try {
    // Verifica autenticazione
    await validateAuth();

    const [trip] = await getTrip(location, date);
    if (!trip) return [undefined, { error: "Trasferta non trovata" }];
    
    const exp = trip.expenses.find(e => e.id === expenseId);
    if (exp && exp.photoPath) {
      // Remove from storage
      await supabase.storage.from("expense_photos").remove([exp.photoPath]);
    }
    
    // Debug informazioni
    const debugInfo = await debugQuery(
      `DELETE FROM expenses WHERE id = '${expenseId}'`, 
      async () => {
        // Remove from db - RLS garantirà che solo l'utente proprietario possa eliminare
        return await supabase.from("expenses").delete().eq("id", expenseId);
      }
    );
    
    if (debugInfo.error) {
      console.error("Errore eliminazione spesa:", debugInfo.error);
      throw new Error(`Errore nell'eliminare la spesa: ${debugInfo.error}`);
    }
    
    // Log per debug
    console.log("Spesa rimossa:", expenseId);
    return [undefined, debugInfo];
  } catch (err) {
    console.error("Errore durante l'eliminazione della spesa:", err);
    return [undefined, { error: String(err) }];
  }
};

// Get/set current trip - keep in localStorage for UX
const CURRENT_TRIP_KEY = 'spese_trasferta_current_trip';
export const setCurrentTrip = (location: string, date: string): void => {
  localStorage.setItem(
    CURRENT_TRIP_KEY,
    JSON.stringify({ location, date })
  );
};

export const getCurrentTrip = (): { location: string; date: string } | null => {
  const currentTripData = localStorage.getItem(CURRENT_TRIP_KEY);
  if (!currentTripData) {
    return null;
  }
  return JSON.parse(currentTripData);
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
