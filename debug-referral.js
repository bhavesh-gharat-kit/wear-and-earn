const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugAndFixReferralCode() {
  console.log('🔍 Debugging referral code generation...');
  
  const userId = 2;
  
  try {
    // Test code generation
    for (let i = 0; i < 3; i++) {
      const referralCode = `WE${userId.toString().padStart(4, '0')}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      console.log(`Generated code ${i + 1}: ${referralCode}`);
      
      // Check if it exists in database
      const existing = await prisma.user.findUnique({
        where: { referralCode }
      });
      
      console.log(`Code ${referralCode} exists in DB: ${existing ? 'YES' : 'NO'}`);
      
      if (!existing) {
        console.log(`✅ Code ${referralCode} is unique and available`);
        
        // Try to assign it
        try {
          const updated = await prisma.user.update({
            where: { id: userId },
            data: { 
              referralCode,
              isActive: true
            }
          });
          
          console.log(`✅ Successfully assigned code ${referralCode} to user ${userId}`);
          console.log('Updated user:', { id: updated.id, name: updated.fullName, code: updated.referralCode, active: updated.isActive });
          break;
        } catch (error) {
          console.error(`❌ Error assigning code: ${error.message}`);
        }
      }
    }
    
    // Check all users with referral codes now
    const usersWithCodes = await prisma.user.findMany({
      where: { referralCode: { not: null } },
      select: { id: true, fullName: true, referralCode: true, isActive: true }
    });
    
    console.log('\n📊 Users with referral codes:');
    usersWithCodes.forEach(user => {
      console.log(`ID: ${user.id}, Name: ${user.fullName}, Code: ${user.referralCode}, Active: ${user.isActive}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

debugAndFixReferralCode();
