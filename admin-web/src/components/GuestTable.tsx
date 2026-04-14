import { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from "@tanstack/react-table";
import { useFilteredGuests, useGuestStore } from "../store/guestStore";
import type { Guest } from "../types/guest";

interface GuestTableProps {
  onEdit: (guest: Guest) => void;
}

const col = createColumnHelper<Guest>();

function fmt(n: number): string {
  return n.toLocaleString("ko-KR");
}

const SIDE_LABEL: Record<string, string> = { groom: "신랑", bride: "신부" };
const METHOD_LABEL: Record<string, string> = { cash: "현금", transfer: "이체" };

export default function GuestTable({ onEdit }: GuestTableProps) {
  const guests = useFilteredGuests();
  const deleteGuest = useGuestStore((s) => s.deleteGuest);
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo(
    () => [
      col.display({
        id: "index",
        header: "#",
        cell: (info) => info.row.index + 1,
        size: 50,
      }),
      col.accessor("name", {
        header: "이름",
        cell: (info) => <span className="font-medium">{info.getValue()}</span>,
      }),
      col.accessor("relation", {
        header: "관계",
        cell: (info) => info.getValue() || "-",
      }),
      col.accessor("side", {
        header: "측",
        cell: (info) => (
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              info.getValue() === "groom"
                ? "bg-sky-100 text-sky-700"
                : "bg-pink-100 text-pink-700"
            }`}
          >
            {SIDE_LABEL[info.getValue()]}
          </span>
        ),
        enableSorting: false,
      }),
      col.accessor("amount", {
        header: "금액",
        cell: (info) => (
          <span className="font-semibold">{fmt(info.getValue())}원</span>
        ),
      }),
      col.accessor("paymentMethod", {
        header: "방법",
        cell: (info) => METHOD_LABEL[info.getValue()],
        enableSorting: false,
      }),
      col.accessor("memo", {
        header: "메모",
        cell: (info) => (
          <span className="text-gray-500 truncate max-w-[120px] inline-block">
            {info.getValue() || "-"}
          </span>
        ),
        enableSorting: false,
      }),
      col.accessor("date", {
        header: "날짜",
        cell: (info) => {
          const d = info.getValue();
          return d ? new Date(d).toLocaleDateString("ko-KR") : "-";
        },
      }),
      col.display({
        id: "actions",
        header: "",
        size: 80,
        cell: (info) => (
          <div className="flex gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(info.row.original);
              }}
              className="p-1 text-gray-400 hover:text-blue-600"
              title="수정"
            >
              &#9998;
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (
                  window.confirm(
                    `"${info.row.original.name}" 항목을 삭제하시겠습니까?`,
                  )
                ) {
                  deleteGuest(info.row.original.id);
                }
              }}
              className="p-1 text-gray-400 hover:text-red-600"
              title="삭제"
            >
              &#128465;
            </button>
          </div>
        ),
      }),
    ],
    [deleteGuest, onEdit],
  );

  const table = useReactTable({
    data: guests,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 50 } },
  });

  if (guests.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-lg">데이터가 없습니다</p>
        <p className="text-sm mt-1">CSV를 업로드하거나 데이터를 추가하세요</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="bg-gray-50 border-b border-gray-200">
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    onClick={
                      header.column.getCanSort()
                        ? header.column.getToggleSortingHandler()
                        : undefined
                    }
                    className={`px-4 py-3 text-left font-semibold text-gray-600 ${
                      header.column.getCanSort()
                        ? "cursor-pointer select-none hover:text-gray-900"
                        : ""
                    }`}
                    style={{
                      width:
                        header.getSize() !== 150 ? header.getSize() : undefined,
                    }}
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                      {{ asc: " ▲", desc: " ▼" }[
                        header.column.getIsSorted() as string
                      ] ?? ""}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                onClick={() => onEdit(row.original)}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-2.5">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
          <span className="text-sm text-gray-500">
            {guests.length}건 중{" "}
            {table.getState().pagination.pageIndex *
              table.getState().pagination.pageSize +
              1}
            -
            {Math.min(
              (table.getState().pagination.pageIndex + 1) *
                table.getState().pagination.pageSize,
              guests.length,
            )}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40"
            >
              이전
            </button>
            <span className="px-3 py-1 text-sm text-gray-600">
              {table.getState().pagination.pageIndex + 1} /{" "}
              {table.getPageCount()}
            </span>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40"
            >
              다음
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
