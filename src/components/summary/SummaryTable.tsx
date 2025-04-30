
import { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Download, Trash2 } from "lucide-react";
import { Trip } from "@/lib/tripStorage";
import { AlertDialog, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DeleteTripDialog } from "@/components/summary/DeleteTripDialog";

interface SummaryTableProps {
  trips: Trip[];
  selectedTrips: {id: string}[];
  toggleTripSelection: (id: string) => void;
  toggleAllTrips: () => void;
  exportTripToZip: (trip: Trip) => Promise<void>;
  onDeleteTrip: (location: string, date: string) => void;
}

export function SummaryTable({
  trips,
  selectedTrips,
  toggleTripSelection,
  toggleAllTrips,
  exportTripToZip,
  onDeleteTrip
}: SummaryTableProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<{location: string, date: string} | null>(null);
  
  const handleDelete = (location: string, date: string) => {
    setSelectedTrip({ location, date });
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setSelectedTrip(null);
  };

  const handleConfirmDelete = () => {
    if (selectedTrip) {
      onDeleteTrip(selectedTrip.location, selectedTrip.date);
    }
    handleCloseDialog();
  };

  return (
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
              <AlertDialog 
                open={showDialog && selectedTrip && selectedTrip.location === trip.location && selectedTrip.date === trip.date} 
                onOpenChange={setShowDialog}
              >
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive" 
                    size="icon" 
                    onClick={() => handleDelete(trip.location, trip.date)}
                  >
                    <Trash2 size={18} />
                    <span className="sr-only">Elimina trasferta</span>
                  </Button>
                </AlertDialogTrigger>
                <DeleteTripDialog 
                  onCancel={handleCloseDialog} 
                  onConfirm={handleConfirmDelete} 
                />
              </AlertDialog>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
