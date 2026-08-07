import { API_BASE_URL, fetchWithAuth } from '../../config/api';
import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import { useLanguage } from '../../context/LanguageContext';
import { usePageTitle } from '../../hooks/usePageTitle';
import '../../styles/components/admin/GestionarInterfaces.css';

const CustomRoleSelect = ({ value, onChange, options, disabled, placeholder = "-- Seleccionar Rol --" }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedOpt = options.find(o => String(o.id) === String(value) || String(o.value) === String(value));

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="custom-role-select-container" ref={containerRef} style={{ position: 'relative', flex: 1 }}>
      <button
        type="button"
        className={`custom-role-select-trigger ${open ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
          {selectedOpt ? (
            <>
              {selectedOpt.color && (
                <span className="role-color-dot" style={{ backgroundColor: selectedOpt.color }} />
              )}
              <span className="role-select-name">{selectedOpt.name || selectedOpt.label}</span>
              {selectedOpt.level_permission !== undefined && (
                <span className="role-level-pill">Nivel: {selectedOpt.level_permission}</span>
              )}
            </>
          ) : (
            <span className="role-select-placeholder">{placeholder}</span>
          )}
        </div>
        <svg 
          className={`role-select-chevron ${open ? 'rotated' : ''}`} 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2.5" 
          width="14" 
          height="14"
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && !disabled && (
        <div className="custom-role-select-dropdown">
          {options.length > 0 ? (
            options.map((opt) => {
              const optVal = opt.id !== undefined ? opt.id : opt.value;
              const isSelected = String(optVal) === String(value);

              return (
                <div
                  key={optVal}
                  className={`custom-role-select-option ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    onChange(optVal);
                    setOpen(false);
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {opt.color && (
                      <span className="role-color-dot" style={{ backgroundColor: opt.color }} />
                    )}
                    <span className="option-name">{opt.name || opt.label}</span>
                    {opt.level_permission !== undefined && (
                      <span className="option-level">Nivel: {opt.level_permission}</span>
                    )}
                  </div>
                  {isSelected && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="3" width="14" height="14">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
              );
            })
          ) : (
            <div style={{ padding: '10px 12px', fontSize: '0.82rem', color: '#64748b', textAlign: 'center' }}>
              Todos los roles ya han sido admitidos
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default function GestionarInterfaces() {
  const { t, language } = useLanguage();
  usePageTitle({ es: 'Gestionar Permisos', en: 'Manage Permissions' }, 'Admin · IoT ULEAM');
  const [interfaces, setInterfaces] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  const getRoleDisplayName = (rName) => {
    if (!rName) return '';
    const key = `roles.${rName.toLowerCase().replace(/\s+/g, '_')}`;
    return t(key, rName);
  };
  
  // Usuario autenticado
  const [currentUser, setCurrentUser] = useState(null);

  // Búsqueda
  const [searchQuery, setSearchQuery] = useState('');

  // Estado del Modal
  const [showModal, setShowModal] = useState(false);

  // Estados del Formulario (solo edición)
  const [editandoId, setEditandoId] = useState(null);
  const [nombre, setNombre] = useState('');
  const [path, setPath] = useState('');
  const [description, setDescription] = useState('');
  const [minLevel, setMinLevel] = useState(1);
  const [allowedRoleIds, setAllowedRoleIds] = useState([]);
  const [selectedRoleIdToAdd, setSelectedRoleIdToAdd] = useState('');

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
    cargarInterfaces();
    cargarRoles();

    window.addEventListener('userProfileUpdated', cargarSesionLocal);
    return () => window.removeEventListener('userProfileUpdated', cargarSesionLocal);
  }, []);

  const cargarInterfaces = () => {
    setLoading(true);
    fetchWithAuth(`${API_BASE_URL}/interfaces`)
      .then(res => res.json())
      .then(data => {
        setInterfaces(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching interfaces:", err);
        setLoading(false);
      });
  };

  const cargarRoles = () => {
    fetchWithAuth(`${API_BASE_URL}/roles`)
      .then(res => res.json())
      .then(data => setRoles(Array.isArray(data) ? data : []))
      .catch(err => console.error("Error fetching roles:", err));
  };

  const userRoleName = currentUser?.role?.name || currentUser?.rol || (currentUser?.role_id === 1 ? 'Superusuario' : null);
  const isSuperadmin = userRoleName === 'Superusuario' || currentUser?.role_id === 1 || currentUser?.rol === 'Superusuario';

  const abrirEditarModal = (iface) => {
    if (!isSuperadmin) return;
    setEditandoId(iface.id);
    setNombre(iface.name);
    setPath(iface.path);
    setDescription(iface.description || '');
    setMinLevel(iface.min_level !== null ? iface.min_level : 1);
    
    let parsedRoles = [];
    if (typeof iface.allowed_roles === 'string') {
      try { parsedRoles = JSON.parse(iface.allowed_roles); } catch(e){}
    } else if (Array.isArray(iface.allowed_roles)) {
      parsedRoles = iface.allowed_roles;
    }

    const roleIds = parsedRoles.map(item => {
      if (typeof item === 'number') return item;
      if (typeof item === 'string' && !isNaN(parseInt(item, 10))) return parseInt(item, 10);
      const found = roles.find(r => r.name === item);
      return found ? found.id : item;
    });

    if (!roleIds.includes(1)) {
      roleIds.unshift(1);
    }

    setAllowedRoleIds(roleIds);
    setSelectedRoleIdToAdd('');
    setShowModal(true);
  };

  const handleAddRole = () => {
    if (!selectedRoleIdToAdd) return;
    const roleIdNum = parseInt(selectedRoleIdToAdd, 10);
    if (!allowedRoleIds.includes(roleIdNum)) {
      setAllowedRoleIds([...allowedRoleIds, roleIdNum]);
    }
    setSelectedRoleIdToAdd('');
  };

  const handleRemoveRole = (roleIdToRemove) => {
    if (roleIdToRemove === 1) return; // Superusuario (ID 1) cannot be removed
    setAllowedRoleIds(allowedRoleIds.filter(id => id !== roleIdToRemove));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isSuperadmin) {
      Swal.fire({
        title: 'Acceso Denegado', text: 'No tienes los privilegios necesarios.',
        icon: 'error', background: '#0b0f19', color: '#ffffff', confirmButtonColor: '#ef4444'
      });
      return;
    }

    if (minLevel === '' || minLevel === null) {
      Swal.fire({ title: 'Atención', text: 'Por favor asigna un nivel de permiso mínimo.', icon: 'warning', background: '#0b0f19', color: '#ffffff' });
      return;
    }

    const finalRoleIds = allowedRoleIds.includes(1) ? allowedRoleIds : [1, ...allowedRoleIds];

    const payload = {
      name: nombre,
      path: path,
      description: description,
      min_level: parseInt(minLevel, 10),
      allowed_roles: finalRoleIds
    };

    fetchWithAuth(`${API_BASE_URL}/interfaces/${editandoId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
      .then(async res => {
        if (!res.ok) throw new Error("Error en servidor al actualizar la interfaz.");
        return res.json();
      })
      .then(() => {
        Swal.fire({
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 2500,
          timerProgressBar: true,
          icon: 'success',
          title: 'Configuración de interfaz actualizada'
        });
        setShowModal(false);
        cargarInterfaces();
        window.dispatchEvent(new Event('appInterfacesUpdated'));
      })
      .catch(err => {
        Swal.fire({
          title: 'Error', text: err.message || 'Error de red o permisos',
          icon: 'error', background: '#0b0f19', color: '#ffffff'
        });
      });
  };

  const getRoleInfo = (roleIdOrName) => {
    if (typeof roleIdOrName === 'number' || !isNaN(parseInt(roleIdOrName, 10))) {
      const id = parseInt(roleIdOrName, 10);
      const found = roles.find(r => r.id === id);
      if (found) return found;
      return { id, name: `Rol #${id}`, color: '#64748b' };
    }
    const found = roles.find(r => r.name === roleIdOrName);
    if (found) return found;
    return { id: roleIdOrName, name: roleIdOrName, color: '#64748b' };
  };

  const isAdministrativePath = (p) => {
    if (!p) return false;
    return p.includes('/admin') || p.includes('/modo-edicion') || p.includes('/edit-mode');
  };

  const interfacesFiltradas = interfaces
    .filter(iface => isAdministrativePath(iface.path) || isAdministrativePath(iface.path_es) || isAdministrativePath(iface.path_en))
    .filter(iface => {
      const query = searchQuery.toLowerCase();
      return (
        iface.name.toLowerCase().includes(query) || 
        iface.path.toLowerCase().includes(query) ||
        (iface.description && iface.description.toLowerCase().includes(query))
      );
    });

  return (
    <div className="interfaces-page-container">
      

      {/* CONTROLES DE BÚSQUEDA */}
      <div className="interfaces-controls-row">
        <div className="search-box-wrapper">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="search-input-field"
            placeholder={t("manage_interfaces.search_ph", "Buscar por nombre, ruta o descripción...")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
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
            <strong>{language === 'en' ? 'Read-Only Mode:' : 'Modo de Solo Lectura:'}</strong> {t("users.readonly_banner", "Tu rol actual es {{role}}. No dispones de permisos de Superusuario para modificar la seguridad de las interfaces.", { role: getRoleDisplayName(userRoleName) || 'Visitante' })}
          </p>
        </div>
      )}

      {/* TABLA DE INTERFACES */}
      <div className="interfaces-list-wrapper">
        <h3 className="list-section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16" style={{ display: 'inline-block', marginRight: '6px' }}>
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="9" y1="21" x2="9" y2="9" />
          </svg>
          {t("manage_interfaces.catalog_title", "Catálogo de Permisos e Interfaces Administrativas")}
        </h3>

        {loading ? (
          <div className="interfaces-loading-spinner">
            <span className="spinner-dot"></span>
            <span>{t("manage_interfaces.loading", "Cargando interfaces administrativas...")}</span>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-interfaces-table">
              <thead>
                <tr>
                  <th>{t("manage_interfaces.col_interface", "Interfaz (Ruta)")}</th>
                  <th>{t("manage_interfaces.col_desc", "Descripción")}</th>
                  <th>{t("manage_interfaces.col_min_level", "Nivel Mínimo")}</th>
                  <th>{t("manage_interfaces.col_allowed_roles", "Roles Admitidos")}</th>
                  {isSuperadmin && <th className="text-right-align">{t("manage_interfaces.col_ops", "Operaciones")}</th>}
                </tr>
              </thead>
              <tbody>
                {interfacesFiltradas.length > 0 ? (
                  interfacesFiltradas.map((iface) => {
                    let allowedList = [];
                    try {
                      allowedList = typeof iface.allowed_roles === 'string' ? JSON.parse(iface.allowed_roles) : iface.allowed_roles;
                    } catch(e){}
                    if (!Array.isArray(allowedList)) allowedList = [];

                    return (
                      <tr key={iface.id}>
                        <td>
                          <div className="interface-avatar-row">
                            <div className="avatar-circle" style={{ backgroundColor: '#2563eb' }}>
                              {iface.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <span className="interface-fullname">{iface.name}</span>
                              <span className="interface-nickname" style={{ fontFamily: 'monospace', color: '#2563eb' }}>{iface.path}</span>
                            </div>
                          </div>
                        </td>
                        <td style={{ color: '#475569', fontSize: '13.5px', maxWidth: '240px' }}>
                          {iface.description || <em>{t("manage_roles.no_desc", "Sin descripción")}</em>}
                        </td>
                        <td>
                          <span className="role-badge-indicator" style={{ 
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: '#eff6ff', 
                            color: '#1d4ed8', 
                            border: '1px solid #bfdbfe',
                            padding: '4px 10px',
                            borderRadius: '8px',
                            fontWeight: 700,
                            fontSize: '12px'
                          }}>
                            <span className="role-dot" style={{ backgroundColor: '#2563eb' }}></span>
                            {t("manage_roles.level_prefix", "Nivel")} {iface.min_level ?? 0}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {allowedList.map((item, idx) => {
                              const roleInfo = getRoleInfo(item);
                              const displayRoleName = getRoleDisplayName(roleInfo.name);
                              return (
                                <span 
                                  key={idx} 
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    background: 'rgba(241, 245, 249, 0.8)',
                                    border: `1px solid ${roleInfo.color || '#cbd5e1'}60`,
                                    padding: '3px 8px',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    borderRadius: '6px',
                                    color: '#1e293b'
                                  }}
                                >
                                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: roleInfo.color || '#3b82f6' }}></span>
                                  {displayRoleName}
                                </span>
                              );
                            })}
                          </div>
                        </td>
                        {isSuperadmin && (
                          <td className="text-right-align">
                            <div className="table-actions">
                              <button
                                onClick={() => abrirEditarModal(iface)}
                                className="table-btn-edit"
                                title={t("manage_interfaces.edit_permissions", "Editar Permisos")}
                              >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z" />
                                </svg>
                                {t("manage_interfaces.edit_permissions", "Editar Permisos")}
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={isSuperadmin ? 5 : 4} className="table-empty-message">
                      {t("manage_roles.empty", "No se encontraron interfaces administrativas.")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL OVERLAY PARA CONFIGURACIÓN DE PERMISOS */}
      {showModal && (
        <div 
          className="interface-modal-overlay"
          onClick={(e) => {
            if (e.target.classList.contains('interface-modal-overlay')) {
              setShowModal(false);
            }
          }}
        >
          <div className="interface-modal-card">
            <div className="modal-top-accent-bar" />
            
            {/* Header del Modal */}
            <div className="modal-card-header">
              <h3 className="modal-title-main">
                <svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" width="20" height="20" style={{ display: 'inline-block', marginRight: '8px' }}>
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="3" y1="9" x2="21" y2="9" />
                  <line x1="9" y1="21" x2="9" y2="9" />
                </svg>
                {t("manage_interfaces.edit_modal_title", "Configurar Permisos de Interfaz")}
              </h3>
              <button 
                type="button" 
                className="modal-close-btn"
                onClick={() => setShowModal(false)}
                title={t("common.close", "Cerrar modal")}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            
            <form className="modal-form-body" onSubmit={handleSubmit}>
              <div className="interface-modal-grid">

                <div className="modal-input-group">
                  <label className="modal-label">{t("manage_roles.col_name", "Nombre del Rol")}</label>
                  <input 
                    type="text" 
                    value={nombre} 
                    readOnly 
                    className="modal-text-input" 
                    style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed', color: '#64748b' }} 
                  />
                </div>

                <div className="modal-input-group">
                  <label className="modal-label">{t("manage_interfaces.path_label", "Ruta / URL")}</label>
                  <input 
                    type="text" 
                    value={path} 
                    readOnly 
                    className="modal-text-input" 
                    style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed', color: '#2563eb', fontFamily: 'monospace' }} 
                  />
                </div>
                
                <div className="modal-input-group">
                  <label className="modal-label">{t("manage_roles.desc_label", "Descripción de la Interfaz")}</label>
                  <textarea 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    placeholder={t("manage_roles.desc_ph", "Describe la función o propósito de esta interfaz...")}
                    className="modal-text-input"
                    rows="3"
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <div className="modal-input-group">
                  <label className="modal-label">{t("manage_interfaces.min_level_label", "Nivel de Permiso Mínimo Requerido")}</label>
                  <input 
                    type="number" 
                    min="0"
                    max="100"
                    value={minLevel} 
                    onChange={(e) => setMinLevel(e.target.value)} 
                    className="modal-text-input" 
                    required 
                  />
                  <small style={{ color: '#64748b', fontSize: '0.72rem', marginTop: '2px' }}>
                    {t("manage_roles.level_hint", "El usuario debe tener un nivel de permiso igual o mayor a este número para acceder.")}
                  </small>
                </div>

                <div className="modal-input-group">
                  <label className="modal-label">{t("manage_interfaces.allowed_roles_label", "Roles Admitidos")}</label>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', minHeight: '42px', padding: '8px 12px', border: '1.5px solid #cbd5e1', borderRadius: '10px', background: '#f8fafc', alignItems: 'center' }}>
                    {allowedRoleIds.map(roleId => {
                      const rInfo = getRoleInfo(roleId);
                      const isSuperRole = roleId === 1 || rInfo.name === 'Superusuario';
                      const displayRName = getRoleDisplayName(rInfo.name);
                      return (
                        <span 
                          key={roleId} 
                          style={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '6px', 
                            background: '#ffffff', 
                            border: `1px solid ${rInfo.color || '#cbd5e1'}`, 
                            padding: '4px 10px', 
                            borderRadius: '6px', 
                            fontSize: '12px', 
                            fontWeight: 700,
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                            color: '#1e293b'
                          }}
                        >
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: rInfo.color || '#3b82f6' }}></span>
                          {displayRName}
                          {!isSuperRole && (
                            <button 
                              type="button" 
                              onClick={() => handleRemoveRole(roleId)} 
                              style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444', fontWeight: 800, padding: '0 2px', marginLeft: '4px', fontSize: '14px' }}
                              title={t("admin.delete", "Quitar Rol")}
                            >
                              ×
                            </button>
                          )}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="modal-input-group">
                  <label className="modal-label">{t("manage_interfaces.add_role_btn", "Añadir Rol")}</label>
                  <div className="add-role-input-row">
                    <CustomRoleSelect
                      value={selectedRoleIdToAdd}
                      onChange={(val) => setSelectedRoleIdToAdd(val)}
                      options={roles.filter(r => !allowedRoleIds.includes(r.id)).map(r => ({ ...r, translatedName: getRoleDisplayName(r.name) }))}
                      placeholder={t("manage_interfaces.select_role_add", "-- Seleccionar Rol para Admitir --")}
                    />
                    <button 
                      type="button" 
                      onClick={handleAddRole} 
                      disabled={!selectedRoleIdToAdd}
                      className="btn-modal-save" 
                      style={{ padding: '0 14px', height: '42px', fontSize: '12.5px', whiteSpace: 'nowrap', backgroundColor: selectedRoleIdToAdd ? '#2563eb' : '#94a3b8', cursor: selectedRoleIdToAdd ? 'pointer' : 'not-allowed' }}
                    >
                      {t("manage_interfaces.add_role_btn", "Añadir Rol")}
                    </button>
                  </div>
                </div>
              </div>

              <div className="modal-actions-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setShowModal(false)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14" style={{ marginRight: '6px' }}>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                  {t("admin.cancel", "Cancelar")}
                </button>
                <button type="submit" className="btn-modal-save">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14" style={{ marginRight: '6px' }}>
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                    <polyline points="17 21 17 13 7 13 7 21" />
                    <polyline points="7 3 7 8 15 8" />
                  </svg>
                  {t("manage_interfaces.save_permissions", "Guardar Configuración")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}