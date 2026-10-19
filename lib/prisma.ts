import { PrismaClient } from '@prisma/client';

function getDatabaseUrl(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (!url) return undefined;
  if (url.includes('pgbouncer=true')) {
    return url;
  }
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}pgbouncer=true`;
}

const pooledUrl = getDatabaseUrl();
if (pooledUrl && process.env.DATABASE_URL !== pooledUrl) {
  process.env.DATABASE_URL = pooledUrl;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient(
    pooledUrl
      ? {
          datasources: {
            db: {
              url: pooledUrl,
            },
          },
        }
      : undefined
  );

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
