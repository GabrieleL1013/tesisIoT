import { useState, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { useInterfaceText } from "../context/InterfaceTextContext";
import { Link, useNavigate } from "react-router-dom"; // ── USAMOS LINK PARA CONECTAR LAS VISTAS ──
import LogoImg from "../assets/LOGO.png";
import IotLogoImg from "../assets/IOT-LOGO.png";
import "../styles/components/Navbar.css"; 

// ── Iconos SVG originales como componentes locales ──
const ChevronDownIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14" style={{ marginLeft: "4px", display: "inline-block", verticalAlign: "middle" }}><polyline points="6 9 12 15 18 9"/></svg>
);
const MenuIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
);
const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
);
const GlobeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" style={{ display: "inline-block", verticalAlign: "middle" }}><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
);
const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" style={{ display: "inline-block", verticalAlign: "middle" }}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
);
const LoginIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" className="icon-login" style={{ display: "inline-block", verticalAlign: "middle" }}><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/></svg>
);
const LogoutIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" className="icon-logout" style={{ display: "inline-block", verticalAlign: "middle" }}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
);
const DashboardIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" className="icon-dashboard" style={{ display: "inline-block", verticalAlign: "middle" }}>
    <rect x="3" y="3" width="7" height="9" />
    <rect x="14" y="3" width="7" height="5" />
    <rect x="14" y="12" width="7" height="9" />
    <rect x="3" y="16" width="7" height="5" />
  </svg>
);

const LANGUAGES = [
  { code: "es", name: "Español (ES)" },
  { code: "en", name: "English (EN)" },
  { code: "fr", name: "Français (FR)" },
  { code: "pt", name: "Português (PT)" },
  { code: "it", name: "Italiano (IT)" },
  { code: "de", name: "Deutsch (DE)" },
  { code: "zh-CN", name: "Chino (ZH)" }
];

export default function Navbar() {
  const { language, setLanguage } = useLanguage();
  const { user, login, logout, isLoggedIn } = useAuth();
  const { editMode, toggleEditMode } = useInterfaceText();
  const navigate = useNavigate();
  
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [activeItem, setActiveItem] = useState("Inicio");
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [sessionUser, setSessionUser] = useState(null);
  const [appInterfaces, setAppInterfaces] = useState([]);

  const cargarInterfaces = () => {
    fetch('http://127.0.0.1:8000/api/interfaces')
      .then(res => res.json())
      .then(data => setAppInterfaces(Array.isArray(data) ? data : []))
      .catch(err => console.error("Error fetching interfaces in Navbar:", err));
  };

  const cargarSessionUser = () => {
    if (isLoggedIn) {
      const activeSes = localStorage.getItem('iot_sesion_activa');
      if (activeSes) {
        try {
          const parsed = JSON.parse(activeSes);
          setSessionUser(parsed);

          if (parsed.id) {
            fetch(`http://127.0.0.1:8000/api/users/${parsed.id}`)
              .then(res => res.json())
              .then(dbUser => {
                if (dbUser && dbUser.name) {
                  setSessionUser(dbUser);
                  const updatedSession = { ...parsed, name: dbUser.name, role: dbUser.role, role_id: dbUser.role_id, email: dbUser.email };
                  localStorage.setItem('iot_sesion_activa', JSON.stringify(updatedSession));
                }
              })
              .catch(err => {
                console.error("Error fetching live user data:", err);
              });
          }
        } catch (e) {
          setSessionUser(null);
        }
      }
    } else {
      setSessionUser(null);
    }
  };

  useEffect(() => {
    cargarSessionUser();
    cargarInterfaces();

    window.addEventListener('userProfileUpdated', cargarSessionUser);
    window.addEventListener('appInterfacesUpdated', cargarInterfaces);
    return () => {
      window.removeEventListener('userProfileUpdated', cargarSessionUser);
      window.removeEventListener('appInterfacesUpdated', cargarInterfaces);
    };
  }, [isLoggedIn]);

  const canAccessEditMode = () => {
    if (!isLoggedIn || !sessionUser) return false;

    const userRoleId = sessionUser?.role_id || sessionUser?.role?.id;
    const userRoleName = sessionUser?.role?.name || sessionUser?.rol;
    const userLevel = sessionUser?.role?.level_permission ?? 1;

    if (userRoleName === 'Superusuario' || userRoleId === 1) return true;

    const editModeIface = appInterfaces.find(i => i.path === '/modo-edicion');
    if (!editModeIface) return false;

    let allowed = [];
    try {
      allowed = typeof editModeIface.allowed_roles === 'string'
        ? JSON.parse(editModeIface.allowed_roles)
        : editModeIface.allowed_roles;
    } catch (e) {}

    if (!Array.isArray(allowed)) allowed = [];

    const isRoleAdmitted = allowed.some(item =>
      item === userRoleId ||
      item === String(userRoleId) ||
      item === userRoleName
    );

    const isLevelSufficient = editModeIface.min_level === null || userLevel >= editModeIface.min_level;

    return isRoleAdmitted && isLevelSufficient;
  };
  const [categoriasDinamicas, setCategoriasDinamicas] = useState([]);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/categorias')
      .then(res => res.json())
      .then(catData => {
        const catList = Array.isArray(catData) ? catData : [];
        if (catList.length > 0) {
          const menuCategorias = {
            label: "Categorías",
            path: "/mapa-tiempo-real",
            children: catList.map(cat => ({
              label: cat.nombre,
              path: `/mapa-tiempo-real?categoria=${encodeURIComponent(cat.nombre)}`
            }))
          };
          setCategoriasDinamicas([menuCategorias]);
        } else {
          setCategoriasDinamicas([]);
        }
      })
      .catch(err => {
        console.error("Error fetching categories in Navbar:", err);
        setCategoriasDinamicas([]);
      });
  }, [isLoggedIn]);

  const NAV_ITEMS = [
    { label: "Inicio", path: "/" },
    ...(categoriasDinamicas.length > 0 ? categoriasDinamicas : [{ label: "Categorías", path: "/mapa-tiempo-real" }]),
    { label: "Noticias", path: "/noticias" },
    { label: "Artículos", path: "/articulos" }, 
    { 
      label: "Acerca de", 
      children: [
        { label: "¿Quiénes somos?", path: "/acerca-de" },
        { label: "Contacto", path: "/contacto" }
      ] 
    },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handleOutsideClick = () => {
      setShowLangDropdown(false);
      setShowProfileMenu(false);
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);



  const handleLogoutClick = () => {
    localStorage.removeItem('iot_sesion_activa');
    logout();
    navigate("/");
    window.location.reload();
  };

  return (
    <>
      <nav className={`nav-main ${scrolled ? "nav-scrolled" : ""}`}>
        <div className="nav-container">
          {/* Brand/Logo */}
          <Link to="/" className="nav-logo" onClick={() => setActiveItem("Inicio")}>
            <img src={LogoImg} alt="Universidad Logo" className="nav-logo-img" />
            <img src={IotLogoImg} alt="IOT Logo" className="nav-logo-img-secondary" />
          </Link>

          {/* Desktop Links */}
          <div className="nav-desktop-links">
            {NAV_ITEMS.map((item) => (
              <div
                key={item.label}
                className="nav-item-wrapper"
                onMouseEnter={() => item.children && setOpenDropdown(item.label)}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                {item.children ? (
                  <Link
                    to={item.path || "#"}
                    onClick={() => {
                      setActiveItem(item.label);
                      setOpenDropdown(null);
                    }}
                    className={`nav-link ${openDropdown === item.label ? "active" : ""}`}
                    style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
                  >
                    {item.label} <ChevronDownIcon />
                  </Link>
                ) : (
                  <Link
                    to={item.path}
                    onClick={() => setActiveItem(item.label)}
                    className={`nav-link ${activeItem === item.label ? "active" : ""}`}
                  >
                    {item.label}
                  </Link>
                )}
                
                {item.children && openDropdown === item.label && (
                  <div className="nav-dropdown">
                    {item.children.map((child) => (
                      <Link 
                        key={child.label} 
                        to={child.path} 
                        onClick={() => {
                          setActiveItem(item.label);
                          setOpenDropdown(null);
                        }}
                        className="nav-dropdown-link"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Actions / Hamburger */}
          <div className="nav-actions">
            
            {/* Language Selector Dropdown */}
            <div className="nav-lang-selector" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setShowLangDropdown(!showLangDropdown)} className="nav-btn-lang">
                <GlobeIcon />
                <span className="nav-btn-text" style={{ marginLeft: "6px" }}>
                  {LANGUAGES.find((l) => l.code === language)?.name || "Español"}
                </span>
                <ChevronDownIcon className="nav-btn-chevron" />
              </button>
              {showLangDropdown && (
                <div className="nav-lang-dropdown">
                  {LANGUAGES.filter((l) => l.code !== language).map((l) => (
                    <button
                      key={l.code}
                      onClick={() => {
                        setLanguage(l.code);
                        setShowLangDropdown(false);
                      }}
                      className="nav-lang-dropdown-item"
                    >
                      {l.name}
                    </button>
                  ))}
                </div>
              )}
            </div>


            {/* Perfil de Usuario con Menú Desplegable o Botón de Acceso */}
            {isLoggedIn && sessionUser ? (
              <div className="nav-profile-container" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="nav-profile-badge"
                >
                  <div className="nav-profile-avatar">
                    {sessionUser.name.charAt(0).toUpperCase()}
                  </div>
                  <ChevronDownIcon className={`nav-profile-chevron ${showProfileMenu ? 'open' : ''}`} />
                </button>

                {showProfileMenu && (
                  <div className="nav-profile-dropdown-menu">
                    <div className="nav-profile-dropdown-header">
                      <span className="nav-profile-dropdown-title">Mi Cuenta</span>
                      <span className="nav-profile-dropdown-name">{sessionUser.name}</span>
                      <span className="nav-profile-dropdown-email">{sessionUser.email}</span>
                      <span className={`nav-profile-dropdown-role-badge ${sessionUser.rol === 'Superusuario' ? 'superadmin' : ''}`}>
                        {sessionUser.rol}
                      </span>
                    </div>
                    
                    <Link
                      to="/admin/dashboard"
                      onClick={() => setShowProfileMenu(false)}
                      className="nav-profile-dropdown-item"
                    >
                      <DashboardIcon />
                      Ir al Panel
                    </Link>

                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        handleLogoutClick();
                      }}
                      className="nav-profile-dropdown-item logout"
                    >
                      <LogoutIcon />
                      Cerrar Sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={() => navigate("/login")} className="nav-btn-access">
                <LoginIcon />
                <span className="nav-btn-text" style={{ marginLeft: "6px" }}>
                  Acceso
                </span>
              </button>
            )}

            {/* Botón de alternancia de Modo Edición (Configurable mediante Gestión de Interfaces) */}
            {canAccessEditMode() && (
              <button 
                onClick={toggleEditMode}
                className="nav-edit-mode-text-only-btn"
                style={{
                  marginLeft: '20px',
                  marginRight: '0px',
                  background: 'none',
                  border: 'none',
                  color: editMode ? '#62ffb1' : 'rgba(255, 255, 255, 0.75)',
                  fontSize: '0.88rem',
                  fontWeight: '750',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 0',
                  transition: 'all 0.2s ease',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  outline: 'none'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = editMode ? '#62ffb1' : '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = editMode ? '#62ffb1' : 'rgba(255, 255, 255, 0.75)';
                }}
              >
                <span>Modo Edición</span>
                <svg viewBox="0 0 38 22" width="28" height="16" fill="none" style={{ verticalAlign: 'middle' }}>
                  <rect 
                    x="1" 
                    y="1" 
                    width="36" 
                    height="20" 
                    rx="10" 
                    fill={editMode ? '#62ffb1' : 'rgba(255, 255, 255, 0.15)'} 
                    stroke={editMode ? '#62ffb1' : 'rgba(255, 255, 255, 0.4)'} 
                    strokeWidth="1.5" 
                    style={{ transition: 'all 0.25s ease' }}
                  />
                  <circle 
                    cx={editMode ? '27' : '11'} 
                    cy="11" 
                    r="6" 
                    fill="#ffffff" 
                    style={{ transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)' }}
                  />
                </svg>
              </button>
            )}

            <button onClick={() => setMobileOpen(!mobileOpen)} className="nav-hamburger">
              {mobileOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="nav-mobile-menu">
            {NAV_ITEMS.map((item) => (
              <div key={item.label} className="nav-mobile-item">
                {item.children ? (
                  <>
                    <button
                      onClick={() => setOpenDropdown(openDropdown === item.label ? null : item.label)}
                      className={`nav-mobile-btn ${activeItem === item.label ? "active" : ""}`}
                    >
                      {item.label} <ChevronDownIcon />
                    </button>
                    {openDropdown === item.label && (
                      <div className="nav-mobile-dropdown">
                        {item.path && (
                          <Link 
                            to={item.path} 
                            onClick={() => {
                              setActiveItem(item.label);
                              setMobileOpen(false);
                              setOpenDropdown(null);
                            }}
                            className="nav-mobile-dropdown-link"
                            style={{ fontWeight: '800', borderBottom: '1px dashed #e2e8f0', paddingBottom: '8px', marginBottom: '4px' }}
                          >
                            Ver Todo ({item.label})
                          </Link>
                        )}
                        {item.children.map((child) => (
                          <Link 
                            key={child.label} 
                            to={child.path} 
                            onClick={() => {
                              setActiveItem(item.label);
                              setMobileOpen(false);
                              setOpenDropdown(null);
                            }}
                            className="nav-mobile-dropdown-link"
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    to={item.path}
                    onClick={() => {
                      setActiveItem(item.label);
                      setMobileOpen(false);
                    }}
                    className={`nav-mobile-btn ${activeItem === item.label ? "active" : ""}`}
                  >
                    {item.label}
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </nav>
    </>
  );
}