import type { PlatformAdminRole, StaffRole } from "@/types/saas"

export type MerchantPermission =
  | "dashboard:view"
  | "products:manage"
  | "categories:manage"
  | "inventory:manage"
  | "orders:view"
  | "orders:manage"
  | "customers:view"
  | "discounts:manage"
  | "store_design:manage"
  | "analytics:view"
  | "settings:manage"
  | "staff:manage"

export type AdminPermission =
  | "admin:overview"
  | "admin:merchants"
  | "admin:stores"
  | "admin:subscriptions"
  | "admin:analytics"
  | "admin:support"
  | "admin:settings"

export const STAFF_ROLE_PERMISSIONS: Record<StaffRole, MerchantPermission[]> = {
  owner: [
    "dashboard:view",
    "products:manage",
    "categories:manage",
    "inventory:manage",
    "orders:view",
    "orders:manage",
    "customers:view",
    "discounts:manage",
    "store_design:manage",
    "analytics:view",
    "settings:manage",
    "staff:manage",
  ],
  admin: [
    "dashboard:view",
    "products:manage",
    "categories:manage",
    "inventory:manage",
    "orders:view",
    "orders:manage",
    "customers:view",
    "discounts:manage",
    "store_design:manage",
    "analytics:view",
    "settings:manage",
  ],
  manager: [
    "dashboard:view",
    "products:manage",
    "categories:manage",
    "inventory:manage",
    "orders:view",
    "orders:manage",
    "customers:view",
    "discounts:manage",
    "analytics:view",
  ],
  order_manager: ["dashboard:view", "orders:view", "orders:manage", "customers:view"],
  inventory_manager: [
    "dashboard:view",
    "products:manage",
    "categories:manage",
    "inventory:manage",
  ],
}

export const ADMIN_ROLE_PERMISSIONS: Record<PlatformAdminRole, AdminPermission[]> = {
  super_admin: [
    "admin:overview",
    "admin:merchants",
    "admin:stores",
    "admin:subscriptions",
    "admin:analytics",
    "admin:support",
    "admin:settings",
  ],
  operations: [
    "admin:overview",
    "admin:merchants",
    "admin:stores",
    "admin:analytics",
    "admin:support",
  ],
  support: ["admin:overview", "admin:merchants", "admin:stores", "admin:support"],
}

export function hasMerchantPermission(
  role: StaffRole,
  permission: MerchantPermission
): boolean {
  return STAFF_ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

export function hasAdminPermission(
  role: PlatformAdminRole,
  permission: AdminPermission
): boolean {
  return ADMIN_ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}
