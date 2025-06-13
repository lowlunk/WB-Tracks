#!/usr/bin/env node

// Deployment readiness checker
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Deployment Readiness Check');
console.log('============================\n');

const checks = [
  checkPackageJson,
  checkBuildScript,
  checkStartScript,
  checkEnvironmentExample,
  checkStaticAssets,
  checkDistDirectory
];

async function runChecks() {
  let allPassed = true;
  
  for (const check of checks) {
    try {
      await check();
    } catch (error) {
      console.error(`❌ ${error.message}`);
      allPassed = false;
    }
  }
  
  if (allPassed) {
    console.log('\n✅ All deployment checks passed!');
    console.log('🎯 Ready for deployment to Replit.');
  } else {
    console.log('\n❌ Some deployment checks failed.');
    console.log('Please fix the issues above before deploying.');
    process.exit(1);
  }
}

function checkPackageJson() {
  const packagePath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(packagePath)) {
    throw new Error('package.json not found');
  }
  
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  if (!pkg.scripts.build) {
    throw new Error('Missing build script in package.json');
  }
  
  if (!pkg.scripts.start) {
    throw new Error('Missing start script in package.json');
  }
  
  console.log('✓ package.json configured correctly');
}

function checkBuildScript() {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const buildScript = pkg.scripts.build;
  
  if (!buildScript.includes('vite build')) {
    throw new Error('Build script should include "vite build"');
  }
  
  if (!buildScript.includes('esbuild')) {
    throw new Error('Build script should include server bundling with esbuild');
  }
  
  console.log('✓ Build script configured correctly');
}

function checkStartScript() {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const startScript = pkg.scripts.start;
  
  if (!startScript.includes('NODE_ENV=production')) {
    throw new Error('Start script should set NODE_ENV=production');
  }
  
  if (!startScript.includes('node dist/index.js')) {
    throw new Error('Start script should run the built server from dist/');
  }
  
  console.log('✓ Start script configured correctly');
}

function checkEnvironmentExample() {
  if (!fs.existsSync('.env.example')) {
    throw new Error('.env.example file missing');
  }
  
  const envExample = fs.readFileSync('.env.example', 'utf8');
  const requiredVars = ['DATABASE_URL', 'NODE_ENV', 'PORT', 'HOST'];
  
  for (const varName of requiredVars) {
    if (!envExample.includes(varName)) {
      throw new Error(`Missing ${varName} in .env.example`);
    }
  }
  
  console.log('✓ Environment variables documented');
}

function checkStaticAssets() {
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('✓ Created uploads directory');
  } else {
    console.log('✓ Uploads directory exists');
  }
}

function checkDistDirectory() {
  const distDir = path.join(process.cwd(), 'dist');
  if (fs.existsSync(distDir)) {
    console.log('✓ Previous build artifacts found (will be replaced)');
  } else {
    console.log('✓ Ready for first build');
  }
}

runChecks().catch(console.error);