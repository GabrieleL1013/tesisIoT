import { API_BASE_URL } from '../config/api';
import React, { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';
import LogoImg from '../assets/LOGO.png';
import IotLogoImg from '../assets/ULEAM-FONDO.jpg';
import IotBrandLogo from '../assets/IOT-LOGO.png';
import '../styles/Login.css';

// SVG Icons
const ArrowLeftIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16" style={{ marginRight: "6px", display: "inline-block", verticalAlign: "middle" }}>
    <line x1="19" y1="12" x2="5" y2="12"></line>
    <polyline points="12 19 5 12 12 5"></polyline>
  </svg>
);

const EyeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

const EyeOffIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
    <line x1="1" y1="1" x2="23" y2="23"></line>
  </svg>
);

export default function Login() {
  const { login, isLoggedIn } = useAuth();
  const session = localStorage.getItem('iot_sesion_activa') || localStorage.getItem('iot_token_seguro');

  // Si el usuario ya está autenticado, no debe poder ver el formulario de login y se le redirige al panel de administración
  if (session || isLoggedIn) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const handleBackToHome = (e) => {
    e.preventDefault();
    setEmail('');
    setPassword('');
    setTimeout(() => {
      navigate('/');
    }, 50);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!email || !password) {
      Swal.fire({
        title: 'Atención',
        text: 'Por favor, completa todos los campos.',
        icon: 'warning',
        background: '#0b0f19',
        color: '#ffffff',
        confirmButtonColor: '#d0182b'
      });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem('iot_token_seguro', data.access_token);
        localStorage.setItem('iot_sesion_activa', JSON.stringify(data.user));

        Swal.fire({
          title: '¡Acceso Concedido!',
          text: `Bienvenido al Panel, ${data.user.name}`,
          icon: 'success',
          background: '#0b0f19',
          color: '#ffffff',
          confirmButtonColor: '#d0182b',
          timer: 1600,
          timerProgressBar: true,
          showConfirmButton: false
        }).then(() => {
          if (login) {
            login(email, password);
          }
          navigate('/admin/nodos');
          window.location.reload();
        });
      } else {
        Swal.fire({
          title: 'Error de Acceso',
          text: data.message || 'Credenciales inválidas.',
          icon: 'error',
          background: '#0b0f19',
          color: '#ffffff',
          confirmButtonColor: '#d0182b'
        });
      }
    } catch (error) {
      console.error('Error de conexión con la API:', error);
      Swal.fire({
        title: 'Error de Conexión',
        text: 'No se pudo establecer conexión con el servidor. Por favor, verifica tu conexión a internet o intenta más tarde.',
        icon: 'error',
        background: '#0b0f19',
        color: '#ffffff',
        confirmButtonColor: '#d0182b'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-container">
      {/* Left Column: Image & Overlay */}
      <div className="login-image-column" style={{ backgroundImage: `url(${IotLogoImg})` }}>
        <div className="login-image-overlay"></div>
        <div className="login-brand-info">
          <img src={IotBrandLogo} alt="IoT Logo" className="login-brand-logo-img" />
          <div className="login-brand-text-wrapper">
            <h1 className="login-brand-title">INTERNET OF THINGS</h1>
            <div className="login-brand-footer">
              <span className="login-brand-sub">ULEAM</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Form Container */}
      <div className="login-form-column">
        <div className="login-form-wrapper">
          {/* Back button */}
          <button type="button" onClick={handleBackToHome} className="login-back-btn">
            <ArrowLeftIcon /> Volver al Inicio
          </button>

          <div className="login-form-header">
            <h2 className="login-form-title">INICIAR SESIÓN</h2>
            <div className="login-logo-wrapper">
              <img src={LogoImg} alt="Universidad Logo" className="login-assets-logo" />
            </div>
          </div>

          <form onSubmit={handleLogin} className="login-actual-form">
            <div className="login-input-group">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Correo Institucional"
                required
                disabled={loading}
              />
            </div>

            <div className="login-input-group">
              <div className="password-input-wrapper" style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Contraseña"
                  required
                  disabled={loading}
                  style={{ width: "100%", paddingRight: "3rem" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle-btn"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <button type="submit" className="login-submit-action-btn" disabled={loading}>
              {loading ? 'Validando en Base de Datos...' : 'Ingresar al Panel'}
            </button>
          </form>

          <div className="login-form-footer">
            <p>Solo personal de red o de investigación de tesis autorizado.</p>
          </div>
        </div>
      </div>
    </div>
  );
}