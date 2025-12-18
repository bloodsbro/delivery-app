export const PERMISSIONS = {
  CREATE_ORDER: 'create_order',
  VIEW_OWN_ORDERS: 'view_own_orders',
  TRACK_ORDER: 'track_order',
  VIEW_ALL_ORDERS: 'view_all_orders',
  UPDATE_ORDER_STATUS: 'update_order_status',
  UPDATE_LOCATION: 'update_location',
  MANAGE_ORDERS: 'manage_orders',
  MANAGE_VEHICLES: 'manage_vehicles',
  MANAGE_USERS: 'manage_users',
  MANAGE_ROLES: 'manage_roles',
  VIEW_LOGS: 'view_logs',
  VIEW_ANALYTICS: 'view_analytics',
  ADMIN_ACCESS: 'admin_access'
} as const

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS]
