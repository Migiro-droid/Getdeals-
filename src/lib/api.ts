// Small helper to centralize API base URL for frontend requests
export const getApiBase = () => {
  // Vite exposes env vars prefixed with VITE_ at build time
  const envUrl = (import.meta.env && import.meta.env.VITE_API_URL) || undefined;
  if (envUrl && typeof envUrl === 'string' && envUrl.length > 0) return envUrl.replace(/\/$/, '');
  // Fallbacks
  if (process.env.NODE_ENV === 'production') return window.location.origin;
  return 'http://localhost:4000';
};

export default getApiBase;
