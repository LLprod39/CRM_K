import { PrismaClient } from '@prisma/client'

type GlobalPrisma = {
  prisma?: PrismaClient
  prismaDbUrl?: string
}

const globalForPrisma = globalThis as unknown as GlobalPrisma

const databaseUrl = process.env.DATABASE_URL || 'file:./prisma/dev.db'

if (!globalForPrisma.prisma || globalForPrisma.prismaDbUrl !== databaseUrl) {
  globalForPrisma.prisma = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl
      }
    }
  })
  globalForPrisma.prismaDbUrl = databaseUrl
}

export const prisma = globalForPrisma.prisma!

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
  globalForPrisma.prismaDbUrl = databaseUrl
}
