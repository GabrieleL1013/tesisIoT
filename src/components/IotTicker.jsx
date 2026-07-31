import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import "../styles/components/IotTicker.css";
import EditableText from "./EditableText";
import { useInterfaceText } from "../context/InterfaceTextContext";
import { useInterfaceImage } from "../context/InterfaceImageContext";
import { checkEditPermission } from "../utils/checkEditPermission";
import Swal from "sweetalert2";

// ── SVG Icons for the Ticker Fallbacks ──
const SensorNodeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ticker-svg">
    <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
    <rect x="9" y="9" width="6" height="6" />
    <line x1="9" y1="1" x2="9" y2="4" />
    <line x1="15" y1="1" x2="15" y2="4" />
    <line x1="9" y1="20" x2="9" y2="23" />
    <line x1="15" y1="20" x2="15" y2="23" />
    <line x1="20" y1="9" x2="23" y2="9" />
    <line x1="20" y1="15" x2="23" y2="15" />
    <line x1="1" y1="9" x2="4" y2="9" />
    <line x1="1" y1="15" x2="4" y2="15" />
  </svg>
);

const GatewayIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ticker-svg">
    <path d="M5 12.55a11 11 0 0 1 14.08 0" />
    <path d="M1.42 9a16 16 0 0 1 21.16 0" />
    <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
    <line x1="12" y1="20" x2="12.01" y2="20" />
  </svg>
);

const DatabaseDiskIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ticker-svg">
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
  </svg>
);

const SmartAgriIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ticker-svg">
    <path d="M12 22V12M12 12a5 5 0 0 1 5-5h2M12 15a5 5 0 0 0-5-5H5M12 8a3 3 0 0 1 3-3h3" />
  </svg>
);

const WaterLevelIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ticker-svg">
    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
    <path d="M6 18h12M8 15h8M10 12h4" />
  </svg>
);

const SmartBulbIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ticker-svg">
    <path d="M9 18h6M10 22h4" />
    <path d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17h8v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="10" y1="11" x2="14" y2="11" />
  </svg>
);

const DashboardChartIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ticker-svg">
    <path d="M3 3v18h18" />
    <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
  </svg>
);

const TemperatureIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ticker-svg">
    <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
  </svg>
);

const SecurityShieldIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ticker-svg">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="M12 6v11" />
    <path d="M9 9h6" />
  </svg>
);

const SignalWaveIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ticker-svg">
    <path d="M2 10s3-3 10-3 10 3 10 3" />
    <path d="M6 14s2-2 6-2 6 2 6 2" />
    <path d="M10 18s1-1 2-1 2 1 2 1" />
  </svg>
);

const PencilIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z" />
  </svg>
);

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" /><path d="M14 11v6" />
  </svg>
);

const CaretDownIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const CaretUpIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="18 15 12 9 6 15" />
  </svg>
);

const DEFAULT_ICONS = [
  <SensorNodeIcon key="0" />,
  <GatewayIcon key="1" />,
  <DatabaseDiskIcon key="2" />,
  <SmartAgriIcon key="3" />,
  <WaterLevelIcon key="4" />,
  <SmartBulbIcon key="5" />,
  <DashboardChartIcon key="6" />,
  <TemperatureIcon key="7" />,
  <SecurityShieldIcon key="8" />,
  <SignalWaveIcon key="9" />
];

const DEFAULT_ITEMS = [
  { id: "ticker-1", label: "Gateway LoRaWAN", iconIndex: 1, image_key: "ticker_img_1" },
  { id: "ticker-2", label: "Base de Datos Histórica", iconIndex: 2, image_key: "ticker_img_2" },
  { id: "ticker-3", label: "Monitoreo Agrícola", iconIndex: 3, image_key: "ticker_img_3" },
  { id: "ticker-4", label: "Nivel de Reservorios", iconIndex: 4, image_key: "ticker_img_4" },
  { id: "ticker-5", label: "Eficiencia Energética", iconIndex: 5, image_key: "ticker_img_5" },
  { id: "ticker-6", label: "Nodo Sensor IoT", iconIndex: 0, image_key: "ticker_img_6" },
  { id: "ticker-7", label: "Paneles de Control", iconIndex: 6, image_key: "ticker_img_7" },
  { id: "ticker-8", label: "Variables Térmicas", iconIndex: 7, image_key: "ticker_img_8" },
  { id: "ticker-9", label: "Criptografía & Seguridad", iconIndex: 8, image_key: "ticker_img_9" },
  { id: "ticker-10", label: "Redes Inalámbricas", iconIndex: 9, image_key: "ticker_img_10" }
];

export default function IotTicker() {
  const { texts, updateText, editMode } = useInterfaceText();
  const { images, updateImage } = useInterfaceImage();

  const [hasPermission, setHasPermission] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [draftItems, setDraftItems] = useState([]);
  const [expandedIndex, setExpandedIndex] = useState(0);
  const [saving, setSaving] = useState(false);

  const fileInputRefs = useRef({});

  // Verificar permisos RBAC de usuario
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

  // Determinar la lista activa de ítems desde la BD o defaults
  let activeItems = DEFAULT_ITEMS;
  if (texts["ticker_items"]) {
    try {
      const parsed = JSON.parse(texts["ticker_items"]);
      if (Array.isArray(parsed) && parsed.length > 0) {
        activeItems = parsed;
      }
    } catch (e) {
      activeItems = DEFAULT_ITEMS;
    }
  }

  // Obtener src de imagen (Custom DB, transient data URL o SVG fallback)
  const getItemImageSrc = (item) => {
    if (item.new_image_data) {
      return item.new_image_data;
    }
    const dbImage = images?.[item.image_key];
    if (dbImage?.image_data) {
      return `data:${dbImage.mime_type || "image/jpeg"};base64,${dbImage.image_data.replace(/^data:[^;]+;base64,/, "")}`;
    }
    if (item.image_data) {
      return item.image_data;
    }
    if (item.image_url) {
      return item.image_url;
    }
    return null;
  };

  // Abrir Modal de Edición de Carrusel
  const handleOpenModal = async () => {
    const permitted = await checkEditPermission();
    if (!permitted) {
      Swal.fire({
        title: "Permiso Denegado",
        text: "No cumples con los permisos requeridos en Gestión de Interfaces para editar el carrusel.",
        icon: "error",
        background: "#0b0f19",
        color: "#ffffff",
        confirmButtonColor: "#d0182b"
      });
      return;
    }

    setDraftItems(JSON.parse(JSON.stringify(activeItems)));
    setExpandedIndex(0);
    setShowModal(true);
  };

  // Reordenar ítems hacia arriba / abajo
  const handleMoveItem = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= draftItems.length) return;
    const next = [...draftItems];
    const temp = next[index];
    next[index] = next[targetIndex];
    next[targetIndex] = temp;
    setDraftItems(next);
    if (expandedIndex === index) setExpandedIndex(targetIndex);
    else if (expandedIndex === targetIndex) setExpandedIndex(index);
  };

  // Eliminar ítem
  const handleDeleteItem = (index) => {
    if (draftItems.length <= 1) {
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "warning",
        title: "Debe haber al menos 1 ítem en el carrusel",
        showConfirmButton: false,
        timer: 2000
      });
      return;
    }
    const next = draftItems.filter((_, i) => i !== index);
    setDraftItems(next);
    if (expandedIndex >= next.length) {
      setExpandedIndex(Math.max(0, next.length - 1));
    }
  };

  // Añadir nuevo ítem
  const handleAddItem = () => {
    const newId = `ticker-${Date.now()}`;
    const newItem = {
      id: newId,
      label: "Nuevo Ítem",
      iconIndex: 0,
      image_key: `ticker_img_${Date.now()}`
    };
    const next = [...draftItems, newItem];
    setDraftItems(next);
    setExpandedIndex(next.length - 1);
  };

  // Manejar selección de archivo de imagen para un ítem
  const handleFileSelect = (index, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      const mimeType = file.type || "image/jpeg";
      setDraftItems((prev) => {
        const next = [...prev];
        next[index] = {
          ...next[index],
          new_image_data: dataUrl,
          mime_type: mimeType
        };
        return next;
      });
    };
    reader.readAsDataURL(file);
  };

  // Guardar Cambios en la Base de Datos
  const handleSaveChanges = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // 1. Guardar cualquier imagen nueva cargada
      for (const item of draftItems) {
        if (item.new_image_data) {
          const cleanBase64 = item.new_image_data.replace(/^data:[^;]+;base64,/, "");
          await updateImage(item.image_key, cleanBase64, item.mime_type || "image/jpeg");
        }
      }

      // 2. Limpiar campos temporales y guardar array de ítems en interface_texts
      const cleanItems = draftItems.map((item) => {
        const { new_image_data, mime_type, ...rest } = item;
        return rest;
      });

      await updateText("ticker_items", JSON.stringify(cleanItems));

      setShowModal(false);
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "¡Carrusel actualizado con éxito!",
        showConfirmButton: false,
        timer: 2500
      });
    } catch (err) {
      console.error("Error saving ticker items:", err);
      Swal.fire({
        title: "Error",
        text: "No se pudieron guardar los cambios del carrusel en la base de datos.",
        icon: "error",
        background: "#0b0f19",
        color: "#ffffff",
        confirmButtonColor: "#d0182b"
      });
    } finally {
      setSaving(false);
    }
  };

  // Duplicar lista para bucle infinito continuo
  const doubleItems = [...activeItems, ...activeItems];

  return (
    <section className="iot-ticker-section">
      <div className="iot-ticker-header-wrap">
        <h2 className="iot-ticker-section-title" style={{ margin: 0 }}>
          <EditableText textKey="ticker_section_title" defaultText="TECNOLOGÍAS E INFRAESTRUCTURAS IOT" />
        </h2>
        {editMode && hasPermission && (
          <button
            type="button"
            className="btn-edit-ticker"
            onClick={handleOpenModal}
            title="Editar carrusel inferior"
          >
            <PencilIcon /> Editar Carrusel
          </button>
        )}
      </div>

      <div className="iot-ticker-container">
        <div className="iot-ticker-track">
          {doubleItems.map((item, index) => {
            const imgSrc = getItemImageSrc(item);
            return (
              <div key={`${item.id}-${index}`} className="iot-ticker-item">
                {imgSrc ? (
                  <img
                    src={imgSrc}
                    alt={item.label}
                    style={{ width: "48px", height: "48px", objectFit: "contain", borderRadius: "8px" }}
                  />
                ) : (
                  DEFAULT_ICONS[item.iconIndex ?? 0] || <SensorNodeIcon />
                )}
                <span className="iot-ticker-label">{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── MODAL "EDITAR CARRUSEL" ── */}
      {showModal && createPortal(
        <div className="ticker-modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="ticker-modal" onClick={(e) => e.stopPropagation()}>
            {/* Header del Modal */}
            <div className="ticker-modal-header">
              <div>
                <h3 className="ticker-modal-title">Editar carrusel</h3>
                <p className="ticker-modal-subtitle">
                  Administra, reordena, edita y agrega los ítems que se muestran en el carrusel principal.
                </p>
              </div>
              <button type="button" className="ticker-modal-close" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>

            {/* Lista de Ítems tipo Acordeón con Scrollbar independiente */}
            <div className="ticker-modal-body">
              <div className="ticker-items-scroll-list">
                {draftItems.map((item, idx) => {
                  const isExpanded = expandedIndex === idx;
                  const imgSrc = getItemImageSrc(item);

                  return (
                    <div key={item.id || idx} className="ticker-item-card">
                      {/* Header de la tarjeta del ítem */}
                      <div
                        className="ticker-item-card-header"
                        onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                      >
                        <div className="ticker-item-card-header-left">
                          {/* Botones de Reordenamiento arriba/abajo */}
                          <div className="ticker-reorder-btns" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              className="ticker-reorder-btn"
                              disabled={idx === 0}
                              onClick={() => handleMoveItem(idx, -1)}
                              title="Mover arriba"
                            >
                              ▲
                            </button>
                            <button
                              type="button"
                              className="ticker-reorder-btn"
                              disabled={idx === draftItems.length - 1}
                              onClick={() => handleMoveItem(idx, 1)}
                              title="Mover abajo"
                            >
                              ▼
                            </button>
                          </div>

                          {/* Vista previa miniatura */}
                          <div className="ticker-item-thumb">
                            {imgSrc ? (
                              <img src={imgSrc} alt="thumb" style={{ width: "28px", height: "28px", objectFit: "contain" }} />
                            ) : (
                              <div style={{ width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                {DEFAULT_ICONS[item.iconIndex ?? 0]}
                              </div>
                            )}
                          </div>

                          <span className="ticker-item-title-preview">
                            {item.label || `Ítem ${idx + 1}`}
                          </span>
                        </div>

                        <div className="ticker-item-card-header-right" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className="ticker-trash-btn"
                            title="Eliminar este ítem"
                            onClick={() => handleDeleteItem(idx)}
                          >
                            <TrashIcon />
                          </button>
                          <button
                            type="button"
                            className="ticker-caret-btn"
                            onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                          >
                            {isExpanded ? <CaretUpIcon /> : <CaretDownIcon />}
                          </button>
                        </div>
                      </div>

                      {/* Desplegable del ítem con campos editables */}
                      {isExpanded && (
                        <div className="ticker-item-card-body">
                          {/* Selector / Previsualización de Imagen */}
                          <div className="ticker-img-upload-box">
                            <div className="ticker-img-preview-container">
                              {imgSrc ? (
                                <img src={imgSrc} alt="preview" />
                              ) : (
                                <div style={{ padding: "8px", textAlign: "center" }}>
                                  {DEFAULT_ICONS[item.iconIndex ?? 0]}
                                </div>
                              )}
                            </div>
                            <button
                              type="button"
                              className="btn-upload-ticker-img"
                              onClick={() => fileInputRefs.current[idx]?.click()}
                            >
                              📷 Cambiar imagen
                            </button>
                            <input
                              ref={(el) => (fileInputRefs.current[idx] = el)}
                              type="file"
                              accept="image/*"
                              style={{ display: "none" }}
                              onChange={(e) => handleFileSelect(idx, e.target.files[0])}
                            />
                          </div>

                          {/* Campo editable de Título */}
                          <div className="ticker-field-group">
                            <label className="ticker-field-label">Título del Ítem</label>
                            <input
                              type="text"
                              className="ticker-field-input"
                              value={item.label || ""}
                              placeholder="Ej. Gateway LoRaWAN"
                              onChange={(e) => {
                                const val = e.target.value;
                                setDraftItems((prev) => {
                                  const next = [...prev];
                                  next[idx] = { ...next[idx], label: val };
                                  return next;
                                });
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Botón para Añadir Nuevo Ítem mantenido fijo en la parte inferior */}
              <div className="ticker-add-btn-container">
                <button
                  type="button"
                  className="btn-add-ticker-item"
                  onClick={handleAddItem}
                >
                  + Añadir nuevo ítem
                </button>
              </div>
            </div>

            {/* Footer del Modal */}
            <div className="ticker-modal-footer">
              <button
                type="button"
                className="btn-ticker-cancel"
                onClick={() => setShowModal(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-ticker-save"
                onClick={handleSaveChanges}
                disabled={saving}
              >
                {saving ? "Guardando…" : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </section>
  );
}
