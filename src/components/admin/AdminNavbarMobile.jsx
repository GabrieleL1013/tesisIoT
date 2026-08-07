import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logoImagen from '../../assets/LOGO.png';
import { useLanguage } from '../../context/LanguageContext';
import '../../styles/components/admin/AdminNavbarMobile.css';

const MenuIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="24" height="24">
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const BellIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
  </svg>
);

const ChevronDownIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14" style={{ marginLeft: '2px' }}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const AdminNavbarMobile = ({
  abrirMenu,
  toggleMenu,
  user,
  dbUser,
  notificaciones = [],
  unreadAlertsCount = 0,
  totalUnseenCount,
  canAccessNotificaciones = true
}) => {
  const handleMenuClick = abrirMenu || toggleMenu;
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const activeUser = dbUser || user || {};
  const nombreMostrar = activeUser.name || activeUser.nombre || activeUser.email || 'Usuario';
  const emailMostrar = activeUser.email || '';
  const rolMostrar = activeUser.role?.name || activeUser.rol || (activeUser.role_id === 1 ? 'Superusuario' : 'Administrador');

  const rolColor = (rolMostrar === 'Superusuario' || activeUser.role_id === 1) ? '#10b981' : '#3b82f6';
  const totalNotifCount = totalUnseenCount !== undefined
    ? totalUnseenCount
    : ((notificaciones.filter(n => !n.leido).length || 0) + unreadAlertsCount);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="admin-navbar-mobile">
      {/* Botón de tres líneas (izquierda) */}
      <button className="btn-hamburger" onClick={handleMenuClick} aria-label="Abrir menú de navegación">
        <MenuIcon />
      </button>

      {/* Centro del Navbar: Logo e Identidad */}
      <div className="mobile-header-content">
        <div className="logo-admin-flex-mobile">
          <img src={logoImagen} alt="Uleam Logo" />
        </div>
        <span className="role-badge-mobile">Panel Administrativo</span>
      </div>

      {/* Botón de perfil (derecha) */}
      <div className="mobile-profile-container" ref={profileRef}>
        <button
          type="button"
          className="mobile-avatar-btn"
          onClick={() => setProfileOpen(prev => !prev)}
          aria-label="Menú de perfil"
        >
          <div className="mobile-avatar-circle" style={{ background: rolColor, backgroundColor: rolColor }}>
            {nombreMostrar.charAt(0).toUpperCase()}
          </div>
          <ChevronDownIcon />
        </button>

        {profileOpen && (
          <div className="mobile-profile-dropdown">
            <div className="mobile-profile-info-header">
              <span className="mobile-profile-name">{nombreMostrar}</span>
              {emailMostrar && <span className="mobile-profile-email">{emailMostrar}</span>}
              <span className="mobile-profile-role-badge" style={{ color: rolColor, borderColor: rolColor }}>
                {rolMostrar}
              </span>
            </div>

            <div className="mobile-profile-divider"></div>

            <div className="mobile-profile-actions-row">
              {/* Notificaciones */}
              {canAccessNotificaciones && (
                <button
                  type="button"
                  className="mobile-action-btn"
                  onClick={() => {
                    setProfileOpen(false);
                    navigate(language === 'en' ? '/en/admin/notifications' : '/es/admin/notificaciones');
                  }}
                >
                  <BellIcon />
                  <span>Notificaciones</span>
                  {totalNotifCount > 0 && (
                    <span className="mobile-action-badge">{totalNotifCount > 99 ? '99+' : totalNotifCount}</span>
                  )}
                </button>
              )}

              {/* Selector de Idioma */}
              <div className="mobile-lang-switch">
                <button
                  type="button"
                  className={`mobile-lang-chip ${language === 'es' ? 'active' : ''}`}
                  onClick={() => setLanguage('es', navigate)}
                >
                  ES (Español)
                </button>
                <button
                  type="button"
                  className={`mobile-lang-chip ${language === 'en' ? 'active' : ''}`}
                  onClick={() => setLanguage('en', navigate)}
                >
                  EN (English)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminNavbarMobile;