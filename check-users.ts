import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('👥 Checking existing users...');
  
  const existingUsers = await prisma.user.findMany({
    select: { id: true, name: true, email: true, phone: true, role: true }
  });
  
  console.log(`Found ${existingUsers.length} existing users:`);
  existingUsers.forEach(user => {
    console.log(`- ${user.name} (${user.email}) - ${user.role} - Phone: ${user.phone}`);
  });
  
  if (existingUsers.length > 0) {
    console.log('\n🧹 Clearing existing users...');
    await prisma.user.deleteMany({});
    console.log('✅ All users cleared');
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log('✅ User check completed!');
  })
  .catch(async (e) => {
    console.error('❌ User check failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
