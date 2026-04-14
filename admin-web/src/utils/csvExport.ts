import type { Guest } from '../types/guest';

const HEADER = 'name,relation,side,amount,paymentMethod,memo,date';

function escape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function guestsToCsv(guests: Guest[]): string {
  const rows = guests.map((g) =>
    [
      escape(g.name),
      escape(g.relation),
      g.side,
      g.amount.toString(),
      g.paymentMethod,
      escape(g.memo),
      g.date,
    ].join(',')
  );
  return [HEADER, ...rows].join('\n');
}

export function downloadCsv(guests: Guest[], filename?: string) {
  const csv = guestsToCsv(guests);
  // UTF-8 BOM for Excel 한글 호환
  const bom = '\uFEFF';
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename ?? `wedding_gift_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
