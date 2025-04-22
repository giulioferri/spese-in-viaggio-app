
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { getTrips } from "@/lib/tripStorage";

export default function Summary() {
  const [trips, setTrips] = useState<any[]>([]);

  useEffect(() => {
    const loadTrips = async () => {
      const loadedTrips = await getTrips();
      setTrips(loadedTrips);
    };
    
    loadTrips();
  }, []);

  const exportToCSV = () => {
    // Colonne: Luogo;Data;Importo;Descrizione
    const headers = ['Luogo', 'Data', 'Importo', 'Descrizione'];
    let csvContent = headers.join(';') + '\n';

    trips.forEach(trip => {
      trip.expenses.forEach((exp: any) => {
        const euroAmount = Number(exp.amount)
          .toFixed(2)
          .replace('.', ','); // Virgola come separatore decimale
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {trips.map((trip, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{trip.location}</TableCell>
                    <TableCell>{new Date(trip.date).toLocaleDateString('it-IT')}</TableCell>
                    <TableCell>{trip.expenses.length}</TableCell>
                    <TableCell className="text-right">
                      €{' '}
                      {trip.expenses
                        .reduce((sum: number, exp: any) => sum + Number(exp.amount), 0)
                        .toFixed(2)}
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
