
import { supabase } from "@/integrations/supabase/client";
import { Expense, QueryDebugInfo } from "./types";
import { validateAuth } from "./auth";
import { getTrip, saveTrip } from "./tripQueries";
import { debugQuery } from "../tripStorageDebug";

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
