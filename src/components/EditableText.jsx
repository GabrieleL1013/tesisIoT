import { API_BASE_URL } from "../config/api";
import { useState, useEffect } from "react";
import { useInterfaceText } from "../context/InterfaceTextContext";
import Swal from "sweetalert2";

// Icono Lápiz SVG Autocontenido
const PencilIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    width="13"
    height="13"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z" />
  </svg>
);

export default function EditableText({ textKey, defaultText, isTextArea = false, className = "", style = {}, block = false }) {
  const { texts, updateText, editMode } = useInterfaceText();
  const [hasPermission, setHasPermission] = useState(false);

  // Leer sesión de localStorage y evaluar permisos RBAC para Modo Edición
  useEffect(() => {
    const checkRole = () => {
      const activeSes = localStorage.getItem("iot_sesion_activa");
      if (!activeSes) {
        setHasPermission(false);
        return;
      }
      try {
        const parsed = JSON.parse(activeSes);
        const userRoleId = parsed.role_id || parsed.role?.id;
        const userRoleName = parsed.role?.name || parsed.rol;
        const userLevel = parsed.role?.level_permission ?? 1;

        if (userRoleName === "Superusuario" || userRoleId === 1) {
          setHasPermission(true);
          return;
        }

        // Consultar permisos configurados para /modo-edicion
        fetch(`${API_BASE_URL}/interfaces`)
          .then(res => res.json())
          .then(ifaces => {
            const editModeIface = ifaces.find(i => i.path === '/modo-edicion');
            if (!editModeIface) { setHasPermission(false); return; }
            let allowed = [];
            try { 
              allowed = typeof editModeIface.allowed_roles === 'string' 
                ? JSON.parse(editModeIface.allowed_roles) 
                : editModeIface.allowed_roles; 
            } catch(e){}
            if (!Array.isArray(allowed)) allowed = [];
            const isRoleAdmitted = allowed.some(item => item === userRoleId || item === String(userRoleId) || item === userRoleName);
            const isLevelSufficient = editModeIface.min_level === null || userLevel >= editModeIface.min_level;
            setHasPermission(isRoleAdmitted && isLevelSufficient);
          })
          .catch(() => setHasPermission(false));
      } catch (e) {
        setHasPermission(false);
      }
    };

    checkRole();
    window.addEventListener("userProfileUpdated", checkRole);
    window.addEventListener("appInterfacesUpdated", checkRole);
    return () => {
      window.removeEventListener("userProfileUpdated", checkRole);
      window.removeEventListener("appInterfacesUpdated", checkRole);
    };
  }, []);

  // El texto a mostrar: prioriza el de la base de datos, si no existe usa el predeterminado
  const displayText = texts[textKey] !== undefined ? texts[textKey] : defaultText;

  // Manejar edición de texto con SweetAlert2
  const handleEditClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const { value: newText } = await Swal.fire({
      title: "Editar texto de la interfaz",
      input: isTextArea ? "textarea" : "text",
      inputValue: displayText,
      inputLabel: `Clave: ${textKey}`,
      showCancelButton: true,
      confirmButtonText: "Guardar",
      cancelButtonText: "Cancelar",
      background: "#0b0f19",
      color: "#ffffff",
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#475569",
      inputValidator: (value) => {
        if (!value || !value.trim()) {
          return "El texto no puede estar vacío";
        }
      },
    });

    if (newText !== undefined && newText !== displayText) {
      try {
        await updateText(textKey, newText.trim());

        Swal.fire({
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 2500,
          timerProgressBar: true,
          icon: "success",
          title: "Texto de interfaz actualizado"
        });
      } catch (err) {
        Swal.fire({
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
          icon: "error",
          title: "Error al guardar el texto"
        });
      }
    }
  };

  return (
    <span className={`editable-text-container ${block ? "block-layout" : ""} ${className}`} style={style}>
      {displayText}
      {hasPermission && editMode && (
        <button
          onClick={handleEditClick}
          className="edit-text-pencil-btn"
          title={`Editar texto: ${textKey}`}
          type="button"
        >
          <PencilIcon />
        </button>
      )}
    </span>
  );
}
