/**
 * Control de Acceso Basado en Roles (RBAC) y Permisos de Interfaces
 */

// Mapa de rutas administrativas y sus alias equivalentes en español e inglés
const ADMIN_ROUTE_KEY_MAP = {
  '/admin/dashboard': ['/es/admin/dashboard', '/en/admin/dashboard', '/admin/dashboard'],
  '/admin/nodos': ['/es/admin/nodos', '/en/admin/nodes', '/admin/nodos', '/admin/nodes'],
  '/admin/categorias': ['/es/admin/categorias', '/en/admin/categories', '/admin/categorias', '/admin/categories'],
  '/admin/metricas': ['/es/admin/metricas', '/en/admin/metrics', '/admin/metricas', '/admin/metrics'],
  '/admin/ubicaciones': ['/es/admin/ubicaciones', '/en/admin/locations', '/admin/ubicaciones', '/admin/locations'],
  '/admin/usuarios': ['/es/admin/usuarios', '/en/admin/users', '/admin/usuarios', '/admin/users'],
  '/admin/roles': ['/es/admin/roles', '/en/admin/roles', '/admin/roles'],
  '/admin/interfaces': ['/es/admin/interfaces', '/en/admin/interfaces', '/admin/interfaces'],
  '/admin/noticias': ['/es/admin/noticias', '/en/admin/news', '/admin/noticias', '/admin/news'],
  '/admin/articulos': ['/es/admin/articulos', '/en/admin/articles', '/admin/articulos', '/admin/articles'],
  '/admin/monitor-en-vivo': ['/es/admin/monitor-en-vivo', '/en/admin/live-monitor', '/admin/monitor-en-vivo', '/admin/live-monitor'],
  '/admin/historico': ['/es/admin/historico', '/en/admin/history', '/admin/historico', '/admin/history'],
  '/admin/notificaciones': ['/es/admin/notificaciones', '/en/admin/notifications', '/admin/notificaciones', '/admin/notifications'],
  '/modo-edicion': ['/modo-edicion', '/edit-mode']
};

/**
 * Encuentra el objeto de interfaz en la BD (appInterfaces) que coincide con la ruta proporcionada.
 */
export function findMatchingInterface(pathname, appInterfaces = []) {
  if (!pathname || !Array.isArray(appInterfaces) || appInterfaces.length === 0) return null;

  const cleanPath = pathname.replace(/^\/(es|en)/, '');

  return appInterfaces.find(iface => {
    if (!iface || !iface.path) return false;
    const ifaceCleanPath = iface.path.replace(/^\/(es|en)/, '');

    // 1. Coincidencia directa o limpia
    if (pathname === iface.path || pathname === iface.path_es || pathname === iface.path_en) return true;
    if (cleanPath === ifaceCleanPath) return true;

    // 2. Coincidencia a través del mapa de alias
    for (const aliases of Object.values(ADMIN_ROUTE_KEY_MAP)) {
      const pathMatchesAlias = aliases.some(alias => pathname === alias || cleanPath === alias.replace(/^\/(es|en)/, ''));
      const ifaceMatchesAlias = aliases.some(alias => iface.path === alias || ifaceCleanPath === alias.replace(/^\/(es|en)/, ''));
      if (pathMatchesAlias && ifaceMatchesAlias) return true;
    }

    return false;
  }) || null;
}

/**
 * Evalúa si el usuario autenticado tiene acceso a una interfaz específica.
 *
 * Criterios:
 * 1. Superusuario (role_id === 1 o rol === 'Superusuario') -> ACCESO TOTAL (true).
 * 2. Si appInterfaces aún no ha cargado -> false por defecto para prevenir destellos de acceso no autorizado.
 * 3. Si no se encuentra la definición de interfaz en la lista -> false.
 * 4. El rol del usuario (ID o Nombre) DEBE estar en allowed_roles.
 * 5. El nivel de permiso del usuario DEBE ser >= min_level de la interfaz (si min_level no es nulo).
 */
export function checkUserInterfaceAccess(pathname, user, appInterfaces = []) {
  if (!user) return false;

  const userRoleId = user?.role_id || user?.role?.id;
  const userRoleName = user?.role?.name || user?.rol || (userRoleId === 1 ? 'Superusuario' : null);
  const userLevel = user?.role?.level_permission ?? user?.level_permission ?? 1;

  // 1. Acceso total incondicional para Superusuario
  if (userRoleName === 'Superusuario' || userRoleId === 1) {
    return true;
  }

  // 2. Si aún no se han cargado las interfaces de la BD, negar acceso temporalmente
  if (!Array.isArray(appInterfaces) || appInterfaces.length === 0) {
    return false;
  }

  // 3. Buscar interfaz correspondiente
  const iface = findMatchingInterface(pathname, appInterfaces);
  if (!iface) {
    return false;
  }

  // 4. Analizar allowed_roles
  let allowedRoles = [];
  try {
    if (typeof iface.allowed_roles === 'string') {
      allowedRoles = JSON.parse(iface.allowed_roles);
    } else if (Array.isArray(iface.allowed_roles)) {
      allowedRoles = iface.allowed_roles;
    }
  } catch (e) {
    allowedRoles = [];
  }

  if (!Array.isArray(allowedRoles)) allowedRoles = [];

  const isRoleAdmitted = allowedRoles.some(item => {
    if (item === userRoleId || String(item) === String(userRoleId) || item === userRoleName) return true;
    if (typeof item === 'object' && item !== null) {
      if (item.id === userRoleId || String(item.id) === String(userRoleId) || item.name === userRoleName) return true;
    }
    return false;
  });

  // 5. Verificar nivel mínimo de permiso
  const isLevelSufficient = iface.min_level === null || userLevel >= iface.min_level;

  return isRoleAdmitted && isLevelSufficient;
}
