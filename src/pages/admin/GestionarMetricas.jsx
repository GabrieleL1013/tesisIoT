import { API_BASE_URL, fetchWithAuth } from '../../config/api';
import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import { usePageTitle } from '../../context/PageTitleContext';
import '../../styles/components/admin/GestionarMetricas.css';
import iotLogoDefault from '../../assets/IOT-LOGO.png';

export const METRIC_ICONS_CATALOG = [
  {
    key: 'termometro',
    label: 'Termómetro',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
        <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
      </svg>
    )
  },
  {
    key: 'humedad',
    label: 'Humedad / Agua',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
      </svg>
    )
  },
  {
    key: 'presion',
    label: 'Presión / Manómetro',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
        <circle cx="12" cy="12" r="9" />
        <line x1="12" y1="12" x2="15" y2="9" />
      </svg>
    )
  },
  {
    key: 'viento',
    label: 'Viento / Aire',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
        <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2" />
      </svg>
    )
  },
  {
    key: 'lluvia',
    label: 'Lluvia',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
        <path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25M8 16v4m4-2v4m4-4v4" />
      </svg>
    )
  },
  {
    key: 'luz',
    label: 'Luz / Sol',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </svg>
    )
  },
  {
    key: 'energia',
    label: 'Energía / Voltaje',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    )
  },
  {
    key: 'ph',
    label: 'pH / Química',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
        <path d="M10 2v7.31L4.75 18.25A2 2 0 0 0 6.46 21.2h11.08a2 2 0 0 0 1.71-2.95L14 9.31V2" />
      </svg>
    )
  },
  {
    key: 'sonido',
    label: 'Sonido / Ruido',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      </svg>
    )
  },
  {
    key: 'general',
    label: 'General / Sensor',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
        <polygon points="12 2 2 7 12 12 22 7 12 2" />
        <polyline points="2 17 12 22 22 17" />
        <polyline points="2 12 12 17 22 12" />
      </svg>
    )
  }
];

const IconPickerButton = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const activeIconObj = METRIC_ICONS_CATALOG.find(i => i.key === value) || METRIC_ICONS_CATALOG[0];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        className="met-icon-picker-trigger"
        onClick={() => setOpen(!open)}
        title="Seleccionar Símbolo/Icono para esta variable"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 10px',
          height: '38px',
          background: '#ffffff',
          border: '1.5px solid #cbd5e1',
          borderRadius: '8px',
          cursor: 'pointer',
          color: '#2563eb',
          transition: 'all 0.15s ease'
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center' }}>
          {activeIconObj.icon}
        </span>
        <svg viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" width="12" height="12" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div 
          className="met-icon-picker-popover"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            zIndex: 1100,
            background: '#ffffff',
            border: '1.5px solid #cbd5e1',
            borderRadius: '14px',
            boxShadow: '0 12px 28px rgba(15, 23, 42, 0.18)',
            padding: '10px',
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 34px)',
            gap: '8px',
            width: 'max-content',
            boxSizing: 'border-box'
          }}
        >
          {METRIC_ICONS_CATALOG.map((item) => {
            const isSelected = item.key === (value || 'termometro');
            return (
              <button
                key={item.key}
                type="button"
                className={`met-icon-item ${isSelected ? 'selected' : ''}`}
                title={item.label}
                onClick={() => {
                  onChange(item.key);
                  setOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  border: isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0',
                  background: isSelected ? '#eff6ff' : '#f8fafc',
                  color: isSelected ? '#2563eb' : '#475569',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {item.icon}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const EMPTY_SUB = { nombre: '', unidad: '', claveMqtt: '', minExpected: '', maxExpected: '', icono: 'termometro' };

export default function GestionarMetricas() {
  const { setPage } = usePageTitle();
  useEffect(() => {
    setPage('🔬 Métricas y Sensores', 'Registra y gestiona los paquetes de sensores y sus subvariables MQTT');
    return () => setPage('', '');
  }, [setPage]);

  const [metricas, setMetricas]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [showForm, setShowForm]           = useState(false);
  const [editandoId, setEditandoId]       = useState(null);
  const [nombre, setNombre]               = useState('');
  const [imagen, setImagen]               = useState('');
  const [subvariables, setSubvariables]   = useState([{ ...EMPTY_SUB }]);
  const [saving, setSaving]               = useState(false);
  const [busqueda, setBusqueda]           = useState('');
  const [orden, setOrden]                 = useState(null);
  const [showOrdenPanel, setShowOrdenPanel] = useState(false);

  const metricasFiltradas = metricas
    .filter(m => {
      const query = busqueda.toLowerCase().trim();
      if (!query) return true;
      const matchNombre = m.nombre.toLowerCase().includes(query);
      const matchSubs = m.subvariables?.some(s => s.nombre.toLowerCase().includes(query) || s.claveMqtt.toLowerCase().includes(query));
      return matchNombre || matchSubs;
    })
    .sort((a, b) => {
      if (orden === 'name_asc') return a.nombre.localeCompare(b.nombre);
      if (orden === 'name_desc') return b.nombre.localeCompare(a.nombre);
      if (orden === 'desc') return b.id - a.id;
      return a.id - b.id;
    });

  const cargarMetricas = () => {
    setLoading(true);
    fetch(`${API_BASE_URL}/metricas`)
      .then(r => r.json())
      .then(data => { setMetricas(Array.isArray(data) ? data : []); })
      .catch((err) => {
        console.error('Error loading metrics presets:', err);
        setMetricas([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { cargarMetricas(); }, []);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.met-filter-group-orden')) {
        setShowOrdenPanel(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  const obtenerTextoOrden = () => {
    if (orden === 'desc') return 'Más recientes primero';
    if (orden === 'name_asc') return 'Nombre (A-Z)';
    if (orden === 'name_desc') return 'Nombre (Z-A)';
    if (orden === 'asc') return 'Más antiguos primero';
    return 'Ordenar';
  };

  const limpiar = () => {
    setEditandoId(null);
    setNombre('');
    setImagen('');
    setSubvariables([{ ...EMPTY_SUB }]);
    setSaving(false);
  };

  const abrirCreacion = () => { limpiar(); setShowForm(true); };
  const cancelar      = () => { limpiar(); setShowForm(false); };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        Swal.fire({ icon: 'error', title: 'Archivo demasiado grande', text: 'La imagen debe ser menor a 2MB.', confirmButtonColor: '#2563eb' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => { setImagen(reader.result); };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => { setImagen(''); };

  const cambiarSub = (i, field, val) => {
    const arr = [...subvariables];
    arr[i] = { ...arr[i], [field]: val };
    setSubvariables(arr);
  };

  const addSub    = () => setSubvariables([...subvariables, { ...EMPTY_SUB }]);
  const removeSub = (i) => subvariables.length > 1 && setSubvariables(subvariables.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const subs = subvariables.filter(s => s.nombre.trim() && s.unidad.trim() && s.claveMqtt.trim());
    if (!nombre.trim() || subs.length === 0) {
      Swal.fire({ icon: 'warning', title: 'Campos incompletos', text: 'Ingresa el nombre del sensor y al menos una subvariable completa.', confirmButtonColor: '#2563eb' });
      return;
    }
    setSaving(true);
    const endpoint = editandoId ? `${API_BASE_URL}/metricas/${editandoId}` : `${API_BASE_URL}/metricas`;
    const method = editandoId ? 'PUT' : 'POST';
    try {
      const res = await fetchWithAuth(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          nombre: nombre.trim(), 
          subvariables: subs.map(s => ({
            ...s,
            minExpected: s.minExpected !== '' && s.minExpected !== null ? Number(s.minExpected) : null,
            maxExpected: s.maxExpected !== '' && s.maxExpected !== null ? Number(s.maxExpected) : null
          })), 
          imagen: imagen || null 
        })
      });
      if (!res.ok) throw new Error();
      Swal.fire({ icon: 'success', title: editandoId ? '¡Actualizado!' : '¡Registrado!', text: editandoId ? 'El sensor se actualizó correctamente.' : 'El sensor se creó correctamente.', confirmButtonColor: '#2563eb' });
      cancelar();
      cargarMetricas();
    } catch {
      Swal.fire({ icon: 'error', title: 'Algo salió mal', text: 'No se pudo guardar el sensor. Inténtalo de nuevo.', confirmButtonColor: '#2563eb' });
    } finally {
      setSaving(false);
    }
  };

  const cargarEdicion = (m) => {
    setEditandoId(m.id);
    setNombre(m.nombre);
    setImagen(m.imagen || '');
    setSubvariables(m.subvariables?.length ? JSON.parse(JSON.stringify(m.subvariables)) : [{ ...EMPTY_SUB }]);
    setShowForm(true);
  };

  const eliminar = (id) => {
    const met = metricas.find(m => m.id === id);
    Swal.fire({
      title: '¿Eliminar sensor?',
      text: `"${met?.nombre}" y todas sus subvariables serán eliminados.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#4b5563',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(async (r) => {
      if (!r.isConfirmed) return;
      try {
        await fetchWithAuth(`${API_BASE_URL}/metricas/${id}`, { method: 'DELETE' });
        if (editandoId === id) cancelar();
        cargarMetricas();
      } catch {
        Swal.fire({ icon: 'error', title: 'Algo salió mal', text: 'No se pudo eliminar el sensor. Inténtalo de nuevo.', confirmButtonColor: '#2563eb' });
      }
    });
  };

  /* ── render ── */
  return (
    <div className="met-page">

      {/* ══════════════════════════════════════════
          MODO FORMULARIO — Full-screen layout
      ══════════════════════════════════════════ */}
      {showForm ? (
        <div className="met-form-fullscreen">

          {/* ── Cabecera del formulario ── */}
          <div className="met-form-topbar">
            <h2 className="met-form-heading">
              {editandoId ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px', color: '#0f2c59' }}>
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px', color: '#0f2c59' }}>
                  <circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"/>
                </svg>
              )}
              {editandoId ? 'Modificar Sensor' : 'Registrar Nuevo Sensor'}
            </h2>

            <button
              type="button"
              onClick={cancelar}
              className="met-btn-volver"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="15" height="15">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
              Volver al Listado
            </button>
          </div>

          {/* ── Cuerpo en dos columnas ── */}
          <form onSubmit={handleSubmit} className="met-form-body">

            {/* ── COL IZQUIERDA: Nombre + Imagen ── */}
            <div className="met-form-left">
              <div className="met-field-group">
                <label className="met-label">Nombre del Sensor</label>
                <input
                  autoFocus
                  type="text"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  placeholder="Ej. Estación Meteorológica DHT22"
                  className="met-input met-input--full"
                />
              </div>

              {/* Imagen grande */}
              <div className="met-field-group" style={{ flex: 1 }}>
                <label className="met-label">Imagen del Sensor</label>
                {imagen ? (
                  <div className="met-img-preview-large">
                    <img src={imagen} alt="Vista previa" className="met-img-large" />
                    <button type="button" className="met-btn-remove-image" onClick={removeImage} title="Quitar imagen">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="14" height="14">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                ) : (
                  <label className="met-dropzone-large">
                    <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="52" height="52" className="met-upload-icon">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    <span className="met-upload-text">Subir imagen del sensor</span>
                    <span className="met-upload-hint">PNG, JPG, WEBP · Máx. 2MB</span>
                  </label>
                )}
              </div>
            </div>

            {/* ── COL DERECHA: Subvariables ── */}
            <div className="met-form-right">
              <div className="met-subs-section met-subs-section--full">
                <div className="met-subs-header">
                  <span className="met-section-label">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14" style={{ display: 'inline', verticalAlign: 'middle', marginRight: '5px' }}>
                      <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
                      <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
                    </svg>
                    Subvariables MQTT
                  </span>
                  <button type="button" onClick={addSub} className="met-btn-add-sub">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="12" height="12">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    Añadir Fila
                  </button>
                </div>

                <div className="met-subs-list">
                  {subvariables.map((sub, idx) => (
                    <div key={idx} className="met-sub-row">
                      <div className="met-sub-row-num">{idx + 1}</div>

                      <div className="met-sub-field">
                        <label className="met-sub-label">Nombre</label>
                        <input
                          type="text"
                          value={sub.nombre}
                          onChange={e => cambiarSub(idx, 'nombre', e.target.value)}
                          placeholder="Nombre variable"
                          className="met-sub-input"
                        />
                      </div>

                      <div className="met-sub-field met-sub-field--short">
                        <label className="met-sub-label">Unidad</label>
                        <input
                          type="text"
                          value={sub.unidad}
                          onChange={e => cambiarSub(idx, 'unidad', e.target.value)}
                          placeholder="°C / % / ppm"
                          className="met-sub-input"
                        />
                      </div>

                      <div className="met-sub-field met-sub-field--icon">
                        <label className="met-sub-label">Símbolo</label>
                        <IconPickerButton
                          value={sub.icono || (sub.claveMqtt === 'temp' ? 'termometro' : sub.claveMqtt === 'hum' ? 'humedad' : sub.claveMqtt === 'press' ? 'presion' : 'general')}
                          onChange={val => cambiarSub(idx, 'icono', val)}
                        />
                      </div>

                      <div className="met-sub-field">
                        <label className="met-sub-label">Clave MQTT</label>
                        <input
                          type="text"
                          value={sub.claveMqtt}
                          onChange={e => cambiarSub(idx, 'claveMqtt', e.target.value)}
                          placeholder="temp / hum / co2"
                          className="met-sub-input met-sub-input--mono"
                        />
                      </div>

                      <div className="met-sub-field met-sub-field--short">
                        <label className="met-sub-label">Min. Esp.</label>
                        <input
                          type="number"
                          step="any"
                          value={sub.minExpected ?? ''}
                          onChange={e => cambiarSub(idx, 'minExpected', e.target.value)}
                          placeholder="Ej. 10"
                          className="met-sub-input"
                        />
                      </div>

                      <div className="met-sub-field met-sub-field--short">
                        <label className="met-sub-label">Max. Esp.</label>
                        <input
                          type="number"
                          step="any"
                          value={sub.maxExpected ?? ''}
                          onChange={e => cambiarSub(idx, 'maxExpected', e.target.value)}
                          placeholder="Ej. 40"
                          className="met-sub-input"
                        />
                      </div>

                      {subvariables.length > 1 && (
                        <button type="button" className="met-btn-remove-sub" onClick={() => removeSub(idx)} title="Eliminar">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="14" height="14">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Acciones */}
              <div className="met-form-actions">
                <button type="button" onClick={cancelar} className="met-btn-cancel">Cancelar</button>
                <button type="submit" className="met-btn-save" disabled={saving}>
                  {saving ? (
                    'Guardando...'
                  ) : editandoId ? (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}>
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                        <polyline points="17 21 17 13 7 13 7 21"/>
                        <polyline points="7 3 7 8 15 8"/>
                      </svg>
                      Aplicar Cambios
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}>
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                        <polyline points="17 21 17 13 7 13 7 21"/>
                        <polyline points="7 3 7 8 15 8"/>
                      </svg>
                      Guardar Sensor
                    </>
                  )}
                </button>
              </div>
            </div>

          </form>
        </div>

      ) : (
        /* ══════════════════════════════════════════
            MODO LISTADO
        ══════════════════════════════════════════ */
        <>
          {/* ── Toolbar única ── */}
          <div className="met-toolbar" style={{ position: 'relative', zIndex: 30 }}>
            {/* Búsqueda */}
            <div className="met-search-wrapper" style={{ flex: '1 1 200px' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="14" height="14" className="met-search-icon">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                placeholder="Buscar sensor o subvariable..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                className="met-filter-input met-search-input"
              />
            </div>

            {/* Ordenar */}
            <div className="pub-news-filter-group met-filter-group-orden" style={{ position: 'relative' }}>
              <button 
                type="button"
                className={`pub-news-unified-filter-btn ${showOrdenPanel ? 'open' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowOrdenPanel(!showOrdenPanel);
                }}
                style={{ height: '42px', borderRadius: '12px' }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                  <path d="M3 12h18M3 6h18M3 18h18" />
                </svg>
                <span>{obtenerTextoOrden()}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12" className="select-arrow-icon">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {showOrdenPanel && (
                <div className="pub-news-unified-filter-panel" style={{ minWidth: '220px', left: 0 }}>
                  <div className="filter-panel-section" style={{ width: '100%' }}>
                    <span className="filter-panel-section-title">Ordenar por</span>
                    <div className="filter-panel-options-list">
                      <button
                        type="button"
                        className={`filter-panel-option-item ${orden === 'asc' ? 'active' : ''}`}
                        onClick={() => {
                          if (orden === 'asc') {
                            setOrden(null);
                          } else {
                            setOrden('asc');
                          }
                          setShowOrdenPanel(false);
                        }}
                      >
                        Más antiguos primero
                      </button>
                      <button
                        type="button"
                        className={`filter-panel-option-item ${orden === 'desc' ? 'active' : ''}`}
                        onClick={() => {
                          if (orden === 'desc') {
                            setOrden(null);
                          } else {
                            setOrden('desc');
                          }
                          setShowOrdenPanel(false);
                        }}
                      >
                        Más recientes primero
                      </button>
                      <button
                        type="button"
                        className={`filter-panel-option-item ${orden === 'name_asc' ? 'active' : ''}`}
                        onClick={() => {
                          if (orden === 'name_asc') {
                            setOrden(null);
                          } else {
                            setOrden('name_asc');
                          }
                          setShowOrdenPanel(false);
                        }}
                      >
                        Nombre (A-Z)
                      </button>
                      <button
                        type="button"
                        className={`filter-panel-option-item ${orden === 'name_desc' ? 'active' : ''}`}
                        onClick={() => {
                          if (orden === 'name_desc') {
                            setOrden(null);
                          } else {
                            setOrden('name_desc');
                          }
                          setShowOrdenPanel(false);
                        }}
                      >
                        Nombre (Z-A)
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Botón agregar */}
            <button className="met-btn-add" onClick={abrirCreacion} style={{ flexShrink: 0, height: '42px', borderRadius: '12px' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="15" height="15">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Agregar Sensor
            </button>
          </div>

          {/* ── Cards ── */}
          <div className="met-grid">
            {loading && <div className="met-loading-text">Cargando sensores...</div>}
            {!loading && metricasFiltradas.length === 0 && (
              <div className="met-empty-state">No se encontraron sensores registrados.</div>
            )}
            {!loading && metricasFiltradas.map((m, idx) => (
              <div key={m.id} className="met-card">
                <div className="met-card-img-wrapper">
                  <img
                    src={m.imagen || iotLogoDefault}
                    alt={m.nombre}
                    className={m.imagen ? 'met-card-img' : 'met-card-img met-card-img--default'}
                  />
                  <div className="met-card-idx">#{idx + 1}</div>
                </div>

                <div className="met-card-content">
                  <h3 className="met-card-name">{m.nombre}</h3>
                  <div className="met-card-section-title">📋 Subvariables</div>
                  <div className="met-card-subs">
                    {m.subvariables?.map((sub, i) => (
                      <div key={i} className="met-sub-badge">
                        <span className="met-sub-badge-name">{sub.nombre}</span>
                        <span className="met-sub-badge-unit">{sub.unidad}</span>
                        <span className="met-sub-badge-key">{sub.claveMqtt}</span>
                        {(sub.minExpected !== null || sub.maxExpected !== null) && (
                          <span className="met-sub-badge-key" style={{backgroundColor: '#e2e8f0', color: '#475569', marginLeft: '4px'}}>
                            Lim: {sub.minExpected ?? '-'} a {sub.maxExpected ?? '-'}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="met-card-actions">
                  <button className="met-btn-edit" onClick={() => cargarEdicion(m)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    Editar
                  </button>
                  <button className="met-btn-delete" onClick={() => eliminar(m.id)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
