
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { debugRlsPolicies, fixOrphanedData } from "@/lib/tripStorageDebug";
import { useAuth } from "@/hooks/useAuth";

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
      
      // Riesegui diagnostica
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
            
            {diagnosticResults && (
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
