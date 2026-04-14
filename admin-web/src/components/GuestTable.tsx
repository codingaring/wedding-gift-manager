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
        cell: (info) => (
          <span className="text-gray-400">{info.row.index + 1}</span>
        ),
        size: 50,
      }),
      col.accessor("name", {
        header: "이름",
        cell: (info) => (
          <span className="font-medium text-gray-900">{info.getValue()}</span>
        ),
      }),
      col.accessor("relation", {
        header: "관계",
        cell: (info) => (
          <span className="text-gray-600">{info.getValue() || "-"}</span>
        ),
      }),
      col.accessor("side", {
        header: "측",
        cell: (info) => (
          <span
            className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium ${
              info.getValue() === "groom"
                ? "bg-sky-50 text-sky-700"
                : "bg-pink-50 text-pink-700"
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
          <span className="font-semibold text-gray-900">
            {fmt(info.getValue())}원
          </span>
        ),
      }),
      col.accessor("paymentMethod", {
        header: "방법",
        cell: (info) => (
          <span className="text-gray-500 text-xs">
            {METHOD_LABEL[info.getValue()]}
          </span>
        ),
        enableSorting: false,
      }),
      col.accessor("mealTickets", {
        header: "식권",
        cell: (info) => {
          const v = info.getValue();
          return v > 0 ? (
            <span className="text-gray-700">{v}장</span>
          ) : (
            <span className="text-gray-300">-</span>
          );
        },
        enableSorting: false,
      }),
      col.accessor("memo", {
        header: "메모",
        cell: (info) => (
          <span className="text-gray-400 truncate max-w-[100px] inline-block text-xs">
            {info.getValue() || "-"}
          </span>
        ),
        enableSorting: false,
      }),
      col.accessor("date", {
        header: "날짜",
        cell: (info) => {
          const d = info.getValue();
          return (
            <span className="text-gray-500 text-xs">
              {d ? new Date(d).toLocaleDateString("ko-KR") : "-"}
            </span>
          );
        },
      }),
      col.display({
        id: "actions",
        header: "",
        size: 70,
        cell: (info) => (
          <div className="flex gap-0.5 opacity-0 group-hover/row:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(info.row.original);
              }}
              className="p-1.5 text-gray-400 hover:text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
              title="수정"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
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
              className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
              title="삭제"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
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
      <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm py-16 text-center">
        <div className="text-gray-300 text-4xl mb-3">📋</div>
        <p className="text-gray-500 font-medium">데이터가 없습니다</p>
        <p className="text-gray-400 text-sm mt-1">
          CSV를 업로드하거나 데이터를 추가하세요
        </p>
      </div>
    );
  }

  const pagination = table.getPageCount() > 1 && (
    <div className="flex items-center justify-between px-4 py-2.5">
      <span className="text-xs text-gray-400">
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
      <div className="flex items-center gap-1">
        <button
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          className="px-2.5 py-1 text-xs border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-40 transition-colors"
        >
          이전
        </button>
        <span className="px-2 text-xs text-gray-500">
          {table.getState().pagination.pageIndex + 1} /{" "}
          {table.getPageCount()}
        </span>
        <button
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          className="px-2.5 py-1 text-xs border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-40 transition-colors"
        >
          다음
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm overflow-hidden">
      {/* Pagination on top */}
      {pagination && <div className="border-b border-gray-100">{pagination}</div>}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b border-gray-100">
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    onClick={
                      header.column.getCanSort()
                        ? header.column.getToggleSortingHandler()
                        : undefined
                    }
                    className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                      header.column.getCanSort()
                        ? "cursor-pointer select-none hover:text-gray-700"
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
                      {header.column.getIsSorted() === "asc" && (
                        <span className="text-gray-700">↑</span>
                      )}
                      {header.column.getIsSorted() === "desc" && (
                        <span className="text-gray-700">↓</span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-50">
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="group/row hover:bg-gray-50/50 cursor-pointer transition-colors"
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

    </div>
  );
}
