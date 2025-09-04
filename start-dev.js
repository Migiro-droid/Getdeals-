#!/usr/bin/env node

/**
 * Development Startup Script
 * Runs both the main server and M-Pesa microservice
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting GetDeals Development Environment...\n');

// Start M-Pesa microservice
console.log('🔄 Starting M-Pesa Microservice on port 3001...');
const mpesaService = spawn('node', ['mpesa-service/index.js'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
});

mpesaService.on('error', (error) => {
  console.error('❌ Failed to start M-Pesa microservice:', error);
});

mpesaService.on('close', (code) => {
  console.log(`M-Pesa microservice exited with code ${code}`);
});

// Wait a moment for M-Pesa service to start
setTimeout(() => {
  console.log('\n🔄 Starting Main Server on port 4000...');
  const mainServer = spawn('node', ['server/index.js'], {
    cwd: __dirname,
    stdio: 'inherit',
    shell: true
  });

  mainServer.on('error', (error) => {
    console.error('❌ Failed to start main server:', error);
  });

  mainServer.on('close', (code) => {
    console.log(`Main server exited with code ${code}`);
  });

  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down services...');
    mpesaService.kill('SIGINT');
    mainServer.kill('SIGINT');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down services...');
    mpesaService.kill('SIGTERM');
    mainServer.kill('SIGTERM');
    process.exit(0);
  });

}, 2000);
