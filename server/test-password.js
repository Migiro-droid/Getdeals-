import bcrypt from 'bcryptjs';

const testPassword = 'quickmart123';
const storedHash = '$2a$10$7rdF9EyoBP7wN9VincQ5g.U8oZSxbadZT3wGnS4gnTInfEIHQ2Wua';

console.log('Testing password verification...');
console.log('Password:', testPassword);
console.log('Stored hash:', storedHash);

const isValid = await bcrypt.compare(testPassword, storedHash);
console.log('Password is valid:', isValid);

if (isValid) {
  console.log('✅ Password verification successful!');
} else {
  console.log('❌ Password verification failed!');
  
  // Test with a fresh hash
  const newHash = await bcrypt.hash(testPassword, 10);
  console.log('New hash generated:', newHash);
  const newTest = await bcrypt.compare(testPassword, newHash);
  console.log('New hash verification:', newTest);
}
