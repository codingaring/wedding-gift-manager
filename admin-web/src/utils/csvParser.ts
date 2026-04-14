import Papa from "papaparse";
import type { Guest } from "../types/guest";

const EXPECTED_HEADERS = [
  "name",
  "relation",
  "side",
  "amount",
  "paymentMethod",
  "mealTickets",
  "memo",
  "date",
];

export interface CsvParseResult {
  guests: Omit<Guest, "id" | "source">[];
  errors: string[];
}

export function parseCsvFile(file: File): Promise<CsvParseResult> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: "UTF-8",
      complete: (results) => {
        const errors: string[] = [];

        // Validate headers
        const headers = results.meta.fields ?? [];
        const missing = EXPECTED_HEADERS.filter((h) => !headers.includes(h));
        if (missing.length > 0) {
          resolve({
            guests: [],
            errors: [`CSV 헤더 오류: ${missing.join(", ")} 컬럼이 없습니다`],
          });
          return;
        }

        const guests: Omit<Guest, "id" | "source">[] = [];
        for (let i = 0; i < results.data.length; i++) {
          const row = results.data[i] as Record<string, string>;
          if (!row.name?.trim()) {
            errors.push(`${i + 2}행: 이름이 비어있어 건너뜁니다`);
            continue;
          }
          guests.push({
            name: row.name.trim(),
            relation: row.relation?.trim() ?? "",
            side: row.side === "bride" ? "bride" : "groom",
            amount: parseInt(row.amount, 10) || 0,
            paymentMethod:
              row.paymentMethod === "transfer" ? "transfer" : "cash",
            mealTickets: parseInt(row.mealTickets, 10) || 0,
            memo: row.memo?.trim() ?? "",
            date: row.date?.trim() ?? new Date().toISOString(),
          });
        }

        resolve({ guests, errors });
      },
      error: (err) => {
        resolve({ guests: [], errors: [`CSV 파싱 오류: ${err.message}`] });
      },
    });
  });
}
