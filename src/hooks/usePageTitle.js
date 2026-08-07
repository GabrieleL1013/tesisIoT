import { useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

/**
 * Hook para establecer el título de la pestaña del navegador.
 * Soporta dos modos:
 *  - usePageTitle('Título ES', 'Sufijo')          → título fijo
 *  - usePageTitle({ es: 'Título ES', en: 'Title EN' }, 'Sufijo')  → bilingüe automático
 *
 * @param {string|{es:string,en:string}} title - Título o mapa de traducciones.
 * @param {string} [suffix='IoT ULEAM'] - Sufijo que se agrega al final.
 */
export function usePageTitle(title, suffix = 'IoT ULEAM') {
  // Intentamos leer el idioma del contexto; si no existe (fuera de provider) tomamos localStorage
  let language = 'es';
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const ctx = useLanguage();
    if (ctx && ctx.language) language = ctx.language;
  } catch (_) {
    // Fuera del LanguageProvider — fallback a localStorage
    const stored = localStorage.getItem('app_language') || localStorage.getItem('i18nextLng') || 'es';
    language = stored.startsWith('en') ? 'en' : 'es';
  }

  const resolved =
    title && typeof title === 'object'
      ? (language === 'en' ? title.en : title.es) || title.es || ''
      : title || '';

  useEffect(() => {
    const prev = document.title;
    document.title = resolved ? `${resolved} - ${suffix}` : suffix;
    return () => {
      document.title = prev;
    };
  }, [resolved, suffix]);
}
