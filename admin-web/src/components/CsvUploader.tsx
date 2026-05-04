import { useCallback, useState } from "react";
import { parseCsvFile } from "../utils/csvParser";
import { useGuestStore } from "../store/guestStore";
import type { Guest } from "../types/guest";

interface PendingImport {
  guests: Omit<Guest, "id" | "source">[];
  existingCount: number;
}

interface DropZoneProps {
  side: "groom" | "bride";
  label: string;
}

function DropZone({ side, label }: DropZoneProps) {
  const importCsv = useGuestStore((s) => s.importCsv);
  const guests = useGuestStore((s) => s.guests);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [pending, setPending] = useState<PendingImport | null>(null);

  const finishImport = useCallback(
    (parsed: Omit<Guest, "id" | "source">[], mode: "append" | "replace") => {
      importCsv(parsed, side, mode);
      setStatus(`${parsed.length}건 업로드`);
      setPending(null);
    },
    [importCsv, side],
  );

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.name.endsWith(".csv")) {
        setError("CSV 파일만 업로드 가능합니다");
        return;
      }
      setError(null);
      setPending(null);
      setStatus("파싱 중...");

      const result = await parseCsvFile(file);
      if (result.errors.length > 0 && result.guests.length === 0) {
        setError(result.errors[0]);
        setStatus(null);
        return;
      }
      if (result.errors.length > 0) {
        setError(`경고: ${result.errors.length}건 건너뜀`);
      }

      const existingCount = guests.filter((g) => g.side === side).length;
      if (existingCount > 0) {
        setStatus(null);
        setPending({ guests: result.guests, existingCount });
        return;
      }

      finishImport(result.guests, "append");
    },
    [guests, side, finishImport],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const onFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      e.target.value = "";
    },
    [handleFile],
  );

  return (
    <div className="space-y-2">
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`
          flex items-center gap-3 px-4 py-3 cursor-pointer
          bg-white border border-dashed rounded-lg
          transition-all duration-150
          ${
            dragging
              ? "border-gray-400 bg-gray-50"
              : "border-gray-200 hover:border-gray-300"
          }
        `}
      >
        <div className="text-lg">{side === "groom" ? "🤵" : "👰"}</div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-700">{label}</div>
          <div className="text-[11px] text-gray-400">
            {status ? (
              <span className="text-emerald-600">{status}</span>
            ) : error ? (
              <span className="text-red-500">{error}</span>
            ) : (
              "드래그 또는 클릭"
            )}
          </div>
        </div>
        <span className="px-2.5 py-1 text-[11px] font-medium text-gray-500 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 transition-colors">
          파일 선택
        </span>
        <input
          type="file"
          accept=".csv"
          onChange={onFileSelect}
          className="hidden"
        />
      </label>

      {pending && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs">
          <span className="text-amber-700 flex-1">
            기존 데이터 {pending.existingCount}건이 있습니다. 새 파일 {pending.guests.length}건을 어떻게 처리할까요?
          </span>
          <button
            onClick={() => finishImport(pending.guests, "append")}
            className="px-2.5 py-1 font-medium text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-md transition-colors whitespace-nowrap"
          >
            추가
          </button>
          <button
            onClick={() => finishImport(pending.guests, "replace")}
            className="px-2.5 py-1 font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-md transition-colors whitespace-nowrap"
          >
            대체
          </button>
          <button
            onClick={() => setPending(null)}
            className="px-2 py-1 text-amber-500 hover:text-amber-700 transition-colors"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

export default function CsvUploader() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <DropZone side="groom" label="신랑 측 CSV" />
      <DropZone side="bride" label="신부 측 CSV" />
    </div>
  );
}
