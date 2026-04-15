import { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useGuestStats, useMealTicketStats } from "../store/guestStore";
import { useBudgetStore, useBudgetStats } from "../store/budgetStore";
import { PAYMENT_METHOD_LABELS, BURDEN_SIDE_LABELS } from "../types/budget";
import type { Expense, Income } from "../types/budget";
import BudgetFormModal from "./BudgetFormModal";

function fmt(n: number): string {
  return n.toLocaleString("ko-KR");
}

const PIE_COLORS = [
  "#18181b", "#3f3f46", "#71717a", "#a1a1aa",
  "#d4d4d8", "#38bdf8", "#f472b6", "#10b981", "#f59e0b",
];

type Tab = "expense" | "income";
type ModalState =
  | { open: false }
  | { open: true; mode: "expense"; editing: Expense | null; defaultCategory?: string }
  | { open: true; mode: "income"; editing: Income | null };

export default function BudgetPage() {
  const guestStats = useGuestStats();
  const mealStats = useMealTicketStats();
  const stats = useBudgetStats(guestStats.totalAmount);
  const { expenses, incomes, addExpense, updateExpense, deleteExpense, addIncome, updateIncome, deleteIncome } =
    useBudgetStore();

  const [tab, setTab] = useState<Tab>("expense");
  const [modal, setModal] = useState<ModalState>({ open: false });

  // 차트 데이터
  const categoryData = Object.entries(stats.byCategory)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));

  const paymentData = Object.entries(stats.byPayment)
    .map(([key, value]) => ({
      name: PAYMENT_METHOD_LABELS[key as keyof typeof PAYMENT_METHOD_LABELS] || key,
      value,
    }));

  return (
    <div className="space-y-6">
      {/* 요약 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="총 수입"
          value={`${fmt(stats.totalIncomeWithGift)}원`}
          sub={`축의금 ${fmt(stats.giftTotal)}원 포함`}
          accent="emerald"
        />
        <MetricCard
          label="총 지출"
          value={`${fmt(stats.totalExpense)}원`}
          sub={`${expenses.length}건`}
          accent="red"
        />
        <MetricCard
          label="잔액"
          value={`${stats.balance >= 0 ? "+" : ""}${fmt(stats.balance)}원`}
          accent={stats.balance >= 0 ? "emerald" : "red"}
        />
        <MetricCard
          label="축의금"
          value={`${fmt(stats.giftTotal)}원`}
          sub={`${guestStats.totalCount}건`}
          accent="blue"
        />
      </div>

      {/* 식권 정산 */}
      {mealStats.totalTickets > 0 && (
        <MealTicketSection
          mealStats={mealStats}
          mealExpense={stats.byCategory["식대 (피로연)"] || 0}
        />
      )}

      {/* 탭 + 추가 버튼 */}
      <div className="flex items-center justify-between">
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          <TabButton
            label="지출"
            count={expenses.length}
            isActive={tab === "expense"}
            onClick={() => setTab("expense")}
          />
          <TabButton
            label="수입"
            count={incomes.length}
            isActive={tab === "income"}
            onClick={() => setTab("income")}
          />
        </div>
        <button
          onClick={() =>
            setModal({
              open: true,
              mode: tab,
              editing: null,
            } as ModalState)
          }
          className="px-3.5 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
        >
          + {tab === "expense" ? "지출" : "수입"} 추가
        </button>
      </div>

      {/* 테이블 */}
      {tab === "expense" ? (
        <ExpenseTable
          expenses={expenses}
          onEdit={(e) => setModal({ open: true, mode: "expense", editing: e })}
          onDelete={(id) => {
            if (confirm("삭제하시겠습니까?")) deleteExpense(id);
          }}
          onAddToCategory={(cat) =>
            setModal({ open: true, mode: "expense", editing: null, defaultCategory: cat })
          }
        />
      ) : (
        <IncomeTable
          incomes={incomes}
          giftTotal={stats.giftTotal}
          giftCount={guestStats.totalCount}
          onEdit={(i) => setModal({ open: true, mode: "income", editing: i })}
          onDelete={(id) => {
            if (confirm("삭제하시겠습니까?")) deleteIncome(id);
          }}
        />
      )}

      {/* 차트 영역 */}
      {expenses.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 카테고리별 지출 도넛 */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              카테고리별 지출
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => `${fmt(Number(value))}원`}
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #e4e4e7",
                    fontSize: 13,
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* 결제수단별 */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              결제수단별 지출
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart
                data={paymentData}
                margin={{ left: -10, right: 16, top: 0, bottom: 0 }}
              >
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: "#71717a" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#a1a1aa" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) =>
                    v >= 10000 ? `${v / 10000}만` : `${v}`
                  }
                />
                <Tooltip
                  formatter={(value) => `${fmt(Number(value))}원`}
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #e4e4e7",
                    fontSize: 13,
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
                  }}
                />
                <Bar dataKey="value" fill="#18181b" radius={[4, 4, 0, 0]} barSize={48} name="금액" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 모달 */}
      {modal.open && (
        <BudgetFormModal
          mode={modal.mode}
          expense={modal.mode === "expense" ? modal.editing as Expense | null : null}
          income={modal.mode === "income" ? modal.editing as Income | null : null}
          defaultCategory={modal.mode === "expense" ? modal.defaultCategory : undefined}
          onClose={() => setModal({ open: false })}
          onSaveExpense={(data) => {
            if (modal.mode === "expense" && modal.editing) {
              updateExpense(modal.editing.id, data);
            } else {
              addExpense(data);
            }
          }}
          onSaveIncome={(data) => {
            if (modal.mode === "income" && modal.editing) {
              updateIncome(modal.editing.id, data);
            } else {
              addIncome(data);
            }
          }}
        />
      )}
    </div>
  );
}

// ─── 하위 컴포넌트 ───

function MetricCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent: string;
}) {
  const colorMap: Record<string, string> = {
    emerald: "text-emerald-600",
    red: "text-red-500",
    blue: "text-sky-500",
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
        {label}
      </div>
      <div className={`text-2xl font-bold tabular-nums ${colorMap[accent] || "text-gray-900"}`}>
        {value}
      </div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

function TabButton({
  label,
  count,
  isActive,
  onClick,
}: {
  label: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
        isActive
          ? "bg-white text-gray-900 shadow-sm"
          : "text-gray-500 hover:text-gray-700"
      }`}
    >
      {label}
      <span className={`ml-1.5 px-1.5 py-0.5 text-[10px] rounded ${isActive ? "bg-gray-100" : "bg-gray-200/60"}`}>
        {count}
      </span>
    </button>
  );
}

function ExpenseTable({
  expenses,
  onEdit,
  onDelete,
  onAddToCategory,
}: {
  expenses: Expense[];
  onEdit: (e: Expense) => void;
  onDelete: (id: string) => void;
  onAddToCategory: (category: string) => void;
}) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  if (expenses.length === 0) {
    return (
      <EmptyState
        message="아직 지출 내역이 없습니다"
        sub="+ 지출 추가 버튼으로 시작하세요"
      />
    );
  }

  // 카테고리별 그룹핑
  const grouped: Record<string, Expense[]> = {};
  for (const e of expenses) {
    if (!grouped[e.category]) grouped[e.category] = [];
    grouped[e.category].push(e);
  }

  // 카테고리를 합계 금액 기준 내림차순
  const categories = Object.entries(grouped)
    .map(([cat, items]) => ({
      category: cat,
      items: items.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
      total: items.reduce((sum, e) => sum + e.amount, 0),
    }))
    .sort((a, b) => b.total - a.total);

  const toggle = (cat: string) =>
    setCollapsed((prev) => ({ ...prev, [cat]: !prev[cat] }));

  return (
    <div className="space-y-3">
      {categories.map(({ category, items, total }) => {
        const isCollapsed = collapsed[category];
        return (
          <div
            key={category}
            className="bg-white rounded-xl border border-gray-200 overflow-hidden"
          >
            {/* 카테고리 헤더 */}
            <button
              onClick={() => toggle(category)}
              className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/50 transition-colors"
            >
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${isCollapsed ? "" : "rotate-90"}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
              <span className="text-sm font-semibold text-gray-900">
                {category}
              </span>
              <span className="text-xs text-gray-400">
                {items.length}건
              </span>
              <span className="ml-auto text-sm font-bold text-gray-900 tabular-nums">
                {fmt(total)}원
              </span>
            </button>

            {/* 하위 항목 */}
            {!isCollapsed && (
              <>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-t border-b border-gray-100 bg-gray-50/50">
                      <Th>내용</Th>
                      <Th align="right">금액</Th>
                      <Th>결제</Th>
                      <Th>부담</Th>
                      <Th>날짜</Th>
                      <Th>메모</Th>
                      <Th />
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((e) => (
                      <tr
                        key={e.id}
                        className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer"
                        onClick={() => onEdit(e)}
                      >
                        <td className="py-3 px-4 font-medium text-gray-800">
                          {e.description || "-"}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-gray-900 tabular-nums">
                          {fmt(e.amount)}원
                        </td>
                        <td className="py-3 px-4 text-gray-500">
                          {PAYMENT_METHOD_LABELS[e.paymentMethod]}
                        </td>
                        <td className="py-3 px-4 text-gray-500">
                          {BURDEN_SIDE_LABELS[e.burdenSide]}
                        </td>
                        <td className="py-3 px-4 text-gray-400 tabular-nums">
                          {new Date(e.date).toLocaleDateString("ko-KR")}
                        </td>
                        <td className="py-3 px-4 text-gray-400 truncate max-w-[120px]">
                          {e.memo || "-"}
                        </td>
                        <td className="py-3 px-2">
                          <button
                            onClick={(ev) => {
                              ev.stopPropagation();
                              onDelete(e.id);
                            }}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {/* 하위 항목 추가 버튼 */}
                <button
                  onClick={() => onAddToCategory(category)}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50 border-t border-gray-100 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
                  </svg>
                  {category}에 항목 추가
                </button>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

function IncomeTable({
  incomes,
  giftTotal,
  giftCount,
  onEdit,
  onDelete,
}: {
  incomes: Income[];
  giftTotal: number;
  giftCount: number;
  onEdit: (i: Income) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      {/* 축의금 자동 합산 행 */}
      {giftTotal > 0 && (
        <div className="bg-sky-50 rounded-xl border border-sky-200 px-5 py-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-sky-600 uppercase tracking-wider">
              축의금 합계 (자동)
            </div>
            <div className="text-sm text-sky-700 mt-0.5">
              대시보드 데이터에서 자동 합산됩니다
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-sky-700 tabular-nums">
              {fmt(giftTotal)}원
            </div>
            <div className="text-xs text-sky-500">{giftCount}건</div>
          </div>
        </div>
      )}

      {incomes.length === 0 ? (
        <EmptyState
          message="추가 수입 내역이 없습니다"
          sub="양가 지원금, 현물 지원 등을 추가하세요"
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <Th>구분</Th>
                <Th>내용</Th>
                <Th align="right">금액</Th>
                <Th>날짜</Th>
                <Th>메모</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {incomes.map((i) => (
                <tr
                  key={i.id}
                  className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer"
                  onClick={() => onEdit(i)}
                >
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 text-xs bg-emerald-50 text-emerald-700 rounded-md">
                      {i.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-800">
                    {i.description || "-"}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-emerald-600 tabular-nums">
                    +{fmt(i.amount)}원
                  </td>
                  <td className="py-3 px-4 text-gray-400 tabular-nums">
                    {new Date(i.date).toLocaleDateString("ko-KR")}
                  </td>
                  <td className="py-3 px-4 text-gray-400 truncate max-w-[120px]">
                    {i.memo || "-"}
                  </td>
                  <td className="py-3 px-2">
                    <button
                      onClick={(ev) => {
                        ev.stopPropagation();
                        onDelete(i.id);
                      }}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Th({
  children,
  align,
}: {
  children?: React.ReactNode;
  align?: "right";
}) {
  return (
    <th
      className={`py-2.5 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

function MealTicketSection({
  mealStats,
  mealExpense,
}: {
  mealStats: { totalTickets: number; groomTickets: number; brideTickets: number; guestsWithTickets: number };
  mealExpense: number;
}) {
  const unitPriceKey = "wedding-meal-unit-price";
  const extraTicketsKey = "wedding-meal-extra-tickets";
  const [unitPrice, setUnitPrice] = useState<string>(() =>
    localStorage.getItem(unitPriceKey) || "",
  );
  const [extraTickets, setExtraTickets] = useState<string>(() =>
    localStorage.getItem(extraTicketsKey) || "",
  );
  const [isOpen, setIsOpen] = useState(true);

  const parsedUnit = parseInt(unitPrice.replace(/,/g, "")) || 0;
  const parsedExtra = parseInt(extraTickets) || 0;
  const adjustedTotal = mealStats.totalTickets + parsedExtra;
  const expectedCost = adjustedTotal * parsedUnit;
  const diff = mealExpense - expectedCost;

  const handleUnitChange = (val: string) => {
    const digits = val.replace(/[^0-9]/g, "");
    if (!digits) {
      setUnitPrice("");
      localStorage.removeItem(unitPriceKey);
      return;
    }
    const formatted = parseInt(digits).toLocaleString();
    setUnitPrice(formatted);
    localStorage.setItem(unitPriceKey, formatted);
  };

  const handleExtraChange = (val: string) => {
    // 음수도 허용 (식권 회수 등)
    const cleaned = val.replace(/[^0-9-]/g, "");
    setExtraTickets(cleaned);
    if (cleaned) {
      localStorage.setItem(extraTicketsKey, cleaned);
    } else {
      localStorage.removeItem(extraTicketsKey);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-5 py-4 hover:bg-gray-50/50 transition-colors"
      >
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${isOpen ? "rotate-90" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-sm font-semibold text-gray-900">🎫 식권 정산</span>
        <span className="text-xs text-gray-400">
          총 {mealStats.totalTickets}장 발행
        </span>
      </button>

      {isOpen && (
        <div className="px-5 pb-5 space-y-4 border-t border-gray-100 pt-4">
          {/* 식권 현황 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <MiniStat label="총 발행" value={`${mealStats.totalTickets}장`} />
            <MiniStat label="신랑 측" value={`${mealStats.groomTickets}장`} />
            <MiniStat label="신부 측" value={`${mealStats.brideTickets}장`} />
            <MiniStat label="식권 받은 하객" value={`${mealStats.guestsWithTickets}명`} />
          </div>

          {/* 식권 수 조정 + 1인당 식대 입력 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                추가/조정 식권
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="0"
                  value={extraTickets}
                  onChange={(e) => handleExtraChange(e.target.value)}
                  className="w-full px-3 py-2 pr-8 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-400 tabular-nums"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">장</span>
              </div>
              <div className="text-[11px] text-gray-400 mt-1">
                스탭/가족 등 추가분 (음수로 회수)
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                1인당 식대 단가
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="예: 40,000"
                  value={unitPrice}
                  onChange={(e) => handleUnitChange(e.target.value)}
                  className="w-full px-3 py-2 pr-8 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-400 tabular-nums"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">원</span>
              </div>
            </div>
            <div className="flex flex-col justify-end text-right">
              <div className="text-xs text-gray-400 mb-1">예상 식대</div>
              <div className="text-lg font-bold text-gray-900 tabular-nums">
                {parsedUnit > 0 ? `${fmt(expectedCost)}원` : "-"}
              </div>
              <div className="text-[11px] text-gray-400">
                {adjustedTotal}장{parsedExtra !== 0 ? ` (${mealStats.totalTickets}${parsedExtra >= 0 ? "+" : ""}${parsedExtra})` : ""} × {parsedUnit > 0 ? `${fmt(parsedUnit)}원` : "?"}
              </div>
            </div>
          </div>

          {/* 비교 */}
          {parsedUnit > 0 && mealExpense > 0 && (
            <div className="grid grid-cols-3 gap-3 p-4 bg-gray-50 rounded-lg">
              <div>
                <div className="text-xs text-gray-400 mb-0.5">실제 식대 지출</div>
                <div className="text-sm font-semibold text-gray-900 tabular-nums">
                  {fmt(mealExpense)}원
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-0.5">예상 식대</div>
                <div className="text-sm font-semibold text-gray-900 tabular-nums">
                  {fmt(expectedCost)}원
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-0.5">차이</div>
                <div className={`text-sm font-bold tabular-nums ${diff > 0 ? "text-red-500" : diff < 0 ? "text-emerald-600" : "text-gray-900"}`}>
                  {diff > 0 ? "+" : ""}{fmt(diff)}원
                </div>
                <div className="text-[11px] text-gray-400">
                  {diff > 0 ? "초과 지출" : diff < 0 ? "절감" : "정확히 일치"}
                </div>
              </div>
            </div>
          )}

          {parsedUnit > 0 && mealExpense === 0 && (
            <div className="text-xs text-gray-400 text-center py-2">
              가계부에 "식대 (피로연)" 카테고리로 지출을 추가하면 비교 결과가 표시됩니다
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-lg border border-gray-100 px-3 py-2.5">
      <div className="text-[11px] text-gray-400">{label}</div>
      <div className="text-sm font-semibold text-gray-900 tabular-nums mt-0.5">{value}</div>
    </div>
  );
}

function EmptyState({ message, sub }: { message: string; sub: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
      <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </div>
      <p className="text-sm font-medium text-gray-700">{message}</p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  );
}
