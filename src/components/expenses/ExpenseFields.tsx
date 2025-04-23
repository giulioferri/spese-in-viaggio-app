
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ExpenseFieldsProps {
  amount: string;
  comment: string;
  onAmountChange: (value: string) => void;
  onCommentChange: (value: string) => void;
  disabled?: boolean;
}

export function ExpenseFields({ 
  amount, 
  comment, 
  onAmountChange, 
  onCommentChange, 
  disabled 
}: ExpenseFieldsProps) {
  return (
    <div className="grid grid-cols-[1fr,2fr] gap-4">
      <div className="space-y-2">
        <Label htmlFor="amount">Importo (€)</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          value={amount}
          onChange={(e) => onAmountChange(e.target.value)}
          disabled={disabled}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="comment">Commento</Label>
        <Input
          id="comment"
          type="text"
          placeholder="Descrizione della spesa..."
          value={comment}
          onChange={(e) => onCommentChange(e.target.value)}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
