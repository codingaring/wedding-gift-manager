import { useGuestStore } from "../store/guestStore";
import type { SideFilter } from "../types/guest";

interface ToolbarProps {
  onAdd: () => void;
}

const SIDE_OPTIONS: { value: SideFilter; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "groom", label: "신랑" },
  { value: "bride", label: "신부" },
];

export default function Toolbar({ onAdd: _onAdd }: ToolbarProps) {
  const { sideFilter, searchQuery, setSideFilter, setSearchQuery, guests, clearAll } =
    useGuestStore();

  if (guests.length === 0) return null;

  const handleClearAll = () => {
    if (
      window.confirm(
        "모든 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.",
      )
    ) {
      clearAll();
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        {/* Side filter */}
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          {SIDE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSideFilter(opt.value)}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-all ${
                sideFilter === opt.value
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="이름 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-400 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>

        <div className="ml-auto">
          <button
            onClick={handleClearAll}
            className="px-3 py-1.5 text-xs font-medium text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            전체 삭제
          </button>
        </div>
      </div>
    </div>
  );
}
