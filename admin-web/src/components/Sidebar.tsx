import { useGuestStats } from "../store/guestStore";

function fmt(n: number): string {
  return n.toLocaleString("ko-KR");
}

export default function Sidebar() {
  const stats = useGuestStats();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-60 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-base">
            💒
          </div>
          <div>
            <div className="font-semibold text-sm text-gray-900">축의금 관리자</div>
            <div className="text-[11px] text-gray-400">Wedding Gift Manager</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3">
        <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-900">
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          대시보드
        </button>
      </nav>

      {/* Summary */}
      {stats.totalCount > 0 && (
        <div className="px-4 py-4 border-t border-gray-100 space-y-3">
          <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
            요약
          </div>
          <div className="space-y-2.5">
            <SidebarStat label="전체" count={stats.totalCount} amount={stats.totalAmount} />
            <SidebarStat label="신랑 측" count={stats.groomCount} amount={stats.groomAmount} color="sky" />
            <SidebarStat label="신부 측" count={stats.brideCount} amount={stats.brideAmount} color="pink" />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-5 py-3 border-t border-gray-100">
        <div className="text-[11px] text-gray-400">
          데이터는 브라우저에 저장됩니다
        </div>
      </div>
    </aside>
  );
}

function SidebarStat({
  label,
  count,
  amount,
  color,
}: {
  label: string;
  count: number;
  amount: number;
  color?: string;
}) {
  const dotColor =
    color === "sky"
      ? "bg-sky-400"
      : color === "pink"
        ? "bg-pink-400"
        : "bg-gray-400";

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <div className="text-right">
        <span className="text-xs font-medium text-gray-700">{count}건</span>
        <span className="text-[11px] text-gray-400 ml-1">{fmt(amount)}원</span>
      </div>
    </div>
  );
}
