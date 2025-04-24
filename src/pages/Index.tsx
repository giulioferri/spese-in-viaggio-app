
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import LocationInput from "@/components/LocationInput";
import ExpenseForm from "@/components/ExpenseForm";
import ExpenseList from "@/components/ExpenseList";
import TripSelector from "@/components/TripSelector";
import { getTrip, getCurrentTrip, setCurrentTrip } from "@/lib/tripStorage";
import { it } from "date-fns/locale";
import { useAuth } from "@/hooks/useAuth";

export default function Index() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [location, setLocation] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeTrip = async () => {
      try {
        // Always use today's date as the default
        const today = format(new Date(), "yyyy-MM-dd");
        setDate(today);
        
        const currentTrip = getCurrentTrip();
        
        if (currentTrip && currentTrip.location) {
          // Use the saved location but always today's date
          setLocation(currentTrip.location);
          
          // Try to load expenses for the current location and today
          const [tripData] = await getTrip(currentTrip.location, today);
          
          if (tripData) {
            setExpenses(tripData.expenses || []);
            // Update current trip with today's date
            setCurrentTrip(currentTrip.location, today);
          } else {
            setExpenses([]);
          }
        }
      } catch (error) {
        console.error("Error initializing trip:", error);
        setExpenses([]);
      } finally {
        setLoading(false);
      }
    };

    initializeTrip();
  }, []);

  const handleLocationChange = (newLocation: string) => {
    setLocation(newLocation);
    if (newLocation && date) {
      setCurrentTrip(newLocation, date);
      loadExpenses(newLocation, date);
    }
  };

  const handleTripSelected = (newLocation: string, newDate: string) => {
    setLocation(newLocation);
    setDate(newDate);
    loadExpenses(newLocation, newDate);
  };

  const loadExpenses = async (tripLocation: string, tripDate: string) => {
    const [tripData] = await getTrip(tripLocation, tripDate);
    setExpenses(tripData?.expenses || []);
  };

  const handleExpenseAdded = async () => {
    await loadExpenses(location, date);
  };

  const handleExpenseRemoved = async () => {
    await loadExpenses(location, date);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Caricamento...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex flex-col md:flex-row md:justify-between md:items-center gap-2">
            {user && (
              <span className="text-sm text-muted-foreground order-1 md:order-2">
                Utente: {user.email} (ID: {user.id.substring(0, 8)}...)
              </span>
            )}
            <span className="order-2 md:order-1">Dettagli Trasferta</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <LocationInput 
              value={location} 
              onChange={handleLocationChange} 
            />
            
            <div>
              <p className="text-sm font-medium mb-1">Data</p>
              <p className="text-lg font-medium">
                {date ? format(new Date(date), "EEEE d MMMM yyyy", { locale: it }) : "Data non selezionata"}
              </p>
            </div>
          </div>
          
          <TripSelector 
            currentLocation={location}
            currentDate={date}
            onTripSelected={handleTripSelected}
          />
        </CardContent>
      </Card>

      {location && date && (
        <>
          <ExpenseList 
            location={location}
            date={date}
            expenses={expenses}
            onExpenseRemoved={handleExpenseRemoved}
          />
          
          <ExpenseForm 
            location={location}
            date={date}
            onExpenseAdded={handleExpenseAdded}
          />
        </>
      )}
    </div>
  );
}
