import { API_BASE_URL } from '../../config/api';
import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import AdminNavbarMobile from './AdminNavbarMobile';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import '../../styles/components/admin/AdminLayout.css';
import '../../styles/components/admin/AdminNotifications.css';

/* ── Idiomas: código siempre fijo, nunca cambia aunque se traduzca la página ── */
const LANGUAGES = [
  { code: 'es', label: 'ES' },
  { code: 'en', label: 'EN' },
  { code: 'fr', label: 'FR' },
  { code: 'pt', label: 'PT' },
  { code: 'it', label: 'IT' },
  { code: 'de', label: 'DE' },
  { code: 'zh-CN', label: 'ZH' },
];

/* ── Mapa de rutas → títulos de página ── */
const PAGE_TITLES = {
  '/admin/dashboard':   'Dashboard General',
  '/admin/metricas':    'Dispositivos - Lecturas',
  '/admin/nodos':       'Control de Nodos IoT Activos',
  '/admin/categorias':  'Líneas de Investigación',
  '/admin/ubicaciones': 'Centro de Ubicaciones y Coordenadas',
  '/admin/usuarios':    'Gestión de Usuarios',
  '/admin/sensores':    'Gestión de Sensores',
  '/admin/lecturas':    'Lecturas de Sensores',
  '/admin/noticias':    'Registro de Noticias & Divulgación',
  '/admin/articulos':   'Registro de Artículos Académicos',
  '/admin/monitor-en-vivo': 'Telemetría en Vivo',
  '/admin/historico':       'Histórico de Telemetría',
  '/admin/notificaciones':  'Centro de Notificaciones',
};

const getPageIcon = (pathname) => {
  switch (pathname) {
    case '/admin/dashboard':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20" style={{ marginRight: '8px', color: '#0f2c59' }}>
          <rect x="3" y="3" width="7" height="9" rx="1" />
          <rect x="14" y="3" width="7" height="5" rx="1" />
          <rect x="14" y="12" width="7" height="9" rx="1" />
          <rect x="3" y="16" width="7" height="5" rx="1" />
        </svg>
      );
    case '/admin/metricas':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20" style={{ marginRight: '8px', color: '#0f2c59' }}>
          <path d="M3 3v18h18" />
          <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
        </svg>
      );
    case '/admin/nodos':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20" style={{ marginRight: '8px', color: '#0f2c59' }}>
          <rect x="2" y="2" width="20" height="8" rx="2" />
          <rect x="2" y="14" width="20" height="8" rx="2" />
          <line x1="6" y1="6" x2="6.01" y2="6" strokeWidth="3" />
          <line x1="6" y1="18" x2="6.01" y2="18" strokeWidth="3" />
          <line x1="12" y1="6" x2="18" y2="6" />
          <line x1="12" y1="18" x2="18" y2="18" />
        </svg>
      );
    case '/admin/categorias':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20" style={{ marginRight: '8px', color: '#0f2c59' }}>
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
          <line x1="7" y1="7" x2="7.01" y2="7" strokeWidth="3" />
        </svg>
      );
    case '/admin/ubicaciones':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20" style={{ marginRight: '8px', color: '#0f2c59' }}>
          <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
          <line x1="9" y1="3" x2="9" y2="18" />
          <line x1="15" y1="6" x2="15" y2="21" />
        </svg>
      );
    case '/admin/usuarios':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20" style={{ marginRight: '8px', color: '#0f2c59' }}>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case '/admin/noticias':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20" style={{ marginRight: '8px', color: '#0f2c59' }}>
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <path d="M16 8h2M16 12h2M8 8h4v8H8z" />
        </svg>
      );
    case '/admin/articulos':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20" style={{ marginRight: '8px', color: '#0f2c59' }}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      );
    case '/admin/monitor-en-vivo':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20" style={{ marginRight: '8px', color: '#0f2c59' }}>
          <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path>
          <path d="M12 12v9"></path>
          <path d="m8 17 4 4 4-4"></path>
        </svg>
      );
    case '/admin/historico':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20" style={{ marginRight: '8px', color: '#0f2c59' }}>
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      );


    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20" style={{ marginRight: '8px', color: '#0f2c59' }}>
          <circle cx="12" cy="12" r="10" />
        </svg>
      );
  }
};

const BellIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="20" height="20">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const AdminLayout = () => {
  const [menuAbierto,       setMenuAbierto]       = useState(false);
  const [showLangDropdown,  setShowLangDropdown]  = useState(false);
  const langRef = useRef(null);

  const { user }              = useAuth();
  const { language, setLanguage } = useLanguage();
  const location              = useLocation();
  const navigate              = useNavigate();

  const [dbUser, setDbUser] = useState(null);
  const [appInterfaces, setAppInterfaces] = useState([]);

  // Estados de Notificaciones de Mensajes de Contacto
  const [notificaciones, setNotificaciones] = useState([]);
  
  // Estados de Notificaciones del Sistema (Alertas de nodos)
  const [alertasSistema, setAlertasSistema] = useState([]);
  const [unreadAlertsCount, setUnreadAlertsCount] = useState(0);
  const [activeNotifTab, setActiveNotifTab] = useState('sistema'); // 'sistema' | 'contacto'

  const [mostrarNotificaciones, setMostrarNotificaciones] = useState(false);
  const [mensajeActivo, setMensajeActivo] = useState(null);
  const notifRef = useRef(null);

  /* Cerrar dropdowns al hacer click fuera */
  useEffect(() => {
    const handleOutside = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) {
        setShowLangDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setMostrarNotificaciones(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  /* Auth guard */
  const session = localStorage.getItem('iot_sesion_activa');

  const cargarPerfil = () => {
    const ses = localStorage.getItem('iot_sesion_activa');
    if (ses) {
      try {
        const parsed = JSON.parse(ses);
        if (parsed && parsed.id) {
          fetch(`${API_BASE_URL}/users/${parsed.id}`)
            .then(res => {
              if (res.status === 404 || res.status === 401) {
                // El usuario activo ha sido eliminado de la Base de Datos
                localStorage.removeItem('iot_sesion_activa');
                localStorage.removeItem('iot_token_seguro');
                localStorage.removeItem('app_user');
                Swal.fire({
                  title: 'Sesión Finalizada',
                  text: 'Tu cuenta de usuario ha sido eliminada de la base de datos.',
                  icon: 'warning',
                  background: '#0b0f19',
                  color: '#ffffff',
                  confirmButtonColor: '#ef4444'
                }).then(() => {
                  window.location.href = '/login';
                });
                throw new Error("Usuario eliminado de la base de datos");
              }
              if (!res.ok) throw new Error("Could not load user profile");
              return res.json();
            })
            .then(data => {
              if (data && data.name) {
                setDbUser(data);
                // Sincronizar localStorage para mantener actualizadas otras referencias de sesión
                const updatedSession = { ...parsed, name: data.name, role: data.role };
                localStorage.setItem('iot_sesion_activa', JSON.stringify(updatedSession));
              }
            })
            .catch(err => {
              console.error("Error loading user profile in AdminLayout:", err);
            });
        }
      } catch (e) {
        console.error("Error parsing user session in AdminLayout", e);
      }
    }
  };

  /* Cargar y sincronizar datos del perfil con la Base de Datos */
  useEffect(() => {
    cargarPerfil();

    // Escuchar cambios de perfil en tiempo real sin recargar página
    window.addEventListener('userProfileUpdated', cargarPerfil);
    return () => window.removeEventListener('userProfileUpdated', cargarPerfil);
  }, []);

  const fetchNotificaciones = () => {
    // 1. Fetch Contactos
    fetch(`${API_BASE_URL}/contactos`)
      .then(res => {
        if (!res.ok) throw new Error("Error fetching contacts");
        return res.json();
      })
      .then(data => {
        setNotificaciones(Array.isArray(data) ? data : []);
      })
      .catch(err => console.error("Error loading notifications:", err));

    // 2. Fetch System Alerts Latest
    fetch(`${API_BASE_URL}/node-alerts/latest`)
      .then(res => res.json())
      .then(data => setAlertasSistema(Array.isArray(data) ? data : []))
      .catch(err => console.error("Error loading system alerts:", err));

    // 3. Fetch System Alerts Unread Count
    fetch(`${API_BASE_URL}/node-alerts/unread-count`)
      .then(res => res.json())
      .then(data => setUnreadAlertsCount(data.count || 0))
      .catch(err => console.error("Error loading unread count:", err));

    // 4. Fetch App Interfaces for RBAC
    fetch(`${API_BASE_URL}/interfaces`)
      .then(res => res.json())
      .then(data => setAppInterfaces(Array.isArray(data) ? data : []))
      .catch(err => console.error("Error loading interfaces:", err));
  };

  useEffect(() => {
    fetchNotificaciones();
    const interval = setInterval(fetchNotificaciones, 30000); // refresh every 30s
    window.addEventListener('appInterfacesUpdated', fetchNotificaciones);
    return () => {
      clearInterval(interval);
      window.removeEventListener('appInterfacesUpdated', fetchNotificaciones);
    };
  }, []);

  const abrirMensajeCompleto = (notif) => {
    setMensajeActivo(notif);
    setMostrarNotificaciones(false);
    
    if (!notif.leido) {
      fetch(`${API_BASE_URL}/contactos/${notif.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ leido: true })
      })
      .then(res => {
        if (res.ok) {
          setNotificaciones(prev => 
            prev.map(n => n.id === notif.id ? { ...n, leido: true } : n)
          );
        }
      })
      .catch(err => console.error("Error marking read:", err));
    }
  };

  const responderGmail = (notif) => {
    const subject = encodeURIComponent(`Respuesta a tu consulta de telemetría - IoT ULEAM [Ref #${notif.id}]`);
    const body = encodeURIComponent(`Hola ${notif.nombre},\n\nCon respecto a tu mensaje enviado a nuestro portal de telemetría:\n"${notif.mensaje}"\n\n[Escribe tu respuesta aquí]\n\nAtentamente,\nDirección de Innovación Tecnológica & Telecomunicaciones ULEAM`);
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(notif.correo)}&su=${subject}&body=${body}`, '_blank');
  };

  const formatearFechaStr = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  if (!session) return <Navigate to="/login" replace />;

  const toggleMenu = () => setMenuAbierto(prev => !prev);
  const cerrarMenu = () => setMenuAbierto(false);

  /* Datos de sesión */
  let sessionUser = {};
  try {
    sessionUser = session.trim().startsWith('{') ? JSON.parse(session) || {} : { name: session };
  } catch (e) { sessionUser = {}; }

  const nombreMostrar = dbUser?.name || sessionUser.name || sessionUser.nombre || user?.name || 'Administrador';
  const rolMostrar    = dbUser?.role?.name || sessionUser?.role?.name || dbUser?.rol || sessionUser.rol || (dbUser?.role_id === 1 ? 'Superusuario' : 'Administrador');
  const rolColor      = dbUser?.role?.color || sessionUser?.role?.color || '#2563eb';
  const emailToMatch  = sessionUser.email || user?.email || '';
  const pageTitle     = PAGE_TITLES[location.pathname] || 'DASHBOARD GENERAL';

  /* Idioma activo — siempre usa la abreviatura fija del array, no texto traducido */
  const activeLang = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];
  const otherLangs = LANGUAGES.filter(l => l.code !== language);

  const canAccessNotificaciones = (() => {
    const userRoleId = dbUser?.role_id || dbUser?.role?.id || sessionUser?.role_id || sessionUser?.role?.id;
    const userRoleName = dbUser?.role?.name || sessionUser?.role?.name || sessionUser?.rol;
    const userLevel = dbUser?.role?.level_permission ?? sessionUser?.role?.level_permission ?? 1;

    if (userRoleName === 'Superusuario' || userRoleId === 1) return true;
    if (!appInterfaces || appInterfaces.length === 0) return true;

    const notifIface = appInterfaces.find(i => i.path === '/admin/notificaciones');
    if (!notifIface) return true;

    let allowed = [];
    try {
      allowed = typeof notifIface.allowed_roles === 'string'
        ? JSON.parse(notifIface.allowed_roles)
        : notifIface.allowed_roles;
    } catch (e) {}

    if (!Array.isArray(allowed)) allowed = [];

    const isRoleAdmitted = allowed.some(item =>
      item === userRoleId ||
      item === String(userRoleId) ||
      item === userRoleName
    );

    const isLevelSufficient = notifIface.min_level === null || userLevel >= notifIface.min_level;

    return isRoleAdmitted && isLevelSufficient;
  })();

  return (
    <div className="admin-layout-container">
      <AdminNavbarMobile abrirMenu={toggleMenu} toggleMenu={toggleMenu} />
      <Sidebar 
        isOpen={menuAbierto} 
        cerrarMenu={cerrarMenu} 
        appInterfaces={appInterfaces} 
        dbUser={dbUser} 
        userSession={session ? JSON.parse(session) : user} 
      />

      <main className="admin-main-content">
        <header className="admin-top-header">

          {/* Título de la sección (izquierda) */}
          <div className="admin-header-page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {getPageIcon(location.pathname)}
            {pageTitle}
            <div id="admin-navbar-portal-target" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '12px' }}></div>
          </div>

          {/* Controles (derecha) */}
          <div className="admin-header-right">

            {/* Campana de Notificaciones */}
            {canAccessNotificaciones && (
            <div className="admin-notifications-container" ref={notifRef}>
              <button 
                className="admin-notif-btn"
                onClick={() => setMostrarNotificaciones(!mostrarNotificaciones)}
                title="Notificaciones"
              >
                <BellIcon />
                {(notificaciones.filter(n => !n.leido).length + unreadAlertsCount) > 0 && (
                  <span className="admin-notif-badge">
                    {(notificaciones.filter(n => !n.leido).length + unreadAlertsCount) > 99 
                      ? '99+' 
                      : (notificaciones.filter(n => !n.leido).length + unreadAlertsCount)}
                  </span>
                )}
              </button>
              
              {mostrarNotificaciones && (
                <div className="admin-notif-dropdown" style={{ width: '380px' }}>
                  <div className="admin-notif-dropdown-header" style={{ paddingBottom: '0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <h4 style={{ padding: '0 16px' }}>Notificaciones</h4>
                    <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0' }}>
                      <button 
                        style={{ flex: 1, padding: '10px', background: 'none', border: 'none', borderBottom: activeNotifTab === 'sistema' ? '2px solid #2563eb' : '2px solid transparent', color: activeNotifTab === 'sistema' ? '#2563eb' : '#64748b', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer' }}
                        onClick={() => setActiveNotifTab('sistema')}
                      >
                        Sistema {unreadAlertsCount > 0 && <span style={{ background: '#ef4444', color: 'white', padding: '2px 6px', borderRadius: '10px', fontSize: '0.7rem', marginLeft: '4px' }}>{unreadAlertsCount}</span>}
                      </button>
                      <button 
                        style={{ flex: 1, padding: '10px', background: 'none', border: 'none', borderBottom: activeNotifTab === 'contacto' ? '2px solid #2563eb' : '2px solid transparent', color: activeNotifTab === 'contacto' ? '#2563eb' : '#64748b', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer' }}
                        onClick={() => setActiveNotifTab('contacto')}
                      >
                        Contacto {notificaciones.filter(n => !n.leido).length > 0 && <span style={{ background: '#ef4444', color: 'white', padding: '2px 6px', borderRadius: '10px', fontSize: '0.7rem', marginLeft: '4px' }}>{notificaciones.filter(n => !n.leido).length}</span>}
                      </button>
                    </div>
                  </div>
                  <div className="admin-notif-dropdown-body" style={{ maxHeight: '350px' }}>
                    {activeNotifTab === 'contacto' ? (
                      notificaciones.length === 0 ? (
                        <div className="admin-notif-empty">No hay mensajes recientes.</div>
                      ) : (
                        notificaciones.map((notif) => (
                          <div 
                            key={notif.id} 
                            className={`admin-notif-item ${!notif.leido ? 'unread' : ''}`}
                            onClick={() => abrirMensajeCompleto(notif)}
                          >
                            <div className="admin-notif-item-title">
                              <span className="admin-notif-author">{notif.nombre}</span>
                              <span className="admin-notif-date">{formatearFechaStr(notif.created_at)}</span>
                            </div>
                            <span className="admin-notif-tel">📞 {notif.telefono}</span>
                            <p className="admin-notif-text">
                              {notif.mensaje.length > 50 ? `${notif.mensaje.substring(0, 50)}...` : notif.mensaje}
                            </p>
                          </div>
                        ))
                      )
                    ) : (
                      alertasSistema.length === 0 ? (
                        <div className="admin-notif-empty">No hay alertas del sistema.</div>
                      ) : (
                        <>
                          {alertasSistema.map((alerta) => (
                            <div 
                              key={alerta.id} 
                              className={`admin-notif-item ${!alerta.is_read ? 'unread' : ''}`}
                              onClick={() => {
                                setMostrarNotificaciones(false);
                                navigate('/admin/notificaciones');
                              }}
                              style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}
                            >
                              <div style={{ marginTop: '2px', color: alerta.severity === 'critical' ? '#ef4444' : '#f59e0b' }}>
                                {alerta.type === 'offline' ? (
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M10.7 17a2.5 2.5 0 0 0 2.6 0M2.6 9a14.8 14.8 0 0 1 18.8 0M6.6 13a9.8 9.8 0 0 1 10.8 0"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
                                ) : (
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                                )}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div className="admin-notif-item-title">
                                  <span className="admin-notif-author" style={{ color: alerta.severity === 'critical' ? '#b91c1c' : '#b45309' }}>{alerta.title}</span>
                                  <span className="admin-notif-date">{formatearFechaStr(alerta.created_at)}</span>
                                </div>
                                <p className="admin-notif-text" style={{ marginTop: '4px', fontSize: '0.75rem' }}>
                                  {alerta.message.length > 70 ? `${alerta.message.substring(0, 70)}...` : alerta.message}
                                </p>
                              </div>
                            </div>
                          ))}
                          <div style={{ padding: '12px', textAlign: 'center', borderTop: '1px solid #e2e8f0' }}>
                            <button 
                              onClick={() => { setMostrarNotificaciones(false); navigate('/admin/notificaciones'); }}
                              style={{ color: '#2563eb', fontSize: '0.85rem', fontWeight: '600', background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                              Ver todas las notificaciones →
                            </button>
                          </div>
                        </>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
            )}

            {/* ── SELECTOR DE IDIOMA: etiquetas siempre fijas, sin traducción ── */}
            <div className="admin-lang-selector" ref={langRef} translate="no">
              <button
                className="admin-lang-btn"
                onClick={() => setShowLangDropdown(prev => !prev)}
                title="Cambiar idioma"
                translate="no"
              >
                {/* Globo — igual que GlobeIcon del Navbar */}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  width="16" height="16" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="2" y1="12" x2="22" y2="12"/>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
                <span className="notranslate" translate="no" style={{ marginLeft: '6px' }}>{activeLang.label}</span>
                {/* Chevron */}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  width="14" height="14" style={{ marginLeft: '4px', display: 'inline-block', verticalAlign: 'middle' }}>
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>

              {showLangDropdown && (
                <div className="admin-lang-dropdown">
                  {otherLangs.map(l => (
                    <button
                      key={l.code}
                      className="admin-lang-dropdown-item notranslate"
                      translate="no"
                      onClick={() => { setLanguage(l.code); setShowLangDropdown(false); }}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Perfil de usuario */}
            <div className="user-profile-badge" title={emailToMatch || 'admin@uleam.edu.ec'}>
              <div className="user-profile-text">
                <span className="user-name-detail">{nombreMostrar}</span>
                <span className="user-role-label" style={{ color: rolColor, fontWeight: 700 }}>
                  {rolMostrar}
                </span>
              </div>
              <div className="user-avatar" style={{ background: rolColor, backgroundColor: rolColor }}>
                {nombreMostrar.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>

        </header>

        {(() => {
          let hasAccess = true;
          const currentSession = session ? JSON.parse(session) : user;
          const userRoleId = dbUser?.role_id || dbUser?.role?.id || currentSession?.role_id || currentSession?.role?.id;
          const userRoleName = dbUser?.role?.name || currentSession?.role?.name || currentSession?.rol;
          const userLevel = dbUser?.role?.level_permission ?? currentSession?.role?.level_permission ?? 1;
          
          if (userRoleName === 'Superusuario' || userRoleId === 1) {
            hasAccess = true;
          } else if (appInterfaces.length > 0) {
            const matchingInterface = appInterfaces.find(iface => location.pathname.startsWith(iface.path));
            if (matchingInterface) {
              let allowed = [];
              try {
                allowed = typeof matchingInterface.allowed_roles === 'string' 
                  ? JSON.parse(matchingInterface.allowed_roles) 
                  : matchingInterface.allowed_roles;
              } catch (e) {
                allowed = [];
              }

              if (!Array.isArray(allowed)) allowed = [];

              const isRoleAdmitted = allowed.some(item => 
                item === userRoleId || 
                item === String(userRoleId) || 
                item === userRoleName
              );

              const isLevelSufficient = matchingInterface.min_level === null || userLevel >= matchingInterface.min_level;

              if (!isRoleAdmitted || !isLevelSufficient) {
                hasAccess = false;
              }
            }
          }

          return hasAccess ? <Outlet /> : <Navigate to="/admin/403" replace />;
        })()}
      </main>

      {/* MODAL DETALLE DE MENSAJE SOBREPUESTO */}
      {mensajeActivo && (
        <div className="admin-msg-modal-overlay" onClick={() => setMensajeActivo(null)}>
          <div className="admin-msg-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-card-header">
              <h3>Detalle del Mensaje</h3>
              <button className="modal-close-btn" onClick={() => setMensajeActivo(null)}>×</button>
            </div>
            <div className="modal-card-body">
              <div className="modal-detail-row">
                <span className="detail-label">Remitente:</span>
                <span className="detail-value font-bold">{mensajeActivo.nombre}</span>
              </div>
              <div className="modal-detail-row">
                <span className="detail-label">Correo:</span>
                <span className="detail-value">{mensajeActivo.correo}</span>
              </div>
              <div className="modal-detail-row">
                <span className="detail-label">Teléfono:</span>
                <span className="detail-value">{mensajeActivo.telefono}</span>
              </div>
              <div className="modal-detail-row">
                <span className="detail-label">Fecha:</span>
                <span className="detail-value">{formatearFechaStr(mensajeActivo.created_at)}</span>
              </div>
              <div className="modal-detail-message-box">
                <span className="detail-label">Mensaje:</span>
                <p className="modal-message-text">{mensajeActivo.mensaje}</p>
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
                Responder por Gmail
              </button>
              <button className="btn-modal-close" onClick={() => setMensajeActivo(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLayout;