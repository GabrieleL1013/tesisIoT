// URL base del backend configurada a través de variables de entorno (Vite)
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

/**
 * Función auxiliar para realizar peticiones HTTP autenticadas adjuntando el Token Bearer Sanctum
 */
export async function fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem('iot_token_seguro');

  const headers = {
    'Accept': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(url, {
    ...options,
    headers,
  });
}
