import { useState, useEffect } from 'react';
import { useGuestStore } from '../store/guestStore';
import type { Guest } from '../types/guest';

interface GuestFormModalProps {
  guest: Guest | null;  // null = add mode
  onClose: () => void;
}

const RELATIONS = ['친구', '직장 동료', '친척', '기타'];
const QUICK_AMOUNTS = [30000, 50000, 100000, 150000, 200000, 250000, 300000];

function fmtQuick(n: number): string {
  return `${n / 10000}만`;
}

export default function GuestFormModal({ guest, onClose }: GuestFormModalProps) {
  const { addGuest, updateGuest } = useGuestStore();
  const isEdit = guest !== null;

  const [name, setName] = useState(guest?.name ?? '');
  const [relation, setRelation] = useState(guest?.relation ?? '친구');
  const [side, setSide] = useState<'groom' | 'bride'>(guest?.side ?? 'groom');
  const [amount, setAmount] = useState(guest?.amount?.toString() ?? '');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer'>(guest?.paymentMethod ?? 'cash');
  const [memo, setMemo] = useState(guest?.memo ?? '');
  const [nameError, setNameError] = useState('');

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setNameError('이름을 입력해주세요');
      return;
    }

    const data = {
      name: name.trim(),
      relation,
      side,
      amount: parseInt(amount, 10) || 0,
      paymentMethod,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          {isEdit ? '수정' : '추가'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">이름 *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setNameError(''); }}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                nameError ? 'border-red-400' : 'border-gray-300'
              }`}
              autoFocus
            />
            {nameError && <p className="text-xs text-red-500 mt-1">{nameError}</p>}
          </div>

          {/* Relation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">관계</label>
            <select
              value={relation}
              onChange={(e) => setRelation(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {RELATIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {/* Side */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">측</label>
            <div className="flex gap-2">
              {(['groom', 'bride'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSide(s)}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${
                    side === s
                      ? s === 'groom' ? 'bg-sky-100 border-sky-400 text-sky-700' : 'bg-pink-100 border-pink-400 text-pink-700'
                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {s === 'groom' ? '신랑 측' : '신부 측'}
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">금액</label>
            <input
              type="text"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))}
              placeholder="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {QUICK_AMOUNTS.map((qa) => (
                <button
                  key={qa}
                  type="button"
                  onClick={() => setAmount(qa.toString())}
                  className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                    parseInt(amount) === qa
                      ? 'bg-blue-100 border-blue-400 text-blue-700'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {fmtQuick(qa)}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">결제 방법</label>
            <div className="flex gap-2">
              {(['cash', 'transfer'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPaymentMethod(m)}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${
                    paymentMethod === m
                      ? 'bg-gray-900 border-gray-900 text-white'
                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {m === 'cash' ? '현금' : '계좌이체'}
                </button>
              ))}
            </div>
          </div>

          {/* Memo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">메모</label>
            <input
              type="text"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              {isEdit ? '수정' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
