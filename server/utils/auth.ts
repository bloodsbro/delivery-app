import prisma from '~/lib/prisma'
import { getCookie, setCookie, deleteCookie } from 'h3'
import { signSession, verifySession } from '~/server/utils/session'

export async function currentUser(event: any) {
  const raw = getCookie(event, 'session')
  const data = verifySession(raw)
  if (!data?.uid) return null
  const user = await prisma.user.findUnique({ where: { id: data.uid }, include: { role: true } })
  return user
}

export function setSession(event: any, uid: string) {
  const token = signSession({ uid })
  setCookie(event, 'session', token, { httpOnly: true, sameSite: 'lax', path: '/', secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 24 * 7 })
}

export function clearSession(event: any) {
  deleteCookie(event, 'session', { path: '/' })
}