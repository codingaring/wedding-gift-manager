import { useEffect, useRef, useCallback } from "react";
import { useGuestStore } from "../store/guestStore";
import { useBudgetStore } from "../store/budgetStore";
import { useBackupStore } from "../store/backupStore";
import {
  isFileSystemAccessSupported,
  getStoredHandle,
  writeBackup,
  pickBackupFile,
  requestPermission,
  loadFromHandle,
  restoreBackupData,
  downloadBackup,
  uploadBackup,
} from "../utils/backup";

export function useAutoBackup() {
  const guests = useGuestStore((s) => s.guests);
  const expenses = useBudgetStore((s) => s.expenses);
  const incomes = useBudgetStore((s) => s.incomes);
  const { isSetup, lastSaved, saving, error, setSetup, setSaved, setSaving, setError } =
    useBackupStore();
  const supported = isFileSystemAccessSupported();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const initializedRef = useRef(false);

  // 초기화: 저장된 handle이 있는지 확인
  useEffect(() => {
    if (!supported || initializedRef.current) return;
    initializedRef.current = true;

    (async () => {
      const handle = await getStoredHandle();
      if (handle) {
        setSetup(true);
      }
    })();
  }, [supported, setSetup]);

  // 데이터 변경 감지 → 자동 저장 (debounce 2초)
  useEffect(() => {
    if (!supported || !isSetup) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const handle = await getStoredHandle();
      if (!handle) return;

      setSaving(true);
      const ok = await writeBackup(handle);
      if (ok) {
        setSaved(new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }));
      } else {
        setError("자동 저장 실패");
      }
    }, 2000);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [guests, expenses, incomes, supported, isSetup, setSaving, setSaved, setError]);

  // 백업 위치 설정
  const setupBackup = useCallback(async () => {
    const handle = await pickBackupFile();
    if (handle) {
      setSetup(true);
      setSaving(true);
      const ok = await writeBackup(handle);
      if (ok) {
        setSaved(new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }));
      } else {
        setError("저장 실패");
      }
    }
  }, [setSetup, setSaving, setSaved, setError]);

  // 권한 재요청 (탭 새로 열었을 때)
  const reconnect = useCallback(async () => {
    const handle = await getStoredHandle();
    if (!handle) {
      setError("백업 파일을 다시 설정해주세요");
      return;
    }
    const ok = await requestPermission(handle);
    if (ok) {
      setSetup(true);
      setError(null);
    } else {
      setError("권한이 거부되었습니다");
    }
  }, [setSetup, setError]);

  // 백업에서 복원
  const restoreFromBackup = useCallback(async () => {
    if (supported) {
      const handle = await getStoredHandle();
      if (handle) {
        const data = await loadFromHandle(handle);
        if (data) {
          restoreBackupData(data);
          window.location.reload();
          return;
        }
      }
    }
    // 폴백: 파일 선택
    const data = await uploadBackup();
    if (data) {
      restoreBackupData(data);
      window.location.reload();
    }
  }, [supported]);

  // 수동 다운로드 (폴백)
  const manualDownload = useCallback(() => {
    downloadBackup();
  }, []);

  // 수동 업로드 (폴백)
  const manualUpload = useCallback(async () => {
    const data = await uploadBackup();
    if (data) {
      restoreBackupData(data);
      window.location.reload();
    }
  }, []);

  return {
    supported,
    isSetup,
    lastSaved,
    saving,
    error,
    setupBackup,
    reconnect,
    restoreFromBackup,
    manualDownload,
    manualUpload,
  };
}
