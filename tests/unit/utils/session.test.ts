import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { signSession, verifySession } from '~/server/utils/session'

describe('Session Utilities', () => {
  const originalEnv = process.env.SESSION_SECRET

  afterEach(() => {
    process.env.SESSION_SECRET = originalEnv
  })

  describe('signSession', () => {
    it('should create a valid token with payload', () => {
      const payload = { userId: '123', role: 'admin' }
      const token = signSession(payload)

      expect(token).toBeTruthy()
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(2)
    })

    it('should include timestamp and nonce in token', () => {
      const payload = { userId: '456' }
      const token = signSession(payload)
      const verified = verifySession(token)

      expect(verified).toBeTruthy()
      expect(verified?.userId).toBe('456')
      expect(verified?.iat).toBeTruthy()
      expect(verified?.nonce).toBeTruthy()
      expect(typeof verified?.iat).toBe('number')
      expect(typeof verified?.nonce).toBe('string')
    })

    it('should create different tokens for same payload (nonce)', () => {
      const payload = { userId: '789' }
      const token1 = signSession(payload)
      const token2 = signSession(payload)

      expect(token1).not.toBe(token2)
    })

    it('should handle empty payload', () => {
      const token = signSession({})
      const verified = verifySession(token)

      expect(verified).toBeTruthy()
      expect(verified?.iat).toBeTruthy()
      expect(verified?.nonce).toBeTruthy()
    })

    it('should handle complex nested payload', () => {
      const payload = {
        user: {
          id: '123',
          email: 'test@example.com',
          roles: ['admin', 'user']
        },
        permissions: { read: true, write: true }
      }
      const token = signSession(payload)
      const verified = verifySession(token)

      expect(verified?.user.id).toBe('123')
      expect(verified?.user.email).toBe('test@example.com')
      expect(verified?.user.roles).toEqual(['admin', 'user'])
      expect(verified?.permissions.read).toBe(true)
    })
  })

  describe('verifySession', () => {
    it('should verify valid token', () => {
      const payload = { userId: '999', role: 'customer' }
      const token = signSession(payload)
      const verified = verifySession(token)

      expect(verified).toBeTruthy()
      expect(verified?.userId).toBe('999')
      expect(verified?.role).toBe('customer')
    })

    it('should return null for undefined token', () => {
      const verified = verifySession(undefined)
      expect(verified).toBeNull()
    })

    it('should return null for empty string token', () => {
      const verified = verifySession('')
      expect(verified).toBeNull()
    })

    it('should return null for malformed token (no dot)', () => {
      const verified = verifySession('invalid-token-without-dot')
      expect(verified).toBeNull()
    })

    it('should return null for token with wrong number of parts', () => {
      const verified = verifySession('part1.part2.part3')
      expect(verified).toBeNull()
    })

    it('should return null for token with invalid signature', () => {
      const payload = { userId: '111' }
      const token = signSession(payload)
      const [data] = token.split('.')
      const tamperedToken = `${data}.invalidsignature`

      const verified = verifySession(tamperedToken)
      expect(verified).toBeNull()
    })

    it('should return null when secret is changed', () => {
      process.env.SESSION_SECRET = 'secret1'
      const payload = { userId: '222' }
      const token = signSession(payload)

      process.env.SESSION_SECRET = 'secret2'
      const verified = verifySession(token)

      expect(verified).toBeNull()
    })

    it('should fail verification with wrong secret', () => {
      process.env.SESSION_SECRET = 'correct-secret'
      const token = signSession({ userId: '333' })

      process.env.SESSION_SECRET = 'wrong-secret'
      const verified = verifySession(token)

      expect(verified).toBeNull()
    })

    it('should return null for token with tampered data', () => {
      const payload = { userId: '444', role: 'user' }
      const token = signSession(payload)
      const [data, sig] = token.split('.')

      // Tamper with data
      const tamperedData = Buffer.from(JSON.stringify({ userId: '444', role: 'admin' }))
        .toString('base64url')
      const tamperedToken = `${tamperedData}.${sig}`

      const verified = verifySession(tamperedToken)
      expect(verified).toBeNull()
    })

    it('should return null for token with invalid base64', () => {
      const verified = verifySession('!!!invalid!!!.base64')
      expect(verified).toBeNull()
    })

    it('should return null for token with invalid JSON', () => {
      const invalidJson = Buffer.from('not valid json').toString('base64url')
      const sig = 'somesignature'
      const verified = verifySession(`${invalidJson}.${sig}`)

      expect(verified).toBeNull()
    })

    it('should handle token with special characters in payload', () => {
      const payload = {
        userId: '555',
        name: 'Test User with "quotes" and \'apostrophes\'',
        data: 'Special chars: <>?/\\|!@#$%^&*()'
      }
      const token = signSession(payload)
      const verified = verifySession(token)

      expect(verified?.userId).toBe('555')
      expect(verified?.name).toBe('Test User with "quotes" and \'apostrophes\'')
      expect(verified?.data).toBe('Special chars: <>?/\\|!@#$%^&*()')
    })
  })

  describe('signSession with different secrets', () => {
    it('should use dev-secret as default', () => {
      delete process.env.SESSION_SECRET
      const payload = { userId: '666' }
      const token = signSession(payload)

      const verified = verifySession(token)
      expect(verified?.userId).toBe('666')
    })

    it('should use custom secret from environment', () => {
      process.env.SESSION_SECRET = 'my-custom-secret-key'
      const payload = { userId: '777' }
      const token = signSession(payload)

      const verified = verifySession(token)
      expect(verified?.userId).toBe('777')
    })

    it('should create different tokens with different secrets', () => {
      process.env.SESSION_SECRET = 'secret-a'
      const token1 = signSession({ userId: '888' })

      process.env.SESSION_SECRET = 'secret-b'
      const token2 = signSession({ userId: '888' })

      expect(token1).not.toBe(token2)
    })
  })

  describe('Round-trip verification', () => {
    it('should correctly sign and verify multiple times', () => {
      const payloads = [
        { userId: '1', role: 'admin' },
        { userId: '2', role: 'courier' },
        { userId: '3', role: 'customer' }
      ]

      payloads.forEach((payload) => {
        const token = signSession(payload)
        const verified = verifySession(token)

        expect(verified?.userId).toBe(payload.userId)
        expect(verified?.role).toBe(payload.role)
      })
    })

    it('should handle token expiration concept (timestamp check)', () => {
      const payload = { userId: '999' }
      const token = signSession(payload)
      const verified = verifySession(token)

      expect(verified?.iat).toBeTruthy()
      expect(Date.now() - verified!.iat).toBeLessThan(1000) // Created within 1 second
    })
  })
})
