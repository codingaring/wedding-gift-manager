import { useCallback, useState } from "react";
import { parseCsvFile } from "../utils/csvParser";
import { useGuestStore } from "../store/guestStore";

interface DropZoneProps {
  side: "groom" | "bride";
  label: string;
}

function DropZone({ side, label }: DropZoneProps) {
  const importCsv = useGuestStore((s) => s.importCsv);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.name.endsWith(".csv")) {
        setError("CSV 파일만 업로드 가능합니다");
        return;
      }
      setError(null);
      setStatus("파싱 중...");

      const result = await parseCsvFile(file);
      if (result.errors.length > 0 && result.guests.length === 0) {
        setError(result.errors[0]);
        setStatus(null);
        return;
      }

      importCsv(result.guests, side);
      setStatus(`${result.guests.length}건 업로드`);
      if (result.errors.length > 0) {
        setError(`경고: ${result.errors.length}건 건너뜀`);
      }
    },
    [importCsv, side],
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
