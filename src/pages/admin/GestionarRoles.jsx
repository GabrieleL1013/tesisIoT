import { API_BASE_URL, fetchWithAuth } from '../../config/api';
import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import '../../styles/components/admin/GestionarUsuarios.css';

const PRESET_COLORS = [
  { hex: '#3b82f6', name: 'Azul' },
  { hex: '#10b981', name: 'Verde' },
  { hex: '#f59e0b', name: 'Ámbar' },
  { hex: '#ef4444', name: 'Rojo' },
  { hex: '#8b5cf6', name: 'Púrpura' },
  { hex: '#ec4899', name: 'Rosa' },
  { hex: '#06b6d4', name: 'Cian' },
  { hex: '#6366f1', name: 'Índigo' },
  { hex: '#f97316', name: 'Naranja' },
  { hex: '#14b8a6', name: 'Turquesa' },
  { hex: '#84cc16', name: 'Lima' },
  { hex: '#64748b', name: 'Pizarra' },
];

const hexToHsv = (hex) => {
  let c = (hex || '#3b82f6').replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  if (c.length !== 6) return { h: 217, s: 76, v: 96 };
  const r = parseInt(c.substr(0, 2), 16) / 255;
  const g = parseInt(c.substr(2, 2), 16) / 255;
  const b = parseInt(c.substr(4, 2), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, v = max;
  const d = max - min;
  s = max === 0 ? 0 : d / max;
  if (max === min) {
    h = 0;
  } else {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), v: Math.round(v * 100) };
};

const hsvToHex = (h, s, v) => {
  const sat = s / 100, val = v / 100;
  let r, g, b;
  const i = Math.floor((h / 60) % 6);
  const f = h / 60 - i;
  const p = val * (1 - sat);
  const q = val * (1 - f * sat);
  const t = val * (1 - (1 - f) * sat);
  switch (i) {
    case 0: r = val; g = t; b = p; break;
    case 1: r = q; g = val; b = p; break;
    case 2: r = p; g = val; b = t; break;
    case 3: r = p; g = q; b = val; break;
    case 4: r = t; g = p; b = val; break;
    case 5: r = val; g = p; b = q; break;
  }
  const toHex = x => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const hsvToRgb = (h, s, v) => {
  const hex = hsvToHex(h, s, v).replace('#', '');
  return {
    r: parseInt(hex.substr(0, 2), 16) || 0,
    g: parseInt(hex.substr(2, 2), 16) || 0,
    b: parseInt(hex.substr(4, 2), 16) || 0
  };
};

const CustomColorPickerPopover = ({ value, onChange, onClose }) => {
  const containerRef = useRef(null);
  const satAreaRef = useRef(null);
  const hueSliderRef = useRef(null);

  const [hsv, setHsv] = useState(() => hexToHsv(value));

  useEffect(() => {
    setHsv(hexToHsv(value));
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleSatMouseDown = (e) => {
    const updateSatVal = (evt) => {
      if (!satAreaRef.current) return;
      const rect = satAreaRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, evt.clientX - rect.left));
      const y = Math.max(0, Math.min(rect.height, evt.clientY - rect.top));
      const newS = Math.round((x / rect.width) * 100);
      const newV = Math.round((1 - y / rect.height) * 100);
      
      const newHsv = { ...hsv, s: newS, v: newV };
      setHsv(newHsv);
      onChange(hsvToHex(newHsv.h, newS, newV));
    };

    updateSatVal(e);

    const onMouseMove = (evt) => updateSatVal(evt);
    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleHueMouseDown = (e) => {
    const updateHue = (evt) => {
      if (!hueSliderRef.current) return;
      const rect = hueSliderRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, evt.clientX - rect.left));
      const newH = Math.round((x / rect.width) * 360);

      const newHsv = { ...hsv, h: newH };
      setHsv(newHsv);
      onChange(hsvToHex(newH, hsv.s, hsv.v));
    };

    updateHue(e);

    const onMouseMove = (evt) => updateHue(evt);
    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleEyeDropper = async () => {
    if (window.EyeDropper) {
      try {
        const eyeDropper = new window.EyeDropper();
        const result = await eyeDropper.open();
        if (result && result.sRGBHex) {
          onChange(result.sRGBHex);
        }
      } catch (err) {
        console.error("Eyedropper error:", err);
      }
    }
  };

  const rgb = hsvToRgb(hsv.h, hsv.s, hsv.v);
  const currentHex = hsvToHex(hsv.h, hsv.s, hsv.v);

  return (
    <div className="pretty-color-popover-panel" ref={containerRef}>
      <div 
        ref={satAreaRef}
        className="pretty-sat-val-area"
        style={{ backgroundColor: `hsl(${hsv.h}, 100%, 50%)` }}
        onMouseDown={handleSatMouseDown}
      >
        <div className="pretty-sat-val-white" />
        <div className="pretty-sat-val-black" />
        <div 
          className="pretty-sat-val-pointer"
          style={{
            left: `${hsv.s}%`,
            top: `${100 - hsv.v}%`
          }}
        />
      </div>

      <div className="pretty-popover-controls-row">
        {window.EyeDropper && (
          <button 
            type="button" 
            className="pretty-pipeta-btn"
            onClick={handleEyeDropper}
            title="Seleccionar color de pantalla (Pipeta)"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="15" height="15">
              <path d="M14 2l4 4L7 17H3v-4L14 2z" />
              <path d="M11 5l4 4" />
            </svg>
          </button>
        )}

        <div 
          className="pretty-popover-color-circle" 
          style={{ backgroundColor: currentHex }}
        />

        <div 
          ref={hueSliderRef}
          className="pretty-hue-slider-track"
          onMouseDown={handleHueMouseDown}
        >
          <div 
            className="pretty-hue-slider-pointer"
            style={{ left: `${(hsv.h / 360) * 100}%` }}
          />
        </div>
      </div>

      <div className="pretty-rgb-inputs-row">
        <div className="pretty-rgb-field">
          <input 
            type="number" 
            min="0" 
            max="255"
            value={rgb.r}
            onChange={(e) => {
              const r = Math.max(0, Math.min(255, parseInt(e.target.value) || 0));
              const hex = `#${r.toString(16).padStart(2, '0')}${rgb.g.toString(16).padStart(2, '0')}${rgb.b.toString(16).padStart(2, '0')}`;
              onChange(hex);
            }}
          />
          <span>R</span>
        </div>
        <div className="pretty-rgb-field">
          <input 
            type="number" 
            min="0" 
            max="255"
            value={rgb.g}
            onChange={(e) => {
              const g = Math.max(0, Math.min(255, parseInt(e.target.value) || 0));
              const hex = `#${rgb.r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${rgb.b.toString(16).padStart(2, '0')}`;
              onChange(hex);
            }}
          />
          <span>G</span>
        </div>
        <div className="pretty-rgb-field">
          <input 
            type="number" 
            min="0" 
            max="255"
            value={rgb.b}
            onChange={(e) => {
              const b = Math.max(0, Math.min(255, parseInt(e.target.value) || 0));
              const hex = `#${rgb.r.toString(16).padStart(2, '0')}${rgb.g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
              onChange(hex);
            }}
          />
          <span>B</span>
        </div>
      </div>
    </div>
  );
};

const PrettyColorPicker = ({ value, onChange }) => {
  const [showPopover, setShowPopover] = useState(false);
  const currentColor = value || '#3b82f6';

  return (
    <div className="pretty-color-picker-container" style={{ position: 'relative' }}>
      <div className="pretty-color-input-row">
        <div 
          className="pretty-color-badge-preview"
          style={{ backgroundColor: currentColor }}
          onClick={() => setShowPopover(!showPopover)}
          title="Haz clic para abrir el selector de color avanzado"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" width="14" height="14" className="pretty-color-edit-icon">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z" />
          </svg>
        </div>

        <div className="pretty-hex-input-wrapper">
          <span className="pretty-hex-prefix">#</span>
          <input 
            type="text"
            value={currentColor.replace('#', '')}
            onChange={(e) => {
              const val = e.target.value.trim();
              onChange(val ? `#${val}` : '#');
            }}
            placeholder="3b82f6"
            className="pretty-hex-input"
            maxLength={7}
          />
        </div>

        <button
          type="button"
          className="pretty-custom-picker-btn"
          onClick={() => setShowPopover(!showPopover)}
          title="Selector de color desplegable"
        >
          <span 
            style={{ 
              width: '12px', 
              height: '12px', 
              borderRadius: '50%', 
              backgroundColor: currentColor,
              display: 'inline-block',
              boxShadow: '0 0 0 1.5px #ffffff, 0 0 0 2.5px rgba(0,0,0,0.15)',
              transition: 'background-color 0.15s ease'
            }} 
          />
          Gama
        </button>
      </div>

      {showPopover && (
        <CustomColorPickerPopover 
          value={currentColor} 
          onChange={onChange} 
          onClose={() => setShowPopover(false)} 
        />
      )}
    </div>
  );
};

export default function GestionarRoles() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Usuario actualmente autenticado
  const [currentUser, setCurrentUser] = useState(null);

  // Búsqueda
  const [searchQuery, setSearchQuery] = useState('');

  // Estado del Modal
  const [showModal, setShowModal] = useState(false);

  // Estados del Formulario (Crear/Editar)
  const [editandoId, setEditandoId] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [levelPermission, setLevelPermission] = useState(1);

  const cargarSesionLocal = () => {
    const sesion = localStorage.getItem('iot_sesion_activa');
    if (sesion) {
      try {
        setCurrentUser(JSON.parse(sesion));
      } catch (e) {
        console.error("Error parsing user session", e);
      }
    }
  };

  useEffect(() => {
    cargarSesionLocal();
    cargarRoles();

    window.addEventListener('userProfileUpdated', cargarSesionLocal);
    return () => window.removeEventListener('userProfileUpdated', cargarSesionLocal);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowModal(false);
      }
    };
    if (showModal) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showModal]);

  const cargarRoles = () => {
    setLoading(true);
    fetchWithAuth(`${API_BASE_URL}/roles`)
      .then(res => res.json())
      .then(data => {
        setRoles(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching roles from backend:", err);
        setLoading(false);
      });
  };

  const userRoleName = currentUser?.role?.name || currentUser?.rol || (currentUser?.role_id === 1 ? 'Superusuario' : null);
  const isSuperadmin = userRoleName === 'Superusuario' || currentUser?.role_id === 1 || currentUser?.rol === 'Superusuario';

  const abrirCrearModal = () => {
    if (!isSuperadmin) return;
    setEditandoId(null);
    setName('');
    setDescription('');
    setColor('#3b82f6');
    setLevelPermission(1);
    setShowModal(true);
  };

  const abrirEditarModal = (roleItem) => {
    if (!isSuperadmin) return;
    setEditandoId(roleItem.id);
    setName(roleItem.name);
    setDescription(roleItem.description || '');
    setColor(roleItem.color || '#3b82f6');
    setLevelPermission(roleItem.level_permission ?? 1);
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!isSuperadmin) {
      Swal.fire({
        title: 'Acceso Denegado',
        text: 'No tienes los privilegios necesarios.',
        icon: 'error',
        background: '#0b0f19',
        color: '#ffffff',
        confirmButtonColor: '#ef4444'
      });
      return;
    }

    if (!name.trim()) {
      Swal.fire({
        title: 'Campo Requerido',
        text: 'El nombre del rol es obligatorio.',
        icon: 'warning',
        background: '#0b0f19',
        color: '#ffffff',
        confirmButtonColor: '#eab308'
      });
      return;
    }

    const payload = {
      name: name.trim(),
      description: description.trim(),
      color: color,
      level_permission: parseInt(levelPermission, 10) || 1
    };

    const endpoint = editandoId 
      ? `${API_BASE_URL}/roles/${editandoId}` 
      : `${API_BASE_URL}/roles`;

    const method = editandoId ? 'PUT' : 'POST';

    fetchWithAuth(endpoint, {
      method: method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) {
          if (res.status === 422 && data.errors && data.errors.name) {
            throw new Error('Ya existe un rol con este nombre.');
          }
          throw new Error(data.message || 'Error al guardar el rol.');
        }
        return data;
      })
      .then(() => {
        Swal.fire({
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 2500,
          timerProgressBar: true,
          icon: 'success',
          title: editandoId ? 'Rol actualizado correctamente' : 'Nuevo rol creado con éxito'
        });
        setShowModal(false);
        cargarRoles();
      })
      .catch(err => {
        Swal.fire({
          title: 'Error al Guardar',
          text: err.message,
          icon: 'error',
          background: '#0b0f19',
          color: '#ffffff',
          confirmButtonColor: '#ef4444'
        });
      });
  };

  const handleDelete = (id, roleName) => {
    if (!isSuperadmin) return;

    if (roleName === 'Superusuario' || id === 1) {
      Swal.fire({
        title: 'Acción Denegada',
        text: 'No se puede eliminar el rol Superusuario principal del sistema.',
        icon: 'error',
        background: '#0b0f19',
        color: '#ffffff',
        confirmButtonColor: '#ef4444'
      });
      return;
    }

    Swal.fire({
      title: '¿Confirmar eliminación?',
      text: `¿Estás seguro de que deseas eliminar el rol "${roleName}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      background: '#0b0f19',
      color: '#ffffff'
    }).then((result) => {
      if (result.isConfirmed) {
        fetchWithAuth(`${API_BASE_URL}/roles/${id}`, {
          method: 'DELETE'
        })
          .then(async res => {
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Error al eliminar rol.');
            return data;
          })
          .then(() => {
            Swal.fire({
              toast: true,
              position: 'top-end',
              showConfirmButton: false,
              timer: 2500,
              timerProgressBar: true,
              icon: 'success',
              title: 'Rol eliminado con éxito'
            });
            cargarRoles();
          })
          .catch(err => {
            Swal.fire({
              title: 'Error',
              text: err.message,
              icon: 'error',
              background: '#0b0f19',
              color: '#ffffff'
            });
          });
      }
    });
  };

  // Filtrado de roles por búsqueda
  const rolesFiltrados = roles.filter(roleItem => {
    const query = searchQuery.toLowerCase();
    return (
      roleItem.name.toLowerCase().includes(query) ||
      (roleItem.description && roleItem.description.toLowerCase().includes(query))
    );
  });

  return (
    <div className="users-page-container">
      
      {/* HEADER DE LA SECCIÓN */}
      <div className="users-header">
        <div className="users-header-info">
          <h2 className="users-page-title">
            <svg className="title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2l3 5h5l-3 5 1 6-6-3-6 3 1-6-3-5h5z" />
            </svg>
            Gestión de Roles del Sistema
          </h2>
          <p className="users-page-subtitle">
            Administra los roles del sistema, sus colores identificadores y sus niveles de jerarquía/permisos.
          </p>
        </div>

        {/* INDICADOR DE ROL ACTUAL */}
        <div className={`role-badge-indicator ${isSuperadmin ? 'is-admin' : 'is-user'}`}>
          <span className="role-dot"></span>
          <span>Rol: {userRoleName || 'Visitante (Solo Lectura)'}</span>
        </div>
      </div>

      {/* CONTROLES DE BÚSQUEDA Y CREACIÓN */}
      <div className="users-controls-row">
        <div className="search-box-wrapper">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="search-input-field"
            placeholder="Buscar rol por nombre o descripción..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-and-add-actions">
          {isSuperadmin && (
            <button 
              type="button" 
              className="btn-add-user"
              onClick={abrirCrearModal}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16" style={{ marginRight: '6px', display: 'inline-block', verticalAlign: 'middle' }}>
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Crear Nuevo Rol
            </button>
          )}
        </div>
      </div>

      {/* AVISO DE LECTURA SI NO ES SUPERADMIN */}
      {!isSuperadmin && (
        <div className="restricted-access-banner-small">
          <svg viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2.5" width="20" height="20" style={{ flexShrink: '0' }}>
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <p className="restricted-notice-text">
            <strong>Modo de Solo Lectura:</strong> Tu rol actual es <strong>{userRoleName || 'Visitante'}</strong>. No dispones de permisos de Superusuario para modificar roles.
          </p>
        </div>
      )}

      {/* TABLA PRINCIPAL DE ROLES */}
      <div className="users-list-wrapper">
        <h3 className="list-section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16" style={{ display: 'inline-block', marginRight: '6px' }}>
            <path d="M12 2l3 5h5l-3 5 1 6-6-3-6 3 1-6-3-5h5z" />
          </svg>
          Catálogo de Roles y Permisos
        </h3>
        
        {loading ? (
          <div className="users-loading-spinner">
            <span className="spinner-dot"></span>
            <span>Cargando catálogo de roles...</span>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-users-table">
              <thead>
                <tr>
                  <th>Nombre del Rol</th>
                  <th>Color Identificador</th>
                  <th>Nivel de Permiso</th>
                  <th>Descripción</th>
                  {isSuperadmin && <th className="text-right-align">Operaciones de Escritura</th>}
                </tr>
              </thead>
              <tbody>
                {rolesFiltrados.length > 0 ? (
                  rolesFiltrados.map((roleItem) => (
                    <tr key={roleItem.id}>
                      <td>
                        <div className="user-avatar-row">
                          <div className="avatar-circle" style={{ backgroundColor: roleItem.color || '#3b82f6' }}>
                            {roleItem.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="user-fullname">{roleItem.name}</span>
                            <span className="user-nickname">ID: #{roleItem.id}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#f8fafc', padding: '4px 10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                          <span style={{ 
                            width: '14px', 
                            height: '14px', 
                            borderRadius: '50%', 
                            backgroundColor: roleItem.color || '#3b82f6', 
                            display: 'inline-block',
                            border: '1px solid rgba(0,0,0,0.15)' 
                          }}></span>
                          <span style={{ fontSize: '12px', fontFamily: 'monospace', color: '#475569', fontWeight: 600 }}>
                            {roleItem.color || '#3b82f6'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="role-badge-indicator" style={{ 
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: roleItem.name === 'Superusuario' ? '#ecfdf5' : '#eff6ff', 
                          color: roleItem.name === 'Superusuario' ? '#047857' : '#1d4ed8',
                          border: `1px solid ${roleItem.name === 'Superusuario' ? '#a7f3d0' : '#bfdbfe'}`,
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontWeight: 700,
                          fontSize: '12px'
                        }}>
                          <span className="role-dot" style={{ backgroundColor: roleItem.name === 'Superusuario' ? '#10b981' : '#3b82f6' }}></span>
                          Nivel {roleItem.level_permission ?? 1}
                        </span>
                      </td>
                      <td style={{ color: '#475569', fontSize: '13.5px', maxWidth: '250px' }}>
                        {roleItem.description || <em>Sin descripción</em>}
                      </td>
                      {isSuperadmin && (
                        <td className="text-right-align">
                          <div className="table-actions">
                            <button
                              onClick={() => abrirEditarModal(roleItem)}
                              className="table-btn-edit"
                              title="Editar configuración de rol"
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z" />
                              </svg>
                              Editar
                            </button>
                            <button
                              onClick={() => handleDelete(roleItem.id, roleItem.name)}
                              className="table-btn-delete"
                              title="Eliminar rol"
                              disabled={roleItem.id === 1 || roleItem.name === 'Superusuario'}
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                              Eliminar
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={isSuperadmin ? 5 : 4} className="table-empty-message">
                      No se encontraron roles registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL OVERLAY PARA REGISTRO/EDICIÓN DE ROL */}
      {showModal && (
        <div 
          className="user-modal-overlay"
          onClick={(e) => {
            if (e.target.classList.contains('user-modal-overlay')) {
              setShowModal(false);
            }
          }}
        >
          <div className="user-modal-card">
            <div className="modal-top-accent-bar" />
            
            {/* Header del Modal */}
            <div className="modal-card-header">
              <h3 className="modal-title-main">
                {editandoId ? (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2.5" width="20" height="20" style={{ display: 'inline-block', marginRight: '8px' }}>
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z" />
                    </svg>
                    Editar Configuración de Rol
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" width="20" height="20" style={{ display: 'inline-block', marginRight: '8px' }}>
                      <path d="M12 2l3 5h5l-3 5 1 6-6-3-6 3 1-6-3-5h5z" />
                    </svg>
                    Crear Nuevo Rol de Sistema
                  </>
                )}
              </h3>
              <button 
                type="button" 
                className="modal-close-btn"
                onClick={() => setShowModal(false)}
                title="Cerrar modal"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="modal-form-body">
              <div className="modal-fields-stack">
                
                <div className="modal-input-group">
                  <label className="modal-label">Nombre del Rol</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej: Observador, Técnico de Red"
                    className="modal-text-input"
                    disabled={editandoId === 1 || name === 'Superusuario'}
                    required
                  />
                </div>

                <div className="modal-input-group">
                  <label className="modal-label">Nivel de Permiso (Mínimo: 1, Máximo: 100)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={levelPermission}
                    onChange={(e) => setLevelPermission(e.target.value)}
                    placeholder="Ej: 1 (Básico), 5 (Intermedio), 10 (Total)"
                    className="modal-text-input"
                    required
                  />
                  <small style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '2px' }}>
                    Los usuarios con este rol podrán acceder a interfaces que requieran este nivel o inferior.
                  </small>
                </div>

                <div className="modal-input-group">
                  <label className="modal-label">Color Identificador</label>
                  <PrettyColorPicker value={color} onChange={setColor} />
                </div>

                <div className="modal-input-group">
                  <label className="modal-label">Descripción del Rol</label>
                  <textarea 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    placeholder="Describe las responsabilidades o alcance de este rol..."
                    className="modal-text-input" 
                    rows="3"
                    style={{ resize: 'vertical' }}
                  />
                </div>

              </div>

              {/* Acciones */}
              <div className="modal-actions-footer">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setShowModal(false)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14" style={{ marginRight: '6px' }}>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                  Cancelar
                </button>
                <button type="submit" className="btn-modal-save">
                  {editandoId ? (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14" style={{ marginRight: '6px' }}>
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z" />
                      </svg>
                      Actualizar
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14" style={{ marginRight: '6px' }}>
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                        <polyline points="17 21 17 13 7 13 7 21" />
                        <polyline points="7 3 7 8 15 8" />
                      </svg>
                      Guardar Rol
                    </>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}