export interface Guest {
  id: string;
  name: string;
  relation: string;
  side: "groom" | "bride";
  amount: number;
  paymentMethod: "cash" | "transfer";
  mealTickets: number;
  memo: string;
  date: string;
  source: "csv" | "manual";
}

export interface GuestStats {
  totalCount: number;
  totalAmount: number;
  groomCount: number;
  groomAmount: number;
  brideCount: number;
  brideAmount: number;
  byRelation: Record<string, { count: number; amount: number }>;
}

export type SideFilter = "all" | "groom" | "bride";
