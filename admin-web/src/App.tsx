import { useState } from "react";
import CsvUploader from "./components/CsvUploader";
import StatsPanel from "./components/StatsPanel";
import Toolbar from "./components/Toolbar";
import GuestTable from "./components/GuestTable";
import GuestFormModal from "./components/GuestFormModal";
import { useGuestStore } from "./store/guestStore";
import type { Guest } from "./types/guest";

function App() {
  const guestCount = useGuestStore((s) => s.guests.length);
  const [modalGuest, setModalGuest] = useState<Guest | null | undefined>(
    undefined,
  );
  // undefined = closed, null = add mode, Guest = edit mode

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">축의금 관리자</h1>
          {guestCount > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              총 {guestCount}건 로드됨
            </p>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <CsvUploader />
        <StatsPanel />
        <Toolbar onAdd={() => setModalGuest(null)} />
        <GuestTable onEdit={(guest) => setModalGuest(guest)} />
      </main>

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
