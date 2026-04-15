import { useState, useEffect } from "react";
import type { Expense, Income, PaymentMethod, BurdenSide } from "../types/budget";
import {
  EXPENSE_CATEGORIES,
  INCOME_TYPES,
  PAYMENT_METHOD_LABELS,
  BURDEN_SIDE_LABELS,
} from "../types/budget";

type Mode = "expense" | "income";

interface Props {
  mode: Mode;
  expense?: Expense | null;
  income?: Income | null;
  defaultCategory?: string;
  onClose: () => void;
  onSaveExpense: (data: Omit<Expense, "id">) => void;
  onSaveIncome: (data: Omit<Income, "id">) => void;
}

export default function BudgetFormModal({
  mode,
  expense,
  income,
  defaultCategory,
  onClose,
  onSaveExpense,
  onSaveIncome,
}: Props) {
  const isEditing = mode === "expense" ? !!expense : !!income;

  // 공통
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [memo, setMemo] = useState("");

  // 지출 전용
  const initialCategory = defaultCategory
    ? EXPENSE_CATEGORIES.includes(defaultCategory as typeof EXPENSE_CATEGORIES[number])
      ? defaultCategory
      : "기타"
    : EXPENSE_CATEGORIES[0];
  const [category, setCategory] = useState<string>(initialCategory);
  const [customCategory, setCustomCategory] = useState(
    defaultCategory && !EXPENSE_CATEGORIES.includes(defaultCategory as typeof EXPENSE_CATEGORIES[number])
      ? defaultCategory
      : "",
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [burdenSide, setBurdenSide] = useState<BurdenSide>("shared");

  // 수입 전용
  const [incomeType, setIncomeType] = useState<string>(INCOME_TYPES[0]);
  const [customIncomeType, setCustomIncomeType] = useState("");

  // 편집 시 초기값
  useEffect(() => {
    if (mode === "expense" && expense) {
      setCategory(
        EXPENSE_CATEGORIES.includes(expense.category as typeof EXPENSE_CATEGORIES[number])
          ? expense.category
          : "기타",
      );
      if (!EXPENSE_CATEGORIES.includes(expense.category as typeof EXPENSE_CATEGORIES[number])) {
        setCustomCategory(expense.category);
      }
      setDescription(expense.description);
      setAmount(expense.amount.toLocaleString());
      setPaymentMethod(expense.paymentMethod);
      setBurdenSide(expense.burdenSide);
      setDate(expense.date);
      setMemo(expense.memo);
    }
    if (mode === "income" && income) {
      setIncomeType(
        INCOME_TYPES.includes(income.type as typeof INCOME_TYPES[number])
          ? income.type
          : "기타",
      );
      if (!INCOME_TYPES.includes(income.type as typeof INCOME_TYPES[number])) {
        setCustomIncomeType(income.type);
      }
      setDescription(income.description);
      setAmount(income.amount.toLocaleString());
      setDate(income.date);
      setMemo(income.memo);
    }
  }, [mode, expense, income]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const parsedAmount = parseInt(amount.replace(/,/g, "")) || 0;
    if (parsedAmount <= 0) return;

    if (mode === "expense") {
      const resolvedCategory =
        category === "기타" && customCategory.trim()
          ? customCategory.trim()
          : category;
      onSaveExpense({
        category: resolvedCategory,
        description: description.trim(),
        amount: parsedAmount,
        paymentMethod,
        burdenSide,
        date,
        memo: memo.trim(),
      });
    } else {
      const resolvedType =
        incomeType === "기타" && customIncomeType.trim()
          ? customIncomeType.trim()
          : incomeType;
      onSaveIncome({
        type: resolvedType,
        description: description.trim(),
        amount: parsedAmount,
        date,
        memo: memo.trim(),
      });
    }
    onClose();
  };

  const handleAmountChange = (val: string) => {
    const digits = val.replace(/[^0-9]/g, "");
    if (!digits) {
      setAmount("");
      return;
    }
    setAmount(parseInt(digits).toLocaleString());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          {/* 헤더 */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">
              {isEditing ? "수정" : mode === "expense" ? "지출 추가" : "수입 추가"}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="px-6 py-5 space-y-4">
            {/* 카테고리/구분 */}
            {mode === "expense" ? (
              <Field label="카테고리">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-400"
                >
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                {category === "기타" && (
                  <input
                    type="text"
                    placeholder="카테고리 직접 입력"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="mt-2 w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-400"
                  />
                )}
              </Field>
            ) : (
              <Field label="구분">
                <select
                  value={incomeType}
                  onChange={(e) => setIncomeType(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-400"
                >
                  {INCOME_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                {incomeType === "기타" && (
                  <input
                    type="text"
                    placeholder="구분 직접 입력"
                    value={customIncomeType}
                    onChange={(e) => setCustomIncomeType(e.target.value)}
                    className="mt-2 w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-400"
                  />
                )}
              </Field>
            )}

            {/* 내용 */}
            <Field label="내용">
              <input
                type="text"
                placeholder={mode === "expense" ? "예: 계약금, 1차 촬영" : "예: 신랑 부모 지원, 적금 만기"}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-400"
              />
            </Field>

            {/* 금액 */}
            <Field label="금액">
              <div className="relative">
                <input
                  type="text"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  required
                  className="w-full px-3 py-2 pr-8 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-400 tabular-nums"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">원</span>
              </div>
            </Field>

            {/* 지출 전용: 결제수단 + 부담측 */}
            {mode === "expense" && (
              <>
                <Field label="결제 수단">
                  <div className="flex gap-2">
                    {(Object.entries(PAYMENT_METHOD_LABELS) as [PaymentMethod, string][]).map(
                      ([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setPaymentMethod(value)}
                          className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg border transition-all ${
                            paymentMethod === value
                              ? "bg-gray-900 text-white border-gray-900"
                              : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          {label}
                        </button>
                      ),
                    )}
                  </div>
                </Field>

                <Field label="부담 측">
                  <div className="flex gap-2">
                    {(Object.entries(BURDEN_SIDE_LABELS) as [BurdenSide, string][]).map(
                      ([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setBurdenSide(value)}
                          className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg border transition-all ${
                            burdenSide === value
                              ? "bg-gray-900 text-white border-gray-900"
                              : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          {label}
                        </button>
                      ),
                    )}
                  </div>
                </Field>
              </>
            )}

            {/* 날짜 */}
            <Field label="날짜">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-400"
              />
            </Field>

            {/* 메모 */}
            <Field label="메모">
              <input
                type="text"
                placeholder="선택 사항"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-400"
              />
            </Field>
          </div>

          {/* 하단 버튼 */}
          <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-[2] px-4 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
            >
              {isEditing ? "수정" : "추가"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}
