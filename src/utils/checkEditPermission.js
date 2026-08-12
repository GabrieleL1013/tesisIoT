import { API_BASE_URL, fetchWithAuth } from "../config/api";
import { checkUserInterfaceAccess } from "./rbac";

let fetchPromise = null;

export async function checkEditPermission() {
  const activeSes = localStorage.getItem("iot_sesion_activa");
  if (!activeSes) return false;

  try {
    const parsed = JSON.parse(activeSes);
    const userRoleId = parsed.role_id || parsed.role?.id;
    const userRoleName = parsed.role?.name || parsed.rol;

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

    return checkUserInterfaceAccess("/modo-edicion", parsed, interfaces);
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
