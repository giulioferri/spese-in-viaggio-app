
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { debugRlsPolicies, fixOrphanedData } from "@/lib/tripStorageDebug";
import { useAuth } from "@/hooks/useAuth";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function DiagnosticPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [diagnosticResults, setDiagnosticResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFixing, setIsFixing] = useState(false);

  const runDiagnostic = async () => {
    setIsLoading(true);
    try {
      const results = await debugRlsPolicies();
      setDiagnosticResults(results);
      
      toast({
        title: results.success ? "Diagnostica completata" : "Errore diagnostica",
        description: results.success 
          ? `Analisi completata. Verifica i dettagli.` 
          : `Errore: ${results.error}`,
        variant: results.success ? "default" : "destructive",
      });
    } catch (error) {
      console.error("Errore durante la diagnostica:", error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante la diagnostica",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fixData = async () => {
    setIsFixing(true);
    try {
      const results = await fixOrphanedData();
      
      toast({
        title: results.success ? "Correzione completata" : "Errore correzione",
        description: results.success 
          ? `Trasferte aggiornate: ${results.updatedTrips}` 
          : `Errore: ${results.error}`,
        variant: results.success ? "default" : "destructive",
      });
      
      // Run diagnostic again after fixing
      if (results.success) {
        await runDiagnostic();
      }
    } catch (error) {
      console.error("Errore durante la correzione dei dati:", error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante la correzione",
        variant: "destructive",
      });
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Strumenti diagnostici RLS</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-md">
              <h3 className="font-medium mb-2">Stato autenticazione</h3>
              {user ? (
                <div>
                  <p><span className="font-medium">Email:</span> {user.email}</p>
                  <p><span className="font-medium">ID:</span> {user.id}</p>
                </div>
              ) : (
                <p className="text-red-500">Non autenticato</p>
              )}
            </div>
            
            <div className="flex space-x-4">
              <Button onClick={runDiagnostic} disabled={isLoading}>
                {isLoading ? "Analisi in corso..." : "Esegui diagnostica"}
              </Button>
              
              <Button 
                onClick={fixData} 
                disabled={isFixing || !diagnosticResults?.problemiUserIds}
                variant="outline"
              >
                {isFixing ? "Correzione in corso..." : "Correggi dati orfani"}
              </Button>
            </div>
            
            {diagnosticResults && diagnosticResults.allTripsData && (
              <div className="mt-6">
                <h3 className="font-medium text-lg mb-2">Confronto trasferte database vs RLS</h3>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">ID (parziale)</TableHead>
                        <TableHead>Località</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>User ID</TableHead>
                        <TableHead className="text-right">Visibile con RLS</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {diagnosticResults.allTripsData.map((trip: any) => {
                        // Verifica se questa trasferta è anche nei risultati filtrati da RLS
                        const isVisibleWithRLS = diagnosticResults.userTripsData?.some(
                          (t: any) => t.id === trip.id
                        );
                        
                        return (
                          <TableRow key={trip.id}>
                            <TableCell className="font-mono">{trip.id.substring(0, 8)}...</TableCell>
                            <TableCell>{trip.location}</TableCell>
                            <TableCell>{trip.date}</TableCell>
                            <TableCell className={trip.user_id ? "font-mono" : "text-red-500"}>
                              {trip.user_id ? 
                                `${trip.user_id.substring(0, 8)}...` : 
                                "MANCANTE"
                              }
                            </TableCell>
                            <TableCell className="text-right">
                              {isVisibleWithRLS ? (
                                <span className="text-green-500 font-medium">Sì</span>
                              ) : (
                                <span className="text-red-500 font-medium">No</span>
                              )}
                              
                              {trip.user_id === diagnosticResults.currentUserId && !isVisibleWithRLS && (
                                <p className="text-amber-500 text-xs">⚠️ Dovrebbe essere visibile (stesso user_id)</p>
                              )}
                              
                              {trip.user_id !== diagnosticResults.currentUserId && isVisibleWithRLS && (
                                <p className="text-amber-500 text-xs">⚠️ Non dovrebbe essere visibile (user_id diverso)</p>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                
                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900 rounded-md border border-yellow-200 dark:border-yellow-800">
                  <p className="font-medium">Utente corrente: {diagnosticResults.currentUserId}</p>
                  <p>Totale trasferte nel DB: {diagnosticResults.totalTrips}</p>
                  <p>Trasferte visibili con RLS: {diagnosticResults.userTrips}</p>
                  <p>Trasferte senza user_id: {diagnosticResults.problemiUserIds}</p>
                </div>
              </div>
            )}
            
            {diagnosticResults && !diagnosticResults.allTripsData && (
              <div className="mt-4 p-4 border rounded-md">
                <h3 className="font-medium mb-2">Risultati diagnostica</h3>
                <pre className="bg-muted p-2 rounded text-sm overflow-auto max-h-96">
                  {JSON.stringify(diagnosticResults, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
