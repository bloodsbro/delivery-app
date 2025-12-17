import { beforeAll, afterAll } from 'vitest'
import prisma from '~/lib/prisma'

// Global test setup
beforeAll(async () => {
  // Ensure test database is connected
  await prisma.$connect()
})

afterAll(async () => {
  // Clean up database connection
  await prisma.$disconnect()
})

// Set test environment variables
process.env.NODE_ENV = 'test'
process.env.SESSION_SECRET = 'test-secret-key'
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test_db'
