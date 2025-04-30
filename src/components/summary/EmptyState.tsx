
import { Card, CardContent } from "@/components/ui/card";

export function EmptyState() {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-center text-muted-foreground">Nessuna trasferta registrata</p>
      </CardContent>
    </Card>
  );
}
