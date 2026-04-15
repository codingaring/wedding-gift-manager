import { useMemo } from "react";
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
import { useGuestStore } from "../store/guestStore";

function fmt(n: number): string {
  return n.toLocaleString("ko-KR");
}

const SIDE_COLORS = { sky: "#38bdf8", pink: "#f472b6" };
const CHART_COLORS = [
  "#18181b",
  "#3f3f46",
  "#71717a",
  "#a1a1aa",
  "#d4d4d8",
  "#e4e4e7",
];

export default function StatsPage() {
  const guests = useGuestStore((s) => s.guests);

  const stats = useMemo(() => {
    let groomCount = 0,
      groomAmount = 0,
      brideCount = 0,
      brideAmount = 0,
      totalMealTickets = 0;

    const byRelation: Record<string, { count: number; amount: number }> = {};
    const bySide: Record<
      string,
      Record<string, { count: number; amount: number }>
    > = { groom: {}, bride: {} };
    const amountBuckets: Record<string, number> = {};

    for (const g of guests) {
      if (g.side === "groom") {
        groomCount++;
        groomAmount += g.amount;
      } else {
        brideCount++;
        brideAmount += g.amount;
      }

      totalMealTickets += g.mealTickets || 0;

      const rel = g.relation || "미지정";
      if (!byRelation[rel]) byRelation[rel] = { count: 0, amount: 0 };
      byRelation[rel].count++;
      byRelation[rel].amount += g.amount;

      if (!bySide[g.side][rel])
        bySide[g.side][rel] = { count: 0, amount: 0 };
      bySide[g.side][rel].count++;
      bySide[g.side][rel].amount += g.amount;

      const bucket = getAmountBucket(g.amount);
      amountBuckets[bucket] = (amountBuckets[bucket] || 0) + 1;
    }

    const totalCount = guests.length;
    const totalAmount = groomAmount + brideAmount;
    const avgAmount = totalCount > 0 ? Math.round(totalAmount / totalCount) : 0;

    const sorted = [...guests].sort((a, b) => b.amount - a.amount);
    const highest = sorted[0] || null;
    const lowest = sorted.length > 0 ? sorted[sorted.length - 1] : null;

    const bucketOrder = [
      "1만원 이하",
      "3만원",
      "5만원",
      "10만원",
      "15만원",
      "20만원",
      "25만원",
      "30만원",
      "30만원 초과",
    ];
    const sortedBuckets = bucketOrder
      .filter((b) => amountBuckets[b])
      .map((b) => ({ name: b, count: amountBuckets[b] }));

    return {
      totalCount,
      totalAmount,
      avgAmount,
      groomCount,
      groomAmount,
      brideCount,
      brideAmount,
      totalMealTickets,
      byRelation,
      bySide,
      sortedBuckets,
      highest,
      lowest,
    };
  }, [guests]);

  if (stats.totalCount === 0) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-7 h-7 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-900">데이터가 없습니다</p>
          <p className="text-xs text-gray-400 mt-1">
            대시보드에서 CSV를 업로드하면 통계를 볼 수 있어요
          </p>
        </div>
      </div>
    );
  }

  // 차트 데이터
  const sideData = [
    { name: "신랑 측", value: stats.groomAmount, count: stats.groomCount },
    { name: "신부 측", value: stats.brideAmount, count: stats.brideCount },
  ];

  const relationData = Object.entries(stats.byRelation)
    .sort((a, b) => b[1].amount - a[1].amount)
    .map(([rel, data]) => ({
      name: rel,
      금액: data.amount,
      건수: data.count,
    }));

  const groomRelData = Object.entries(stats.bySide.groom)
    .sort((a, b) => b[1].amount - a[1].amount)
    .map(([rel, data]) => ({ name: rel, count: data.count, amount: data.amount }));
  const brideRelData = Object.entries(stats.bySide.bride)
    .sort((a, b) => b[1].amount - a[1].amount)
    .map(([rel, data]) => ({ name: rel, count: data.count, amount: data.amount }));

  return (
    <div className="space-y-6">
      {/* 핵심 지표 */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard label="총 건수" value={`${stats.totalCount}건`} />
        <MetricCard label="총 금액" value={`${fmt(stats.totalAmount)}원`} />
        <MetricCard label="평균 금액" value={`${fmt(stats.avgAmount)}원`} />
        <MetricCard label="총 식권" value={`${stats.totalMealTickets}장`} />
        <MetricCard
          label="최고 금액"
          value={stats.highest ? `${fmt(stats.highest.amount)}원` : "-"}
          sub={stats.highest?.name}
        />
      </div>

      {/* 신랑/신부 비교 (파이 + 카드) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            측별 금액 비율
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={sideData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                <Cell fill={SIDE_COLORS.sky} />
                <Cell fill={SIDE_COLORS.pink} />
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

        <SideDetailCard
          label="신랑 측"
          count={stats.groomCount}
          amount={stats.groomAmount}
          total={stats.totalAmount}
          color="sky"
          relations={groomRelData}
        />
        <SideDetailCard
          label="신부 측"
          count={stats.brideCount}
          amount={stats.brideAmount}
          total={stats.totalAmount}
          color="pink"
          relations={brideRelData}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 관계별 금액 차트 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            관계별 금액
          </h3>
          <ResponsiveContainer width="100%" height={relationData.length * 44 + 30}>
            <BarChart
              data={relationData}
              layout="vertical"
              margin={{ left: 0, right: 16, top: 0, bottom: 0 }}
            >
              <XAxis
                type="number"
                tickFormatter={(v: number) =>
                  v >= 10000 ? `${v / 10000}만` : `${v}`
                }
                tick={{ fontSize: 11, fill: "#a1a1aa" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={60}
                tick={{ fontSize: 12, fill: "#3f3f46" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(value, name) =>
                  name === "금액" ? `${fmt(Number(value))}원` : `${value}건`
                }
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid #e4e4e7",
                  fontSize: 13,
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
                }}
              />
              <Bar dataKey="금액" fill="#18181b" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 금액 분포 차트 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            금액 분포
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={stats.sortedBuckets}
              margin={{ left: -10, right: 16, top: 0, bottom: 0 }}
            >
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "#a1a1aa" }}
                axisLine={false}
                tickLine={false}
                interval={0}
                angle={-30}
                textAnchor="end"
                height={50}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#a1a1aa" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(value) => `${value}건`}
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid #e4e4e7",
                  fontSize: 13,
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
                }}
              />
              <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} barSize={32} name="건수" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 관계별 상세 테이블 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">
          관계별 상세
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2.5 px-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  관계
                </th>
                <th className="text-right py-2.5 px-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  건수
                </th>
                <th className="text-right py-2.5 px-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  총 금액
                </th>
                <th className="text-right py-2.5 px-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  평균 금액
                </th>
                <th className="text-right py-2.5 px-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  비율
                </th>
                <th className="py-2.5 px-3 text-xs font-medium text-gray-400 uppercase tracking-wider w-40">
                </th>
              </tr>
            </thead>
            <tbody>
              {relationData.map((r, i) => {
                const pct = Math.round(
                  (r.금액 / stats.totalAmount) * 100,
                );
                const avg = r.건수 > 0 ? Math.round(r.금액 / r.건수) : 0;
                return (
                  <tr
                    key={r.name}
                    className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="py-3 px-3 font-medium text-gray-800">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-sm"
                          style={{
                            backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                          }}
                        />
                        {r.name}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right text-gray-600 tabular-nums">
                      {r.건수}건
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-gray-900 tabular-nums">
                      {fmt(r.금액)}원
                    </td>
                    <td className="py-3 px-3 text-right text-gray-600 tabular-nums">
                      {fmt(avg)}원
                    </td>
                    <td className="py-3 px-3 text-right text-gray-500 tabular-nums">
                      {pct}%
                    </td>
                    <td className="py-3 px-3">
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${pct}%`,
                            backgroundColor:
                              CHART_COLORS[i % CHART_COLORS.length],
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 최고/최저 */}
      <div className="grid grid-cols-2 gap-4">
        {stats.highest && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
              최고 금액
            </div>
            <div className="text-xl font-bold text-gray-900 tabular-nums">
              {fmt(stats.highest.amount)}원
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {stats.highest.name}
              {stats.highest.relation && (
                <span className="text-gray-400">
                  {" "}
                  · {stats.highest.relation}
                </span>
              )}
            </div>
          </div>
        )}
        {stats.lowest && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
              최저 금액
            </div>
            <div className="text-xl font-bold text-gray-900 tabular-nums">
              {fmt(stats.lowest.amount)}원
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {stats.lowest.name}
              {stats.lowest.relation && (
                <span className="text-gray-400">
                  {" "}
                  · {stats.lowest.relation}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 하위 컴포넌트 ───

function MetricCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
        {label}
      </div>
      <div className="text-2xl font-bold text-gray-900 tabular-nums">
        {value}
      </div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

function SideDetailCard({
  label,
  count,
  amount,
  total,
  color,
  relations,
}: {
  label: string;
  count: number;
  amount: number;
  total: number;
  color: "sky" | "pink";
  relations: { name: string; count: number; amount: number }[];
}) {
  const pct = total > 0 ? Math.round((amount / total) * 100) : 0;
  const dotColor = color === "sky" ? "bg-sky-400" : "bg-pink-400";
  const barColor = color === "sky" ? "bg-sky-400" : "bg-pink-400";

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-2 h-2 rounded-full ${dotColor}`} />
        <span className="text-sm font-semibold text-gray-900">{label}</span>
        <span className="text-xs text-gray-400 ml-auto">{pct}%</span>
      </div>
      <div className="text-xl font-bold text-gray-900 tabular-nums">
        {fmt(amount)}원
      </div>
      <div className="text-xs text-gray-400 mt-0.5">{count}건</div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-3">
        <div
          className={`h-full ${barColor} rounded-full transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {relations.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-100 space-y-2">
          {relations.map((r) => (
            <div key={r.name} className="flex items-center justify-between">
              <span className="text-xs text-gray-500">{r.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">{r.count}건</span>
                <span className="text-xs font-medium text-gray-700 tabular-nums">
                  {fmt(r.amount)}원
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── 유틸 ───

function getAmountBucket(amount: number): string {
  if (amount <= 10000) return "1만원 이하";
  if (amount <= 30000) return "3만원";
  if (amount <= 50000) return "5만원";
  if (amount <= 100000) return "10만원";
  if (amount <= 150000) return "15만원";
  if (amount <= 200000) return "20만원";
  if (amount <= 250000) return "25만원";
  if (amount <= 300000) return "30만원";
  return "30만원 초과";
}
