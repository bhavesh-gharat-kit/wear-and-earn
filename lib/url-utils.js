/**
 * Generate dynamic base URL from request headers
 * This works in all environments (localhost, Vercel, custom domains)
 */
export function getBaseUrl(request) {
  // Try to get from headers first (works on Vercel and most hosts)
  const host = request.headers.get('host')
  const protocol = request.headers.get('x-forwarded-proto') || 
                   request.headers.get('x-forwarded-protocol') || 
                   (host?.includes('localhost') ? 'http' : 'https')
  
  if (host) {
    return `${protocol}://${host}`
  }
  
  // Fallback to environment variable
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL
  }
  
  // Final fallback for development
  return 'http://localhost:3000'
}

/**
 * Generate referral link with proper base URL
 */
export function generateReferralLink(request, referralCode) {
  const baseUrl = getBaseUrl(request)
  return `${baseUrl}/login-register?spid=${referralCode}`
}
