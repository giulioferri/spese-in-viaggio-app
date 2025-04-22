
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";

interface LocationInputProps {
  value: string;
  onChange: (location: string) => void;
}

export default function LocationInput({ value, onChange }: LocationInputProps) {
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("La geolocalizzazione non è supportata dal tuo browser");
      return;
    }

    setLocationLoading(true);
    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          // Use reverse geocoding to get a human-readable address
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          
          if (!response.ok) {
            throw new Error("Impossibile ottenere l'indirizzo");
          }
          
          const data = await response.json();
          
          // Extract city and country from the response
          const city = data.address.city || 
                      data.address.town || 
                      data.address.village || 
                      data.address.hamlet || 
                      "Località sconosciuta";
                      
          const country = data.address.country || "";
          const location = city + (country ? `, ${country}` : "");
          
          onChange(location);
        } catch (error) {
          setLocationError("Errore nel recupero della posizione");
          console.error(error);
        } finally {
          setLocationLoading(false);
        }
      },
      (error) => {
        setLocationError("Errore nel recupero della posizione: " + error.message);
        setLocationLoading(false);
      }
    );
  };

  // Request location when component mounts if no value is provided
  useEffect(() => {
    if (!value) {
      getCurrentLocation();
    }
  }, []);

  return (
    <div className="space-y-2">
      <Label htmlFor="location">Luogo</Label>
      <div className="flex gap-2">
        <Input
          id="location"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Inserisci la località"
          className="flex-1"
        />
        <Button 
          type="button" 
          onClick={getCurrentLocation} 
          variant="outline"
          disabled={locationLoading}
        >
          <Search size={18} />
        </Button>
      </div>
      {locationError && (
        <p className="text-sm text-destructive">{locationError}</p>
      )}
    </div>
  );
}
