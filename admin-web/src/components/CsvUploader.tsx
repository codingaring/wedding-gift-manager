import { useCallback, useState } from 'react';
import { parseCsvFile } from '../utils/csvParser';
import { useGuestStore } from '../store/guestStore';

interface DropZoneProps {
  side: 'groom' | 'bride';
  label: string;
}

function DropZone({ side, label }: DropZoneProps) {
  const importCsv = useGuestStore((s) => s.importCsv);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.name.endsWith('.csv')) {
        setError('CSV 파일만 업로드 가능합니다');
        return;
      }
      setError(null);
      setStatus('파싱 중...');

      const result = await parseCsvFile(file);
      if (result.errors.length > 0 && result.guests.length === 0) {
        setError(result.errors[0]);
        setStatus(null);
        return;
      }

      importCsv(result.guests, side);
      setStatus(`${result.guests.length}건 업로드됨`);
      if (result.errors.length > 0) {
        setError(`경고: ${result.errors.length}건 건너뜀`);
      }
    },
    [importCsv, side]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      e.target.value = '';
    },
    [handleFile]
  );

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={`
        flex flex-col items-center justify-center gap-3 p-8
        border-2 border-dashed rounded-xl cursor-pointer
        transition-colors
        ${dragging
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-300 bg-gray-50 hover:border-gray-400'
        }
      `}
    >
      <div className="text-lg font-semibold text-gray-700">{label}</div>
      <div className="text-sm text-gray-500">CSV 파일을 드래그하거나</div>
      <label className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 cursor-pointer">
        파일 선택
        <input
          type="file"
          accept=".csv"
          onChange={onFileSelect}
          className="hidden"
        />
      </label>
      {status && (
        <div className="text-sm text-green-600 font-medium">{status}</div>
      )}
      {error && (
        <div className="text-sm text-red-600">{error}</div>
      )}
    </div>
  );
}

export default function CsvUploader() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <DropZone side="groom" label="신랑 측 CSV" />
      <DropZone side="bride" label="신부 측 CSV" />
    </div>
  );
}
