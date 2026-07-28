import { API_BASE_URL } from '../../config/api';
import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import '../../styles/components/admin/GestionarUsuarios.css';

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
    <div className="custom-role-select-container" ref={containerRef} style={{ position: 'relative', width: '100%' }}>
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
          {options.map((opt) => {
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
          })}
        </div>
      )}
    </div>
  );
};

const CustomUserRoleFilterSelect = ({ value, onChange, roles }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const filterOptions = [
    { value: 'todos', label: 'Todos los Roles', color: '#64748b' },
    { value: 'super', label: 'Solo Superusuarios', color: '#10b981' },
    { value: 'no-super', label: 'Usuarios Estándar', color: '#3b82f6' },
    ...roles.map(r => ({
      value: String(r.id),
      label: r.name,
      color: r.color || '#3b82f6',
      level_permission: r.level_permission
    }))
  ];

  const selectedOpt = filterOptions.find(o => String(o.value) === String(value)) || filterOptions[0];

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
    <div className="custom-role-select-container" ref={containerRef} style={{ position: 'relative', minWidth: '200px' }}>
      <button
        type="button"
        className={`custom-role-select-trigger ${open ? 'active' : ''}`}
        onClick={() => setOpen(!open)}
        style={{ height: '42px', padding: '0 0.85rem', display: 'flex', alignItems: 'center' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
          {selectedOpt.value !== 'todos' ? (
            <span className="role-color-dot" style={{ backgroundColor: selectedOpt.color }} />
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" width="13" height="13" style={{ flexShrink: 0 }}>
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          )}
          <span className="role-select-name" style={{ fontSize: '0.85rem' }}>{selectedOpt.label}</span>
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

      {open && (
        <div className="custom-role-select-dropdown" style={{ minWidth: '220px' }}>
          {filterOptions.map((opt) => {
            const isSelected = String(opt.value) === String(value);

            return (
              <div
                key={opt.value}
                className={`custom-role-select-option ${isSelected ? 'selected' : ''}`}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {opt.value !== 'todos' ? (
                    <span className="role-color-dot" style={{ backgroundColor: opt.color }} />
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" width="12" height="12" style={{ flexShrink: 0 }}>
                      <polygon points="12 2 2 7 12 12 22 7 12 2" />
                      <polyline points="2 17 12 22 22 17" />
                      <polyline points="2 12 12 17 22 12" />
                    </svg>
                  )}
                  <span className="option-name">{opt.label}</span>
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
          })}
        </div>
      )}
    </div>
  );
};

export default function GestionarUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Obtener rol del usuario actualmente autenticado
  const [currentUser, setCurrentUser] = useState(null);

  // Filtros y búsquedas
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('todos');

  // Estado del Modal
  const [showModal, setShowModal] = useState(false);

  // Estados del Formulario (para crear/editar en el Modal)
  const [editandoId, setEditandoId] = useState(null);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId] = useState(2);
  const [showPassword, setShowPassword] = useState(false);

  const cargarSesionLocal = () => {
    const sesion = localStorage.getItem('iot_sesion_activa');
    if (sesion) {
      try {
        const parsed = JSON.parse(sesion);
        setCurrentUser(parsed);
      } catch (e) {
        console.error("Error parsing user session", e);
      }
    }
  };

  useEffect(() => {
    cargarSesionLocal();
    cargarUsuarios();
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

  const cargarUsuarios = () => {
    setLoading(true);
    fetch(`${API_BASE_URL}/users`)
      .then(res => res.json())
      .then(data => {
        setUsuarios(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching users from backend:", err);
        setLoading(false);
      });
  };

  const cargarRoles = () => {
    fetch(`${API_BASE_URL}/roles`)
      .then(res => res.json())
      .then(data => setRoles(data))
      .catch(err => console.error("Error fetching roles:", err));
  };

  const userRoleName = currentUser?.role?.name || currentUser?.rol || (currentUser?.role_id === 1 ? 'Superusuario' : null);
  const isSuperadmin = userRoleName === 'Superusuario' || currentUser?.role_id === 1 || currentUser?.rol === 'Superusuario';

  const abrirCrearModal = () => {
    if (!isSuperadmin) return;
    setEditandoId(null);
    setNombre('');
    setEmail('');
    setPassword('');
    // Default to standard role or first non-super role
    const defaultRole = roles.find(r => r.name !== 'Superusuario')?.id || 2;
    setRoleId(defaultRole);
    setShowPassword(false);
    setShowModal(true);
  };

  const abrirEditarModal = (userItem) => {
    if (!isSuperadmin) return;
    setEditandoId(userItem.id);
    setNombre(userItem.name);
    setEmail(userItem.email);
    setPassword(''); // dejar vacío por defecto en edición
    setRoleId(userItem.role_id || userItem.role?.id || 2);
    setShowPassword(false);
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

    if (!nombre || !email || (!editandoId && !password)) {
      Swal.fire({
        title: 'Campos Incompletos',
        text: 'Por favor, completa todos los campos del formulario.',
        icon: 'warning',
        background: '#0b0f19',
        color: '#ffffff',
        confirmButtonColor: '#eab308'
      });
      return;
    }

    const payload = {
      name: nombre,
      email: email,
      role_id: roleId
    };

    if (password) {
      payload.password = password;
    }

    const endpoint = editandoId 
      ? `${API_BASE_URL}/users/${editandoId}` 
      : `${API_BASE_URL}/users`;

    const method = editandoId ? 'PUT' : 'POST';

    fetch(endpoint, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) {
          if (res.status === 422 && data.errors && data.errors.email) {
            throw new Error('El email ya existe.');
          }
          throw new Error(data.message || 'Error al guardar los datos.');
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
          title: editandoId ? 'Usuario actualizado correctamente' : 'Nuevo usuario registrado con éxito'
        });
        setShowModal(false);
        cargarUsuarios();

        if (editandoId && currentUser && editandoId.toString() === currentUser.id.toString()) {
          window.dispatchEvent(new Event('userProfileUpdated'));
        }
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

  const eliminarUsuario = (id) => {
    if (!isSuperadmin) return;
    if (id === 1 || id === '1') {
      Swal.fire({
        title: 'Restringido',
        text: 'No se puede eliminar al Superusuario raíz del sistema.',
        icon: 'warning',
        background: '#0b0f19',
        color: '#ffffff',
        confirmButtonColor: '#f97316'
      });
      return;
    }

    Swal.fire({
      title: '¿Revocar permisos?',
      text: "El usuario perderá el acceso a la administración de la red IoT.",
      icon: 'warning',
      showCancelButton: true,
      background: '#0b0f19',
      color: '#ffffff',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#475569',
      confirmButtonText: 'Sí, revocar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        fetch(`${API_BASE_URL}/users/${id}`, {
          method: 'DELETE',
          headers: { 'Accept': 'application/json' }
        })
          .then(async res => {
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Error al eliminar usuario.');
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
              title: 'Usuario removido del sistema'
            });
            cargarUsuarios();
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

  // Filtrado de usuarios por búsqueda y por rol
  const usuariosFiltrados = usuarios.filter(userItem => {
    const matchesSearch = userItem.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          userItem.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterRole === 'super') {
      return matchesSearch && (userItem.role?.name === 'Superusuario' || userItem.role_id === 1);
    }
    if (filterRole === 'no-super') {
      return matchesSearch && (userItem.role?.name !== 'Superusuario' && userItem.role_id !== 1);
    }
    if (filterRole !== 'todos' && filterRole !== 'super' && filterRole !== 'no-super') {
      return matchesSearch && (userItem.role_id === parseInt(filterRole, 10) || userItem.role?.name === filterRole);
    }
    return matchesSearch;
  });

  const isEditingAnotherSuperuser = editandoId && 
    editandoId.toString() !== currentUser?.id?.toString() && 
    (usuarios.find(u => u.id === editandoId)?.role?.name === 'Superusuario' || usuarios.find(u => u.id === editandoId)?.role_id === 1);

  return (
    <div className="gestionar-usuarios-container">
      
      {/* HEADER DE LA SECCIÓN */}
      <div className="users-header">
        <div className="users-header-info">
          <h2 className="users-page-title">
            <svg className="title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Directorio de Usuarios y Credenciales
          </h2>
          <p className="users-page-subtitle">
            Gestión y parametrización de accesos del personal académico para la administración de la red IoT.
          </p>
        </div>

        {/* INDICADOR DE ROL ACTUAL */}
        <div className={`role-badge-indicator ${isSuperadmin ? 'is-admin' : 'is-user'}`}>
          <span className="role-dot"></span>
          <span>Rol: {userRoleName || 'Visitante (Solo Lectura)'}</span>
        </div>
      </div>

      {/* CONTROLES DE BÚSQUEDA, FILTRO Y AGREGAR (ARRIBA DE LA TABLA) */}
      <div className="users-controls-row">
        <div className="search-box-wrapper">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="search-input-field"
            placeholder="Buscar por nombre o correo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-and-add-actions">
          <CustomUserRoleFilterSelect
            value={filterRole}
            onChange={(val) => setFilterRole(val)}
            roles={roles}
          />

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
              Agregar Usuario
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
            <strong>Modo de Solo Lectura:</strong> Tu rol actual es <strong>{userRoleName || 'Visitante'}</strong>. No dispones de permisos de Superusuario para modificar credenciales o contraseñas.
          </p>
        </div>
      )}

      {/* TABLA PRINCIPAL DE USUARIOS */}
      <div className="users-list-wrapper">
        <h3 className="list-section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16" style={{ display: 'inline-block', marginRight: '6px' }}>
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          Directorio del Personal de Red
        </h3>
        
        {loading ? (
          <div className="users-loading-spinner">
            <span className="spinner-dot"></span>
            <span>Cargando directorio de usuarios...</span>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-users-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Correo Electrónico</th>
                  <th>Rol Asignado</th>
                  {isSuperadmin && <th className="text-right-align">Operaciones de Escritura</th>}
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.length > 0 ? (
                  usuariosFiltrados.map((userItem) => {
                    const rName = userItem.role?.name || (userItem.role_id === 1 ? 'Superusuario' : 'Técnico de Soporte');
                    const rColor = userItem.role?.color || (rName === 'Superusuario' ? '#10b981' : '#3b82f6');

                    return (
                      <tr key={userItem.id}>
                        <td>
                          <div className="user-avatar-row">
                            <div className="avatar-circle" style={{ backgroundColor: rColor }}>
                              {userItem.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <span className="user-fullname">{userItem.name}</span>
                              <span className="user-nickname">ID: #{userItem.id}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="user-email-text">{userItem.email}</span>
                        </td>
                        <td>
                          <span className="role-badge-indicator" style={{ 
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: 'rgba(241, 245, 249, 0.8)', 
                            color: '#1e293b', 
                            border: `1px solid ${rColor}60`,
                            padding: '4px 10px',
                            borderRadius: '8px',
                            fontWeight: 700,
                            fontSize: '12px'
                          }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: rColor }}></span>
                            {rName}
                          </span>
                        </td>
                        {isSuperadmin && (
                          <td className="text-right-align">
                            <div className="table-actions">
                              <button
                                onClick={() => abrirEditarModal(userItem)}
                                className="table-btn-edit"
                                title="Editar credenciales y rol"
                              >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z" />
                                </svg>
                                Editar
                              </button>
                              <button
                                onClick={() => eliminarUsuario(userItem.id)}
                                className="table-btn-delete"
                                title="Eliminar cuenta de red"
                                disabled={userItem.id === 1 || userItem.id === '1'}
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
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={isSuperadmin ? 4 : 3} className="table-empty-message">
                      No se encontraron usuarios que coincidan con la búsqueda o filtro.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL OVERLAY PARA REGISTRO/EDICIÓN DE USUARIO */}
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
                    Modificar Credencial de Usuario
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" width="20" height="20" style={{ display: 'inline-block', marginRight: '8px' }}>
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <line x1="19" y1="8" x2="19" y2="14" />
                      <line x1="22" y1="11" x2="16" y2="11" />
                    </svg>
                    Registrar Nuevo Miembro de Red
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
                  <label className="modal-label">Nombre Completo</label>
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Nombre y apellido del usuario"
                    className="modal-text-input"
                    required
                  />
                </div>

                <div className="modal-input-group">
                  <label className="modal-label">Correo Institucional (Email)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Correo electrónico institucional"
                    className="modal-text-input"
                    required
                  />
                </div>

                <div className="modal-input-group">
                  <label className="modal-label">
                    {editandoId ? 'Nueva Contraseña (dejar en blanco para conservar)' : 'Contraseña de Acceso'}
                  </label>
                  <div className="password-input-wrapper" style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={editandoId ? "Dejar vacío para conservar la actual" : "Contraseña de acceso"}
                      className="modal-text-input"
                      style={{ width: '100%', paddingRight: '2.5rem' }}
                      required={!editandoId}
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#64748b',
                        cursor: 'pointer',
                        padding: '0',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      {showPassword ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* SELECTOR DE ROL ASIGNADO */}
                <div className="modal-input-group">
                  <label className="modal-label">Rol Asignado en el Sistema</label>
                  <CustomRoleSelect 
                    value={roleId}
                    onChange={(val) => setRoleId(parseInt(val, 10))}
                    options={roles}
                    disabled={isEditingAnotherSuperuser}
                    placeholder="-- Seleccionar Rol --"
                  />
                  {isEditingAnotherSuperuser && (
                    <span style={{ fontSize: '0.72rem', color: '#ef4444', marginTop: '0.25rem', fontWeight: '600' }}>
                      * Operación protegida. No puedes degradar a otro Superusuario del sistema.
                    </span>
                  )}
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
                      Guardar
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