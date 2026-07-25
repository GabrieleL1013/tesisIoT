import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import logoImagen from '../../assets/LOGO.png'; 
import '../../styles/components/admin/Sidebar.css';

// Custom Inline SVG Icons (no external icon package required)
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
    <path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>
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

const Sidebar = ({ isOpen, cerrarMenu, appInterfaces = [], dbUser, userSession }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const canAccess = (path) => {
    const userRoleId = dbUser?.role_id || dbUser?.role?.id || userSession?.role_id || userSession?.role?.id;
    const userRoleName = dbUser?.role?.name || userSession?.role?.name || userSession?.rol;
    const userLevel = dbUser?.role?.level_permission ?? userSession?.role?.level_permission ?? 1;

    if (userRoleName === 'Superusuario' || userRoleId === 1) return true;
    if (!appInterfaces || appInterfaces.length === 0) return true;

    const iface = appInterfaces.find(i => path.startsWith(i.path));
    if (!iface) return true;

    let allowed = [];
    try {
      allowed = typeof iface.allowed_roles === 'string' ? JSON.parse(iface.allowed_roles) : iface.allowed_roles;
    } catch(e) {}
    
    if (!Array.isArray(allowed)) allowed = [];

    const isRoleAdmitted = allowed.some(item => 
      item === userRoleId || 
      item === String(userRoleId) || 
      item === userRoleName
    );

    const isLevelSufficient = iface.min_level === null || userLevel >= iface.min_level;
    
    return isRoleAdmitted && isLevelSufficient;
  };

  const [nodosSubmenuOpen, setNodosSubmenuOpen] = useState(
    location.pathname.includes('/admin/nodos') || 
    location.pathname.includes('/admin/categorias') ||
    location.pathname.includes('/admin/metricas')
  );

  const [seguridadSubmenuOpen, setSeguridadSubmenuOpen] = useState(
    location.pathname.includes('/admin/usuarios') || 
    location.pathname.includes('/admin/roles') ||
    location.pathname.includes('/admin/interfaces')
  );

  const manejarCerrarSesion = () => {
    // Clear credentials and authentication cookies/localStorage keys
    localStorage.removeItem('iot_token_seguro');
    localStorage.removeItem('iot_sesion_activa');
    localStorage.removeItem('app_user');
    
    // Reset React Context auth state
    logout();
    
    if (cerrarMenu) cerrarMenu(); 
    navigate('/');
  };

  const isNodosPageActive = location.pathname === '/admin/nodos' || 
                            location.pathname === '/admin/categorias' ||
                            location.pathname === '/admin/metricas';

  const isSeguridadPageActive = location.pathname === '/admin/usuarios' || 
                                location.pathname === '/admin/roles' ||
                                location.pathname === '/admin/interfaces';


  const toggleSubmenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setNodosSubmenuOpen(!nodosSubmenuOpen);
  };

  const userRoleId = dbUser?.role_id || dbUser?.role?.id || userSession?.role_id || userSession?.role?.id;
  const userRoleName = dbUser?.role?.name || userSession?.role?.name || userSession?.rol;
  const isSuper = userRoleName === 'Superusuario' || userRoleId === 1;
  const isLoading = !isSuper && (!appInterfaces || appInterfaces.length === 0);

  return (
    <>
      {/* Overlay para cerrar al tocar fuera en móvil */}
      {isOpen && <div className="sidebar-overlay" onClick={cerrarMenu}></div>}

      <aside className={`admin-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <Link to="/admin/dashboard" className="logo-admin-flex" onClick={cerrarMenu}>
            <img src={logoImagen} alt="Uleam Logo" />
          </Link>
          <span className="role-badge">Panel Administrativo</span>
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
              <NavLink to="/admin/dashboard" className="side-item" onClick={cerrarMenu}>
                <DashboardIcon /> <span>Dashboard</span>
              </NavLink>
              )}

          {/* Expandable parent menu item for Telemetria */}
          {(canAccess('/admin/monitor-en-vivo') || canAccess('/admin/historico')) && (
          <div className={`side-menu-parent ${location.pathname.includes('/admin/monitor-en-vivo') || location.pathname.includes('/admin/historico') ? 'expanded' : ''}`}>
            <button 
              type="button" 
              className={`side-item-btn ${location.pathname.includes('/admin/monitor-en-vivo') || location.pathname.includes('/admin/historico') ? 'active' : ''}`}
              onClick={(e) => {
                const parent = e.currentTarget.parentElement;
                parent.classList.toggle('expanded');
              }}
            >
              <MqttIcon /> <span>Telemetría</span>
              <span className={`submenu-arrow ${location.pathname.includes('/admin/monitor-en-vivo') || location.pathname.includes('/admin/historico') ? 'rotated' : ''}`}>▾</span>
            </button>

            <div className="submenu-nav">
              {canAccess('/admin/monitor-en-vivo') && (<NavLink 
                to="/admin/monitor-en-vivo" 
                className={({ isActive }) => `submenu-item ${isActive ? 'active' : ''}`} 
                onClick={cerrarMenu}
              >
                <ActivityIcon /> <span>En Vivo</span>
              </NavLink>)}
              
              {canAccess('/admin/historico') && (<NavLink 
                to="/admin/historico" 
                className={({ isActive }) => `submenu-item ${isActive ? 'active' : ''}`} 
                onClick={cerrarMenu}
              >
                <HistoryIcon /> <span>Histórico Agregado</span>
              </NavLink>)}
            </div>
          </div>)}

          {/* Expandable parent menu item for Nodos Sensores */}
          {(canAccess('/admin/nodos') || canAccess('/admin/categorias') || canAccess('/admin/metricas')) && (
          <div className={`side-menu-parent ${nodosSubmenuOpen ? 'expanded' : ''}`}>
            <button 
              type="button" 
              className={`side-item-btn ${isNodosPageActive ? 'active' : ''}`}
              onClick={() => setNodosSubmenuOpen(!nodosSubmenuOpen)}
            >
              <NodesIcon /> <span>Nodos Sensores</span>
              <span className={`submenu-arrow ${nodosSubmenuOpen ? 'rotated' : ''}`}>▾</span>
            </button>

            {nodosSubmenuOpen && (
              <div className="submenu-nav">
                {canAccess('/admin/nodos') && (<NavLink 
                  to="/admin/nodos" 
                  end 
                  className={({ isActive }) => `submenu-item ${isActive ? 'active' : ''}`} 
                  onClick={cerrarMenu}
                >
                  <AddIcon /> <span>Registrar Nodo</span>
                </NavLink>)}
                
                {canAccess('/admin/categorias') && (<NavLink 
                  to="/admin/categorias" 
                  className={({ isActive }) => `submenu-item ${isActive ? 'active' : ''}`} 
                  onClick={cerrarMenu}
                >
                  <TagIcon /> <span>Categorías de Nodos</span>
                </NavLink>)}

                {canAccess('/admin/metricas') && (<NavLink 
                  to="/admin/metricas" 
                  className={({ isActive }) => `submenu-item ${isActive ? 'active' : ''}`} 
                  onClick={cerrarMenu}
                >
                  <MetricIcon /> <span>Métricas de Nodos</span>
                </NavLink>)}
              </div>
            )}

          </div>)}
          
          {canAccess('/admin/ubicaciones') && (
          <NavLink to="/admin/ubicaciones" className="side-item" onClick={cerrarMenu}>
            <LocationsIcon /> <span>Ubicaciones</span>
          </NavLink>
          )}

          {/* Expandable parent menu item for Seguridad */}
          {(canAccess('/admin/usuarios') || canAccess('/admin/roles') || canAccess('/admin/interfaces')) && (
          <div className={`side-menu-parent ${seguridadSubmenuOpen ? 'expanded' : ''}`}>
            <button 
              type="button" 
              className={`side-item-btn ${isSeguridadPageActive ? 'active' : ''}`}
              onClick={() => setSeguridadSubmenuOpen(!seguridadSubmenuOpen)}
            >
              <ShieldIcon /> <span>Seguridad</span>
              <span className={`submenu-arrow ${seguridadSubmenuOpen ? 'rotated' : ''}`}>▾</span>
            </button>

            {seguridadSubmenuOpen && (
              <div className="submenu-nav">
                {canAccess('/admin/usuarios') && (<NavLink 
                  to="/admin/usuarios" 
                  className={({ isActive }) => `submenu-item ${isActive ? 'active' : ''}`} 
                  onClick={cerrarMenu}
                >
                  <UsersIcon /> <span>Usuarios</span>
                </NavLink>)}
                
                {canAccess('/admin/roles') && (<NavLink 
                  to="/admin/roles" 
                  className={({ isActive }) => `submenu-item ${isActive ? 'active' : ''}`} 
                  onClick={cerrarMenu}
                >
                  <BadgeIcon /> <span>Roles</span>
                </NavLink>)}

                {canAccess('/admin/interfaces') && (<NavLink 
                  to="/admin/interfaces" 
                  className={({ isActive }) => `submenu-item ${isActive ? 'active' : ''}`} 
                  onClick={cerrarMenu}
                >
                  <LayoutIcon /> <span>Interfaces</span>
                </NavLink>)}
              </div>
            )}
          </div>)}

          {canAccess('/admin/noticias') && (
          <NavLink to="/admin/noticias" className="side-item" onClick={cerrarMenu}>
            <NewsIcon /> <span>Noticias</span>
          </NavLink>
          )}

          {canAccess('/admin/articulos') && (
          <NavLink to="/admin/articulos" className="side-item" onClick={cerrarMenu}>
            <ArticlesIcon /> <span>Artículos</span>
          </NavLink>
          )}

          {canAccess('/admin/notificaciones') && (
          <NavLink to="/admin/notificaciones" className="side-item" onClick={cerrarMenu}>
            <BellIcon /> <span>Notificaciones</span>
          </NavLink>
          )}


          <NavLink to="/" className="side-item" onClick={cerrarMenu}>
            <DashboardIcon /> <span>Inicio</span>
          </NavLink>

            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <button className="btn-logout" onClick={manejarCerrarSesion}>
            <LogoutIcon /> <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;