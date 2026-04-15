import { useState } from "react";
import CsvUploader from "./components/CsvUploader";
import StatsPage from "./components/StatsPage";
import BudgetPage from "./components/BudgetPage";
import Toolbar from "./components/Toolbar";
import GuestTable from "./components/GuestTable";
import GuestFormModal from "./components/GuestFormModal";
import Sidebar, { type Page } from "./components/Sidebar";
import { useGuestStore } from "./store/guestStore";
import { downloadExcel } from "./utils/excelExport";
import type { Guest } from "./types/guest";

function App() {
  const guests = useGuestStore((s) => s.guests);
  const guestCount = guests.length;
  const [modalGuest, setModalGuest] = useState<Guest | null | undefined>(
    undefined,
  );
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");

  return (
    <div className="flex min-h-screen bg-[#fafafa]">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />

      <div className="flex-1 ml-60">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-100 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                {currentPage === "dashboard"
                  ? "Dashboard"
                  : currentPage === "stats"
                    ? "통계"
                    : "가계부"}
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">
                {currentPage === "dashboard"
                  ? guestCount > 0
                    ? `총 ${guestCount}건의 축의금 데이터`
                    : "CSV를 업로드하여 시작하세요"
                  : currentPage === "stats"
                    ? "축의금 데이터를 다양한 관점에서 분석합니다"
                    : "결혼 자금 수입과 지출을 관리합니다"}
              </p>
            </div>
            {currentPage === "dashboard" && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => downloadExcel(guests)}
                  disabled={guestCount === 0}
                  className="px-3.5 py-2 bg-white border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  엑셀 내보내기
                </button>
                <button
                  onClick={() => setModalGuest(null)}
                  className="px-3.5 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
                >
                  + 수납 추가
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="px-8 py-6 space-y-5">
          {currentPage === "dashboard" ? (
            <>
              <CsvUploader />
              <Toolbar onAdd={() => setModalGuest(null)} />
              <GuestTable onEdit={(guest) => setModalGuest(guest)} />
            </>
          ) : currentPage === "stats" ? (
            <StatsPage />
          ) : (
            <BudgetPage />
          )}
        </main>
      </div>

      {modalGuest !== undefined && (
        <GuestFormModal
          guest={modalGuest}
          onClose={() => setModalGuest(undefined)}
        />
      )}
    </div>
  );
}

export default App;
