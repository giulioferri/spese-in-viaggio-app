
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Camera } from "lucide-react";
import { addExpense, Expense } from "@/lib/tripStorage";

interface ExpenseFormProps {
  location: string;
  date: string;
  onExpenseAdded: () => void;
}

export default function ExpenseForm({ location, date, onExpenseAdded }: ExpenseFormProps) {
  const [amount, setAmount] = useState("");
  const [comment, setComment] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size and type
    if (file.size > 5 * 1024 * 1024) {
      setError("L'immagine è troppo grande (max 5MB)");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Il file selezionato non è un'immagine");
      return;
    }

    setError("");
    
    // Create a temporary URL for the image
    const imageUrl = URL.createObjectURL(file);
    setPhotoUrl(imageUrl);
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

      // Convert amount to number and check if it's valid
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        throw new Error("L'importo deve essere un numero positivo");
      }

      // Create a new expense object
      const newExpense: Expense = {
        id: Date.now().toString(),
        amount: numAmount,
        comment,
        photoUrl,
        timestamp: Date.now(),
      };

      // Add the expense to storage
      await addExpense(location, date, newExpense);

      // Reset the form
      setAmount("");
      setComment("");
      setPhotoUrl("");
      
      // Notify the parent component
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
                    onClick={() => setPhotoUrl("")}
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
                    Scegli foto
                  </Label>
                  <Input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handlePhotoChange}
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
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Commento</Label>
            <Textarea
              id="comment"
              placeholder="Descrizione della spesa..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button 
            type="submit" 
            className="w-full bg-primary" 
            disabled={isSubmitting}
          >
            {isSubmitting ? "Salvataggio..." : "Aggiungi Spesa"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
