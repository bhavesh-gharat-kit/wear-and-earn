// Simple logging utility for debugging and error tracking

export const addToLog = (level, message, data = null) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level: level.toUpperCase(),
    message,
    data
  };

  // Log to console with appropriate method
  switch (level.toLowerCase()) {
    case 'error':
      console.error(`[${timestamp}] ERROR:`, message, data);
      break;
    case 'warn':
    case 'warning':
      console.warn(`[${timestamp}] WARN:`, message, data);
      break;
    case 'info':
      console.info(`[${timestamp}] INFO:`, message, data);
      break;
    case 'debug':
      console.debug(`[${timestamp}] DEBUG:`, message, data);
      break;
    default:
      console.log(`[${timestamp}] ${level.toUpperCase()}:`, message, data);
  }

  // In production, you might want to send logs to external service
  // Example: Send to logging service like Winston, Sentry, etc.
  
  return logEntry;
};