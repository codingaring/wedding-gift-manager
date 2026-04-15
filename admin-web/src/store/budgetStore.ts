import { useMemo } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Expense, Income } from "../types/budget";

interface BudgetStore {
  expenses: Expense[];
  incomes: Income[];

  addExpense: (expense: Omit<Expense, "id">) => void;
  updateExpense: (id: string, updates: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;

  addIncome: (income: Omit<Income, "id">) => void;
  updateIncome: (id: string, updates: Partial<Income>) => void;
  deleteIncome: (id: string) => void;

  clearBudget: () => void;
}

export const useBudgetStore = create<BudgetStore>()(
  persist(
    (set) => ({
      expenses: [],
      incomes: [],

      addExpense: (expense) =>
        set((s) => ({
          expenses: [...s.expenses, { ...expense, id: crypto.randomUUID() }],
        })),

      updateExpense: (id, updates) =>
        set((s) => ({
          expenses: s.expenses.map((e) =>
            e.id === id ? { ...e, ...updates } : e,
          ),
        })),

      deleteExpense: (id) =>
        set((s) => ({
          expenses: s.expenses.filter((e) => e.id !== id),
        })),

      addIncome: (income) =>
        set((s) => ({
          incomes: [...s.incomes, { ...income, id: crypto.randomUUID() }],
        })),

      updateIncome: (id, updates) =>
        set((s) => ({
          incomes: s.incomes.map((i) =>
            i.id === id ? { ...i, ...updates } : i,
          ),
        })),

      deleteIncome: (id) =>
        set((s) => ({
          incomes: s.incomes.filter((i) => i.id !== id),
        })),

      clearBudget: () => set({ expenses: [], incomes: [] }),
    }),
    { name: "wedding-budget" },
  ),
);

// 통계 셀렉터
export function useBudgetStats(giftTotal: number) {
  const expenses = useBudgetStore((s) => s.expenses);
  const incomes = useBudgetStore((s) => s.incomes);

  return useMemo(() => {
    const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
    const totalIncomeWithGift = totalIncome + giftTotal;
    const balance = totalIncomeWithGift - totalExpense;

    // 카테고리별 지출
    const byCategory: Record<string, number> = {};
    for (const e of expenses) {
      byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
    }

    // 결제수단별 지출
    const byPayment: Record<string, number> = {};
    for (const e of expenses) {
      byPayment[e.paymentMethod] = (byPayment[e.paymentMethod] || 0) + e.amount;
    }

    // 부담측별 지출
    const bySide: Record<string, number> = {};
    for (const e of expenses) {
      bySide[e.burdenSide] = (bySide[e.burdenSide] || 0) + e.amount;
    }

    return {
      totalExpense,
      totalIncome,
      totalIncomeWithGift,
      giftTotal,
      balance,
      byCategory,
      byPayment,
      bySide,
    };
  }, [expenses, incomes, giftTotal]);
}
