import { getUrlLanguage } from "../utils/routeMapping";

// URL base del backend configurada a través de variables de entorno (Vite)
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const pendingRequests = new Map();

/**
 * Deduplica solicitudes HTTP (GET, POST, etc.) simultáneas o cercanas para evitar ráfagas duplicadas al backend
 */
export async function fetchDeduplicated(url, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const bodyKey = options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : '';
  const requestKey = `${method}:${url}:${bodyKey}`;

  if (pendingRequests.has(requestKey)) {
    const existing = pendingRequests.get(requestKey);
    return existing.then(res => res.clone());
  }

  const fetchPromise = fetch(url, options)
    .then(res => {
      setTimeout(() => {
        pendingRequests.delete(requestKey);
      }, 500);
      return res;
    })
    .catch(err => {
      pendingRequests.delete(requestKey);
      throw err;
    });

  pendingRequests.set(requestKey, fetchPromise);
  return fetchPromise.then(res => res.clone());
}

/**
 * Añade automáticamente el parámetro ?lang=es|en a cualquier URL de API
 */
export function appendLangToUrl(url) {
  const currentLang = getUrlLanguage();
  if (!url) return url;
  
  const separator = url.includes('?') ? '&' : '?';
  if (!url.includes('lang=')) {
    return `${url}${separator}lang=${currentLang}`;
  }
  return url;
}

/**
 * Función auxiliar para realizar peticiones HTTP autenticadas adjuntando el Token Bearer Sanctum y el idioma activo de la URL
 */
export async function fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem('iot_token_seguro');
  const currentLang = getUrlLanguage();
  const urlWithLang = appendLangToUrl(url);

  const headers = {
    'Accept': 'application/json',
    'Accept-Language': currentLang,
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetchDeduplicated(urlWithLang, {
    ...options,
    headers,
  });
}
