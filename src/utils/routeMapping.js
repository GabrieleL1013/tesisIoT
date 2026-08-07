/**
 * Mapeo oficial de rutas traducidas entre Español (:lang = 'es') e Inglés (:lang = 'en')
 */
export const ROUTE_MAP = [
  { key: "home", es: "/es", en: "/en" },
  { key: "map", es: "/es/categorias", en: "/en/categories" },
  { key: "history", es: "/es/analisis-historico", en: "/en/historical-analysis" },
  { key: "news", es: "/es/noticias", en: "/en/news" },
  { key: "articles", es: "/es/articulos", en: "/en/articles" },
  { key: "about", es: "/es/acerca-de", en: "/en/about-us" },
  { key: "software", es: "/es/software", en: "/en/software" },
  { key: "contact", es: "/es/contacto", en: "/en/contact" },
  { key: "login", es: "/es/login", en: "/en/login" },
  { key: "adminDashboard", es: "/es/admin/dashboard", en: "/en/admin/dashboard" },
  { key: "adminNodes", es: "/es/admin/nodos", en: "/en/admin/nodes" },
  { key: "adminCategories", es: "/es/admin/categorias", en: "/en/admin/categories" },
  { key: "adminMetrics", es: "/es/admin/metricas", en: "/en/admin/metrics" },
  { key: "adminLocations", es: "/es/admin/ubicaciones", en: "/en/admin/locations" },
  { key: "adminUsers", es: "/es/admin/usuarios", en: "/en/admin/users" },
  { key: "adminRoles", es: "/es/admin/roles", en: "/en/admin/roles" },
  { key: "adminInterfaces", es: "/es/admin/interfaces", en: "/en/admin/interfaces" },
  { key: "adminNews", es: "/es/admin/noticias", en: "/en/admin/news" },
  { key: "adminArticles", es: "/es/admin/articulos", en: "/en/admin/articles" },
  { key: "adminLiveMonitor", es: "/es/admin/monitor-en-vivo", en: "/en/admin/live-monitor" },
  { key: "adminAggregatedHistory", es: "/es/admin/historico", en: "/en/admin/history" },
  { key: "adminNotifications", es: "/es/admin/notificaciones", en: "/en/admin/notifications" },
  { key: "admin403", es: "/es/admin/403", en: "/en/admin/403" }
];

/**
 * Obtener el idioma activo ('es' o 'en') inspeccionando el primer segmento de la URL.
 * Por defecto retorna 'es'.
 */
export function getUrlLanguage(pathname = window.location.pathname) {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length > 0 && (parts[0] === "es" || parts[0] === "en")) {
    return parts[0];
  }
  return "es";
}

/**
 * Mapear una ruta actual dada al idioma objetivo (targetLang: 'es' | 'en')
 */
export function getEquivalentRoute(currentPath, targetLang) {
  const cleanPath = currentPath.endsWith("/") && currentPath.length > 1 
    ? currentPath.slice(0, -1) 
    : currentPath;

  const found = ROUTE_MAP.find((item) => item.es === cleanPath || item.en === cleanPath);
  if (found) {
    return found[targetLang];
  }

  // Si no se encuentra mapeado exacto, reemplazar el prefijo /es/ o /en/
  if (cleanPath.startsWith("/es")) {
    return targetLang === "en" ? cleanPath.replace("/es", "/en") : cleanPath;
  }
  if (cleanPath.startsWith("/en")) {
    return targetLang === "es" ? cleanPath.replace("/en", "/es") : cleanPath;
  }

  return `/${targetLang}${cleanPath === "/" ? "" : cleanPath}`;
}
