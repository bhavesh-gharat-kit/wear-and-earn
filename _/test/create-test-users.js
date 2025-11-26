/**
 * Create test users with 9 teams to verify promotion system
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createTestUsersWithTeams() {
  console.log('🧪 Creating test users with 9 teams for promotion testing\n')
  
  try {
    await prisma.$transaction(async (tx) => {
      // Create a test user
      const testUser = await tx.user.create({
        data: {
          fullName: 'Test User L2',
          email: 'testl2@example.com',
          password: 'hashedpassword',
          mobileNo: '9999999999',
          isActive: true,
          teamCount: 9, // Set to 9 teams to trigger L2 promotion
          directTeams: 9,
          level: 1 // Currently L1, should be promoted to L2
        }
      })
      
      console.log(`✅ Created test user: ${testUser.fullName} (ID: ${testUser.id})`)
      console.log(`   Teams: ${testUser.teamCount} | Level: L${testUser.level}`)
      
      // Create another test user with even more teams
      const testUser2 = await tx.user.create({
        data: {
          fullName: 'Test User L3',
          email: 'testl3@example.com', 
          password: 'hashedpassword',
          mobileNo: '9999999998',
          isActive: true,
          teamCount: 30, // Set to 30 teams to trigger L3 promotion
          directTeams: 30,
          level: 1 // Currently L1, should be promoted to L3
        }
      })
      
      console.log(`✅ Created test user: ${testUser2.fullName} (ID: ${testUser2.id})`)
      console.log(`   Teams: ${testUser2.teamCount} | Level: L${testUser2.level}`)
      
      // Now test the promotion logic
      console.log('\n🔄 Testing promotion logic...')
      
      // Test L2 promotion (9 teams)
      await testPromotion(tx, testUser.id)
      
      // Test L3 promotion (30 teams)  
      await testPromotion(tx, testUser2.id)
    })
    
  } catch (error) {
    console.error('❌ Error creating test users:', error)
  } finally {
    await prisma.$disconnect()
  }
}

async function testPromotion(tx, userId) {
  const user = await tx.user.findUnique({
    where: { id: userId },
    select: { 
      id: true,
      fullName: true,
      teamCount: true, 
      level: true 
    }
  })
  
  // Calculate expected level
  const LEVEL_REQUIREMENTS = {
    1: 1,    // L1: 1 team
    2: 9,    // L2: 9 teams  
    3: 27,   // L3: 27 teams
    4: 81,   // L4: 81 teams
    5: 243   // L5: 243 teams
  }
  
  let expectedLevel = 0
  for (const [level, requirement] of Object.entries(LEVEL_REQUIREMENTS)) {
    if (user.teamCount >= requirement) {
      expectedLevel = parseInt(level)
    }
  }
  
  console.log(`👤 ${user.fullName}: ${user.teamCount} teams → Should be L${expectedLevel} (Currently L${user.level})`)
  
  // Update user to correct level if needed
  if (expectedLevel > user.level) {
    await tx.user.update({
      where: { id: userId },
      data: { level: expectedLevel }
    })
    
    console.log(`🎉 Promoted ${user.fullName} from L${user.level} to L${expectedLevel}`)
  } else {
    console.log(`✅ ${user.fullName} is already at correct level L${user.level}`)
  }
}

// Run the test
createTestUsersWithTeams()