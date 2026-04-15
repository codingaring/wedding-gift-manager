import { useState } from "react";
import { useGuestStore, useRelationOptions } from "../store/guestStore";
import type { SideFilter } from "../types/guest";

interface ToolbarProps {
  onAdd: () => void;
}

const SIDE_OPTIONS: { value: SideFilter; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "groom", label: "신랑" },
  { value: "bride", label: "신부" },
];

const AMOUNT_PRESETS = [
  { label: "전체", min: null, max: null },
  { label: "~5만", min: null, max: 50000 },
  { label: "5~10만", min: 50000, max: 100000 },
  { label: "10~20만", min: 100000, max: 200000 },
  { label: "20~30만", min: 200000, max: 300000 },
  { label: "30만~", min: 300000, max: null },
] as const;

export default function Toolbar({ onAdd: _onAdd }: ToolbarProps) {
  const {
    sideFilter,
    searchQuery,
    relationFilter,
    amountRange,
    setSideFilter,
    setSearchQuery,
    setRelationFilter,
    setAmountRange,
    clearFilters,
    guests,
    clearAll,
  } = useGuestStore();

  const relationOptions = useRelationOptions();
  const [showAmountCustom, setShowAmountCustom] = useState(false);
  const [customMin, setCustomMin] = useState("");
  const [customMax, setCustomMax] = useState("");

  if (guests.length === 0) return null;

  const hasActiveFilters =
    sideFilter !== "all" ||
    relationFilter !== "all" ||
    amountRange.min !== null ||
    amountRange.max !== null;

  const isPresetActive = (preset: (typeof AMOUNT_PRESETS)[number]) =>
    amountRange.min === preset.min && amountRange.max === preset.max;

  const handleClearAll = () => {
    if (
      window.confirm(
        "모든 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.",
      )
    ) {
      clearAll();
    }
  };

  const applyCustomRange = () => {
    const min = customMin ? parseInt(customMin) * 10000 : null;
    const max = customMax ? parseInt(customMax) * 10000 : null;
    setAmountRange({ min, max });
    setShowAmountCustom(false);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm px-4 py-3 space-y-3">
      {/* Row 1: Side filter + Search + Actions */}
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

        {/* Relation filter */}
        {relationOptions.length > 0 && (
          <select
            value={relationFilter}
            onChange={(e) => setRelationFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-400 transition-colors cursor-pointer"
          >
            <option value="all">관계: 전체</option>
            {relationOptions.map((rel) => (
              <option key={rel} value={rel}>
                {rel}
              </option>
            ))}
          </select>
        )}

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
              <svg
                className="w-3.5 h-3.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              필터 초기화
            </button>
          )}
          <button
            onClick={handleClearAll}
            className="px-3 py-1.5 text-xs font-medium text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            전체 삭제
          </button>
        </div>
      </div>

      {/* Row 2: Amount range filter */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-gray-400 mr-1">금액대</span>
        {AMOUNT_PRESETS.map((preset) => (
          <button
            key={preset.label}
            onClick={() =>
              setAmountRange({ min: preset.min ?? null, max: preset.max ?? null })
            }
            className={`px-2.5 py-1 text-xs rounded-md transition-all ${
              isPresetActive(preset)
                ? "bg-gray-900 text-white font-medium"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
            }`}
          >
            {preset.label}
          </button>
        ))}
        <button
          onClick={() => setShowAmountCustom(!showAmountCustom)}
          className={`px-2.5 py-1 text-xs rounded-md transition-all ${
            showAmountCustom
              ? "bg-gray-200 text-gray-700"
              : "bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
          }`}
        >
          직접 입력
        </button>

        {showAmountCustom && (
          <div className="flex items-center gap-1.5 ml-1">
            <input
              type="number"
              placeholder="최소(만)"
              value={customMin}
              onChange={(e) => setCustomMin(e.target.value)}
              className="w-20 px-2 py-1 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
            />
            <span className="text-xs text-gray-400">~</span>
            <input
              type="number"
              placeholder="최대(만)"
              value={customMax}
              onChange={(e) => setCustomMax(e.target.value)}
              className="w-20 px-2 py-1 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
            />
            <span className="text-[10px] text-gray-400">만원</span>
            <button
              onClick={applyCustomRange}
              className="px-2 py-1 text-xs bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
            >
              적용
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
