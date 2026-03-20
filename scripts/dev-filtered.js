#!/usr/bin/env node

/**
 * Custom development server script that filters out OAuth authorization codes
 * from Next.js development server logs to prevent security exposure.
 */

const { spawn } = require('child_process');
const path = require('path');

// Start Next.js development server on port 3000
// Port 3000: GDAP frontend (this app)
// Port 3001: GovConfidence
// Port 3002: GovUNLEASHED frontend
// Port 3003: real-estate-prod client
// Port 3005: GovUNLEASHED backend
// Port 3006: real-estate-prod server
// Port 5000: GDAP backend
const nextDev = spawn('next', ['dev', '-p', '3000'], {
  cwd: process.cwd(),
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: true,
  env: {
    ...process.env,
    BASELINE_BROWSER_MAPPING_IGNORE_OLD_DATA: "true",
    BROWSERSLIST_IGNORE_OLD_DATA: "true",
  },
});

// Set environment variables to suppress warnings
process.env.BASELINE_BROWSER_MAPPING_IGNORE_OLD_DATA = "true";
process.env.BROWSERSLIST_IGNORE_OLD_DATA = "true";

// Filter function to detect OAuth callback URLs and baseline-browser-mapping warnings
function shouldFilterLog(data) {
  const logString = data.toString();
  
  // Filter out baseline-browser-mapping warnings
  if (
    logString.includes("baseline-browser-mapping") &&
    logString.includes("over two months old")
  ) {
    return true;
  }
  
  // Filter out OAuth callback URLs containing authorization codes
  if (logString.includes('code=') && 
      logString.includes('state=') && 
      (logString.includes('302 in') || logString.includes('GET /'))) {
    return true;
  }
  
  // Filter out other sensitive OAuth-related logs
  if (logString.includes('AQS') && logString.includes('state=')) {
    return true;
  }
  
  return false;
}

// Handle stdout (standard output)
nextDev.stdout.on('data', (data) => {
  if (!shouldFilterLog(data)) {
    process.stdout.write(data);
  }
});

// Handle stderr (error output)
nextDev.stderr.on('data', (data) => {
  if (!shouldFilterLog(data)) {
    process.stderr.write(data);
  }
});

// Handle process exit
nextDev.on('close', (code) => {
  process.exit(code);
});

// Handle process termination
process.on('SIGINT', () => {
  nextDev.kill('SIGINT');
});

process.on('SIGTERM', () => {
  nextDev.kill('SIGTERM');
});
