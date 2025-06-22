import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setupGlobalErrorHandler } from "./utils/error-handling";

// Setup global error handling for production
setupGlobalErrorHandler();

try {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error("Root element not found");
  }
  
  createRoot(rootElement).render(<App />);
} catch (error) {
  console.error("Failed to initialize application:", error);
  
  // Fallback error display
  const rootElement = document.getElementById("root");
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px;">
        <div style="max-width: 400px; text-align: center; font-family: system-ui, sans-serif;">
          <h1 style="color: #dc2626; margin-bottom: 16px;">Application Error</h1>
          <p style="color: #666; margin-bottom: 20px;">The application failed to load. Please refresh the page or contact support if the problem persists.</p>
          <button onclick="window.location.reload()" style="background: #dc2626; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer;">
            Refresh Page
          </button>
        </div>
      </div>
    `;
  }
}
