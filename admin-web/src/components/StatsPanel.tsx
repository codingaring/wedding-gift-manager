import { useState } from "react";
import { useGuestStats } from "../store/guestStore";

function fmt(n: number): string {
  return n.toLocaleString("ko-KR");
}

export default function StatsPanel() {
  const stats = useGuestStats();
  const [showRelation, setShowRelation] = useState(false);

  if (stats.totalCount === 0) return null;

  const relationEntries = Object.entries(stats.byRelation).sort(
    (a, b) => b[1].amount - a[1].amount,
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="전체"
          count={stats.totalCount}
          amount={stats.totalAmount}
          color="blue"
        />
        <StatCard
          label="신랑 측"
          count={stats.groomCount}
          amount={stats.groomAmount}
          color="sky"
        />
        <StatCard
          label="신부 측"
          count={stats.brideCount}
          amount={stats.brideAmount}
          color="pink"
        />
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-500">총 금액</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {fmt(stats.totalAmount)}원
          </div>
        </div>
      </div>

      {relationEntries.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <button
            onClick={() => setShowRelation(!showRelation)}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            <span
              className={`transition-transform ${showRelation ? "rotate-90" : ""}`}
            >
              &#9654;
            </span>
            관계별 통계
          </button>
          {showRelation && (
            <div className="mt-3 space-y-2">
              {relationEntries.map(([rel, data]) => (
                <div
                  key={rel}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-gray-700 w-20">
                      {rel || "미지정"}
                    </span>
                    <span className="text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full text-xs">
                      {data.count}건
                    </span>
                  </div>
                  <span className="font-semibold text-gray-900">
                    {fmt(data.amount)}원
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  count,
  amount,
  color,
}: {
  label: string;
  count: number;
  amount: number;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 border-blue-200",
    sky: "bg-sky-50 border-sky-200",
    pink: "bg-pink-50 border-pink-200",
  };

  return (
    <div
      className={`rounded-xl shadow-sm border p-4 ${colorMap[color] ?? "bg-white border-gray-200"}`}
    >
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-xl font-bold text-gray-900 mt-1">{count}건</div>
      <div className="text-sm text-gray-600 mt-0.5">{fmt(amount)}원</div>
    </div>
  );
}
