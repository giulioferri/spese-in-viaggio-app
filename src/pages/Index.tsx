
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

export default function Index() {
  const navigate = useNavigate();
  const [location, setLocation] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeTrip = async () => {
      try {
        // Check if there's a current trip in local storage
        const currentTrip = getCurrentTrip();
        
        if (currentTrip) {
          // Use the stored current trip
          setLocation(currentTrip.location);
          setDate(currentTrip.date);
          
          // Load expenses for the current trip
          const tripData = await getTrip(currentTrip.location, currentTrip.date);
          setExpenses(tripData?.expenses || []);
        } else {
          // Use today's date and get location from device
          const today = format(new Date(), "yyyy-MM-dd");
          setDate(today);
          
          // The LocationInput component will handle getting the current location
        }
      } catch (error) {
        console.error("Error initializing trip:", error);
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
    const tripData = await getTrip(tripLocation, tripDate);
    setExpenses(tripData?.expenses || []);
  };

  const handleExpenseAdded = () => {
    loadExpenses(location, date);
  };

  const handleExpenseRemoved = () => {
    loadExpenses(location, date);
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
          <CardTitle>Dettagli Trasferta</CardTitle>
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
