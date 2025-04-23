
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
import { getTrips, deleteTrip } from "@/lib/tripStorage";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Summary() {
  const [trips, setTrips] = useState<any[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<{location: string, date: string} | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const { toast } = useToast();

  const loadTrips = async () => {
    const [loadedTrips] = await getTrips(); // Destrutturo per estrarre solo l'array di trasferte
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Riepilogo Trasferte</h2>
        <Button onClick={exportToCSV} className="bg-primary">
          Esporta CSV
        </Button>
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
                    <TableCell className="font-medium">{trip.location}</TableCell>
                    <TableCell>{new Date(trip.date).toLocaleDateString('it-IT')}</TableCell>
                    <TableCell>{trip.expenses.length}</TableCell>
                    <TableCell className="text-right">
                      €{' '}
                      {trip.expenses
                        .reduce((sum: number, exp: any) => sum + Number(exp.amount), 0)
                        .toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
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
