import { useMemo } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Guest, GuestStats, SideFilter, AmountRange } from "../types/guest";

interface GuestStore {
  guests: Guest[];
  sideFilter: SideFilter;
  searchQuery: string;
  relationFilter: string;
  amountRange: AmountRange;

  importCsv: (
    csvGuests: Omit<Guest, "id" | "source">[],
    side: "groom" | "bride",
    mode?: "append" | "replace",
  ) => void;
  addGuest: (guest: Omit<Guest, "id" | "source">) => void;
  updateGuest: (id: string, updates: Partial<Guest>) => void;
  deleteGuest: (id: string) => void;
  setSideFilter: (filter: SideFilter) => void;
  setSearchQuery: (query: string) => void;
  setRelationFilter: (relation: string) => void;
  setAmountRange: (range: AmountRange) => void;
  clearFilters: () => void;
  clearAll: () => void;
}

export const useGuestStore = create<GuestStore>()(
  persist(
    (set) => ({
      guests: [],
      sideFilter: "all",
      searchQuery: "",
      relationFilter: "all",
      amountRange: { min: null, max: null },

      importCsv: (csvGuests, side, mode = "append") =>
        set((state) => {
          const newGuests: Guest[] = csvGuests.map((g) => ({
            ...g,
            id: crypto.randomUUID(),
            side,
            source: "csv" as const,
          }));
          const base =
            mode === "replace"
              ? state.guests.filter((g) => g.side !== side)
              : state.guests;
          return { guests: [...base, ...newGuests] };
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
      setRelationFilter: (relation) => set({ relationFilter: relation }),
      setAmountRange: (range) => set({ amountRange: range }),
      clearFilters: () =>
        set({
          sideFilter: "all",
          searchQuery: "",
          relationFilter: "all",
          amountRange: { min: null, max: null },
        }),
      clearAll: () =>
        set({
          guests: [],
          sideFilter: "all",
          searchQuery: "",
          relationFilter: "all",
          amountRange: { min: null, max: null },
        }),
    }),
    { name: "wedding-gift-admin" },
  ),
);

// Selectors — use primitive selectors + useMemo to avoid infinite re-render
export function useFilteredGuests() {
  const guests = useGuestStore((s) => s.guests);
  const sideFilter = useGuestStore((s) => s.sideFilter);
  const searchQuery = useGuestStore((s) => s.searchQuery);
  const relationFilter = useGuestStore((s) => s.relationFilter);
  const amountRange = useGuestStore((s) => s.amountRange);

  return useMemo(() => {
    let filtered = guests;
    if (sideFilter !== "all") {
      filtered = filtered.filter((g) => g.side === sideFilter);
    }
    if (relationFilter !== "all") {
      filtered = filtered.filter((g) => (g.relation || "미지정") === relationFilter);
    }
    if (amountRange.min !== null) {
      filtered = filtered.filter((g) => g.amount >= amountRange.min!);
    }
    if (amountRange.max !== null) {
      filtered = filtered.filter((g) => g.amount <= amountRange.max!);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((g) => g.name.toLowerCase().includes(q));
    }
    return filtered;
  }, [guests, sideFilter, searchQuery, relationFilter, amountRange]);
}

export function useRelationOptions(): string[] {
  const guests = useGuestStore((s) => s.guests);
  return useMemo(() => {
    const set = new Set<string>();
    for (const g of guests) {
      set.add(g.relation || "미지정");
    }
    return Array.from(set).sort();
  }, [guests]);
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

export function useMealTicketStats() {
  const guests = useGuestStore((s) => s.guests);

  return useMemo(() => {
    let totalTickets = 0;
    let groomTickets = 0;
    let brideTickets = 0;
    let guestsWithTickets = 0;

    for (const g of guests) {
      const t = g.mealTickets || 0;
      totalTickets += t;
      if (t > 0) guestsWithTickets++;
      if (g.side === "groom") groomTickets += t;
      else brideTickets += t;
    }

    return { totalTickets, groomTickets, brideTickets, guestsWithTickets };
  }, [guests]);
}
