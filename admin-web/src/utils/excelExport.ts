import * as XLSX from "xlsx";
import type { Guest } from "../types/guest";

const SIDE_LABEL: Record<string, string> = { groom: "신랑", bride: "신부" };
const METHOD_LABEL: Record<string, string> = {
  cash: "현금",
  transfer: "계좌이체",
};

export function downloadExcel(guests: Guest[], filename?: string) {
  const rows = guests.map((g, i) => ({
    번호: i + 1,
    이름: g.name,
    관계: g.relation || "",
    측: SIDE_LABEL[g.side] || g.side,
    금액: g.amount,
    결제방법: METHOD_LABEL[g.paymentMethod] || g.paymentMethod,
    식권: g.mealTickets,
    메모: g.memo || "",
    날짜: g.date ? new Date(g.date).toLocaleDateString("ko-KR") : "",
  }));

  const ws = XLSX.utils.json_to_sheet(rows);

  // 컬럼 너비 설정
  ws["!cols"] = [
    { wch: 5 }, // 번호
    { wch: 12 }, // 이름
    { wch: 10 }, // 관계
    { wch: 6 }, // 측
    { wch: 12 }, // 금액
    { wch: 10 }, // 결제방법
    { wch: 6 }, // 식권
    { wch: 20 }, // 메모
    { wch: 14 }, // 날짜
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "축의금");

  const defaultName =
    filename ??
    `축의금_${new Date().toISOString().split("T")[0]}.xlsx`;

  XLSX.writeFile(wb, defaultName, { bookType: "xlsx" });
}
