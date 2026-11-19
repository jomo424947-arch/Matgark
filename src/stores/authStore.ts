import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { PlatformAdminRole, StaffRole } from "@/types/saas"

export interface AdminSession {
  id: string
  name: string
  email: string
  role: PlatformAdminRole
  signedInAt: string
}

export interface MerchantSession {
  merchantId: string
  storeId: string
  name: string
  email: string
  role: StaffRole
  signedInAt: string
}

export interface StoreCustomerSession {
  customerId: string
  storeId: string
  storeSlug: string
  name: string
  email: string
  signedInAt: string
}

interface AuthState {
  adminSession: AdminSession | null
  merchantSession: MerchantSession | null
  // Strictly isolated customer sessions keyed by storeSlug
  customerSessions: Record<string, StoreCustomerSession | null>

  loginAdmin: (session: Omit<AdminSession, "signedInAt">) => void
  logoutAdmin: () => void

  loginMerchant: (session: Omit<MerchantSession, "signedInAt">) => void
  switchMerchantStore: (storeId: string) => void
  logoutMerchant: () => void

  loginStoreCustomer: (
    storeSlug: string,
    session: Omit<StoreCustomerSession, "signedInAt">
  ) => void
  logoutStoreCustomer: (storeSlug: string) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      adminSession: null,
      merchantSession: null,
      customerSessions: {},

      loginAdmin: (session) =>
        set({
          adminSession: { ...session, signedInAt: new Date().toISOString() },
        }),
      logoutAdmin: () => set({ adminSession: null }),

      loginMerchant: (session) =>
        set({
          merchantSession: { ...session, signedInAt: new Date().toISOString() },
        }),
      switchMerchantStore: (storeId) =>
        set((state) =>
          state.merchantSession
            ? { merchantSession: { ...state.merchantSession, storeId } }
            : state
        ),
      logoutMerchant: () => set({ merchantSession: null }),

      loginStoreCustomer: (storeSlug, session) =>
        set((state) => ({
          customerSessions: {
            ...state.customerSessions,
            [storeSlug]: { ...session, signedInAt: new Date().toISOString() },
          },
        })),
      logoutStoreCustomer: (storeSlug) =>
        set((state) => ({
          customerSessions: {
            ...state.customerSessions,
            [storeSlug]: null,
          },
        })),
    }),
    {
      name: "matgarak-auth-sessions-v2",
    }
  )
)
