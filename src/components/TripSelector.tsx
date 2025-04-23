
import { useEffect, useState } from "react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { getTrips, setCurrentTrip } from "@/lib/tripStorage";
import QueryDebug from "@/components/QueryDebug";

interface Trip {
  location: string;
  date: string;
}

interface TripSelectorProps {
  currentLocation: string;
  currentDate: string;
  onTripSelected: (location: string, date: string) => void;
}

export default function TripSelector({ 
  currentLocation,
  currentDate,
  onTripSelected
}: TripSelectorProps) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [date, setDate] = useState<Date | undefined>(new Date(currentDate));
  const [isNewTrip, setIsNewTrip] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<string>("");
  const [queryDebugInfo, setQueryDebugInfo] = useState<any>(null);

  // Load trips on mount
  useEffect(() => {
    const loadTrips = async () => {
      // Destructure the return value to get both trips array and debug info
      const [loadedTrips, debugInfo] = await getTrips();
      setTrips(loadedTrips);
      setQueryDebugInfo(debugInfo);
      
      // Create a unique ID for the current trip
      const currentTripId = `${currentLocation}|${currentDate}`;
      setSelectedTrip(currentTripId);
    };
    
    loadTrips();
  }, [currentLocation, currentDate]);

  // Handle trip selection
  const handleTripChange = (tripId: string) => {
    if (tripId === "new") {
      setIsNewTrip(true);
      setDate(new Date());
      return;
    }
    
    setIsNewTrip(false);
    setSelectedTrip(tripId);
    
    // Parse the location and date from the trip ID
    const [location, date] = tripId.split("|");
    onTripSelected(location, date);
    
    // Update the current trip in storage
    setCurrentTrip(location, date);
  };

  // Handle date selection for new trip
  const handleDateSelect = (newDate: Date | undefined) => {
    if (!newDate) return;
    setDate(newDate);
  };

  // Handle new trip creation
  const handleNewTrip = () => {
    if (!date) return;
    
    const newDate = date.toISOString().split("T")[0];
    onTripSelected(currentLocation, newDate);
    
    // Update the current trip in storage
    setCurrentTrip(currentLocation, newDate);
    
    // Reset new trip state
    setIsNewTrip(false);
  };

  return (
    <div className="space-y-4 mt-4">
      <div>
        <label className="text-sm font-medium mb-1 block">
          Seleziona trasferta
        </label>
        <Select
          value={isNewTrip ? "new" : selectedTrip}
          onValueChange={handleTripChange}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Seleziona una trasferta" />
          </SelectTrigger>
          <SelectContent>
            {trips.map((trip) => (
              <SelectItem 
                key={`${trip.location}|${trip.date}`} 
                value={`${trip.location}|${trip.date}`}
              >
                {trip.location} - {new Date(trip.date).toLocaleDateString('it-IT')}
              </SelectItem>
            ))}
            <SelectItem value="new">
              <div className="flex items-center gap-2">
                <Plus size={16} />
                <span>Nuova trasferta</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Mostra il debug della query */}
      {queryDebugInfo && (
        <QueryDebug queryInfo={queryDebugInfo} />
      )}

      {isNewTrip && (
        <div className="space-y-4 p-4 border rounded-md">
          <h3 className="text-sm font-medium">Nuova trasferta</h3>
          
          <div>
            <label className="text-sm font-medium mb-1 block">
              Data
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "dd/MM/yyyy") : <span>Seleziona data</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={handleDateSelect}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <Button 
            className="w-full bg-primary" 
            onClick={handleNewTrip}
          >
            Crea trasferta
          </Button>
        </div>
      )}
    </div>
  );
}
