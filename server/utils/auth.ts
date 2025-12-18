import prisma from '~/lib/prisma'
import type { H3Event } from 'h3';
import { getCookie, setCookie, deleteCookie } from 'h3'
import { signSession, verifySession } from '~/server/utils/session'

export async function currentUser(event: H3Event) {
  const raw = getCookie(event, 'session')
  const data = verifySession(raw)
  if (!data?.uid) return null
  const user = await prisma.user.findUnique({ where: { id: data.uid }, include: { role: true } })
  return user
}

export function setSession(event: H3Event, uid: string) {
  const config = useRuntimeConfig()
  const token = signSession({ uid })
  setCookie(event, 'session', token, { httpOnly: true, sameSite: 'lax', path: '/', secure: config.isProduction as boolean, maxAge: 60 * 60 * 24 * 7 })
}

export function clearSession(event: H3Event) {
  deleteCookie(event, 'session', { path: '/' })
}