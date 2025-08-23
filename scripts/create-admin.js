const { PrismaClient } = require('../app/generated/prisma');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        fullName: 'Administrator',
        email: 'admin@wearandearn.com',
        mobileNo: '9999999999',
        password: hashedPassword,
        role: 'admin',
        isVerified: true,
        gender: 'Other'
      }
    });

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@wearandearn.com');
    console.log('📱 Mobile: 9999999999');
    console.log('🔑 Password: admin123');
    console.log('👤 Role: admin');
    console.log('🆔 User ID:', adminUser.id);
    
  } catch (error) {
    if (error.code === 'P2002') {
      console.error('❌ Admin user already exists with this email or mobile number');
    } else {
      console.error('❌ Error creating admin user:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
