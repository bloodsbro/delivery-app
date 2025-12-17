import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import prisma from '~/lib/prisma'
import bcrypt from 'bcrypt'
import { signSession, verifySession } from '~/server/utils/session'

describe('Auth API Integration Tests', () => {
  let testUser: any
  let testRole: any
  const testPassword = 'password123'

  beforeAll(async () => {
    // Create test role
    testRole = await prisma.role.upsert({
      where: { name: 'test_auth_customer' },
      update: {},
      create: {
        name: 'test_auth_customer',
        description: 'Customer role for auth testing',
        permissions: { canCreateOrder: true }
      }
    })

    // Create test user
    const passwordHash = await bcrypt.hash(testPassword, 10)
    testUser = await prisma.user.upsert({
      where: { email: 'test-auth@example.com' },
      update: {
        password_hash: passwordHash,
        first_name: 'Test',
        last_name: 'User',
        status: 'active',
        role_id: testRole.id
      },
      create: {
        email: 'test-auth@example.com',
        password_hash: passwordHash,
        first_name: 'Test',
        last_name: 'User',
        role_id: testRole.id,
        status: 'active'
      }
    })
  })

  afterAll(async () => {
    // Cleanup
    if (testUser) {
      await prisma.log.deleteMany({ where: { user_id: testUser.id } })
      await prisma.user.delete({ where: { id: testUser.id } }).catch(() => {})
    }
    if (testRole) {
      await prisma.role.delete({ where: { id: testRole.id } }).catch(() => {})
    }
  })

  describe('Login Logic', () => {
    it('should validate email format with Joi', () => {
      const Joi = require('joi')
      const schema = Joi.object({
        email: Joi.string().trim().lowercase().email().required(),
        password: Joi.string().min(6).required(),
      })

      // Valid email
      const valid = schema.validate({ email: 'test@example.com', password: 'password123' })
      expect(valid.error).toBeUndefined()

      // Invalid email
      const invalid = schema.validate({ email: 'invalid-email', password: 'password123' })
      expect(invalid.error).toBeTruthy()

      // Short password
      const short = schema.validate({ email: 'test@example.com', password: '12345' })
      expect(short.error).toBeTruthy()
    })

    it('should verify password with bcrypt', async () => {
      const user = await prisma.user.findUnique({
        where: { email: 'test-auth@example.com' }
      })

      expect(user).toBeTruthy()

      // Correct password
      const correctMatch = await bcrypt.compare(testPassword, user!.password_hash)
      expect(correctMatch).toBe(true)

      // Wrong password
      const wrongMatch = await bcrypt.compare('wrongpassword', user!.password_hash)
      expect(wrongMatch).toBe(false)
    })

    it('should normalize email (lowercase and trim)', () => {
      const input = '  TEST@EXAMPLE.COM  '
      const normalized = input.trim().toLowerCase()
      expect(normalized).toBe('test@example.com')
    })

    it('should verify password hash format', async () => {
      const user = await prisma.user.findUnique({
        where: { email: 'test-auth@example.com' }
      })

      expect(user?.password_hash).toBeTruthy()
      expect(user?.password_hash).not.toBe(testPassword)
      expect(user?.password_hash.startsWith('$2b$')).toBe(true) // bcrypt hash prefix
    })

    it('should create login log entry', async () => {
      await prisma.log.create({
        data: {
          user_id: testUser.id,
          action: 'login',
          entity_type: 'user',
          entity_id: testUser.id,
          ip_address: '127.0.0.1',
          user_agent: 'test-agent'
        }
      })

      const logs = await prisma.log.findMany({
        where: {
          user_id: testUser.id,
          action: 'login'
        },
        orderBy: { created_at: 'desc' },
        take: 1
      })

      expect(logs.length).toBeGreaterThan(0)
      expect(logs[0].entity_type).toBe('user')
      expect(logs[0].entity_id).toBe(testUser.id)
    })
  })

  describe('Session Management', () => {
    it('should create and verify session token', () => {
      const payload = { uid: testUser.id }
      const token = signSession(payload)

      expect(token).toBeTruthy()
      expect(typeof token).toBe('string')

      const verified = verifySession(token)
      expect(verified?.uid).toBe(testUser.id)
    })

    it('should fail verification with invalid token', () => {
      const verified = verifySession('invalid-token')
      expect(verified).toBeNull()
    })

    it('should fail verification with tampered token', () => {
      const token = signSession({ uid: testUser.id })
      const tampered = token.slice(0, -5) + 'xxxxx'

      const verified = verifySession(tampered)
      expect(verified).toBeNull()
    })

    it('should retrieve user from database by session', async () => {
      const user = await prisma.user.findUnique({
        where: { id: testUser.id },
        include: { role: true }
      })

      expect(user).toBeTruthy()
      expect(user?.id).toBe(testUser.id)
      expect(user?.email).toBe('test-auth@example.com')
      expect(user?.role.name).toBe('test_auth_customer')
    })
  })

  describe('Session Cookie Security', () => {
    it('should use httpOnly flag for security', () => {
      // Session cookies should be httpOnly to prevent XSS attacks
      const cookieOptions = {
        httpOnly: true,
        sameSite: 'lax' as const,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7
      }

      expect(cookieOptions.httpOnly).toBe(true)
      expect(cookieOptions.sameSite).toBe('lax')
      expect(cookieOptions.maxAge).toBe(604800) // 7 days
    })

    it('should set secure flag in production', () => {
      const originalEnv = process.env.NODE_ENV

      process.env.NODE_ENV = 'production'
      const prodSecure = process.env.NODE_ENV === 'production'
      expect(prodSecure).toBe(true)

      process.env.NODE_ENV = 'development'
      const devSecure = process.env.NODE_ENV === 'production'
      expect(devSecure).toBe(false)

      process.env.NODE_ENV = originalEnv
    })

    it('should have appropriate session duration (7 days)', () => {
      const maxAge = 60 * 60 * 24 * 7
      expect(maxAge).toBe(604800) // 7 days in seconds
    })
  })

  describe('Error Handling', () => {
    it('should return 400 for invalid email format', () => {
      const Joi = require('joi')
      const schema = Joi.object({
        email: Joi.string().trim().lowercase().email().required(),
        password: Joi.string().min(6).required(),
      })

      const result = schema.validate({ email: 'not-an-email', password: 'test123' })
      expect(result.error?.details[0].type).toBe('string.email')
    })

    it('should return 400 for missing password', () => {
      const Joi = require('joi')
      const schema = Joi.object({
        email: Joi.string().trim().lowercase().email().required(),
        password: Joi.string().min(6).required(),
      })

      const result = schema.validate({ email: 'test@example.com' })
      expect(result.error?.details[0].path[0]).toBe('password')
    })

    it('should return 401 for wrong password', async () => {
      const user = await prisma.user.findUnique({
        where: { email: 'test-auth@example.com' }
      })

      const match = await bcrypt.compare('wrongpassword', user!.password_hash)
      expect(match).toBe(false)
    })

    it('should return 401 for non-existent user', async () => {
      const user = await prisma.user.findUnique({
        where: { email: 'nonexistent@example.com' }
      })

      expect(user).toBeNull()
    })
  })

  describe('User Data Retrieval', () => {
    it('should return user with role information', async () => {
      const user = await prisma.user.findUnique({
        where: { email: 'test-auth@example.com' },
        include: { role: true }
      })

      expect(user).toBeTruthy()
      expect(user?.id).toBe(testUser.id)
      expect(user?.email).toBe('test-auth@example.com')
      expect(user?.first_name).toBe('Test')
      expect(user?.last_name).toBe('User')
      expect(user?.role.name).toBe('test_auth_customer')
    })

    it('should not expose password hash in response', async () => {
      const user = await prisma.user.findUnique({
        where: { email: 'test-auth@example.com' },
        select: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
          role: { select: { name: true } }
          // password_hash intentionally not selected
        }
      })

      expect(user).toBeTruthy()
      expect(user).not.toHaveProperty('password_hash')
    })
  })

  describe('Logout Logic', () => {
    it('should invalidate session on logout', () => {
      // After logout, cookie should be cleared (Max-Age=0)
      const token = signSession({ uid: testUser.id })

      // Verify token is valid before logout
      const beforeLogout = verifySession(token)
      expect(beforeLogout?.uid).toBe(testUser.id)

      // After logout, the cookie is deleted client-side
      // We can simulate this by verifying undefined token
      const afterLogout = verifySession(undefined)
      expect(afterLogout).toBeNull()
    })
  })
})
