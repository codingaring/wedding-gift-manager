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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="전체 건수"
          value={`${stats.totalCount}건`}
          sub={`${fmt(stats.totalAmount)}원`}
          accent="indigo"
        />
        <StatCard
          label="신랑 측"
          value={`${stats.groomCount}건`}
          sub={`${fmt(stats.groomAmount)}원`}
          accent="sky"
        />
        <StatCard
          label="신부 측"
          value={`${stats.brideCount}건`}
          sub={`${fmt(stats.brideAmount)}원`}
          accent="pink"
        />
        <StatCard
          label="총 금액"
          value={`${fmt(stats.totalAmount)}원`}
          sub={`평균 ${fmt(Math.round(stats.totalAmount / stats.totalCount))}원`}
          accent="emerald"
        />
      </div>

      {relationEntries.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm">
          <button
            onClick={() => setShowRelation(!showRelation)}
            className="w-full flex items-center justify-between px-5 py-3.5 text-sm font-medium text-gray-700 hover:bg-gray-50/50 rounded-xl transition-colors"
          >
            <span>관계별 통계</span>
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform ${showRelation ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          {showRelation && (
            <div className="px-5 pb-4 space-y-2.5 border-t border-gray-100">
              <div className="pt-3" />
              {relationEntries.map(([rel, data]) => {
                const pct = Math.round(
                  (data.amount / stats.totalAmount) * 100,
                );
                return (
                  <div key={rel} className="flex items-center gap-3 text-sm">
                    <span className="w-20 font-medium text-gray-700 truncate">
                      {rel || "미지정"}
                    </span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gray-400 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 w-8 text-right">
                      {pct}%
                    </span>
                    <span className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full">
                      {data.count}건
                    </span>
                    <span className="w-24 text-right font-semibold text-gray-800">
                      {fmt(data.amount)}원
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent: string;
}) {
  const accentMap: Record<string, { border: string; dot: string }> = {
    indigo: { border: "border-gray-200", dot: "bg-gray-800" },
    sky: { border: "border-gray-200", dot: "bg-sky-400" },
    pink: { border: "border-gray-200", dot: "bg-pink-400" },
    emerald: { border: "border-gray-200", dot: "bg-emerald-400" },
  };

  const a = accentMap[accent] ?? accentMap.indigo;

  return (
    <div className={`bg-white rounded-xl border ${a.border} shadow-sm p-5`}>
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-2 h-2 rounded-full ${a.dot}`} />
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
          {label}
        </span>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-400 mt-1">{sub}</div>
    </div>
  );
}
