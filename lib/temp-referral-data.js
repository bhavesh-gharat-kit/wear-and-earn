// Temporary hardcoded referral data for known users
export const TEMP_REFERRAL_DATA = {
  'darshan@gmail.com': {
    referralCode: 'XK3EXQHS',
    isActive: true
  }
  // Add more users as needed
}

export function getTempReferralData(email) {
  return TEMP_REFERRAL_DATA[email] || null
}
