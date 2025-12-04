/* eslint-disable @typescript-eslint/no-explicit-any */

// Type definition for Prisma client
interface PrismaClientType {
  user: any
  transaction: any
  forecast: any
  alert: any
  $connect: () => Promise<void>
  $disconnect: () => Promise<void>
}

// Create a mock client for build time when Prisma isn't available
function createMockClient(): PrismaClientType {
  const mockModel = {
    findMany: async () => [],
    findUnique: async () => null,
    findFirst: async () => null,
    create: async () => ({}),
    createMany: async () => ({ count: 0 }),
    update: async () => ({}),
    updateMany: async () => ({ count: 0 }),
    delete: async () => ({}),
    deleteMany: async () => ({ count: 0 }),
    upsert: async () => ({}),
    count: async () => 0,
  }

  return {
    user: mockModel,
    transaction: mockModel,
    forecast: mockModel,
    alert: mockModel,
    $connect: async () => {},
    $disconnect: async () => {},
  }
}

function createPrismaClient(): PrismaClientType {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaClient } = require('@prisma/client')
    return new PrismaClient()
  } catch {
    console.warn('Prisma client not available, using mock client')
    return createMockClient()
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientType | undefined
}

export const prisma: PrismaClientType =
  globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
