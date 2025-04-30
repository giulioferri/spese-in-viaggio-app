
export interface Expense {
  id: string;
  amount: number;
  comment: string;
  photoUrl: string;
  photoPath?: string;
  timestamp: number;
}

export interface Trip {
  id: string;
  location: string;
  date: string; // ISO date string (yyyy-MM-dd)
  expenses: Expense[];
}

export interface QueryDebugInfo {
  query?: string;
  params?: any;
  results?: any;
  error?: any;
  userId?: string;
}
