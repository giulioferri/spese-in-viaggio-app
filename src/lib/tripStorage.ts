// Type definitions
export interface Expense {
  id: string;
  amount: number;
  comment: string;
  photoUrl: string;
  timestamp: number;
}

export interface Trip {
  location: string;
  date: string; // ISO date string
  expenses: Expense[];
}

// Local storage keys
const TRIPS_STORAGE_KEY = 'spese_trasferta_trips';
const CURRENT_TRIP_KEY = 'spese_trasferta_current_trip';

// Get all trips
export const getTrips = async (): Promise<Trip[]> => {
  const tripsData = localStorage.getItem(TRIPS_STORAGE_KEY);
  return tripsData ? JSON.parse(tripsData) : [];
};

// Save all trips
export const saveTrips = async (trips: Trip[]): Promise<void> => {
  localStorage.setItem(TRIPS_STORAGE_KEY, JSON.stringify(trips));
};

// Get a trip by location and date
export const getTrip = async (location: string, date: string): Promise<Trip | undefined> => {
  const trips = await getTrips();
  return trips.find(
    (trip) => trip.location === location && trip.date === date
  );
};

// Add or update a trip
export const saveTrip = async (trip: Trip): Promise<void> => {
  const trips = await getTrips();
  const existingTripIndex = trips.findIndex(
    (t) => t.location === trip.location && t.date === trip.date
  );

  if (existingTripIndex >= 0) {
    trips[existingTripIndex] = trip;
  } else {
    trips.push(trip);
  }

  await saveTrips(trips);
};

// Add an expense to a trip
export const addExpense = async (
  location: string,
  date: string,
  expense: Expense
): Promise<void> => {
  let trip = await getTrip(location, date);

  if (!trip) {
    trip = {
      location,
      date,
      expenses: [],
    };
  }

  trip.expenses.push(expense);
  await saveTrip(trip);
};

// Remove an expense from a trip
export const removeExpense = async (
  location: string,
  date: string,
  expenseId: string
): Promise<void> => {
  const trip = await getTrip(location, date);
  
  if (!trip) return;
  
  trip.expenses = trip.expenses.filter((e) => e.id !== expenseId);
  await saveTrip(trip);
};

// Set current trip
export const setCurrentTrip = (location: string, date: string): void => {
  localStorage.setItem(
    CURRENT_TRIP_KEY,
    JSON.stringify({ location, date })
  );
};

// Get current trip
export const getCurrentTrip = (): { location: string; date: string } | null => {
  const currentTripData = localStorage.getItem(CURRENT_TRIP_KEY);
  
  if (!currentTripData) {
    return null;
  }
  
  return JSON.parse(currentTripData);
};

// Funzione di utilità per rimuovere tutte le foto di una trasferta
export const removeTripPhotos = async (trip: Trip) => {
  for (const expense of trip.expenses) {
    if (expense.photoUrl && expense.photoUrl.startsWith("https://xkqzwdubkxutogqcnapm.supabase.co/storage/")) {
      try {
        // Estrai il percorso del file dallo URL
        const url = new URL(expense.photoUrl);
        // Esempio: /storage/v1/object/public/profile_photos/avatar-xxxx-1234567.png
        const parts = url.pathname.split("/");
        const bucket = parts[5]; // "profile_photos"
        const path = parts.slice(6).join("/"); // "avatar-xxxx-1234567.png"
        const { supabase } = await import("@/integrations/supabase/client");
        await supabase.storage.from(bucket).remove([path]);
      } catch (e) {
        // fallo silenziosamente, può trattarsi di una foto locale/non su Supabase
        console.warn("Errore nella rimozione della foto:", e);
      }
    }
  }
};

// Rimuovi l'intera trasferta e le sue foto
export const deleteTrip = async (location: string, date: string): Promise<void> => {
  const trips = await getTrips();
  const tripIndex = trips.findIndex((t) => t.location === location && t.date === date);
  if (tripIndex >= 0) {
    const trip = trips[tripIndex];
    await removeTripPhotos(trip);
    trips.splice(tripIndex, 1);
    await saveTrips(trips);
  }
};
