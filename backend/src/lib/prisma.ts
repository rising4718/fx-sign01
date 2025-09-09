/**
 * Prisma Client インスタンス
 * 作成日: 2025-09-09
 * 用途: データベース接続とクエリの統一管理
 */

import { PrismaClient } from '../generated/prisma';

// Prisma Client のシングルトンインスタンス
let prisma: PrismaClient;

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  // 開発環境では Hot reload時にコネクションが増大するのを防ぐ
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
    });
  }
  prisma = global.__prisma;
}

export { prisma };