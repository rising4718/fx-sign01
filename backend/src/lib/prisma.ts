/**
 * Prisma Client インスタンス
 * 作成日: 2025-09-09
 * 用途: データベース接続とクエリの統一管理
 */

import { PrismaClient } from '@prisma/client';

// グローバル変数の型定義
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

// Prisma Client のシングルトンインスタンス
let globalPrisma: PrismaClient | null = null;

function createPrismaClient(): PrismaClient {
  try {
    const client = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    });
    console.log('Prisma client created successfully');
    return client;
  } catch (error) {
    console.error('Failed to create Prisma client:', error);
    throw error;
  }
}

// Initialize Prisma client with proper error handling
function getPrismaClient(): PrismaClient {
  if (process.env.NODE_ENV === 'production') {
    if (!globalPrisma) {
      globalPrisma = createPrismaClient();
    }
    return globalPrisma;
  } else {
    // 開発環境では Hot reload時にコネクションが増大するのを防ぐ
    if (!global.__prisma) {
      global.__prisma = createPrismaClient();
    }
    return global.__prisma;
  }
}

export const prisma = getPrismaClient();