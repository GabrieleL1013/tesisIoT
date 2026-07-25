import React from 'react';
// Importamos tu logo
import logoImagen from '../../assets/LOGO.png';
import '../../styles/components/admin/AdminNavbarMobile.css';

// MenuIcon SVG (hamburger lines)
const MenuIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="24" height="24">
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const AdminNavbarMobile = ({ abrirMenu, toggleMenu }) => {
  // Support both property names for robust layout integrations
  const handleMenuClick = abrirMenu || toggleMenu;

  return (
    <div className="admin-navbar-mobile">
      {/* Botón de tres líneas que abre y cierra */}
      <button className="btn-hamburger" onClick={handleMenuClick} aria-label="Abrir menú de navegación">
        <MenuIcon />
      </button>
      
      {/* Centro del Navbar: Identidad visual idéntica a la PC */}
      <div className="mobile-header-content">
        <div className="logo-admin-flex-mobile">
          <img src={logoImagen} alt="Uleam Logo" />
        </div>
        <span className="role-badge-mobile">Panel Administrativo</span>
      </div>

      {/* Espacio vacío a la derecha para que el logo quede perfectamente centrado */}
      <div style={{ width: '40px' }}></div>
    </div>
  );
};

export default AdminNavbarMobile;