import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import '../../styles/pages/admin/Error403.css';

export default function Error403() {
  const { language } = useLanguage();
  return (
    <div className="error403-container">
      <div className="error403-card">
        <div className="error403-icon-wrapper">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="64" height="64">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h1 className="error403-title">Error 403 - Acceso Denegado</h1>
        <p className="error403-text">
          Lo sentimos, no tienes los permisos necesarios para acceder a esta interfaz.
          Comunícate con el Superusuario de tu sistema si crees que esto es un error.
        </p>
        <Link to={`/${language}/admin/dashboard`} className="btn-return-dashboard">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18" style={{ marginRight: '8px' }}>
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Volver al Dashboard
        </Link>
      </div>
    </div>
  );
}
