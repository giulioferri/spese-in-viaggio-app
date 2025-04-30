import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { getTrips, deleteTrip } from "@/lib/tripStorage";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { Trash2, Download, FileArchive } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Summary() {
  const [trips, setTrips] = useState<any[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<{location: string, date: string} | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedTrips, setSelectedTrips] = useState<{id: string}[]>([]);
  const { toast } = useToast();

  const loadTrips = async () => {
    const [loadedTrips] = await getTrips();
    setTrips(loadedTrips);
  };

  useEffect(() => {
    loadTrips();
  }, []);

  const exportToCSV = () => {
    const headers = ['Luogo', 'Data', 'Importo', 'Descrizione'];
    let csvContent = headers.join(';') + '\n';
    trips.forEach(trip => {
      trip.expenses.forEach((exp: any) => {
        const euroAmount = Number(exp.amount)
          .toFixed(2)
          .replace('.', ',');
        const row = [
          trip.location,
          new Date(trip.date).toLocaleDateString('it-IT'),
          euroAmount,
          (typeof exp.comment === 'string' ? exp.comment.replace(/[\n\r;]/g, ' ') : '')
        ];
        csvContent += row.join(';') + '\n';
      });
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'spese_trasferta.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
      const headers = ['Luogo', 'Data', 'Importo', 'Descrizione'];
      let csvContent = headers.join(';') + '\n';
      
      // Filter only selected trips
      const tripsToExport = trips.filter(trip => 
        selectedTrips.some(selected => selected.id === trip.id)
      );
      
      tripsToExport.forEach(trip => {
        trip.expenses.forEach((exp: any) => {
          const euroAmount = Number(exp.amount)
            .toFixed(2)
            .replace('.', ',');
          const row = [
            trip.location,
            new Date(trip.date).toLocaleDateString('it-IT'),
            euroAmount,
            (typeof exp.comment === 'string' ? exp.comment.replace(/[\n\r;]/g, ' ') : '')
          ];
          csvContent += row.join(';') + '\n';
        });
      });

      const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

      const photoPromises = tripsToExport.flatMap(trip => 
        trip.expenses
          .filter((exp: any) => exp.photoUrl)
          .map(async (exp: any) => {
            try {
              const response = await fetch(exp.photoUrl);
              const blob = await response.blob();
              // Create folder structure by date (YYYY-MM-DD)
              const tripDate = trip.date; // Already in YYYY-MM-DD format
              return {
                name: `${tripDate}/${trip.location}_${exp.id}${getFileExtension(exp.photoUrl)}`,
                blob
              };
            } catch (error) {
              console.error('Errore nel download della foto:', error);
              return null;
            }
          })
      );

      const photos = (await Promise.all(photoPromises)).filter(photo => photo !== null);

      const JSZip = await import('jszip');
      const zip = new JSZip.default();

      zip.file('riepilogo_spese.csv', csvBlob);

      photos.forEach(photo => {
        if (photo) {
          zip.file(`photos/${photo.name}`, photo.blob);
        }
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipUrl = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = zipUrl;
      link.download = `trasferte_selezionate.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(zipUrl);

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

  const getFileExtension = (url: string) => {
    const match = url.match(/\.([^.]+)(?:\?.*)?$/);
    return match ? `.${match[1].toLowerCase()}` : '.jpg';
  };

  const handleDelete = (location: string, date: string) => {
    setSelectedTrip({ location, date });
    setShowDialog(true);
  };

  const confirmDelete = async () => {
    if (selectedTrip) {
      await deleteTrip(selectedTrip.location, selectedTrip.date);
      setShowDialog(false);
      setSelectedTrip(null);
      toast({
        title: "Trasferta eliminata",
        description: "La trasferta e i relativi allegati sono stati eliminati.",
      });
      await loadTrips();
    }
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

  const exportTripToZip = async (trip: any) => {
    try {
      // Create CSV content for this single trip
      const headers = ['Luogo', 'Data', 'Importo', 'Descrizione'];
      let csvContent = headers.join(';') + '\n';
      
      trip.expenses.forEach((exp: any) => {
        const euroAmount = Number(exp.amount)
          .toFixed(2)
          .replace('.', ',');
        const row = [
          trip.location,
          new Date(trip.date).toLocaleDateString('it-IT'),
          euroAmount,
          (typeof exp.comment === 'string' ? exp.comment.replace(/[\n\r;]/g, ' ') : '')
        ];
        csvContent += row.join(';') + '\n';
      });

      const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

      // Get photos for this trip
      const photoPromises = trip.expenses
        .filter((exp: any) => exp.photoUrl)
        .map(async (exp: any) => {
          try {
            const response = await fetch(exp.photoUrl);
            const blob = await response.blob();
            return {
              name: `${trip.location}_${exp.id}${getFileExtension(exp.photoUrl)}`,
              blob
            };
          } catch (error) {
            console.error('Errore nel download della foto:', error);
            return null;
          }
        });

      const photos = (await Promise.all(photoPromises)).filter(photo => photo !== null);

      const JSZip = await import('jszip');
      const zip = new JSZip.default();

      // Add CSV file
      zip.file('riepilogo_spese.csv', csvBlob);

      // Add photos
      photos.forEach(photo => {
        if (photo) {
          zip.file(`photos/${photo.name}`, photo.blob);
        }
      });

      // Generate and download the ZIP file
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipUrl = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = zipUrl;
      link.download = `trasferta_${trip.location}_${trip.date}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(zipUrl);

      // Show success notification
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
          <Button onClick={exportToCSV} className="bg-primary">
            <Download className="mr-2 h-4 w-4" />
            Esporta CSV
          </Button>
        </div>
      </div>

      {trips.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Nessuna trasferta registrata</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <Checkbox 
                      checked={trips.length > 0 && selectedTrips.length === trips.length}
                      onCheckedChange={toggleAllTrips}
                      aria-label="Seleziona tutte le trasferte"
                    />
                  </TableHead>
                  <TableHead>Luogo</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>N° Spese</TableHead>
                  <TableHead className="text-right">Totale</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {trips.map((trip, index) => (
                  <TableRow key={trip.id ?? index}>
                    <TableCell>
                      <Checkbox 
                        checked={selectedTrips.some(selected => selected.id === trip.id)}
                        onCheckedChange={() => toggleTripSelection(trip.id)}
                        aria-label={`Seleziona trasferta ${trip.location}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{trip.location}</TableCell>
                    <TableCell>{new Date(trip.date).toLocaleDateString('it-IT')}</TableCell>
                    <TableCell>{trip.expenses.length}</TableCell>
                    <TableCell className="text-right">
                      €{' '}
                      {trip.expenses
                        .reduce((sum: number, exp: any) => sum + Number(exp.amount), 0)
                        .toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => exportTripToZip(trip)}
                        className="bg-primary/30 hover:bg-primary/40"
                      >
                        <Download size={18} />
                        <span className="sr-only">Esporta trasferta</span>
                      </Button>
                      <AlertDialog open={showDialog && selectedTrip && selectedTrip.location === trip.location && selectedTrip.date === trip.date} onOpenChange={setShowDialog}>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="icon" onClick={() => handleDelete(trip.location, trip.date)}>
                            <Trash2 size={18} />
                            <span className="sr-only">Elimina trasferta</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Eliminare questa trasferta?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Tutte le spese e gli allegati di questa trasferta verranno eliminati definitivamente. Sei sicuro di voler continuare?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annulla</AlertDialogCancel>
                            <AlertDialogAction asChild>
                              <Button variant="destructive" onClick={confirmDelete}>
                                Elimina definitivamente
                              </Button>
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
