import { API_BASE_URL, fetchWithAuth } from '../../config/api';
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { usePageTitle } from '../../hooks/usePageTitle';
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
  const { t, language } = useLanguage();
  usePageTitle({ es: 'Notificaciones', en: 'Notifications' }, 'Admin · IoT ULEAM');
  const navigate = useNavigate();

  const [mainTab, setMainTab] = useState('sistema'); // 'sistema' | 'contacto'

  // Alertas del Sistema
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedAlerts, setExpandedAlerts] = useState({});
  const [expandedContactos, setExpandedContactos] = useState({});

  // Mensajes de Contacto
  const [contactos, setContactos] = useState([]);
  const [mensajeActivo, setMensajeActivo] = useState(null);

  // Filtros
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');
  
  // Paginación de Alertas
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Selección múltiple / borrado masivo
  const [selectedIds, setSelectedIds] = useState([]);

  // Resetear selección al cambiar de pestaña, filtros o página
  useEffect(() => {
    setSelectedIds([]);
  }, [mainTab, filterType, filterStatus, currentPage]);

  const toggleAlertExpand = (id) => {
    setExpandedAlerts(prev => {
      const isWillBeExpanded = !prev[id];
      if (isWillBeExpanded) {
        const alerta = alerts.find(a => a.id === id);
        if (alerta && !alerta.is_read) {
          markAsRead(id);
        }
      }
      return { ...prev, [id]: isWillBeExpanded };
    });
  };

  const toggleContactoExpand = (id) => {
    setExpandedContactos(prev => {
      const isWillBeExpanded = !prev[id];
      if (isWillBeExpanded) {
        const notif = contactos.find(c => c.id === id);
        if (notif && !notif.leido) {
          marcarContactoComoLeido(id);
        }
      }
      return { ...prev, [id]: isWillBeExpanded };
    });
  };

  const marcarContactoComoLeido = (id) => {
    fetchWithAuth(`${API_BASE_URL}/contactos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leido: true })
    })
      .then(res => {
        if (res.ok) {
          setContactos(prev =>
            prev.map(c => c.id === id ? { ...c, leido: true } : c)
          );
        }
      })
      .catch(err => console.error("Error marking contact message read:", err));
  };

  const filterTypeOptions = [
    { value: 'all', label: t("manage_notifications.type_all", "Todos los tipos") },
    { value: 'offline', label: t("manage_notifications.type_disconnection", "Nodos Offline") },
    { value: 'instability', label: t("manage_notifications.type_instability", "Inestabilidad") },
  ];

  const filterStatusOptions = [
    { value: 'all', label: t("manage_notifications.status_all", "Todos los estados") },
    { value: 'unread', label: t("manage_notifications.status_unread", "No leídos") },
    { value: 'read', label: t("manage_notifications.status_read", "Leídos") },
  ];

  const handleInspect = (alerta) => {
    if (!alerta) return;
    const targetRoute = language === 'en' ? '/en/admin/history' : '/es/admin/historico';
    
    let dateStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Guayaquil' });
    let hourInt = parseInt(new Date().toLocaleString('en-US', { timeZone: 'America/Guayaquil', hour: '2-digit', hour12: false }), 10);

    if (alerta.created_at) {
      try {
        const d = new Date(alerta.created_at);
        dateStr = d.toLocaleDateString('en-CA', { timeZone: 'America/Guayaquil' });
        hourInt = parseInt(d.toLocaleString('en-US', { timeZone: 'America/Guayaquil', hour: '2-digit', hour12: false }), 10);
      } catch (e) {
        console.error("Error parsing alert date:", e);
      }
    }

    navigate(targetRoute, {
      state: {
        inspectInstability: true,
        node_id: alerta.node_id,
        date: dateStr,
        hour: hourInt
      }
    });
  };

  const fetchAlerts = (page = 1) => {
    setLoading(true);
    
    const params = new URLSearchParams({ page });
    if (filterType !== 'all') params.append('type', filterType);
    if (filterStatus !== 'all') params.append('status', filterStatus);
    if (search) params.append('search', search);

    fetchWithAuth(`${API_BASE_URL}/node-alerts?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        setAlerts(data.data || []);
        setCurrentPage(data.current_page || 1);
        setTotalPages(data.last_page || 1);
        setTotalCount(data.total || 0);
      })
      .catch(err => {
        console.error("Error loading alerts:", err);
      })
      .finally(() => setLoading(false));
  };

  const fetchContactos = () => {
    setLoading(true);
    fetchWithAuth(`${API_BASE_URL}/contactos`)
      .then(res => res.json())
      .then(data => {
        setContactos(Array.isArray(data) ? data : []);
      })
      .catch(err => console.error("Error loading contacts:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (mainTab === 'sistema') {
      fetchAlerts();
    } else {
      fetchContactos();
    }
  }, [mainTab, filterType, filterStatus]);

  const handleSearch = (e) => {
    if (e.key === 'Enter' || e.type === 'click') {
      if (mainTab === 'sistema') {
        fetchAlerts(1);
      }
    }
  };

  const markAsRead = (id) => {
    fetchWithAuth(`${API_BASE_URL}/node-alerts/${id}/read`, {
      method: 'PUT'
    })
    .then(res => res.json())
    .then(() => {
      setAlerts(alerts.map(a => a.id === id ? { ...a, is_read: true } : a));
    })
    .catch(err => console.error("Error marking read:", err));
  };

  const markAllAsRead = () => {
    if (mainTab === 'sistema') {
      fetchWithAuth(`${API_BASE_URL}/node-alerts/mark-all-read`, {
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
          title: 'Todas las alertas marcadas como leídas'
        });
      })
      .catch(err => console.error("Error marking all read:", err));
    } else {
      fetchWithAuth(`${API_BASE_URL}/contactos/mark-all-read`, {
        method: 'PUT'
      })
      .then(res => res.json())
      .then(() => {
        setContactos(contactos.map(c => ({ ...c, leido: true })));
        Swal.fire({
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 2500,
          timerProgressBar: true,
          icon: 'success',
          title: 'Todos los mensajes de contacto marcados como leídos'
        });
      })
      .catch(err => console.error("Error marking all contacts read:", err));
    }
  };

  const abrirMensajeContacto = (notif) => {
    setMensajeActivo(notif);
    if (!notif.leido) {
      marcarContactoComoLeido(notif.id);
    }
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
        fetchWithAuth(`${API_BASE_URL}/node-alerts/${id}`, {
          method: 'DELETE'
        })
        .then(res => res.json())
        .then(() => {
          setAlerts(alerts.filter(a => a.id !== id));
          setSelectedIds(prev => prev.filter(i => i !== id));
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

  const deleteContacto = (id) => {
    Swal.fire({
      title: '¿Eliminar mensaje de contacto?',
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
        fetchWithAuth(`${API_BASE_URL}/contactos/${id}`, {
          method: 'DELETE'
        })
        .then(res => res.json())
        .then(() => {
          setContactos(contactos.filter(c => c.id !== id));
          setSelectedIds(prev => prev.filter(i => i !== id));
          Swal.fire({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 2500,
            timerProgressBar: true,
            icon: 'success',
            title: 'Mensaje de contacto eliminado'
          });
        })
        .catch(err => console.error("Error deleting contact:", err));
      }
    });
  };

  const responderGmail = (notif) => {
    const subject = encodeURIComponent(`Respuesta a tu consulta de telemetría - IoT ULEAM [Ref #${notif.id}]`);
    const body = encodeURIComponent(`Hola ${notif.nombre},\n\nCon respecto a tu mensaje enviado a nuestro portal de telemetría:\n"${notif.mensaje}"\n\n[Escribe tu respuesta aquí]\n\nAtentamente,\nDirección de Innovación Tecnológica & Telecomunicaciones ULEAM`);
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(notif.correo)}&su=${subject}&body=${body}`, '_blank');
  };

  const formatRelativeTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString.includes('T') ? dateString : dateString.replace(' ', 'T'));
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return t("manage_notifications.time_just_now", "Hace un momento");
    if (diffMins < 60) return language === 'en' ? `${diffMins} min ago` : `Hace ${diffMins} min`;
    if (diffHours < 24) return language === 'en' ? `${diffHours} hr ago` : `Hace ${diffHours} hr`;
    if (diffDays === 1) return t("manage_notifications.time_yesterday", "Ayer");
    if (diffDays < 7) return language === 'en' ? `${diffDays} days ago` : `Hace ${diffDays} días`;
    
    return date.toLocaleDateString();
  };

  const formatearFechaStr = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T'));
    return date.toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const contactosFiltrados = contactos.filter(c => {
    const matchesSearch = !search || 
      (c.nombre || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.correo || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.telefono || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.mensaje || '').toLowerCase().includes(search.toLowerCase());

    if (filterStatus === 'unread') return matchesSearch && !c.leido;
    if (filterStatus === 'read') return matchesSearch && c.leido;
    return matchesSearch;
  });

  const currentList = mainTab === 'sistema' ? alerts : contactosFiltrados;
  const isAllSelected = currentList.length > 0 && currentList.every(item => selectedIds.includes(item.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(currentList.map(item => item.id));
    }
  };

  const toggleSelectItem = (id, e) => {
    e.stopPropagation();
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;

    const itemLabel = mainTab === 'sistema' ? 'notificaciones' : 'mensajes de contacto';

    Swal.fire({
      title: `¿Eliminar ${selectedIds.length} ${itemLabel}?`,
      text: "Esta acción no se puede deshacer.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#475569',
      confirmButtonText: 'Sí, eliminar seleccionados',
      cancelButtonText: 'Cancelar',
      background: '#0b0f19',
      color: '#ffffff'
    }).then((result) => {
      if (result.isConfirmed) {
        const endpoint = mainTab === 'sistema'
          ? `${API_BASE_URL}/node-alerts/bulk-delete`
          : `${API_BASE_URL}/contactos/bulk-delete`;

        fetchWithAuth(endpoint, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: selectedIds })
        })
          .then(res => res.json())
          .then(() => {
            if (mainTab === 'sistema') {
              setAlerts(prev => prev.filter(a => !selectedIds.includes(a.id)));
              setTotalCount(prev => Math.max(0, prev - selectedIds.length));
            } else {
              setContactos(prev => prev.filter(c => !selectedIds.includes(c.id)));
            }
            setSelectedIds([]);
            Swal.fire({
              toast: true,
              position: 'top-end',
              showConfirmButton: false,
              timer: 2500,
              timerProgressBar: true,
              icon: 'success',
              title: `${selectedIds.length} ${itemLabel} eliminados correctamente`
            });
          })
          .catch(err => {
            console.error("Error batch deleting:", err);
            Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudieron eliminar los elementos.' });
          });
      }
    });
  };

  const portalTarget = document.getElementById('admin-navbar-portal-target');

  return (
    <div className="notificaciones-container">
      {/* HEADER SECTION PORTAL */}
      {portalTarget && ReactDOM.createPortal(
        <div className="notif-header-portal-actions">
          <span className="notificaciones-count-badge">
            {mainTab === 'sistema' ? `${totalCount} registros` : `${contactosFiltrados.length} mensajes`}
          </span>
          <button className="btn-mark-all" onClick={markAllAsRead}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="15" height="15">
              <path d="M18 6L7 17l-5-5"/>
              <path d="M22 10l-5.5 5.5"/>
            </svg>
            <span>{t("manage_notifications.mark_all_read", "Marcar todo como leído")}</span>
          </button>
        </div>,
        portalTarget
      )}

      <div className="notificaciones-content">
        {/* PESTAÑAS PRINCIPALES: SISTEMA VS CONTACTO */}
        <div className="notificaciones-main-tabs">
          <button
            type="button"
            className={`notif-tab-btn ${mainTab === 'sistema' ? 'active' : ''}`}
            onClick={() => setMainTab('sistema')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="15" height="15">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span>{language === 'en' ? 'System Alerts' : 'Alertas del Sistema'}</span>
          </button>

          <button
            type="button"
            className={`notif-tab-btn ${mainTab === 'contacto' ? 'active' : ''}`}
            onClick={() => setMainTab('contacto')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="15" height="15">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            <span>{language === 'en' ? 'Contact Messages' : 'Mensajes de Contacto'}</span>
          </button>
        </div>

        {/* BARRA DE BÚSQUEDA Y FILTROS */}
        <div className="notificaciones-filters-card">
          <div className="search-box">
            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input 
              type="text" 
              placeholder={mainTab === 'sistema' ? t("manage_notifications.search_ph", "Buscar por nodo o mensaje...") : "Buscar por nombre, correo, teléfono o mensaje..."} 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearch}
            />
            <button className="btn-search-trigger" onClick={handleSearch}>
              <span>{t("manage_notifications.search_btn", "Buscar")}</span>
            </button>
          </div>

          <div className="filter-selects">
            {mainTab === 'sistema' && (
              <CustomFilterSelect
                label={t("manage_notifications.alert_type", "Tipo de Alerta:")}
                value={filterType}
                options={filterTypeOptions}
                onChange={(val) => setFilterType(val)}
              />
            )}
            <CustomFilterSelect
              label={t("manage_notifications.status_label", "Estado:")}
              value={filterStatus}
              options={filterStatusOptions}
              onChange={(val) => setFilterStatus(val)}
            />
          </div>
        </div>

        {/* BARRA DE SELECCIÓN Y ACCIONES EN LOTE */}
        {currentList.length > 0 && !loading && (
          <div className="notif-bulk-toolbar">
            <label className="bulk-select-all-label">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={toggleSelectAll}
                className="bulk-checkbox"
              />
              <span>{isAllSelected ? (language === 'en' ? 'Deselect all' : 'Desmarcar todos') : (language === 'en' ? 'Select all' : 'Seleccionar todos')}</span>
            </label>

            {selectedIds.length > 0 && (
              <div className="bulk-actions-group">
                <span className="bulk-selected-count">
                  {selectedIds.length} {language === 'en' ? 'selected' : (selectedIds.length === 1 ? 'seleccionado' : 'seleccionados')}
                </span>
                <button
                  type="button"
                  className="btn-bulk-delete"
                  onClick={handleBulkDelete}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="14" height="14">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  <span className="btn-bulk-delete-text">{language === 'en' ? 'Delete selected' : 'Eliminar seleccionados'}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* LISTA / BUZÓN DE NOTIFICACIONES */}
        <div className="notificaciones-list-card">
          {loading ? (
            <div className="notificaciones-loading">
              <div className="spinner"></div>
              <span>{language === 'en' ? 'Loading notifications...' : 'Cargando notificaciones...'}</span>
            </div>
          ) : mainTab === 'sistema' ? (
            alerts.length === 0 ? (
              <div className="notificaciones-empty">
                <div className="empty-icon-box">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                    <line x1="18" y1="2" x2="22" y2="6"></line>
                    <line x1="22" y1="2" x2="18" y2="6"></line>
                  </svg>
                </div>
                <h3>{language === 'en' ? 'No system alerts' : 'No hay alertas del sistema'}</h3>
                <p>{language === 'en' ? 'No records match the selected filters.' : 'No se encontraron resultados para los filtros seleccionados.'}</p>
              </div>
            ) : (
              <div className="alerts-list">
                {alerts.map((alerta) => {
                  const isExpanded = !!expandedAlerts[alerta.id];
                  const isSelected = selectedIds.includes(alerta.id);
                  return (
                    <div 
                      key={alerta.id} 
                      className={`alert-item ${!alerta.is_read ? 'unread' : 'read'} ${isExpanded ? 'expanded' : 'collapsed'} ${isSelected ? 'selected-item' : ''}`}
                    >
                      <div className="alert-item-header" onClick={() => toggleAlertExpand(alerta.id)}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => toggleSelectItem(alerta.id, e)}
                          onClick={(e) => e.stopPropagation()}
                          className="item-checkbox"
                        />

                        <div className={`alert-icon ${alerta.severity}`}>
                          {alerta.type === 'offline' ? (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="18" height="18">
                              <path d="M10.7 17a2.5 2.5 0 0 0 2.6 0M2.6 9a14.8 14.8 0 0 1 18.8 0M6.6 13a9.8 9.8 0 0 1 10.8 0"/>
                              <line x1="2" y1="2" x2="22" y2="22"/>
                            </svg>
                          ) : (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="18" height="18">
                              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                              <line x1="12" y1="9" x2="12" y2="13"/>
                              <line x1="12" y1="17" x2="12.01" y2="17"/>
                            </svg>
                          )}
                        </div>
                        
                        <div className="alert-header-info">
                          <div className="alert-title-row">
                            <span className="alert-title">{alerta.title}</span>
                            {!alerta.is_read && <span className="alert-unread-pill">{language === 'en' ? 'New' : 'Nuevo'}</span>}
                          </div>
                          {!isExpanded && <p className="alert-message-snippet">{alerta.message}</p>}
                        </div>

                        <div className="alert-header-right">
                          <span className="alert-time">{formatRelativeTime(alerta.created_at)}</span>
                          <svg className={`accordion-chevron ${isExpanded ? 'rotated' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                            <polyline points="6 9 12 15 18 9"/>
                          </svg>
                        </div>
                      </div>
                      
                      {isExpanded && (
                        <div className="alert-item-body">
                          <p className="alert-message-full">{alerta.message}</p>
                          
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

                          <div className="alert-actions-bar">
                            {(alerta.node_id || alerta.type === 'instability' || alerta.type === 'offline') && (
                              <button 
                                type="button" 
                                className="btn-action-pill inspect-btn" 
                                onClick={(e) => { e.stopPropagation(); handleInspect(alerta); }}
                              >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                                  <circle cx="11" cy="11" r="8"></circle>
                                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                  <line x1="11" y1="8" x2="11" y2="14"></line>
                                  <line x1="8" y1="11" x2="14" y2="11"></line>
                                </svg>
                                <span>{t("manage_notifications.inspect_historical", "Ir a Histórico Agregado")}</span>
                              </button>
                            )}
                            {!alerta.is_read && (
                              <button 
                                type="button" 
                                className="btn-action-pill read-btn" 
                                onClick={(e) => { e.stopPropagation(); markAsRead(alerta.id); }}
                              >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                                  <path d="M20 6L9 17l-5-5"/>
                                </svg>
                                <span>{language === 'en' ? 'Mark as Read' : 'Marcar como visto'}</span>
                              </button>
                            )}
                            <button 
                              type="button" 
                              className="btn-action-pill delete-btn" 
                              onClick={(e) => { e.stopPropagation(); deleteAlert(alerta.id); }}
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="14" height="14">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              </svg>
                              <span>{language === 'en' ? 'Delete' : 'Eliminar'}</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            contactosFiltrados.length === 0 ? (
              <div className="notificaciones-empty">
                <div className="empty-icon-box">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </div>
                <h3>{language === 'en' ? 'No contact messages' : 'No hay mensajes de contacto'}</h3>
                <p>{language === 'en' ? 'No contact entries match your search.' : 'No se encontraron mensajes de contacto para la búsqueda actual.'}</p>
              </div>
            ) : (
              <div className="alerts-list">
                {contactosFiltrados.map((notif) => {
                  const isExpanded = !!expandedContactos[notif.id];
                  const isSelected = selectedIds.includes(notif.id);
                  return (
                    <div 
                      key={notif.id} 
                      className={`alert-item ${!notif.leido ? 'unread' : 'read'} ${isExpanded ? 'expanded' : 'collapsed'} ${isSelected ? 'selected-item' : ''}`}
                    >
                      <div className="alert-item-header" onClick={() => toggleContactoExpand(notif.id)}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => toggleSelectItem(notif.id, e)}
                          onClick={(e) => e.stopPropagation()}
                          className="item-checkbox"
                        />

                        <div className="alert-icon" style={{ background: !notif.leido ? '#eff6ff' : '#f8fafc', color: '#2563eb' }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="18" height="18">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                            <polyline points="22,6 12,13 2,6" />
                          </svg>
                        </div>

                        <div className="alert-header-info">
                          <div className="alert-title-row">
                            <span className="alert-title">{notif.nombre}</span>
                            {!notif.leido && <span className="alert-unread-pill" style={{ background: '#2563eb' }}>{language === 'en' ? 'Unread' : 'No leído'}</span>}
                          </div>
                          {!isExpanded && (
                            <p className="alert-message-snippet">
                              {notif.mensaje}
                            </p>
                          )}
                        </div>

                        <div className="alert-header-right">
                          <span className="alert-time">{formatRelativeTime(notif.created_at)}</span>
                          <svg className={`accordion-chevron ${isExpanded ? 'rotated' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                            <polyline points="6 9 12 15 18 9"/>
                          </svg>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="alert-item-body">
                          <div className="contact-details-box">
                            <span>📞 <strong>{notif.telefono}</strong></span>
                            <span>✉️ {notif.correo}</span>
                          </div>
                          <p className="alert-message-full">"{notif.mensaje}"</p>

                          <div className="alert-actions-bar">
                            <button 
                              type="button" 
                              className="btn-action-pill gmail-btn" 
                              onClick={(e) => { e.stopPropagation(); responderGmail(notif); }}
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="14" height="14">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                <polyline points="22,6 12,13 2,6" />
                              </svg>
                              <span>Responder Gmail</span>
                            </button>
                            <button 
                              type="button" 
                              className="btn-action-pill inspect-btn" 
                              onClick={(e) => { e.stopPropagation(); abrirMensajeContacto(notif); }}
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                              <span>Ver Detalle</span>
                            </button>
                            <button 
                              type="button" 
                              className="btn-action-pill delete-btn" 
                              onClick={(e) => { e.stopPropagation(); deleteContacto(notif.id); }}
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="14" height="14">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              </svg>
                              <span>{language === 'en' ? 'Delete' : 'Eliminar'}</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          )}
          
          {/* PAGINACIÓN DE ALERTAS DE SISTEMA */}
          {mainTab === 'sistema' && totalPages > 1 && (
            <div className="notificaciones-pagination">
              <button 
                className="btn-page" 
                disabled={currentPage === 1}
                onClick={() => fetchAlerts(currentPage - 1)}
              >
                Anterior
              </button>
              <span className="page-info">
                <span className="page-info-desktop">{language === 'en' ? 'Page ' : 'Página '}</span>
                <strong>{currentPage}</strong> {language === 'en' ? 'of' : 'de'} {totalPages}
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

      {/* MODAL DETALLE DE MENSAJE SOBREPUESTO */}
      {mensajeActivo && (
        <div className="admin-msg-modal-overlay" onClick={() => setMensajeActivo(null)}>
          <div className="admin-msg-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-card-header">
              <h3>
                <svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" width="20" height="20">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                {language === 'en' ? 'Contact Message Details' : 'Detalle del Mensaje'}
              </h3>
              <button className="modal-close-btn" onClick={() => setMensajeActivo(null)}>×</button>
            </div>

            <div className="modal-card-body">
              <div className="modal-sender-profile">
                <div className="modal-sender-avatar">
                  {mensajeActivo.nombre ? mensajeActivo.nombre.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="modal-sender-info">
                  <span className="modal-sender-name">{mensajeActivo.nombre}</span>
                  <span className="modal-sender-subtitle">{language === 'en' ? 'Public Portal Sender' : 'Remitente del Portal Web'}</span>
                </div>
              </div>

              <div className="modal-info-grid">
                <div className="modal-info-card">
                  <span className="info-label">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="13" height="13">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                    {language === 'en' ? 'Email Address' : 'Correo Electrónico'}
                  </span>
                  <span className="info-value">{mensajeActivo.correo}</span>
                </div>

                <div className="modal-info-card">
                  <span className="info-label">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="13" height="13">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                    {language === 'en' ? 'Phone' : 'Teléfono'}
                  </span>
                  <span className="info-value">{mensajeActivo.telefono || 'N/A'}</span>
                </div>

                <div className="modal-info-card" style={{ gridColumn: '1 / -1' }}>
                  <span className="info-label">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="13" height="13">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    {language === 'en' ? 'Sent Date' : 'Fecha y Hora de Recepción'}
                  </span>
                  <span className="info-value">{formatearFechaStr(mensajeActivo.created_at)}</span>
                </div>
              </div>

              <div className="modal-message-box-wrapper">
                <span className="box-label">{language === 'en' ? 'Message Content:' : 'Contenido del Mensaje:'}</span>
                <p className="modal-message-content">{mensajeActivo.mensaje}</p>
              </div>
            </div>

            <div className="modal-card-footer">
              <button
                className="btn-modal-respond"
                onClick={() => responderGmail(mensajeActivo)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16" style={{ marginRight: '6px' }}>
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                {language === 'en' ? 'Reply via Gmail' : 'Responder por Gmail'}
              </button>
              <button className="btn-modal-close" onClick={() => setMensajeActivo(null)}>
                {language === 'en' ? 'Close' : 'Cerrar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notificaciones;
