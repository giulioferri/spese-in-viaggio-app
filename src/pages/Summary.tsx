
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileArchive } from "lucide-react";
import { getTrips, deleteTrip, Trip } from "@/lib/tripStorage";
import { useToast } from "@/hooks/use-toast";
import { SummaryTable } from "@/components/summary/SummaryTable";
import { EmptyState } from "@/components/summary/EmptyState";
import { 
  createTripCSV, 
  fetchTripPhotos, 
  createAndDownloadZip 
} from "@/utils/exportUtils";

export default function Summary() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTrips, setSelectedTrips] = useState<{id: string}[]>([]);
  const { toast } = useToast();

  const loadTrips = async () => {
    const [loadedTrips] = await getTrips();
    setTrips(loadedTrips);
  };

  useEffect(() => {
    loadTrips();
  }, []);

  const exportSelectedTripsToZip = async () => {
    if (selectedTrips.length === 0) {
      toast({
        title: "Nessuna trasferta selezionata",
        description: "Seleziona almeno una trasferta per esportarla",
        variant: "destructive",
      });
      return;
    }

    try {
      // Filter only selected trips
      const tripsToExport = trips.filter(trip => 
        selectedTrips.some(selected => selected.id === trip.id)
      );
      
      // Create CSV content
      const csvBlob = createTripCSV(tripsToExport);

      // Get photos
      const photos = await fetchTripPhotos(tripsToExport);

      // Create and download ZIP
      await createAndDownloadZip(csvBlob, photos, 'trasferte_selezionate.zip');

      toast({
        title: "Esportazione completata",
        description: "Il file ZIP è stato scaricato con successo.",
      });
    } catch (error) {
      console.error('Errore durante l\'esportazione:', error);
      toast({
        title: "Errore durante l'esportazione",
        description: "Si è verificato un errore durante l'esportazione delle trasferte.",
        variant: "destructive",
      });
    }
  };

  const exportTripToZip = async (trip: Trip) => {
    try {
      // Create CSV content for this single trip
      const csvBlob = createTripCSV([trip]);

      // Get photos for this trip
      const photos = await fetchTripPhotos([trip]);

      // Create and download ZIP
      await createAndDownloadZip(csvBlob, photos, `trasferta_${trip.location}_${trip.date}.zip`);

      toast({
        title: "Esportazione completata",
        description: "Il file ZIP è stato scaricato con successo.",
      });
    } catch (error) {
      console.error('Errore durante l\'esportazione:', error);
      toast({
        title: "Errore durante l'esportazione",
        description: "Si è verificato un errore durante l'esportazione della trasferta.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTrip = async (location: string, date: string) => {
    await deleteTrip(location, date);
    toast({
      title: "Trasferta eliminata",
      description: "La trasferta e i relativi allegati sono stati eliminati.",
    });
    await loadTrips();
  };

  const toggleTripSelection = (id: string) => {
    setSelectedTrips(prevSelected => {
      if (prevSelected.some(trip => trip.id === id)) {
        return prevSelected.filter(trip => trip.id !== id);
      } else {
        return [...prevSelected, { id }];
      }
    });
  };

  const toggleAllTrips = () => {
    if (selectedTrips.length === trips.length) {
      setSelectedTrips([]);
    } else {
      setSelectedTrips(trips.map(trip => ({ id: trip.id })));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-2xl font-bold">Riepilogo Trasferte</h2>
        <div className="flex flex-wrap gap-2">
          {selectedTrips.length > 0 && (
            <Button onClick={exportSelectedTripsToZip} className="bg-primary">
              <FileArchive className="mr-2 h-4 w-4" />
              Scarica selezionate
            </Button>
          )}
        </div>
      </div>

      {trips.length === 0 ? (
        <EmptyState />
      ) : (
        <Card>
          <CardContent className="p-0">
            <SummaryTable
              trips={trips}
              selectedTrips={selectedTrips}
              toggleTripSelection={toggleTripSelection}
              toggleAllTrips={toggleAllTrips}
              exportTripToZip={exportTripToZip}
              onDeleteTrip={handleDeleteTrip}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
