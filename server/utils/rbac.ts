import { currentUser } from './auth'
import type { Permission } from '~/utils/permissions'
import type { H3Event } from 'h3'

export async function requirePermission(event: H3Event, permission: Permission) {
  const user = await currentUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  // Admin role check as fallback/superuser
  if (user.role.name === 'admin') return user

  let permissions: string[] = []
  if (user.role.permissions) {
    if (typeof user.role.permissions === 'string') {
      try { permissions = JSON.parse(user.role.permissions) } catch {
        /* empty */
      }
    } else if (Array.isArray(user.role.permissions)) {
      permissions = user.role.permissions as string[]
    }
  }

  if (permissions.includes('*') || permissions.includes(permission)) {
    return user
  }

  throw createError({ statusCode: 403, statusMessage: 'Forbidden: Missing permission ' + permission })
}
