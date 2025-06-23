// Production error handling utilities
export function handleProductionError(error: any) {
  console.error('Production error:', error);
  
  // Don't throw errors in production, just log them
  if (process.env.NODE_ENV === 'production') {
    return null;
  }
  
  throw error;
}

export function safeAsyncOperation<T>(
  operation: () => Promise<T>,
  fallback: T
): Promise<T> {
  return operation().catch((error) => {
    console.warn('Async operation failed:', error);
    return fallback;
  });
}

// Global error handler for production
export function setupGlobalErrorHandler() {
  if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error);
      event.preventDefault(); // Prevent default browser error handling
    });

    window.addEventListener('unhandledrejection', (event) => {
      console.warn('Unhandled promise rejection:', event.reason);
      event.preventDefault(); // Prevent default browser error handling
    });
  }
}