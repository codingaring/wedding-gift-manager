import { useState, useEffect } from "react";
import { useGuestStore } from "../store/guestStore";
import type { Guest } from "../types/guest";

interface GuestFormModalProps {
  guest: Guest | null;
  onClose: () => void;
}

const RELATIONS = ["친구", "직장 동료", "친척", "기타"];
const QUICK_AMOUNTS = [30000, 50000, 100000, 150000, 200000, 250000, 300000];

function fmtQuick(n: number): string {
  return `${n / 10000}만`;
}

export default function GuestFormModal({
  guest,
  onClose,
}: GuestFormModalProps) {
  const { addGuest, updateGuest } = useGuestStore();
  const isEdit = guest !== null;

  const [name, setName] = useState(guest?.name ?? "");
  const [relation, setRelation] = useState(guest?.relation ?? "친구");
  const [side, setSide] = useState<"groom" | "bride">(guest?.side ?? "groom");
  const [amount, setAmount] = useState(guest?.amount?.toString() ?? "");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "transfer">(
    guest?.paymentMethod ?? "cash",
  );
  const [mealTickets, setMealTickets] = useState(
    guest?.mealTickets?.toString() ?? "0",
  );
  const [memo, setMemo] = useState(guest?.memo ?? "");
  const [nameError, setNameError] = useState("");

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setNameError("이름을 입력해주세요");
      return;
    }

    const data = {
      name: name.trim(),
      relation,
      side,
      amount: parseInt(amount, 10) || 0,
      paymentMethod,
      mealTickets: parseInt(mealTickets, 10) || 0,
      memo: memo.trim(),
      date: guest?.date ?? new Date().toISOString(),
    };

    if (isEdit) {
      updateGuest(guest.id, data);
    } else {
      addGuest(data);
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? "수납 수정" : "수납 추가"}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
              이름 *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setNameError("");
              }}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-400 transition-colors ${
                nameError ? "border-red-300" : "border-gray-200"
              }`}
              autoFocus
            />
            {nameError && (
              <p className="text-xs text-red-500 mt-1">{nameError}</p>
            )}
          </div>

          {/* Amount quick select */}
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
              금액
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {QUICK_AMOUNTS.map((qa) => (
                <button
                  key={qa}
                  type="button"
                  onClick={() => setAmount(qa.toString())}
                  className={`px-2.5 py-1 text-xs rounded-md border transition-all ${
                    parseInt(amount) === qa
                      ? "bg-gray-100 border-gray-400 text-gray-800 font-medium"
                      : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {fmtQuick(qa)}
                </button>
              ))}
            </div>
            <input
              type="text"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
              placeholder="직접 입력"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-400 transition-colors"
            />
          </div>

          {/* Side + Payment row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                측
              </label>
              <div className="flex gap-1.5">
                {(["groom", "bride"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSide(s)}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-all ${
                      side === s
                        ? s === "groom"
                          ? "bg-sky-50 border-sky-300 text-sky-700"
                          : "bg-pink-50 border-pink-300 text-pink-700"
                        : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    {s === "groom" ? "신랑" : "신부"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                결제
              </label>
              <div className="flex gap-1.5">
                {(["cash", "transfer"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPaymentMethod(m)}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-all ${
                      paymentMethod === m
                        ? "bg-gray-900 border-gray-900 text-white"
                        : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    {m === "cash" ? "현금" : "이체"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Relation + Meal Tickets row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                관계
              </label>
              <select
                value={relation}
                onChange={(e) => setRelation(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-400 transition-colors"
              >
                {RELATIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                식권
              </label>
              <div className="flex items-center gap-1.5">
                <div className="flex gap-1">
                  {[0, 1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setMealTickets(n.toString())}
                      className={`w-7 h-8 text-xs rounded-md border transition-all ${
                        parseInt(mealTickets) === n
                          ? "bg-gray-900 border-gray-900 text-white font-medium"
                          : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"
                      }`}
                    >
                      {n === 0 ? "X" : n}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Memo */}
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
              메모
            </label>
            <input
              type="text"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="선택 사항"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-400 transition-colors"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors shadow-sm"
            >
              {isEdit ? "수정" : "저장"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
