import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { nanoid } from 'nanoid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const usersFile = path.join(__dirname, 'data/users.json');

// Read existing users
let users = [];
try {
  if (fs.existsSync(usersFile)) {
    users = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));
  }
} catch (e) {
  console.log('Creating new users file...');
}

// Create a test user
const hash = await bcrypt.hash('test123', 10);
const testUser = {
  id: 'test-user-001',
  name: 'Test User',
  phone: '+254700000001',
  email: 'test@getdeals.co.ke',
  passwordHash: hash,
  role: 'quickmart',
  createdAt: new Date().toISOString()
};

// Check if user already exists
const existingIndex = users.findIndex(u => u.email === 'test@getdeals.co.ke');
if (existingIndex >= 0) {
  users[existingIndex] = testUser;
  console.log('Updated existing test user');
} else {
  users.push(testUser);
  console.log('Created new test user');
}

// Save users
fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
console.log('Test user saved successfully');
console.log('Email: test@getdeals.co.ke');
console.log('Password: test123');
console.log('Role: quickmart');
