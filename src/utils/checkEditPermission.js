import { API_BASE_URL, fetchWithAuth } from "../config/api";

let fetchPromise = null;

export async function checkEditPermission() {
  const activeSes = localStorage.getItem("iot_sesion_activa");
  if (!activeSes) return false;

  try {
    const parsed = JSON.parse(activeSes);
    const userRoleId = parsed.role_id || parsed.role?.id;
    const userRoleName = parsed.role?.name || parsed.rol;
    const userLevel = parsed.role?.level_permission ?? 1;

    // Superusuario siempre tiene permiso absoluto
    if (userRoleName === "Superusuario" || userRoleId === 1) {
      return true;
    }

    // Reutilizar la misma promesa activa de consulta a /interfaces para evitar peticiones redundantes
    if (!fetchPromise) {
      fetchPromise = fetchWithAuth(`${API_BASE_URL}/interfaces`)
        .then((res) => (res.ok ? res.json() : []))
        .catch(() => []);
    }

    const interfaces = await fetchPromise;
    if (!Array.isArray(interfaces)) return false;

    const editModeIface = interfaces.find((i) => i.path === "/modo-edicion");
    if (!editModeIface) return false;

    let allowed = [];
    try {
      allowed = typeof editModeIface.allowed_roles === "string"
        ? JSON.parse(editModeIface.allowed_roles)
        : editModeIface.allowed_roles;
    } catch (e) {}

    if (!Array.isArray(allowed)) allowed = [];

    const isRoleAdmitted = allowed.some((item) => {
      if (item === userRoleId || String(item) === String(userRoleId) || item === userRoleName) return true;
      if (typeof item === 'object' && item !== null) {
        if (item.id === userRoleId || String(item.id) === String(userRoleId) || item.name === userRoleName) return true;
      }
      return false;
    });

    const isLevelSufficient =
      editModeIface.min_level === null || userLevel >= editModeIface.min_level;

    return isRoleAdmitted && isLevelSufficient;
  } catch (e) {
    return false;
  }
}

// Resetear la caché cuando se actualicen los permisos de las interfaces
if (typeof window !== "undefined") {
  window.addEventListener("appInterfacesUpdated", () => {
    fetchPromise = null;
  });
}
