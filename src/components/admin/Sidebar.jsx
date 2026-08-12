import React, { useState } from 'react';
import { NavLink, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { checkUserInterfaceAccess } from '../../utils/rbac';
import logoImagen from '../../assets/LOGO.png';
import '../../styles/components/admin/Sidebar.css';

const DashboardIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="18" height="18" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
    <rect x="3" y="3" width="7" height="9" rx="1" />
    <rect x="14" y="3" width="7" height="5" rx="1" />
    <rect x="14" y="12" width="7" height="9" rx="1" />
    <rect x="3" y="16" width="7" height="5" rx="1" />
  </svg>
);

const NodesIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="18" height="18" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
    <rect x="2" y="2" width="20" height="8" rx="2" />
    <rect x="2" y="14" width="20" height="8" rx="2" />
    <line x1="6" y1="6" x2="6.01" y2="6" strokeWidth="3" />
    <line x1="6" y1="18" x2="6.01" y2="18" strokeWidth="3" />
    <line x1="12" y1="6" x2="18" y2="6" />
    <line x1="12" y1="18" x2="18" y2="18" />
  </svg>
);


const SensorIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="18" height="18" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
    <rect x="2" y="6" width="20" height="12" rx="3" />
    <path d="M6 12h4m4 0h4" />
  </svg>
);

const LocationsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="18" height="18" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const UsersIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="18" height="18" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const NewsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="18" height="18" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <path d="M16 8h2M16 12h2M8 8h4v8H8z" />
  </svg>
);

const ArticlesIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="18" height="18" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const BellIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="18" height="18" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
  </svg>
);

const LogoutIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="18" height="18" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const ActivityIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', width: '18px', height: '18px' }}>
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
  </svg>
);

const HistoryIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', width: '18px', height: '18px' }}>
    <path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" />
  </svg>
);

const MqttIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="18" height="18" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
    <path d="M4 11a9 9 0 0 1 9 9"></path>
    <path d="M4 4a16 16 0 0 1 16 16"></path>
    <circle cx="5" cy="19" r="1"></circle>
  </svg>
);

const AddIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const TagIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <line x1="7" y1="7" x2="7.01" y2="7" strokeWidth="3" />
  </svg>
);

const MetricIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12">
    <path d="M3 3v18h18" />
    <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
  </svg>
);

const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="18" height="18" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const BadgeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12">
    <path d="M12 2l3 5h5l-3 5 1 6-6-3-6 3 1-6-3-5h5z" />
  </svg>
);

const LayoutIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="9" y1="21" x2="9" y2="9" />
  </svg>
);

const getSidebarBadgeTitle = (pathname, language) => {
  const isEn = language === 'en';
  const cleanPath = (pathname || '').replace(/^\/(en|es)/, '');

  switch (cleanPath) {
    case '/admin/dashboard':
      return isEn ? 'GENERAL DASHBOARD' : 'DASHBOARD GENERAL';
    case '/admin/monitor-en-vivo':
    case '/admin/live-monitor':
      return isEn ? 'LIVE MONITOR' : 'MONITOR EN VIVO';
    case '/admin/historico':
    case '/admin/history':
      return isEn ? 'AGGREGATED HISTORY' : 'HISTÓRICO AGREGADO';
    case '/admin/nodos':
    case '/admin/nodes':
      return isEn ? 'MANAGE NODES' : 'GESTIONAR NODOS';
    case '/admin/sensores':
    case '/admin/sensors':
      return isEn ? 'MANAGE SENSORS' : 'GESTIONAR SENSORES';
    case '/admin/metricas':
    case '/admin/metrics':
      return isEn ? 'METRICS & UNITS' : 'MÉTRICAS Y UNIDADES';
    case '/admin/categorias':
    case '/admin/categories':
      return isEn ? 'NODE CATEGORIES' : 'CATEGORÍAS DE NODOS';
    case '/admin/ubicaciones':
    case '/admin/locations':
      return isEn ? 'LOCATIONS' : 'UBICACIONES';
    case '/admin/usuarios':
    case '/admin/users':
      return isEn ? 'USERS' : 'USUARIOS';
    case '/admin/roles':
      return isEn ? 'ROLES' : 'ROLES';
    case '/admin/interfaces':
      return isEn ? 'PERMISSIONS' : 'PERMISOS';
    case '/admin/noticias':
    case '/admin/news':
      return isEn ? 'NEWS' : 'NOTICIAS';
    case '/admin/articulos':
    case '/admin/articles':
      return isEn ? 'ARTICLES' : 'ARTÍCULOS';
    case '/admin/notificaciones':
    case '/admin/notifications':
      return isEn ? 'NOTIFICATIONS' : 'NOTIFICACIONES';
    default:
      return isEn ? 'GENERAL DASHBOARD' : 'DASHBOARD GENERAL';
  }
};

const Sidebar = ({ isOpen, cerrarMenu, appInterfaces = [], dbUser, userSession }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const { language, t } = useLanguage();

  const baseAdmin = `/${language}/admin`;

  const canAccess = (subpath) => {
    const activeUser = dbUser || userSession;
    return checkUserInterfaceAccess(subpath, activeUser, appInterfaces);
  };

  const isTelemetriaPageActive = location.pathname.includes('/monitor-en-vivo') || location.pathname.includes('/live-monitor') ||
    location.pathname.includes('/historico') || location.pathname.includes('/history');

  const [telemetriaSubmenuOpen, setTelemetriaSubmenuOpen] = useState(isTelemetriaPageActive);

  const [nodosSubmenuOpen, setNodosSubmenuOpen] = useState(
    location.pathname.includes('/nodos') || location.pathname.includes('/nodes') ||
    location.pathname.includes('/categorias') || location.pathname.includes('/categories') ||
    location.pathname.includes('/metricas') || location.pathname.includes('/metrics')
  );

  const [seguridadSubmenuOpen, setSeguridadSubmenuOpen] = useState(
    location.pathname.includes('/usuarios') || location.pathname.includes('/users') ||
    location.pathname.includes('/roles') || location.pathname.includes('/interfaces')
  );

  const manejarCerrarSesion = () => {
    localStorage.removeItem('iot_token_seguro');
    localStorage.removeItem('iot_sesion_activa');
    localStorage.removeItem('app_user');
    logout();
    if (cerrarMenu) cerrarMenu();
    navigate(`/${language}/login`);
  };

  const isNodosPageActive = location.pathname.includes('/nodos') || location.pathname.includes('/nodes') ||
    location.pathname.includes('/categorias') || location.pathname.includes('/categories') ||
    location.pathname.includes('/metricas') || location.pathname.includes('/metrics');

  const isSeguridadPageActive = location.pathname.includes('/usuarios') || location.pathname.includes('/users') ||
    location.pathname.includes('/roles') || location.pathname.includes('/interfaces');

  const userRoleId = dbUser?.role_id || dbUser?.role?.id || userSession?.role_id || userSession?.role?.id;
  const userRoleName = dbUser?.role?.name || userSession?.role?.name || userSession?.rol;
  const isSuper = userRoleName === 'Superusuario' || userRoleId === 1;
  const isLoading = !isSuper && (!appInterfaces || appInterfaces.length === 0);

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={cerrarMenu}></div>}

      <aside className={`admin-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <button type="button" className="sidebar-mobile-toggle-close" onClick={cerrarMenu} title={t("common.close", "Cerrar menú")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="22" height="22">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <Link to={`${baseAdmin}/dashboard`} className="logo-admin-flex" onClick={cerrarMenu}>
            <img src={logoImagen} alt="Uleam Logo" />
          </Link>
          <span className="role-badge">{getSidebarBadgeTitle(location.pathname, language)}</span>
        </div>

        <nav className="sidebar-nav">
          {isLoading ? (
            <div className="sidebar-skeleton-wrapper">
              {[75, 60, 80, 50, 65, 70].map((widthPct, idx) => (
                <div key={idx} className="sidebar-skeleton-item">
                  <div className="skeleton-icon-circle"></div>
                  <div className="skeleton-text-bar" style={{ width: `${widthPct}%` }}></div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {canAccess('/admin/dashboard') && (
                <NavLink to={`${baseAdmin}/dashboard`} className="side-item" onClick={cerrarMenu}>
                  <DashboardIcon /> <span>{t("admin.dashboard", "Dashboard")}</span>
                </NavLink>
              )}

              {(canAccess('/admin/monitor-en-vivo') || canAccess('/admin/historico')) && (
                <div className={`side-menu-parent ${telemetriaSubmenuOpen ? 'expanded' : ''}`}>
                  <button
                    type="button"
                    className={`side-item-btn ${isTelemetriaPageActive ? 'active' : ''}`}
                    onClick={() => setTelemetriaSubmenuOpen(!telemetriaSubmenuOpen)}
                  >
                    <MqttIcon /> <span>{t("sidebar.telemetry", "Telemetría")}</span>
                    <span className={`submenu-arrow ${telemetriaSubmenuOpen ? 'rotated' : ''}`}>▾</span>
                  </button>

                  {telemetriaSubmenuOpen && (
                    <div className="submenu-nav">
                      {canAccess('/admin/monitor-en-vivo') && (<NavLink
                        to={`${baseAdmin}/${language === 'en' ? 'live-monitor' : 'monitor-en-vivo'}`}
                        className={({ isActive }) => `submenu-item ${isActive ? 'active' : ''}`}
                        onClick={cerrarMenu}
                      >
                        <ActivityIcon /> <span>{t("admin.live_monitor", "En Vivo")}</span>
                      </NavLink>)}

                      {canAccess('/admin/historico') && (<NavLink
                        to={`${baseAdmin}/${language === 'en' ? 'history' : 'historico'}`}
                        className={({ isActive }) => `submenu-item ${isActive ? 'active' : ''}`}
                        onClick={cerrarMenu}
                      >
                        <HistoryIcon /> <span>{t("admin.aggregated_history", "Histórico Agregado")}</span>
                      </NavLink>)}
                    </div>
                  )}
                </div>)}

              {(canAccess('/admin/nodos') || canAccess('/admin/categorias') || canAccess('/admin/metricas')) && (
                <div className={`side-menu-parent ${nodosSubmenuOpen ? 'expanded' : ''}`}>
                  <button
                    type="button"
                    className={`side-item-btn ${isNodosPageActive ? 'active' : ''}`}
                    onClick={() => setNodosSubmenuOpen(!nodosSubmenuOpen)}
                  >
                    <NodesIcon /> <span>{t("admin.nodes", "Nodos Sensores")}</span>
                    <span className={`submenu-arrow ${nodosSubmenuOpen ? 'rotated' : ''}`}>▾</span>
                  </button>

                  {nodosSubmenuOpen && (
                    <div className="submenu-nav">
                      {canAccess('/admin/nodos') && (<NavLink
                        to={`${baseAdmin}/${language === 'en' ? 'nodes' : 'nodos'}`}
                        end
                        className={({ isActive }) => `submenu-item ${isActive ? 'active' : ''}`}
                        onClick={cerrarMenu}
                      >
                        <NodesIcon /> <span>{t("admin.register_node", "Gestionar Nodos")}</span>
                        <NodesIcon /> <span>{t("admin.register_node", "Gestionar Nodos")}</span>
                      </NavLink>)}

                      {canAccess('/admin/sensores') && (<NavLink
                        to={`${baseAdmin}/${language === 'en' ? 'sensors' : 'sensores'}`}
                      {canAccess('/admin/sensores') && (<NavLink
                        to={`${baseAdmin}/${language === 'en' ? 'sensors' : 'sensores'}`}
                        className={({ isActive }) => `submenu-item ${isActive ? 'active' : ''}`}
                        onClick={cerrarMenu}
                      >
                        <SensorIcon /> <span>{t("admin.sensors", "Gestionar Sensores")}</span>
                        <SensorIcon /> <span>{t("admin.sensors", "Gestionar Sensores")}</span>
                      </NavLink>)}

                      {canAccess('/admin/metricas') && (<NavLink
                        to={`${baseAdmin}/${language === 'en' ? 'metrics' : 'metricas'}`}
                        className={({ isActive }) => `submenu-item ${isActive ? 'active' : ''}`}
                        onClick={cerrarMenu}
                      >
                        <MetricIcon /> <span>{t("admin.metrics", "Métricas / Unidades")}</span>
                      </NavLink>)}

                      {canAccess('/admin/categorias') && (<NavLink
                        to={`${baseAdmin}/${language === 'en' ? 'categories' : 'categorias'}`}
                        className={({ isActive }) => `submenu-item ${isActive ? 'active' : ''}`}
                        onClick={cerrarMenu}
                      >
                        <TagIcon /> <span>{t("admin.categories", "Categorías de Nodos")}</span>
                        <MetricIcon /> <span>{t("admin.metrics", "Métricas / Unidades")}</span>
                      </NavLink>)}

                      {canAccess('/admin/categorias') && (<NavLink
                        to={`${baseAdmin}/${language === 'en' ? 'categories' : 'categorias'}`}
                        className={({ isActive }) => `submenu-item ${isActive ? 'active' : ''}`}
                        onClick={cerrarMenu}
                      >
                        <TagIcon /> <span>{t("admin.categories", "Categorías de Nodos")}</span>
                      </NavLink>)}
                    </div>
                  )}
                </div>)}

              {canAccess('/admin/ubicaciones') && (
                <NavLink to={`${baseAdmin}/${language === 'en' ? 'locations' : 'ubicaciones'}`} className="side-item" onClick={cerrarMenu}>
                  <LocationsIcon /> <span>{t("admin.locations", "Ubicaciones")}</span>
                </NavLink>
              )}

              {(canAccess('/admin/usuarios') || canAccess('/admin/roles') || canAccess('/admin/interfaces')) && (
                <div className={`side-menu-parent ${seguridadSubmenuOpen ? 'expanded' : ''}`}>
                  <button
                    type="button"
                    className={`side-item-btn ${isSeguridadPageActive ? 'active' : ''}`}
                    onClick={() => setSeguridadSubmenuOpen(!seguridadSubmenuOpen)}
                  >
                    <ShieldIcon /> <span>{t("sidebar.security", "Seguridad")}</span>
                    <span className={`submenu-arrow ${seguridadSubmenuOpen ? 'rotated' : ''}`}>▾</span>
                  </button>

                  {seguridadSubmenuOpen && (
                    <div className="submenu-nav">
                      {canAccess('/admin/usuarios') && (<NavLink
                        to={`${baseAdmin}/${language === 'en' ? 'users' : 'usuarios'}`}
                        className={({ isActive }) => `submenu-item ${isActive ? 'active' : ''}`}
                        onClick={cerrarMenu}
                      >
                        <UsersIcon /> <span>{t("admin.users", "Usuarios")}</span>
                      </NavLink>)}

                      {canAccess('/admin/roles') && (<NavLink
                        to={`${baseAdmin}/roles`}
                        className={({ isActive }) => `submenu-item ${isActive ? 'active' : ''}`}
                        onClick={cerrarMenu}
                      >
                        <BadgeIcon /> <span>{t("admin.roles", "Roles")}</span>
                      </NavLink>)}

                      {canAccess('/admin/interfaces') && (<NavLink
                        to={`${baseAdmin}/interfaces`}
                        className={({ isActive }) => `submenu-item ${isActive ? 'active' : ''}`}
                        onClick={cerrarMenu}
                      >
                        <LayoutIcon /> <span>{t("admin.interfaces", "Permisos")}</span>
                      </NavLink>)}
                    </div>
                  )}
                </div>)}

              {canAccess('/admin/noticias') && (
                <NavLink to={`${baseAdmin}/${language === 'en' ? 'news' : 'noticias'}`} className="side-item" onClick={cerrarMenu}>
                  <NewsIcon /> <span>{t("admin.manage_news", "Noticias")}</span>
                </NavLink>
              )}

              {canAccess('/admin/articulos') && (
                <NavLink to={`${baseAdmin}/${language === 'en' ? 'articles' : 'articulos'}`} className="side-item" onClick={cerrarMenu}>
                  <ArticlesIcon /> <span>{t("admin.manage_articles", "Artículos")}</span>
                </NavLink>
              )}

              {canAccess('/admin/notificaciones') && (
                <NavLink to={`${baseAdmin}/${language === 'en' ? 'notifications' : 'notificaciones'}`} className="side-item" onClick={cerrarMenu}>
                  <BellIcon /> <span>{t("admin.notifications", "Notificaciones")}</span>
                </NavLink>
              )}

              <Link to={`/${language}`} className="side-item" onClick={cerrarMenu}>
                <DashboardIcon /> <span>{t("sidebar.public_portal", "Ir al Portal Público")}</span>
              </Link>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <button className="btn-logout" onClick={manejarCerrarSesion}>
            <LogoutIcon /> <span>{t("nav.logout", "Cerrar Sesión")}</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;