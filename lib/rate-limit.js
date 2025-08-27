import { NextResponse } from 'next/server'

// In-memory store for rate limiting (in production, use Redis)
const store = new Map()

export function rateLimit({ interval = 60 * 1000, uniqueTokenPerInterval = 500 } = {}) {
  return {
    check: async (limit, token) => {
      const tokenKey = `${token}_${Math.floor(Date.now() / interval)}`
      
      // Clean up old entries periodically
      if (Math.random() < 0.01) { // 1% chance to cleanup
        const now = Date.now()
        for (const [key, data] of store.entries()) {
          if (now - data.resetTime > interval * 2) {
            store.delete(key)
          }
        }
      }

      const tokenData = store.get(tokenKey) || { count: 0, resetTime: Date.now() + interval }
      
      if (tokenData.count >= limit) {
        const error = new Error('Rate limit exceeded')
        error.status = 429
        throw error
      }

      tokenData.count++
      store.set(tokenKey, tokenData)
      
      return {
        limit,
        remaining: Math.max(0, limit - tokenData.count),
        reset: new Date(tokenData.resetTime)
      }
    }
  }
}

// IP-based rate limiting middleware
export function createIPRateLimit(options = {}) {
  const limiter = rateLimit(options)
  
  return async (request, limit = 10) => {
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown'
    
    try {
      const result = await limiter.check(limit, ip)
      return result
    } catch (error) {
      throw new Error('Rate limit exceeded')
    }
  }
}

// User-based rate limiting
export function createUserRateLimit(options = {}) {
  const limiter = rateLimit(options)
  
  return async (userId, limit = 20) => {
    try {
      const result = await limiter.check(limit, `user_${userId}`)
      return result
    } catch (error) {
      throw new Error('Rate limit exceeded')
    }
  }
}

// Rate limiting response helper
export function rateLimitResponse(message = 'Too many requests') {
  return NextResponse.json(
    { 
      error: message,
      retryAfter: '1 minute'
    },
    { 
      status: 429,
      headers: {
        'Retry-After': '60'
      }
    }
  )
}

// Advanced rate limiting with different tiers
export class TieredRateLimit {
  constructor() {
    this.limits = new Map()
  }

  async check(identifier, tier = 'default') {
    const tiers = {
      default: { limit: 10, interval: 60 * 1000 },
      user: { limit: 30, interval: 60 * 1000 },
      admin: { limit: 100, interval: 60 * 1000 },
      api: { limit: 1000, interval: 60 * 1000 }
    }

    const config = tiers[tier] || tiers.default
    const limiter = rateLimit(config)
    
    return await limiter.check(config.limit, `${tier}_${identifier}`)
  }
}

// Export a default rate limiter instance
export const defaultRateLimit = rateLimit()

// Export rate limit configurations
export const rateLimitConfigs = {
  // API endpoints
  api: {
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 500
  },
  
  // Authentication endpoints
  auth: {
    interval: 15 * 60 * 1000, // 15 minutes
    uniqueTokenPerInterval: 100
  },
  
  // Admin endpoints
  admin: {
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 200
  },
  
  // Public endpoints
  public: {
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 1000
  }
}
