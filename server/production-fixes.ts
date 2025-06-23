import type { Express } from "express";
import path from "path";
import fs from "fs";

// Production-specific middleware and fixes
export function applyProductionFixes(app: Express) {
  // Add security headers for production
  app.use((req, res, next) => {
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    }
    next();
  });

  // Fix for generateObject error - ensure proper module loading
  app.use('/assets', (req, res, next) => {
    if (req.path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    }
    next();
  });

  // Add a health check specifically for production builds
  app.get('/api/build-health', (req, res) => {
    const buildInfo = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      nodeEnv: process.env.NODE_ENV,
      buildExists: checkBuildExists(),
      version: '1.0.0'
    };
    
    res.json(buildInfo);
  });
}

function checkBuildExists(): boolean {
  const distPath = path.resolve(process.cwd(), 'dist', 'public');
  const indexPath = path.join(distPath, 'index.html');
  return fs.existsSync(indexPath);
}