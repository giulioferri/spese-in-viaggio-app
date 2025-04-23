import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Camera } from "lucide-react";
import { addExpense, Expense } from "@/lib/tripStorage";
import { supabase } from "@/integrations/supabase/client";

interface ExpenseFormProps {
  location: string;
  date: string;
  onExpenseAdded: () => void;
}

function generateId() {
  return crypto.randomUUID();
}

export default function ExpenseForm({ location, date, onExpenseAdded }: ExpenseFormProps) {
  const [amount, setAmount] = useState("");
  const [comment, setComment] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoPath, setPhotoPath] = useState<string | undefined>(undefined);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError("L'immagine è troppo grande (max 10MB)");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("Il file selezionato non è un'immagine");
      return;
    }

    try {
      setIsUploading(true);
      const ext = file.name.split('.').pop() || "jpg";
      const newId = generateId();
      const filename = `scontrino-${newId}.${ext}`;
      const filePath = `${location}/${date}/${filename}`;

      const { data, error: uploadError } = await supabase
        .storage
        .from("expense_photos")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        setError("Errore nel caricamento dell'immagine");
        return;
      }

      const {
        data: { publicUrl }
      } = supabase.storage.from("expense_photos").getPublicUrl(filePath);

      setPhotoUrl(publicUrl);
      setPhotoPath(filePath);
    } catch {
      setError("Errore nel caricamento della foto");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!amount || !photoUrl) {
      setError("Inserisci l'importo e carica una foto della spesa");
      return;
    }

    try {
      setIsSubmitting(true);

      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        throw new Error("L'importo deve essere un numero positivo");
      }

      const newExpense: Expense = {
        id: generateId(),
        amount: numAmount,
        comment,
        photoUrl: photoUrl,
        photoPath: photoPath,
        timestamp: Date.now(),
      };

      await addExpense(location, date, newExpense);

      setAmount("");
      setComment("");
      setPhotoUrl("");
      setPhotoPath(undefined);

      onExpenseAdded();
    } catch (err: any) {
      setError(err.message || "Si è verificato un errore");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="mt-6">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="photo">Foto della spesa</Label>
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-md p-4 bg-gray-50">
              {photoUrl ? (
                <div className="relative w-full">
                  <img
                    src={photoUrl}
                    alt="Anteprima scontrino"
                    className="mx-auto max-h-48 rounded-md object-contain"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="absolute top-2 right-2 bg-white"
                    onClick={() => {
                      setPhotoUrl("");
                      setPhotoPath(undefined);
                    }}
                    disabled={isUploading || isSubmitting}
                  >
                    Cambia
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center">
                  <Camera className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Carica una foto della spesa
                  </p>
                  <Label
                    htmlFor="photo-upload"
                    className="cursor-pointer bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  >
                    {isUploading ? "Caricamento..." : "Scegli foto"}
                  </Label>
                  <Input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handlePhotoChange}
                    disabled={isUploading || isSubmitting}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Importo (€)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Commento</Label>
            <Textarea
              id="comment"
              placeholder="Descrizione della spesa..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button 
            type="submit" 
            className="w-full bg-primary" 
            disabled={isSubmitting || isUploading}
          >
            {isSubmitting ? "Salvataggio..." : "Aggiungi Spesa"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
