import { useGuestStore } from '../store/guestStore';
import { downloadCsv } from '../utils/csvExport';
import type { SideFilter } from '../types/guest';

interface ToolbarProps {
  onAdd: () => void;
}

const SIDE_OPTIONS: { value: SideFilter; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'groom', label: '신랑' },
  { value: 'bride', label: '신부' },
];

export default function Toolbar({ onAdd }: ToolbarProps) {
  const { sideFilter, searchQuery, setSideFilter, setSearchQuery, guests, clearAll } = useGuestStore();

  const handleClearAll = () => {
    if (window.confirm('모든 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      clearAll();
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Side filter */}
      <div className="flex rounded-lg border border-gray-300 overflow-hidden">
        {SIDE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setSideFilter(opt.value)}
            className={`px-3 py-1.5 text-sm font-medium transition-colors ${
              sideFilter === opt.value
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <input
          type="text"
          placeholder="이름 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            &#10005;
          </button>
        )}
      </div>

      {/* Actions */}
      <button
        onClick={onAdd}
        className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
      >
        + 추가
      </button>

      <button
        onClick={() => downloadCsv(guests)}
        disabled={guests.length === 0}
        className="px-4 py-1.5 bg-white border border-gray-300 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        CSV 다운로드
      </button>

      <button
        onClick={handleClearAll}
        disabled={guests.length === 0}
        className="px-4 py-1.5 bg-white border border-red-300 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        전체 삭제
      </button>
    </div>
  );
}
