// En desarrollo, usar ruta relativa permite que Vite resuelva /api via proxy.
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
