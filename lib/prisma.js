import { PrismaClient } from '@prisma/client';

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  errorFormat: 'minimal',
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Add graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

// Helper function to ensure connection with retries
const ensureConnection = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      await prisma.$connect();
      return true;
    } catch (error) {
      console.error(`Database connection attempt ${i + 1} failed:`, error.message);
      if (i === retries - 1) {
        console.error('Failed to connect to database after all retries');
        return false;
      }
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
  return false;
};

// Wrapper function for Prisma operations with connection handling
export const withConnection = async (operation) => {
  try {
    // Ensure connection before operation
    const connected = await ensureConnection();
    if (!connected) {
      throw new Error('Database connection failed');
    }
    
    return await operation(prisma);
  } catch (error) {
    console.error('Database operation failed:', error.message);
    
    // If connection error, try to reconnect and retry once
    if (error.message.includes('Engine is not yet connected') || error.message.includes('Response from the Engine was empty')) {
      console.log('Attempting to reconnect and retry operation...');
      try {
        //await prisma.$disconnect();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const reconnected = await ensureConnection();
        if (reconnected) {
          return await operation(prisma);
        }
      } catch (retryError) {
        console.error('Retry operation also failed:', retryError.message);
      }
    }
    
    throw error;
  }
};

export default prisma;
