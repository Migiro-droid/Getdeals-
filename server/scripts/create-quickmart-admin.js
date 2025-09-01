import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const usersFile = path.join(__dirname, '../data/users.json');

// Ensure data directory exists
const dataDir = path.dirname(usersFile);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Read existing users
let users = [];
try {
  if (fs.existsSync(usersFile)) {
    users = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));
  }
} catch (e) {
  console.log('Creating new users file...');
}

// Create QuickMart admin user
const hash = await bcrypt.hash('quickmart123', 10);
const quickmartAdmin = {
  id: 'quickmart-admin-001',
  name: 'QuickMart Admin',
  phone: '+254700000000',
  email: 'quickmart@getdeals.co.ke',
  passwordHash: hash,
  role: 'quickmart',
  createdAt: new Date().toISOString()
};

// Check if user already exists
const existingIndex = users.findIndex(u => u.email === 'quickmart@getdeals.co.ke');
if (existingIndex >= 0) {
  users[existingIndex] = quickmartAdmin;
  console.log('Updated existing QuickMart admin user');
} else {
  users.push(quickmartAdmin);
  console.log('Created new QuickMart admin user');
}

// Save users
fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
console.log('QuickMart admin user saved successfully');
console.log('Email: quickmart@getdeals.co.ke');
console.log('Password: quickmart123');
