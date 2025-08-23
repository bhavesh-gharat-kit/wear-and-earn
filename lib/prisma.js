import { PrismaClient } from '@/app/generated/prisma';

let prisma;

if (typeof window === 'undefined') {
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
} else {
  prisma = new PrismaClient(); // fallback for client side, not used in practice
}

export default prisma;
