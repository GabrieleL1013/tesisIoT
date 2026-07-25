import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import '../../styles/pages/admin/Notificaciones.css';
import Swal from 'sweetalert2';

// Componente de Select Personalizado con Animaciones Interactivas
const CustomFilterSelect = ({ label, value, options, onChange }) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedOption = options.find(o => o.value === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="notif-custom-select-group" ref={dropdownRef}>
      {label && <label className="notif-select-label">{label}</label>}
      <button 
        type="button"
        className={`notif-custom-select-trigger ${open ? 'active' : ''}`}
        onClick={() => setOpen(!open)}
      >
        <span>{selectedOption.label}</span>
        <svg 
          className={`notif-select-chevron ${open ? 'rotated' : ''}`}
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
        <div className="notif-custom-select-dropdown">
          {options.map((opt) => (
            <div
              key={opt.value}
              className={`notif-select-option ${value === opt.value ? 'selected' : ''}`}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
            >
              <span>{opt.label}</span>
              {value === opt.value && (
                <svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="3" width="14" height="14">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Notificaciones = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all'); // 'all', 'offline', 'instability'
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'unread', 'read'
  const [search, setSearch] = useState('');
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const filterTypeOptions = [
    { value: 'all', label: 'Todos los tipos' },
    { value: 'offline', label: 'Nodos Offline' },
    { value: 'instability', label: 'Inestabilidad' },
  ];

  const filterStatusOptions = [
    { value: 'all', label: 'Todos los estados' },
    { value: 'unread', label: 'No leídos' },
    { value: 'read', label: 'Leídos' },
  ];

  const handleInspect = (alerta) => {
    const nodeId = alerta.node_id;
    const dateObj = new Date(alerta.created_at);
    
    navigate('/admin/historico', {
      state: {
        inspectInstability: true,
        node_id: nodeId,
        date: dateObj.toISOString().split('T')[0],
        hour: dateObj.getHours()
      }
    });
  };

  const fetchAlerts = (page = 1) => {
    setLoading(true);
    
    const params = new URLSearchParams({ page });
    if (filterType !== 'all') params.append('type', filterType);
    if (filterStatus !== 'all') params.append('status', filterStatus);
    if (search) params.append('search', search);

    fetch(`http://127.0.0.1:8000/api/node-alerts?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        setAlerts(data.data || []);
        setCurrentPage(data.current_page || 1);
        setTotalPages(data.last_page || 1);
        setTotalCount(data.total || 0);
      })
      .catch(err => {
        console.error("Error loading alerts:", err);
        Swal.fire({
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
          icon: 'error',
          title: 'No se pudieron cargar las notificaciones'
        });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAlerts();
  }, [filterType, filterStatus]);

  const handleSearch = (e) => {
    if (e.key === 'Enter' || e.type === 'click') {
      fetchAlerts(1);
    }
  };

  const markAsRead = (id) => {
    fetch(`http://127.0.0.1:8000/api/node-alerts/${id}/read`, {
      method: 'PUT'
    })
    .then(res => res.json())
    .then(() => {
      setAlerts(alerts.map(a => a.id === id ? { ...a, is_read: true } : a));
    })
    .catch(err => console.error("Error marking read:", err));
  };

  const markAllAsRead = () => {
    fetch('http://127.0.0.1:8000/api/node-alerts/mark-all-read', {
      method: 'PUT'
    })
    .then(res => res.json())
    .then(() => {
      setAlerts(alerts.map(a => ({ ...a, is_read: true })));
      Swal.fire({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true,
        icon: 'success',
        title: 'Todas las notificaciones marcadas como leídas'
      });
    })
    .catch(err => console.error("Error marking all read:", err));
  };

  const deleteAlert = (id) => {
    Swal.fire({
      title: '¿Eliminar notificación?',
      text: "Esta acción no se puede deshacer.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#475569',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      background: '#0b0f19',
      color: '#ffffff'
    }).then((result) => {
      if (result.isConfirmed) {
        fetch(`http://127.0.0.1:8000/api/node-alerts/${id}`, {
          method: 'DELETE'
        })
        .then(res => res.json())
        .then(() => {
          setAlerts(alerts.filter(a => a.id !== id));
          Swal.fire({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 2500,
            timerProgressBar: true,
            icon: 'success',
            title: 'Notificación eliminada'
          });
        })
        .catch(err => console.error("Error deleting alert:", err));
      }
    });
  };

  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Hace un momento';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} hr`;
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    
    return date.toLocaleDateString();
  };

  const portalTarget = document.getElementById('admin-navbar-portal-target');

  return (
    <div className="notificaciones-container">
      {/* HEADER SECTION PORTAL */}
      {portalTarget && ReactDOM.createPortal(
        <div className="notif-header-portal-actions">
          <span className="notificaciones-count-badge">{totalCount} registros</span>
          <button className="btn-mark-all" onClick={markAllAsRead}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="15" height="15">
              <path d="M18 6L7 17l-5-5"/>
              <path d="M22 10l-5.5 5.5"/>
            </svg>
            <span>Marcar todo como leído</span>
          </button>
        </div>,
        portalTarget
      )}

      <div className="notificaciones-content">
        {/* BARRA DE BÚSQUEDA Y FILTROS */}
        <div className="notificaciones-filters-card">
          <div className="search-box">
            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input 
              type="text" 
              placeholder="Buscar por nodo o mensaje..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearch}
            />
            <button className="btn-search-trigger" onClick={handleSearch}>
              <span>Buscar</span>
            </button>
          </div>

          <div className="filter-selects">
            <CustomFilterSelect
              label="Tipo de Alerta:"
              value={filterType}
              options={filterTypeOptions}
              onChange={(val) => setFilterType(val)}
            />
            <CustomFilterSelect
              label="Estado:"
              value={filterStatus}
              options={filterStatusOptions}
              onChange={(val) => setFilterStatus(val)}
            />
          </div>
        </div>

        {/* LISTA / BUZÓN DE NOTIFICACIONES */}
        <div className="notificaciones-list-card">
          {loading ? (
            <div className="notificaciones-loading">
              <div className="spinner"></div>
              <span>Cargando notificaciones...</span>
            </div>
          ) : alerts.length === 0 ? (
            <div className="notificaciones-empty">
              <div className="empty-icon-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                  <line x1="18" y1="2" x2="22" y2="6"></line>
                  <line x1="22" y1="2" x2="18" y2="6"></line>
                </svg>
              </div>
              <h3>No hay notificaciones</h3>
              <p>No se encontraron resultados para los filtros seleccionados.</p>
            </div>
          ) : (
            <div className="alerts-list">
              {alerts.map((alerta) => (
                <div key={alerta.id} className={`alert-item ${!alerta.is_read ? 'unread' : 'read'}`}>
                  <div className={`alert-icon ${alerta.severity}`}>
                    {alerta.type === 'offline' ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="20" height="20">
                        <path d="M10.7 17a2.5 2.5 0 0 0 2.6 0M2.6 9a14.8 14.8 0 0 1 18.8 0M6.6 13a9.8 9.8 0 0 1 10.8 0"/>
                        <line x1="2" y1="2" x2="22" y2="22"/>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="20" height="20">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                        <line x1="12" y1="9" x2="12" y2="13"/>
                        <line x1="12" y1="17" x2="12.01" y2="17"/>
                      </svg>
                    )}
                  </div>
                  
                  <div className="alert-content-area">
                    <div className="alert-header">
                      <div className="alert-title-row">
                        <span className="alert-title">{alerta.title}</span>
                        {!alerta.is_read && <span className="alert-unread-pill">Nuevo</span>}
                      </div>
                      <span className="alert-time">{formatRelativeTime(alerta.created_at)}</span>
                    </div>
                    
                    <p className="alert-message">{alerta.message}</p>
                    
                    {alerta.metadata?.unstable_variables && (
                      <div className="alert-metadata">
                        <span className="metadata-title">Variables afectadas:</span>
                        <div className="metadata-tags">
                          {alerta.metadata.unstable_variables.map((v, i) => (
                            <span key={i} className="metadata-tag">
                              {v.variable} ({v.percentage}%)
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="alert-actions">
                    {alerta.type === 'instability' && (
                      <button className="btn-action-icon inspect-btn" onClick={() => handleInspect(alerta)} title="Inspeccionar Histórico">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                          <circle cx="11" cy="11" r="8"></circle>
                          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                          <line x1="11" y1="8" x2="11" y2="14"></line>
                          <line x1="8" y1="11" x2="14" y2="11"></line>
                        </svg>
                      </button>
                    )}
                    {!alerta.is_read && (
                      <button className="btn-action-icon read-btn" onClick={() => markAsRead(alerta.id)} title="Marcar como leída">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                          <path d="M20 6L9 17l-5-5"/>
                        </svg>
                      </button>
                    )}
                    <button className="btn-action-icon delete-btn" onClick={() => deleteAlert(alerta.id)} title="Eliminar">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="16" height="16">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* PAGINACIÓN */}
          {totalPages > 1 && (
            <div className="notificaciones-pagination">
              <button 
                className="btn-page" 
                disabled={currentPage === 1}
                onClick={() => fetchAlerts(currentPage - 1)}
              >
                Anterior
              </button>
              <span className="page-info">
                Página <strong>{currentPage}</strong> de {totalPages}
              </span>
              <button 
                className="btn-page" 
                disabled={currentPage === totalPages}
                onClick={() => fetchAlerts(currentPage + 1)}
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notificaciones;
