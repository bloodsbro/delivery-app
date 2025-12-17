import { PrismaClient } from '@prisma/client'

function createPrisma() {
  const localUrl = process.env.DATABASE_URL_LOCAL || process.env.DATABASE_URL_FALLBACK || process.env.TEST_DATABASE_URL
  const url = process.env.DATABASE_URL || ''
  const isAccelerate = url.startsWith('prisma+')
  const hasApiKey = !!process.env.PRISMA_POSTGRES_API_KEY && process.env.PRISMA_POSTGRES_API_KEY !== 'PRISMA_POSTGRES_API_KEY'
  if (isAccelerate && !hasApiKey && localUrl) {
    return new PrismaClient({ datasources: { db: { url: localUrl } } })
  }
  if (!url && localUrl) {
    return new PrismaClient({ datasources: { db: { url: localUrl } } })
  }
  return new PrismaClient()
}

declare const globalThis: {
  prismaGlobal: ReturnType<typeof createPrisma>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? createPrisma()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
