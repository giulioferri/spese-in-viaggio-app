
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { addExpense, Expense } from "@/lib/tripStorage";
import { PhotoUpload } from "./expenses/PhotoUpload";
import { ExpenseFields } from "./expenses/ExpenseFields";

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handlePhotoUploaded = (url: string, path: string | undefined) => {
    setPhotoUrl(url);
    setPhotoPath(path);
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
      console.error("Submission error:", err);
      if (err.message?.includes("Permission denied")) {
        setError("Errore di permesso: assicurati di aver effettuato il login");
      } else {
        setError(err.message || "Si è verificato un errore");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="mt-6">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <PhotoUpload
            location={location}
            date={date}
            photoUrl={photoUrl}
            onPhotoUploaded={handlePhotoUploaded}
            disabled={isSubmitting}
          />

          <ExpenseFields
            amount={amount}
            comment={comment}
            onAmountChange={setAmount}
            onCommentChange={setComment}
            disabled={isSubmitting}
          />

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
