import { create } from 'zustand'

export type LineItem = {
  id: string
  serviceId: string
  serviceName: string
  priceCents: number
  durationMinutes: number
  stylistId: string | null
  stylistName: string | null
  /** Service card image for summary */
  serviceImageUrl?: string
  /** Set when service has "no photo" — summary shows monogram, not image */
  serviceNoPhoto?: boolean
  /** Stylist avatar for summary + header stack */
  stylistAvatarUrl?: string | null
  /** Set when stylist has "no photo" — initials only, no stock avatar */
  stylistNoPhoto?: boolean
}

type Customer = {
  phone: string
  email: string
  firstName: string
  lastName: string
  notes: string
}

type BookingState = {
  lineItems: LineItem[]
  selectedDateKey: string | null
  selectedSlotIso: string | null
  customer: Customer
  addLineItem: (item: Omit<LineItem, 'id'>) => void
  updateLineItem: (id: string, patch: Partial<LineItem>) => void
  removeLineItem: (id: string) => void
  setSelectedSlot: (dateKey: string, slotIso: string | null) => void
  setCustomer: (c: Partial<Customer>) => void
  reset: () => void
}

const emptyCustomer: Customer = {
  phone: '',
  email: '',
  firstName: '',
  lastName: '',
  notes: '',
}

export const useBookingStore = create<BookingState>((set) => ({
  lineItems: [],
  selectedDateKey: null,
  selectedSlotIso: null,
  customer: { ...emptyCustomer },
  addLineItem: (item) =>
    set((s) => ({
      lineItems: [
        ...s.lineItems,
        { ...item, id: crypto.randomUUID() },
      ],
    })),
  updateLineItem: (id, patch) =>
    set((s) => ({
      lineItems: s.lineItems.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    })),
  removeLineItem: (id) =>
    set((s) => ({
      lineItems: s.lineItems.filter((l) => l.id !== id),
    })),
  setSelectedSlot: (dateKey, slotIso) => set({ selectedDateKey: dateKey, selectedSlotIso: slotIso }),
  setCustomer: (c) =>
    set((s) => ({ customer: { ...s.customer, ...c } })),
  reset: () =>
    set({
      lineItems: [],
      selectedDateKey: null,
      selectedSlotIso: null,
      customer: { ...emptyCustomer },
    }),
}))
