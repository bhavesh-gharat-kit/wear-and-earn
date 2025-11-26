const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTestUser() {
  const user = await prisma.user.findFirst({
    where: { fullName: 'Purchase Test User' },
    orderBy: { id: 'desc' }
  });
  console.log(user);
  //await prisma.$disconnect();
}

checkTestUser();
