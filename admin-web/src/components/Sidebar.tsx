import { useGuestStats } from "../store/guestStore";
import { useAutoBackup } from "../hooks/useAutoBackup";

function fmt(n: number): string {
  return n.toLocaleString("ko-KR");
}

export type Page = "dashboard" | "stats" | "budget";

export default function Sidebar({
  currentPage,
  onNavigate,
}: {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}) {
  const stats = useGuestStats();
  const backup = useAutoBackup();

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
      <nav className="flex-1 px-3 py-3 space-y-1">
        <NavButton
          label="대시보드"
          isActive={currentPage === "dashboard"}
          onClick={() => onNavigate("dashboard")}
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          }
        />
        <NavButton
          label="통계"
          isActive={currentPage === "stats"}
          onClick={() => onNavigate("stats")}
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />
        <NavButton
          label="가계부"
          isActive={currentPage === "budget"}
          onClick={() => onNavigate("budget")}
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
            </svg>
          }
        />
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

      {/* Backup */}
      <div className="px-4 py-3 border-t border-gray-100 space-y-2">
        <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
          백업
        </div>

        {backup.supported ? (
          // File System Access API 지원
          <>
            {backup.isSetup ? (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${backup.saving ? "bg-yellow-400 animate-pulse" : backup.error ? "bg-red-400" : "bg-green-400"}`} />
                  <span className="text-[11px] text-gray-500">
                    {backup.saving
                      ? "저장 중..."
                      : backup.error
                        ? backup.error
                        : backup.lastSaved
                          ? `마지막 저장 ${backup.lastSaved}`
                          : "자동 저장 활성"}
                  </span>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={backup.restoreFromBackup}
                    className="flex-1 px-2 py-1 text-[11px] text-gray-500 bg-gray-50 hover:bg-gray-100 rounded transition-colors"
                  >
                    복원
                  </button>
                  <button
                    onClick={backup.setupBackup}
                    className="flex-1 px-2 py-1 text-[11px] text-gray-500 bg-gray-50 hover:bg-gray-100 rounded transition-colors"
                  >
                    위치 변경
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={backup.setupBackup}
                className="w-full px-3 py-2 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
              >
                📁 백업 위치 설정
              </button>
            )}
          </>
        ) : (
          // 폴백: 수동 다운로드/업로드
          <div className="flex gap-1.5">
            <button
              onClick={backup.manualDownload}
              className="flex-1 px-2 py-1.5 text-[11px] font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded transition-colors"
            >
              내보내기
            </button>
            <button
              onClick={backup.manualUpload}
              className="flex-1 px-2 py-1.5 text-[11px] font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded transition-colors"
            >
              가져오기
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-gray-100">
        <div className="text-[11px] text-gray-400">
          데이터는 브라우저에 저장됩니다
        </div>
      </div>
    </aside>
  );
}

function NavButton({
  label,
  isActive,
  onClick,
  icon,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        isActive
          ? "bg-gray-100 text-gray-900"
          : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
      }`}
    >
      <span className={isActive ? "text-gray-700" : "text-gray-400"}>
        {icon}
      </span>
      {label}
    </button>
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
