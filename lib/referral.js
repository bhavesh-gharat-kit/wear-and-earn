import crypto from "crypto";

const DEFAULT_LENGTH = 8;
// Unambiguous A-Z + 2-9 (no O,0,I,1,L)
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function randomCode(len = DEFAULT_LENGTH) {
  const bytes = crypto.randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

/**
 * Generates a unique referral code and assigns it to the given user.
 * Safe against race conditions via DB UNIQUE constraint.
 *
 * @param prismaOrTx Prisma client or transaction
 * @param userId number
 * @param length optional code length (default 8)
 * @param maxAttempts safety limit (default 10)
 */
export async function generateAndAssignReferralCode(
  prismaOrTx,
  userId,
  length = DEFAULT_LENGTH,
  maxAttempts = 10
) {
  // First check if user already has a referral code
  const existingUser = await prismaOrTx.user.findUnique({
    where: { id: userId },
    select: { referralCode: true }
  });
  
  if (existingUser?.referralCode) {
    return existingUser.referralCode;
  }
  console.log(`Generating new referral code for user ${userId}`);
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const code = randomCode(length);
    try {
      const user = await prismaOrTx.user.update({
        where: { id: userId },
        data: { referralCode: code },
        select: { referralCode: true },
      });
      return user.referralCode;
    } catch (err) {
      // If unique constraint fails, try again with a new code
      const isUniqueViolation =
        err?.code === "P2002" || /unique/i.test(String(err?.message));
      if (!isUniqueViolation) throw err;
      // else loop and retry
    }
  }
  throw new Error("Failed to generate unique referral code after several attempts.");
}

/**
 * Simple function to generate a random referral code without assigning
 * Useful for testing or when you need just the code generation logic
 */
export function generateReferralCode(length = DEFAULT_LENGTH) {
  return randomCode(length);
}
