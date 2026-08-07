import { API_BASE_URL } from "../config/api";
import { useState, useEffect } from "react";
import { useInterfaceText } from "../context/InterfaceTextContext";
import { useLanguage } from "../context/LanguageContext";
import { checkEditPermission } from "../utils/checkEditPermission";
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

export default function EditableText({ textKey, defaultText, isTextArea = false, className = "", style = {}, block = false, forcePath = null }) {
  const { texts, updateText, editMode, loading } = useInterfaceText();
  const { language } = useLanguage();
  const isEn = language === 'en';
  const [hasPermission, setHasPermission] = useState(false);

  // Leer sesión de localStorage y evaluar permisos RBAC para Modo Edición
  useEffect(() => {
    const checkRole = () => {
      checkEditPermission().then(res => setHasPermission(res));
    };

    checkRole();
    window.addEventListener("userProfileUpdated", checkRole);
    window.addEventListener("appInterfacesUpdated", checkRole);
    return () => {
      window.removeEventListener("userProfileUpdated", checkRole);
      window.removeEventListener("appInterfacesUpdated", checkRole);
    };
  }, []);

  // Si los textos de la BD aún están cargando, mostrar Skeleton Loader en lugar del defaultText para evitar destello
  if (loading) {
    if (isTextArea) {
      return (
        <span
          className={`editable-text-skeleton-container ${className}`}
          style={{ display: 'block', width: '100%', margin: '4px 0', ...style }}
        >
          <span className="editable-text-skeleton" style={{ width: '100%', height: '0.9em', display: 'block', marginBottom: '6px' }} />
          <span className="editable-text-skeleton" style={{ width: '86%', height: '0.9em', display: 'block', marginBottom: '6px' }} />
          <span className="editable-text-skeleton" style={{ width: '62%', height: '0.9em', display: 'block' }} />
        </span>
      );
    }

    const calcWidth = defaultText
      ? `${Math.min(Math.max(defaultText.length * 8, 80), 400)}px`
      : '120px';

    return (
      <span
        className={`editable-text-skeleton ${className}`}
        style={{
          width: calcWidth,
          height: '1.1em',
          display: block ? 'block' : 'inline-block',
          margin: '2px 0',
          ...style
        }}
      />
    );
  }

  // El texto a mostrar: prioriza el de la base de datos, si no existe usa el predeterminado
  const displayText = texts[textKey] !== undefined ? texts[textKey] : defaultText;

  // Manejar edición de texto con SweetAlert2
  const handleEditClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Escapar caracteres HTML para el valor inicial
    const escapedValue = (displayText || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

    const { value: result } = await Swal.fire({
      title: isEn ? "Edit Interface Text" : "Editar texto de la interfaz",
      html: `
        <div class="swal-floating-translate-card">
          <label class="swal-floating-translate-label" for="swal-auto-translate-checkbox">
            <input type="checkbox" id="swal-auto-translate-checkbox" class="swal-custom-checkbox" checked />
            <span class="swal-checkbox-text">${isEn ? "Do you want to translate automatically?" : "¿Desea que se traduzca automáticamente?"}</span>
          </label>
        </div>
        <div style="text-align: left; margin-bottom: 10px; font-size: 0.85rem; color: #94a3b8;">
          <strong>${isEn ? "Key:" : "Clave:"}</strong> <code style="background: rgba(255,255,255,0.08); padding: 2px 6px; border-radius: 4px; color: #38bdf8; font-family: monospace;">${textKey}</code>
        </div>
        ${
          isTextArea
            ? `<textarea id="swal-input-text" class="swal2-textarea" style="width: 100%; margin: 0; min-height: 120px; background: #1e293b; color: #ffffff; border: 1px solid #334155; border-radius: 8px; padding: 12px; font-family: inherit; font-size: 0.95rem; resize: vertical; box-sizing: border-box;">${escapedValue}</textarea>`
            : `<input id="swal-input-text" class="swal2-input" style="width: 100%; margin: 0; height: 44px; background: #1e293b; color: #ffffff; border: 1px solid #334155; border-radius: 8px; padding: 0 12px; font-family: inherit; font-size: 0.95rem; box-sizing: border-box;" value="${escapedValue}" />`
        }
      `,
      showCancelButton: true,
      confirmButtonText: isEn ? "Save" : "Guardar",
      cancelButtonText: isEn ? "Cancel" : "Cancelar",
      background: "#0b0f19",
      color: "#ffffff",
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#475569",
      customClass: {
        popup: "swal-editable-text-popup"
      },
      didOpen: () => {
        const input = document.getElementById("swal-input-text");
        if (input) {
          input.focus();
          if (typeof input.setSelectionRange === "function" && !isTextArea) {
            const len = input.value.length;
            input.setSelectionRange(len, len);
          }
        }
      },
      preConfirm: () => {
        const inputEl = document.getElementById("swal-input-text");
        const checkEl = document.getElementById("swal-auto-translate-checkbox");
        const val = inputEl ? inputEl.value : "";
        if (!val || !val.trim()) {
          Swal.showValidationMessage(isEn ? "Text cannot be empty" : "El texto no puede estar vacío");
          return false;
        }
        return {
          newText: val.trim(),
          autoTranslate: checkEl ? checkEl.checked : true
        };
      }
    });

    if (result && result.newText !== undefined && (result.newText !== displayText || result.autoTranslate !== undefined)) {
      try {
        await updateText(textKey, result.newText, forcePath, result.autoTranslate);

        Swal.fire({
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 2500,
          timerProgressBar: true,
          icon: "success",
          title: isEn ? "Interface text updated" : "Texto de interfaz actualizado"
        });
      } catch (err) {
        Swal.fire({
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
          icon: "error",
          title: isEn ? "Error saving text" : "Error al guardar el texto"
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
          title={isEn ? `Edit text: ${textKey}` : `Editar texto: ${textKey}`}
          type="button"
        >
          <PencilIcon />
        </button>
      )}
    </span>
  );
}
