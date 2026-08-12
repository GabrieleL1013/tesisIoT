import { API_BASE_URL, fetchWithAuth } from '../../config/api';
import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import AdminNavbarMobile from './AdminNavbarMobile';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { checkUserInterfaceAccess } from '../../utils/rbac';
import '../../styles/components/admin/AdminLayout.css';
import '../../styles/components/admin/AdminNotifications.css';

/* ── Idiomas: código siempre fijo, nunca cambia aunque se traduzca la página ── */
const LANGUAGES = [
  { code: 'es', label: 'ES' },
  { code: 'en', label: 'EN' },
];

/* ── Mapa de rutas → títulos de página (Bilingüe ES / EN) ── */
const PAGE_TITLES = {
  '/admin/dashboard': { es: 'Análisis e Indicadores IoT', en: 'IoT Real-Time Dashboard' },
  '/admin/metricas': { es: 'Dispositivos - Lecturas', en: 'Devices - Readings' },
  '/admin/metrics': { es: 'Dispositivos - Lecturas', en: 'Devices - Readings' },
  '/admin/nodos': { es: 'Control de Nodos IoT Activos', en: 'Active IoT Nodes Control' },
  '/admin/nodes': { es: 'Control de Nodos IoT Activos', en: 'Active IoT Nodes Control' },
  '/admin/categorias': { es: 'Líneas de Investigación', en: 'Research Categories' },
  '/admin/categories': { es: 'Líneas de Investigación', en: 'Research Categories' },
  '/admin/ubicaciones': { es: 'Centro de Ubicaciones y Coordenadas', en: 'Locations and Coordinates' },
  '/admin/locations': { es: 'Centro de Ubicaciones y Coordenadas', en: 'Locations and Coordinates' },
  '/admin/usuarios': { es: 'Gestión de Usuarios', en: 'User Management' },
  '/admin/users': { es: 'Gestión de Usuarios', en: 'User Management' },
  '/admin/sensores': { es: 'Gestión de Sensores', en: 'Sensor Management' },
  '/admin/lecturas': { es: 'Lecturas de Sensores', en: 'Sensor Readings' },
  '/admin/noticias': { es: 'Registro de Noticias & Divulgación', en: 'News & Outreach' },
  '/admin/news': { es: 'Registro de Noticias & Divulgación', en: 'News & Outreach' },
  '/admin/articulos': { es: 'Registro de Artículos Académicos', en: 'Academic Articles' },
  '/admin/articles': { es: 'Registro de Artículos Académicos', en: 'Academic Articles' },
  '/admin/monitor-en-vivo': { es: 'Telemetría en Vivo', en: 'Live Telemetry' },
  '/admin/live-monitor': { es: 'Telemetría en Vivo', en: 'Live Telemetry' },
  '/admin/historico': { es: 'Histórico de Telemetría', en: 'Telemetry History' },
  '/admin/history': { es: 'Histórico de Telemetría', en: 'Telemetry History' },
  '/admin/notificaciones': { es: 'Notificaciones', en: 'Notifications' },
  '/admin/notifications': { es: 'Notificaciones', en: 'Notifications' },
  '/admin/interfaces': { es: 'Gestión de Permisos', en: 'Permissions Management' },
};

const getPageIcon = (pathname) => {
  const cleanPath = (pathname || '').replace(/^\/(en|es)/, '');
  switch (cleanPath) {
    case '/admin/dashboard':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="#0f2c59" strokeWidth="2.2" width="20" height="20" style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, marginRight: '8px' }}>
          <rect x="3" y="3" width="7" height="9" rx="1" />
          <rect x="14" y="3" width="7" height="5" rx="1" />
          <rect x="14" y="12" width="7" height="9" rx="1" />
          <rect x="3" y="16" width="7" height="5" rx="1" />
        </svg>
      );
    case '/admin/monitor-en-vivo':
    case '/admin/live-monitor':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="#0f2c59" strokeWidth="2.2" width="20" height="20" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, marginRight: '8px' }}>
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      );
    case '/admin/historico':
    case '/admin/history':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="#0f2c59" strokeWidth="2.2" width="20" height="20" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, marginRight: '8px' }}>
          <path d="M3 3v18h18" />
          <path d="m19 9-5 5-4-4-3 3" />
        </svg>
      );
    case '/admin/nodos':
    case '/admin/nodes':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="#0f2c59" strokeWidth="2.2" width="20" height="20" style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, marginRight: '8px' }}>
          <rect x="2" y="2" width="20" height="8" rx="2" />
          <rect x="2" y="14" width="20" height="8" rx="2" />
          <line x1="6" y1="6" x2="6.01" y2="6" strokeWidth="3" />
          <line x1="6" y1="18" x2="6.01" y2="18" strokeWidth="3" />
          <line x1="12" y1="6" x2="18" y2="6" />
          <line x1="12" y1="18" x2="18" y2="18" />
        </svg>
      );
    case '/admin/categorias':
    case '/admin/categories':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="#0f2c59" strokeWidth="2.2" width="20" height="20" style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, marginRight: '8px' }}>
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
          <line x1="7" y1="7" x2="7.01" y2="7" strokeWidth="3" />
        </svg>
      );
    case '/admin/metricas':
    case '/admin/metrics':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="#0f2c59" strokeWidth="2.2" width="20" height="20" style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, marginRight: '8px' }}>
          <path d="M3 3v18h18" />
          <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
        </svg>
      );
    case '/admin/ubicaciones':
    case '/admin/locations':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="#0f2c59" strokeWidth="2.2" width="20" height="20" style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, marginRight: '8px' }}>
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      );
    case '/admin/usuarios':
    case '/admin/users':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="#0f2c59" strokeWidth="2.2" width="20" height="20" style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, marginRight: '8px' }}>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case '/admin/roles':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="#0f2c59" strokeWidth="2.2" width="20" height="20" style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, marginRight: '8px' }}>
          <path d="M12 2l3 5h5l-3 5 1 6-6-3-6 3 1-6-3-5h5z" />
        </svg>
      );
    case '/admin/interfaces':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="#0f2c59" strokeWidth="2.2" width="20" height="20" style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, marginRight: '8px' }}>
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="9" y1="21" x2="9" y2="9" />
        </svg>
      );
    case '/admin/noticias':
    case '/admin/news':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="#0f2c59" strokeWidth="2.2" width="20" height="20" style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, marginRight: '8px' }}>
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <path d="M16 8h2M16 12h2M8 8h4v8H8z" />
        </svg>
      );
    case '/admin/articulos':
    case '/admin/articles':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="#0f2c59" strokeWidth="2.2" width="20" height="20" style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, marginRight: '8px' }}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      );
    case '/admin/notificaciones':
    case '/admin/notifications':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="#0f2c59" strokeWidth="2.2" width="20" height="20" style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, marginRight: '8px' }}>
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="#0f2c59" strokeWidth="2.2" width="20" height="20" style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, marginRight: '8px' }}>
          <rect x="3" y="3" width="7" height="9" rx="1" />
          <rect x="14" y="3" width="7" height="5" rx="1" />
          <rect x="14" y="12" width="7" height="9" rx="1" />
          <rect x="3" y="16" width="7" height="5" rx="1" />
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
  const navigate = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const langRef = useRef(null);

  // Refs y estados para detectar desbordamiento del título en header y scroll suave
  const titleContainerRef = useRef(null);
  const titleTextRef = useRef(null);
  const [isTitleOverflowing, setIsTitleOverflowing] = useState(false);
  const [scrollDistance, setScrollDistance] = useState(0);

  const { user } = useAuth();
  const { language, setLanguage, t, isContentLoading } = useLanguage();
  const location = useLocation();
  const [dbUser, setDbUser] = useState(null);
  const [appInterfaces, setAppInterfaces] = useState([]);
  const [interfacesLoaded, setInterfacesLoaded] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);

  // Activar pantalla de carga solo al cambiar de ruta de navegación en administración
  useEffect(() => {
    setRouteLoading(true);
    const timer = setTimeout(() => {
      setRouteLoading(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  // Estados de Notificaciones de Mensajes de Contacto
  const [notificaciones, setNotificaciones] = useState([]);

  // Estados de Notificaciones del Sistema (Alertas de nodos)
  const [alertasSistema, setAlertasSistema] = useState([]);
  const [unreadAlertsCount, setUnreadAlertsCount] = useState(0);
  const [activeNotifTab, setActiveNotifTab] = useState('sistema'); // 'sistema' | 'contacto'

  const [mostrarNotificaciones, setMostrarNotificaciones] = useState(false);
  const [mensajeActivo, setMensajeActivo] = useState(null);
  const notifRef = useRef(null);

  /* Auth guard & Session */
  const session = localStorage.getItem('iot_sesion_activa');

  /* Identificación de usuario activo y timestamp de visualización de la campanita (Facebook style) */
  const activeUserId = dbUser?.id || (session && session.trim().startsWith('{') ? JSON.parse(session)?.id : null);
  const lastSeenStorageKey = activeUserId ? `iot_last_seen_notif_time_${activeUserId}` : 'iot_last_seen_notif_time';
  
  const [lastSeenNotifTime, setLastSeenNotifTime] = useState(() => {
    return localStorage.getItem(lastSeenStorageKey) || localStorage.getItem('iot_last_seen_notif_time') || null;
  });

  useEffect(() => {
    if (activeUserId) {
      const userLastSeen = localStorage.getItem(`iot_last_seen_notif_time_${activeUserId}`);
      if (userLastSeen) {
        setLastSeenNotifTime(userLastSeen);
      }
    }
  }, [activeUserId]);

  const marcarNotificacionesVistas = () => {
    const nowIso = new Date().toISOString();
    setLastSeenNotifTime(nowIso);
    if (activeUserId) {
      localStorage.setItem(`iot_last_seen_notif_time_${activeUserId}`, nowIso);
    }
    localStorage.setItem('iot_last_seen_notif_time', nowIso);
  };

  const isUnseenNotification = (dateStr) => {
    if (!lastSeenNotifTime) return true;
    if (!dateStr) return false;
    try {
      const itemTime = new Date(dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T')).getTime();
      const seenTime = new Date(lastSeenNotifTime).getTime();
      return itemTime > seenTime;
    } catch (e) {
      return false;
    }
  };

  const unseenContactoCount = notificaciones.filter(n => !n.leido && isUnseenNotification(n.created_at)).length;
  const unseenSistemaCount = !lastSeenNotifTime
    ? unreadAlertsCount
    : alertasSistema.filter(a => !a.is_read && isUnseenNotification(a.created_at)).length;
  const totalUnseenCount = unseenContactoCount + unseenSistemaCount;

  useEffect(() => {
    if (location.pathname.includes('/admin/notificaciones') || location.pathname.includes('/admin/notifications')) {
      marcarNotificacionesVistas();
    }
  }, [location.pathname, activeUserId]);

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

  const cargarPerfil = () => {
    const ses = localStorage.getItem('iot_sesion_activa');
    if (ses) {
      try {
        const parsed = JSON.parse(ses);
        if (parsed && parsed.id) {
          fetchWithAuth(`${API_BASE_URL}/users/${parsed.id}`)
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
                  window.location.href = `/${language}/login`;
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

  const fetchInterfaces = () => {
    fetchWithAuth(`${API_BASE_URL}/interfaces`)
      .then(res => res.json())
      .then(data => {
        setAppInterfaces(Array.isArray(data) ? data : []);
        setInterfacesLoaded(true);
      })
      .catch(err => {
        console.error("Error loading interfaces:", err);
        setInterfacesLoaded(true);
      });
  };

  const fetchNotificaciones = () => {
    // 1. Fetch Contactos
    fetchWithAuth(`${API_BASE_URL}/contactos`)
      .then(res => {
        if (!res.ok) throw new Error("Error fetching contacts");
        return res.json();
      })
      .then(data => {
        setNotificaciones(Array.isArray(data) ? data : []);
      })
      .catch(err => console.error("Error loading notifications:", err));

    // 2. Fetch System Alerts Latest
    fetchWithAuth(`${API_BASE_URL}/node-alerts/latest`)
      .then(res => res.json())
      .then(data => setAlertasSistema(Array.isArray(data) ? data : []))
      .catch(err => console.error("Error loading system alerts:", err));

    // 3. Fetch System Alerts Unread Count
    fetchWithAuth(`${API_BASE_URL}/node-alerts/unread-count`)
      .then(res => res.json())
      .then(data => setUnreadAlertsCount(data.count || 0))
      .catch(err => console.error("Error loading unread count:", err));
  };

  useEffect(() => {
    fetchInterfaces();
    fetchNotificaciones();
    const interval = setInterval(fetchNotificaciones, 30000); // refresh every 30s
    window.addEventListener('appInterfacesUpdated', fetchInterfaces);
    return () => {
      clearInterval(interval);
      window.removeEventListener('appInterfacesUpdated', fetchInterfaces);
    };
  }, []);

  const abrirMensajeCompleto = (notif) => {
    setMensajeActivo(notif);
    setMostrarNotificaciones(false);

    if (!notif.leido) {
      fetchWithAuth(`${API_BASE_URL}/contactos/${notif.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
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

  const abrirAlertaSistema = (alerta) => {
    setMostrarNotificaciones(false);
    if (!alerta.is_read) {
      fetchWithAuth(`${API_BASE_URL}/node-alerts/${alerta.id}/read`, {
        method: 'PUT'
      })
        .then(res => {
          if (res.ok) {
            setAlertasSistema(prev =>
              prev.map(a => a.id === alerta.id ? { ...a, is_read: true } : a)
            );
            setUnreadAlertsCount(prev => Math.max(0, prev - 1));
          }
        })
        .catch(err => console.error("Error marking alert read:", err));
    }
    navigate(language === 'en' ? '/en/admin/notifications' : '/es/admin/notificaciones');
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

  if (!session) return <Navigate to={`/${language}/login`} replace />;

  const toggleMenu = () => setMenuAbierto(prev => !prev);
  const cerrarMenu = () => setMenuAbierto(false);

  /* Datos de sesión */
  let sessionUser = {};
  try {
    sessionUser = session.trim().startsWith('{') ? JSON.parse(session) || {} : { name: session };
  } catch (e) { sessionUser = {}; }

  const nombreMostrar = dbUser?.name || sessionUser.name || sessionUser.nombre || user?.name || (language === 'en' ? 'Administrator' : 'Administrador');
  const rolMostrarRaw = dbUser?.role?.name || sessionUser?.role?.name || dbUser?.rol || sessionUser.rol || (dbUser?.role_id === 1 ? 'Superusuario' : 'Administrador');
  const rolMostrar = language === 'en'
    ? (rolMostrarRaw === 'Superusuario' ? 'SUPERUSER' : (rolMostrarRaw === 'Administrador' ? 'ADMINISTRATOR' : rolMostrarRaw))
    : (rolMostrarRaw === 'Superusuario' ? 'SUPERUSUARIO' : rolMostrarRaw);
  const rolColor = dbUser?.role?.color || sessionUser?.role?.color || '#2563eb';
  const emailToMatch = sessionUser.email || user?.email || '';

  const cleanPath = location.pathname.replace(/^\/(en|es)/, '');
  const titleObj = PAGE_TITLES[cleanPath] || PAGE_TITLES[location.pathname];
  const pageTitle = (typeof titleObj === 'object' ? titleObj[language] || titleObj.es : titleObj) || (language === 'en' ? 'Real-time analysis and indicators of IoT infrastructure' : 'Análisis e indicadores en tiempo real de la infraestructura IOT');

  /* Idioma activo — siempre usa la abreviatura fija del array, no texto traducido */
  const activeLang = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];
  const otherLangs = LANGUAGES.filter(l => l.code !== language);

  const canAccessNotificaciones = (() => {
    const activeUser = dbUser || (session ? JSON.parse(session) : user);
    return checkUserInterfaceAccess('/admin/notificaciones', activeUser, appInterfaces);
  })();

  // Efecto para calcular desbordamiento de título en resoluciones PC / Tablet
  useEffect(() => {
    const checkOverflow = () => {
      if (titleContainerRef.current && titleTextRef.current) {
        const containerWidth = titleContainerRef.current.clientWidth;
        const textWidth = titleTextRef.current.scrollWidth;
        if (textWidth > containerWidth + 4) {
          setIsTitleOverflowing(true);
          setScrollDistance(textWidth - containerWidth + 15);
        } else {
          setIsTitleOverflowing(false);
          setScrollDistance(0);
        }
      }
    };

    checkOverflow();
    const timer = setTimeout(checkOverflow, 150);
    window.addEventListener('resize', checkOverflow);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkOverflow);
    };
  }, [location.pathname, language, pageTitle]);

  return (
    <div className="admin-layout-container">
      <AdminNavbarMobile
        abrirMenu={toggleMenu}
        toggleMenu={toggleMenu}
        user={session ? JSON.parse(session) : user}
        dbUser={dbUser}
        notificaciones={notificaciones}
        unreadAlertsCount={unreadAlertsCount}
        totalUnseenCount={totalUnseenCount}
        canAccessNotificaciones={canAccessNotificaciones}
      />
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
          <div className="admin-header-page-title" style={{ display: 'flex', alignItems: 'center', minWidth: 0, flex: 1, maxWidth: '520px' }}>
            {getPageIcon(location.pathname)}
            <div 
              className={`admin-header-title-container ${isTitleOverflowing ? 'is-overflowing' : ''}`}
              ref={titleContainerRef}
              style={{ '--scroll-dist': `-${scrollDistance}px` }}
            >
              <span 
                className="admin-header-title-text" 
                ref={titleTextRef}
                title={pageTitle}
              >
                {pageTitle}
              </span>
            </div>
            <div id="admin-navbar-portal-target" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '12px', flexShrink: 0 }}></div>
          </div>

          {/* Controles (derecha) */}
          <div className="admin-header-right">

            {/* Campana de Notificaciones */}
            {canAccessNotificaciones && (
              <div className="admin-notifications-container" ref={notifRef}>
                <button
                  className={`admin-notif-btn ${mostrarNotificaciones ? 'active' : ''}`}
                  onClick={() => {
                    setShowLangDropdown(false);
                    setMostrarNotificaciones(prev => {
                      const nextState = !prev;
                      if (nextState) {
                        marcarNotificacionesVistas();
                      }
                      return nextState;
                    });
                  }}
                  title="Notificaciones"
                >
                  <BellIcon />
                  {totalUnseenCount > 0 && (
                    <span className="admin-notif-badge">
                      {totalUnseenCount > 99 ? '99+' : totalUnseenCount}
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
                          Sistema {unseenSistemaCount > 0 && <span style={{ background: '#ef4444', color: 'white', padding: '2px 6px', borderRadius: '10px', fontSize: '0.7rem', marginLeft: '4px' }}>{unseenSistemaCount}</span>}
                        </button>
                        <button
                          style={{ flex: 1, padding: '10px', background: 'none', border: 'none', borderBottom: activeNotifTab === 'contacto' ? '2px solid #2563eb' : '2px solid transparent', color: activeNotifTab === 'contacto' ? '#2563eb' : '#64748b', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer' }}
                          onClick={() => setActiveNotifTab('contacto')}
                        >
                          Contacto {unseenContactoCount > 0 && <span style={{ background: '#ef4444', color: 'white', padding: '2px 6px', borderRadius: '10px', fontSize: '0.7rem', marginLeft: '4px' }}>{unseenContactoCount}</span>}
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
                                onClick={() => abrirAlertaSistema(alerta)}
                                style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}
                              >
                                <div style={{ marginTop: '2px', color: alerta.severity === 'critical' ? '#ef4444' : '#f59e0b' }}>
                                  {alerta.type === 'offline' ? (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M10.7 17a2.5 2.5 0 0 0 2.6 0M2.6 9a14.8 14.8 0 0 1 18.8 0M6.6 13a9.8 9.8 0 0 1 10.8 0" /><line x1="2" y1="2" x2="22" y2="22" /></svg>
                                  ) : (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
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
                                onClick={() => { marcarNotificacionesVistas(); setMostrarNotificaciones(false); navigate(language === 'en' ? '/en/admin/notifications' : '/es/admin/notificaciones'); }}
                                style={{ color: '#2563eb', fontSize: '0.85rem', fontWeight: '600', background: 'none', border: 'none', cursor: 'pointer' }}
                              >
                                {t("manage_notifications.view_all", language === 'en' ? "View all notifications →" : "Ver todas las notificaciones →")}
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
                onClick={() => { setMostrarNotificaciones(false); setShowLangDropdown(prev => !prev); }}
                title="Cambiar idioma"
                translate="no"
              >
                {/* Globo — igual que GlobeIcon del Navbar */}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  width="16" height="16" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
                <span className="notranslate" translate="no" style={{ marginLeft: '6px' }}>{activeLang.label}</span>
                {/* Chevron */}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  width="14" height="14" style={{ marginLeft: '4px', display: 'inline-block', verticalAlign: 'middle' }}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {showLangDropdown && (
                <div className="admin-lang-dropdown">
                  {otherLangs.map(l => (
                    <button
                      key={l.code}
                      className="admin-lang-dropdown-item notranslate"
                      translate="no"
                      onClick={() => { setLanguage(l.code, navigate); setShowLangDropdown(false); }}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Perfil de usuario */}
            <div className="user-profile-badge notranslate" translate="no" title={emailToMatch || 'Usuario'}>
              <div className="user-profile-text">
                <span className="user-name-detail notranslate" translate="no">{nombreMostrar}</span>
                <span className="user-role-label" style={{ color: rolColor, fontWeight: 700 }}>
                  {t(rolMostrar)}
                </span>
              </div>
              <div className="user-avatar notranslate" translate="no" style={{ background: rolColor, backgroundColor: rolColor }}>
                {nombreMostrar.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>

        </header>

        {(() => {
          const activeUser = dbUser || (session ? JSON.parse(session) : user);
          const isSuperadmin = activeUser?.role?.name === 'Superusuario' || activeUser?.role_id === 1 || activeUser?.rol === 'Superusuario';
          const isPendingInterfaces = !isSuperadmin && !interfacesLoaded;
          const showLoader = routeLoading || isContentLoading || isPendingInterfaces;

          return (
            <>
              {showLoader && (
                <div className="admin-content-loader-overlay">
                  <div className="admin-content-loader-box">
                    <div className="admin-loader-spinner" />
                    <span className="admin-loader-text">
                      {language === 'en' ? 'Loading...' : 'Cargando...'}
                    </span>
                  </div>
                </div>
              )}

              <div className={`admin-content-fade-wrapper ${showLoader ? 'is-loading' : 'is-ready'}`}>
                {(() => {
                  if (isPendingInterfaces) return null;
                  const hasAccess = checkUserInterfaceAccess(location.pathname, activeUser, appInterfaces);
                  return hasAccess ? <Outlet /> : <Navigate to={`/${language}/admin/403`} replace />;
                })()}
              </div>
            </>
          );
        })()}
      </main>

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

export default AdminLayout;