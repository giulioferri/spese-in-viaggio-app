
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

// Fetch all trips (with expenses)
export const getTrips = async (): Promise<Trip[]> => {
  const { data: tripsData, error: tripsError } = await supabase
    .from('trips')
    .select('id, location, date, expenses:expenses(id, amount, comment, photo_url, photo_path, timestamp)')
    .order('date', { ascending: false });
  if (tripsError) {
    console.error("Errore nel recupero trasferte:", tripsError);
    return [];
  }
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
};

// Save a trip (insert or update if exists)
export const saveTrip = async (trip: Omit<Trip, "expenses">): Promise<string | null> => {
  // Ensure the user_id field is properly set to the current authenticated user
  const { data, error } = await supabase
    .from('trips')
    .upsert({
      id: trip.id,
      location: trip.location,
      date: trip.date, // ISO "yyyy-MM-dd"
      // user_id will be set automatically by the trigger on the server
    }, { onConflict: "location,date" })
    .select()
    .maybeSingle();
  if (error) {
    console.error("Errore salvataggio trasferta:", error);
    return null;
  }
  return data?.id || null;
};

// Get a single trip and its expenses
export const getTrip = async (location: string, date: string): Promise<Trip | undefined> => {
  const { data: trip, error } = await supabase
    .from('trips')
    .select('id, location, date, expenses:expenses(id, amount, comment, photo_url, photo_path, timestamp)')
    .eq('location', location)
    .eq('date', date)
    .maybeSingle();
  if (error || !trip) return undefined;
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
};

// Add an expense to a trip
export const addExpense = async (
  location: string,
  date: string,
  expense: Expense
): Promise<void> => {
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
  
  // Non è necessario specificare user_id poiché abbiamo implementato un trigger
  // che imposta automaticamente user_id = auth.uid() per le nuove trips
  await supabase
    .from("expenses")
    .insert({
      id: expense.id,
      amount: expense.amount,
      comment: expense.comment,
      photo_url: expense.photoUrl,
      photo_path: expense.photoPath ?? null,
      timestamp: new Date(expense.timestamp).toISOString(),
      trip_id: tripId
    });
};

// Remove an expense from a trip (and delete its photo in storage)
export const removeExpense = async (
  location: string,
  date: string,
  expenseId: string
): Promise<void> => {
  const trip = await getTrip(location, date);
  if (!trip) return;
  const exp = trip.expenses.find(e => e.id === expenseId);
  if (exp && exp.photoPath) {
    // Remove from storage
    await supabase.storage.from("expense_photos").remove([exp.photoPath]);
  }
  // Remove from db
  await supabase.from("expenses").delete().eq("id", expenseId);
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
  const trip = await getTrip(location, date);
  if (!trip) return;
  // Remove photos of all expenses
  await removeTripPhotos(trip);
  // Remove trip (will cascade and delete all expenses)
  await supabase.from('trips').delete().match({ location, date });
};

// Not used: getTrips already fetches expenses in one query
