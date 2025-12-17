import { createHmac, randomBytes } from 'crypto'

const ALG = 'sha256'

function getSecret() {
  return process.env.SESSION_SECRET || 'dev-secret'
}

export function signSession(payload: Record<string, any>): string {
  const data = { ...payload, iat: Date.now(), nonce: randomBytes(8).toString('hex') }
  const json = JSON.stringify(data)
  const b64 = Buffer.from(json).toString('base64url')
  const sig = createHmac(ALG, getSecret()).update(b64).digest('base64url')
  return `${b64}.${sig}`
}

export function verifySession(token?: string): Record<string, any> | null {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 2) return null
  const [b64, sig] = parts
  const expected = createHmac(ALG, getSecret()).update(b64).digest('base64url')
  if (sig !== expected) return null
  try {
    const json = Buffer.from(b64, 'base64url').toString('utf8')
    return JSON.parse(json)
  } catch {
    return null
  }
}