"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
let globalPrisma = null;
function createPrismaClient() {
    try {
        const client = new client_1.PrismaClient({
            log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
        });
        console.log('Prisma client created successfully');
        return client;
    }
    catch (error) {
        console.error('Failed to create Prisma client:', error);
        throw error;
    }
}
function getPrismaClient() {
    if (process.env.NODE_ENV === 'production') {
        if (!globalPrisma) {
            globalPrisma = createPrismaClient();
        }
        return globalPrisma;
    }
    else {
        if (!global.__prisma) {
            global.__prisma = createPrismaClient();
        }
        return global.__prisma;
    }
}
exports.prisma = getPrismaClient();
//# sourceMappingURL=prisma.js.map