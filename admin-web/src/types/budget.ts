// 지출 카테고리
export const EXPENSE_CATEGORIES = [
  "예식장",
  "식대 (피로연)",
  "스드메",
  "예물/예단",
  "신혼여행",
  "혼수 (가전/가구)",
  "청첩장/인쇄물",
  "부케/꽃장식",
  "기타",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number] | string;

// 수입 구분
export const INCOME_TYPES = [
  "양가 지원금",
  "본인 저축",
  "현물 지원",
  "경조금",
  "기타",
] as const;

export type IncomeType = (typeof INCOME_TYPES)[number] | string;

// 결제 수단
export type PaymentMethod = "card" | "cash" | "transfer";

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  card: "신용카드",
  cash: "현금",
  transfer: "계좌이체",
};

// 부담 측
export type BurdenSide = "groom" | "bride" | "shared";

export const BURDEN_SIDE_LABELS: Record<BurdenSide, string> = {
  groom: "신랑",
  bride: "신부",
  shared: "공동",
};

// 지출 항목
export interface Expense {
  id: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  paymentMethod: PaymentMethod;
  burdenSide: BurdenSide;
  date: string;
  memo: string;
}

// 수입 항목 (축의금 제외)
export interface Income {
  id: string;
  type: IncomeType;
  description: string;
  amount: number;
  date: string;
  memo: string;
}
