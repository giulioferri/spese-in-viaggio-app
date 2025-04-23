import { supabase } from "@/integrations/supabase/client";

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
export const getTrips = async (): Promise<Trip[]> => {
  try {
    // Verifica autenticazione
    await validateAuth();
    
    // RLS garantirà che vengano restituiti solo i trip dell'utente autenticato
    const { data: tripsData, error: tripsError } = await supabase
      .from('trips')
      .select('id, location, date, expenses:expenses(id, amount, comment, photo_url, photo_path, timestamp)')
      .order('date', { ascending: false });

    if (tripsError) {
      console.error("Errore nel recupero trasferte:", tripsError);
      return [];
    }

    // Log per debug: verificare quali dati vengono restituiti
    console.log("Dati trasferte recuperati:", tripsData ? tripsData.length : 0, "trasferte");
    
    return (tripsData || []).map((trip: any) => ({
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
  } catch (err) {
    console.error("Errore durante il recupero delle trasferte:", err);
    return [];
  }
};

// Get a single trip and its expenses
export const getTrip = async (location: string, date: string): Promise<Trip | undefined> => {
  try {
    // Verifica autenticazione
    await validateAuth();
    
    // RLS garantirà che vengano restituiti solo i trip dell'utente autenticato
    const { data: trip, error } = await supabase
      .from('trips')
      .select('id, location, date, expenses:expenses(id, amount, comment, photo_url, photo_path, timestamp)')
      .eq('location', location)
      .eq('date', date)
      .maybeSingle();

    if (error) {
      console.error("Errore nel recupero trasferta:", error);
      return undefined;
    }
    
    if (!trip) return undefined;

    // Log per debug: verificare i dettagli della trasferta recuperata
    console.log("Dettagli trasferta recuperata:", trip.id, trip.location, trip.date);

    return {
      ...trip,
      expenses: (trip.expenses || []).map((exp: any) => ({
        id: exp.id,
        amount: Number(exp.amount),
        comment: exp.comment || "",
        photoUrl: exp.photo_url,
        photoPath: exp.photo_path,
        timestamp: typeof exp.timestamp === "string" ? new Date(exp.timestamp).getTime() : exp.timestamp
      })),
    };
  } catch (err) {
    console.error("Errore durante il recupero della trasferta:", err);
    return undefined;
  }
};

// Save a trip (insert or update if exists)
export const saveTrip = async (trip: Omit<Trip, "expenses">): Promise<string | null> => {
  try {
    // Verifica autenticazione
    await validateAuth();
    
    // Il trigger set_user_id_on_trip_insert imposterà automaticamente user_id
    const { data, error } = await supabase
      .from('trips')
      .upsert({
        id: trip.id,
        location: trip.location,
        date: trip.date, // ISO "yyyy-MM-dd"
        // Non specificare user_id qui, il trigger lo imposterà automaticamente
      }, { onConflict: "location,date" })
      .select()
      .maybeSingle();
    
    if (error) {
      console.error("Errore salvataggio trasferta:", error);
      return null;
    }

    // Log per debug
    console.log("Trasferta salvata con ID:", data?.id);
    
    return data?.id || null;
  } catch (err) {
    console.error("Errore durante il salvataggio della trasferta:", err);
    return null;
  }
};

// Add an expense to a trip
export const addExpense = async (
  location: string,
  date: string,
  expense: Expense
): Promise<void> => {
  try {
    // Verifica autenticazione
    await validateAuth();

    // Step 1: Ensure trip exists/get id
    let trip = await getTrip(location, date);
    let tripId = trip?.id;
    if (!trip) {
      // Insert trip if not exists
      const newTripId = await saveTrip({
        id: undefined as any,
        location,
        date
      });
      tripId = newTripId as string;
    }
    
    // Step 2: Add expense
    if (!tripId) {
      throw new Error("Impossibile salvare la spesa: nessuna trasferta trovata");
    }
    
    // Il trigger set_user_id_on_expense_insert imposterà automaticamente user_id
    const { error } = await supabase
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

    if (error) {
      console.error("Errore salvataggio spesa:", error);
      throw new Error(`Errore nel salvare la spesa: ${error.message}`);
    }

    // Log per debug
    console.log("Spesa aggiunta con ID:", expense.id, "alla trasferta:", tripId);
  } catch (err) {
    console.error("Errore durante il salvataggio della spesa:", err);
    throw err;
  }
};

// Remove an expense from a trip (and delete its photo in storage)
export const removeExpense = async (
  location: string,
  date: string,
  expenseId: string
): Promise<void> => {
  try {
    // Verifica autenticazione
    await validateAuth();

    const trip = await getTrip(location, date);
    if (!trip) return;
    const exp = trip.expenses.find(e => e.id === expenseId);
    if (exp && exp.photoPath) {
      // Remove from storage
      await supabase.storage.from("expense_photos").remove([exp.photoPath]);
    }
    // Remove from db - RLS garantirà che solo l'utente proprietario possa eliminare
    const { error } = await supabase.from("expenses").delete().eq("id", expenseId);
    
    if (error) {
      console.error("Errore eliminazione spesa:", error);
      throw new Error(`Errore nell'eliminare la spesa: ${error.message}`);
    }
    
    // Log per debug
    console.log("Spesa rimossa:", expenseId);
  } catch (err) {
    console.error("Errore durante l'eliminazione della spesa:", err);
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
export const deleteTrip = async (location: string, date: string): Promise<void> => {
  try {
    // Verifica autenticazione
    await validateAuth();

    const trip = await getTrip(location, date);
    if (!trip) return;
    // Remove photos of all expenses
    await removeTripPhotos(trip);
    // Remove trip (will cascade and delete all expenses) - RLS garantirà che solo l'utente proprietario possa eliminare
    const { error } = await supabase.from('trips').delete().match({ location, date });
    
    if (error) {
      console.error("Errore eliminazione trasferta:", error);
      throw new Error(`Errore nell'eliminare la trasferta: ${error.message}`);
    } else {
      console.log("Trasferta eliminata:", location, date);
    }
  } catch (err) {
    console.error("Errore durante l'eliminazione della trasferta:", err);
  }
};
