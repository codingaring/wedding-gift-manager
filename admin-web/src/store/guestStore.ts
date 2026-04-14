import { useMemo } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Guest, GuestStats, SideFilter } from "../types/guest";

interface GuestStore {
  guests: Guest[];
  sideFilter: SideFilter;
  searchQuery: string;

  importCsv: (
    csvGuests: Omit<Guest, "id" | "source">[],
    side: "groom" | "bride",
  ) => void;
  addGuest: (guest: Omit<Guest, "id" | "source">) => void;
  updateGuest: (id: string, updates: Partial<Guest>) => void;
  deleteGuest: (id: string) => void;
  setSideFilter: (filter: SideFilter) => void;
  setSearchQuery: (query: string) => void;
  clearAll: () => void;
}

export const useGuestStore = create<GuestStore>()(
  persist(
    (set) => ({
      guests: [],
      sideFilter: "all",
      searchQuery: "",

      importCsv: (csvGuests, side) =>
        set((state) => {
          const newGuests: Guest[] = csvGuests.map((g) => ({
            ...g,
            id: crypto.randomUUID(),
            side,
            source: "csv" as const,
          }));
          return { guests: [...state.guests, ...newGuests] };
        }),

      addGuest: (guest) =>
        set((state) => ({
          guests: [
            ...state.guests,
            { ...guest, id: crypto.randomUUID(), source: "manual" as const },
          ],
        })),

      updateGuest: (id, updates) =>
        set((state) => ({
          guests: state.guests.map((g) =>
            g.id === id ? { ...g, ...updates } : g,
          ),
        })),

      deleteGuest: (id) =>
        set((state) => ({
          guests: state.guests.filter((g) => g.id !== id),
        })),

      setSideFilter: (filter) => set({ sideFilter: filter }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      clearAll: () => set({ guests: [], sideFilter: "all", searchQuery: "" }),
    }),
    { name: "wedding-gift-admin" },
  ),
);

// Selectors — use primitive selectors + useMemo to avoid infinite re-render
export function useFilteredGuests() {
  const guests = useGuestStore((s) => s.guests);
  const sideFilter = useGuestStore((s) => s.sideFilter);
  const searchQuery = useGuestStore((s) => s.searchQuery);

  return useMemo(() => {
    let filtered = guests;
    if (sideFilter !== "all") {
      filtered = filtered.filter((g) => g.side === sideFilter);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((g) => g.name.toLowerCase().includes(q));
    }
    return filtered;
  }, [guests, sideFilter, searchQuery]);
}

export function useGuestStats(): GuestStats {
  const guests = useGuestStore((s) => s.guests);

  return useMemo(() => {
    const byRelation: Record<string, { count: number; amount: number }> = {};
    let groomCount = 0,
      groomAmount = 0,
      brideCount = 0,
      brideAmount = 0;

    for (const g of guests) {
      if (g.side === "groom") {
        groomCount++;
        groomAmount += g.amount;
      } else {
        brideCount++;
        brideAmount += g.amount;
      }

      const rel = g.relation || "미지정";
      if (!byRelation[rel]) byRelation[rel] = { count: 0, amount: 0 };
      byRelation[rel].count++;
      byRelation[rel].amount += g.amount;
    }

    return {
      totalCount: guests.length,
      totalAmount: groomAmount + brideAmount,
      groomCount,
      groomAmount,
      brideCount,
      brideAmount,
      byRelation,
    };
  }, [guests]);
}
