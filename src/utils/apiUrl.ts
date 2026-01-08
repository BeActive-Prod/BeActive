// Get the API URL dynamically based on environment
export function getApiUrl(): string {
  // Server-side: return localhost (won't be used, but safe fallback)
  if (typeof window === 'undefined') {
    return 'http://localhost:3001';
  }

  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    // In development: use the same host as the frontend, but on port 3001
    const host = window.location.hostname;
    return `http://${host}:3001`;
  } else {
    // In production: use the proxy through Next.js (same origin)
    return window.location.origin;
  }
}
