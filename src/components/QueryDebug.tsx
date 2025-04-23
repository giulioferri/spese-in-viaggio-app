
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface QueryDebugProps {
  queryInfo: {
    query?: string;
    params?: any;
    results?: any;
    error?: any;
    userId?: string;
  };
}

const QueryDebug: React.FC<QueryDebugProps> = ({ queryInfo }) => {
  if (!queryInfo) return null;

  return (
    <Card className="mt-4 bg-yellow-50 border-yellow-300 dark:bg-yellow-950 dark:border-yellow-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Debug Informazioni Query</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {queryInfo.userId && (
          <div>
            <h3 className="font-bold">User ID autenticato:</h3>
            <pre className="bg-muted p-2 rounded overflow-auto">{queryInfo.userId}</pre>
          </div>
        )}
        {queryInfo.query && (
          <div>
            <h3 className="font-bold">Query eseguita:</h3>
            <pre className="bg-muted p-2 rounded overflow-auto">{queryInfo.query}</pre>
          </div>
        )}
        {queryInfo.params && (
          <div>
            <h3 className="font-bold">Parametri:</h3>
            <pre className="bg-muted p-2 rounded overflow-auto">{JSON.stringify(queryInfo.params, null, 2)}</pre>
          </div>
        )}
        {queryInfo.results && (
          <div>
            <h3 className="font-bold">Risultati:</h3>
            <pre className="bg-muted p-2 rounded overflow-auto max-h-96">{JSON.stringify(queryInfo.results, null, 2)}</pre>
          </div>
        )}
        {queryInfo.error && (
          <div>
            <h3 className="font-bold text-red-500">Errore:</h3>
            <pre className="bg-red-100 dark:bg-red-900 p-2 rounded overflow-auto">{JSON.stringify(queryInfo.error, null, 2)}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QueryDebug;
