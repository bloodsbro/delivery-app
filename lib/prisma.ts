import { PrismaClient } from '@prisma/client'

function createPrisma() {
  const config = useRuntimeConfig();

  const localUrl = config.databaseUrlLocal || config.databaseUrlFallback || config.testDatabaseUrl
  const url = config.databaseUrl || ''
  const isAccelerate = url.startsWith('prisma+')
  const hasApiKey = !!config.prismaPostgresApiKey && config.prismaPostgresApiKey !== 'PRISMA_POSTGRES_API_KEY'
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
