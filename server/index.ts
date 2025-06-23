import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { validateStartup } from "./startup-check";
import { applyProductionFixes } from "./production-fixes";

// Validate required environment variables
function validateEnvironment() {
  const requiredEnvVars = ['DATABASE_URL'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('Missing required environment variables:', missingVars.join(', '));
    process.exit(1);
  }
}

// Validate environment before starting
validateEnvironment();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Apply production-specific fixes
applyProductionFixes(app);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Graceful shutdown handler
function setupGracefulShutdown(server: any) {
  const shutdown = (signal: string) => {
    log(`Received ${signal}, shutting down gracefully...`);
    server.close(() => {
      log('Process terminated');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

(async () => {
  try {
    // Run comprehensive startup validation in production
    if (process.env.NODE_ENV === 'production') {
      await validateStartup();
    }
    
    const server = await registerRoutes(app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      log(`Error ${status}: ${message}`);
      res.status(status).json({ message });
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (process.env.NODE_ENV === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // ALWAYS serve the app on port 5000
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = process.env.PORT || 5000;
    const host = process.env.HOST || "0.0.0.0";
    
    server.listen({
      port: Number(port),
      host,
      reusePort: true,
    }, () => {
      log(`serving on ${host}:${port}`);
      log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Handle server startup errors
    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        log(`Port ${port} is already in use`);
      } else {
        log(`Server error: ${error.message}`);
      }
      process.exit(1);
    });

    setupGracefulShutdown(server);

  } catch (error: any) {
    log(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
})();
