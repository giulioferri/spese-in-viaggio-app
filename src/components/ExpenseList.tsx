
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Expense, removeExpense } from "@/lib/tripStorage";

interface ExpenseListProps {
  location: string;
  date: string;
  expenses: Expense[];
  onExpenseRemoved: () => void;
}

export default function ExpenseList({ 
  location, 
  date, 
  expenses, 
  onExpenseRemoved 
}: ExpenseListProps) {
  if (expenses.length === 0) {
    return null;
  }

  const handleRemoveExpense = async (expenseId: string) => {
    await removeExpense(location, date, expenseId);
    onExpenseRemoved();
  };

  // Calculate total expenses
  const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <Card className="mt-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex justify-between items-center">
          <span>Spese registrate</span>
          <span className="text-primary">
            Totale: €{totalAmount.toFixed(2)}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {expenses.map((expense) => (
            <div 
              key={expense.id} 
              className="p-4 flex gap-4"
            >
              <div className="flex-shrink-0">
                <img
                  src={expense.photoUrl}
                  alt="Scontrino"
                  className="w-16 h-16 object-cover rounded-md"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium">€{expense.amount.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {expense.comment || "Nessuna descrizione"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(expense.timestamp).toLocaleTimeString('it-IT', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
              <div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-8 text-destructive hover:text-destructive/80"
                  onClick={() => handleRemoveExpense(expense.id)}
                >
                  Rimuovi
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
