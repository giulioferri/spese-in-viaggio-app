
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import LocationInput from "@/components/LocationInput";
import ExpenseForm from "@/components/ExpenseForm";
import ExpenseList from "@/components/ExpenseList";
import TripSelector from "@/components/TripSelector";
import { getTrip, getCurrentTrip, setCurrentTrip, QueryDebugInfo } from "@/lib/tripStorage";
import { it } from "date-fns/locale";
import QueryDebug from "@/components/QueryDebug";
import { useAuth } from "@/hooks/useAuth";

export default function Index() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [location, setLocation] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [queryDebugInfo, setQueryDebugInfo] = useState<QueryDebugInfo | null>(null);

  useEffect(() => {
    const initializeTrip = async () => {
      try {
        const currentTrip = getCurrentTrip();
        
        if (currentTrip) {
          setLocation(currentTrip.location);
          setDate(currentTrip.date);
          const [tripData, debugInfo] = await getTrip(currentTrip.location, currentTrip.date);
          setExpenses(tripData?.expenses || []);
          setQueryDebugInfo(debugInfo);
        } else {
          const today = format(new Date(), "yyyy-MM-dd");
          setDate(today);
        }
      } catch (error) {
        console.error("Error initializing trip:", error);
        setQueryDebugInfo({ error: String(error) });
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
    const [tripData, debugInfo] = await getTrip(tripLocation, tripDate);
    setExpenses(tripData?.expenses || []);
    setQueryDebugInfo(debugInfo);
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
          <CardTitle className="text-lg flex justify-between items-center">
            <span>Dettagli Trasferta</span>
            {user && (
              <span className="text-sm text-muted-foreground">
                Utente: {user.email} (ID: {user.id.substring(0, 8)}...)
              </span>
            )}
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

      {/* Informazioni di debug sulle query */}
      {queryDebugInfo && <QueryDebug queryInfo={queryDebugInfo} />}

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
