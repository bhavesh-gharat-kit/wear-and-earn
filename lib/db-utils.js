import prisma from './prisma';

/**
 * Wrapper function to handle database operations with retry logic
 * This helps prevent connection issues in serverless environments
 */
export async function withRetry(operation, maxRetries = 3, delay = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      console.error(`Database operation failed (attempt ${attempt}/${maxRetries}):`, error.message);
      
      // If it's the last attempt, throw the error
      if (attempt === maxRetries) {
        throw error;
      }
      
      // If it's a connection-related error, wait before retrying
      if (isConnectionError(error)) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      } else {
        // For non-connection errors, don't retry
        throw error;
      }
    }
  }
}

/**
 * Check if an error is related to database connection
 */
function isConnectionError(error) {
  const connectionErrorPatterns = [
    'connection',
    'timeout',
    'ECONNREFUSED',
    'ENOTFOUND',
    'ETIMEDOUT',
    'socket',
    'network',
    'connect',
    'P1001', // Prisma connection error
    'P1002', // Prisma connection timeout
    'P1008', // Operations timed out
  ];
  
  const errorMessage = error.message.toLowerCase();
  return connectionErrorPatterns.some(pattern => errorMessage.includes(pattern.toLowerCase()));
}

/**
 * Safe database query wrapper
 */
export async function safeQuery(queryFn) {
  try {
    return await withRetry(queryFn);
  } catch (error) {
    console.error('Database query failed after retries:', error);
    throw new Error(`Database operation failed: ${error.message}`);
  }
}

/**
 * Health check for database connection
 */
export async function checkDatabaseHealth() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { healthy: true };
  } catch (error) {
    console.error('Database health check failed:', error);
    return { healthy: false, error: error.message };
  }
}

export default prisma;