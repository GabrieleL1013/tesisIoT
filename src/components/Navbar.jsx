import { API_BASE_URL, fetchWithAuth, fetchDeduplicated } from "../config/api";
import { useState, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { useInterfaceText } from "../context/InterfaceTextContext";
import { checkEditPermission } from "../utils/checkEditPermission";
import { Link, useNavigate, useLocation } from "react-router-dom";
import LogoImg from "../assets/LOGO.png";
import LogoImg2 from "../assets/LOGO2.png";
import IotLogoImg from "../assets/IOT-LOGO.png";
import "../styles/components/Navbar.css"; 

const ChevronDownIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><polyline points="6 9 12 15 18 9"/></svg>
);
const MenuIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
);
const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
);
const GlobeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z"></path></svg>
);
const LoginIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" className="icon-login"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/></svg>
);
const LogoutIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" className="icon-logout"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
);
const DashboardIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" className="icon-dashboard">
    <rect x="3" y="3" width="7" height="9" />
    <rect x="14" y="3" width="7" height="5" />
    <rect x="14" y="12" width="7" height="9" />
    <rect x="3" y="16" width="7" height="5" />
  </svg>
);

const LANGUAGES = [
  { code: "es", name: "Español (ES)" },
  { code: "en", name: "English (EN)" }
];

export default function Navbar() {
  const { language, setLanguage, t } = useLanguage();
  const { logout, isLoggedIn } = useAuth();
  const { editMode, toggleEditMode } = useInterfaceText();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [sessionUser, setSessionUser] = useState(null);
  const [canEditMode, setCanEditMode] = useState(false);

  const updateCanEditMode = () => {
    checkEditPermission().then(res => setCanEditMode(res));
  };

  const cargarSessionUser = () => {
    if (isLoggedIn) {
      const activeSes = localStorage.getItem('iot_sesion_activa');
      if (activeSes) {
        try {
          const parsed = JSON.parse(activeSes);
          setSessionUser(parsed);

          if (parsed.id) {
            fetchWithAuth(`${API_BASE_URL}/users/${parsed.id}`)
              .then(res => res.json())
              .then(dbUser => {
                if (dbUser && dbUser.name) {
                  setSessionUser(dbUser);
                  const updatedSession = { ...parsed, name: dbUser.name, role: dbUser.role, role_id: dbUser.role_id, email: dbUser.email };
                  localStorage.setItem('iot_sesion_activa', JSON.stringify(updatedSession));
                  updateCanEditMode();
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
    updateCanEditMode();

    const handleProfileUpdate = () => {
      cargarSessionUser();
      updateCanEditMode();
    };

    const handleInterfacesUpdate = () => {
      updateCanEditMode();
    };

    window.addEventListener('userProfileUpdated', handleProfileUpdate);
    window.addEventListener('appInterfacesUpdated', handleInterfacesUpdate);
    return () => {
      window.removeEventListener('userProfileUpdated', handleProfileUpdate);
      window.removeEventListener('appInterfacesUpdated', handleInterfacesUpdate);
    };
  }, [isLoggedIn]);

  const [categoriasDinamicas, setCategoriasDinamicas] = useState([]);

  useEffect(() => {
    const mapSlug = language === "en" ? "categories" : "categorias";
    fetchDeduplicated(`${API_BASE_URL}/categorias?lang=${language}`)
      .then(res => res.json())
      .then(catData => {
        const catList = Array.isArray(catData) ? catData : [];
        if (catList.length > 0) {
          const menuCategorias = {
            label: t("nav.categories", "Categorías"),
            path: `/${language}/${mapSlug}`,
            children: catList.map(cat => ({
              label: cat.nombre,
              path: `/${language}/${mapSlug}?categoria=${encodeURIComponent(cat.nombre)}`
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
  }, [isLoggedIn, language]);

  const mapSlug = language === "en" ? "categories" : "categorias";
  const newsSlug = language === "en" ? "news" : "noticias";
  const articlesSlug = language === "en" ? "articles" : "articulos";
  const aboutSlug = language === "en" ? "software" : "software";
  const contactSlug = language === "en" ? "contact" : "contacto";

  const NAV_ITEMS = [
    { label: t("nav.home", "Inicio"), path: `/${language}` },
    ...(categoriasDinamicas.length > 0 ? categoriasDinamicas : [{ label: t("nav.categories", "Categorías"), path: `/${language}/${mapSlug}` }]),
    { label: t("nav.news", "Noticias"), path: `/${language}/${newsSlug}` },
    { label: t("nav.articles", "Artículos"), path: `/${language}/${articlesSlug}` }, 
    { 
      label: t("nav.about", "Acerca de"), 
      path: `/${language}/${aboutSlug}`,
      children: [
        { label: t("about.title", "¿Quiénes somos?"), path: `/${language}/${aboutSlug}` },
        { label: t("nav.contact", "Contacto"), path: `/${language}/${contactSlug}` }
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
      setOpenDropdown(null);
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [mobileOpen]);

  const handleLogoutClick = () => {
    localStorage.removeItem('iot_sesion_activa');
    logout();
    navigate(`/${language}`);
    window.location.reload();
  };

  const isItemActive = (item) => {
    const currentPath = location.pathname;
    const currentSearch = location.search;
    const currentUrl = currentPath + currentSearch;
    
    if (item.path === `/${language}`) {
      return currentPath === `/${language}` || currentPath === `/${language}/`;
    }
    if (item.children && item.children.length > 0) {
      return item.children.some((child) => {
        try {
          return decodeURIComponent(currentUrl) === decodeURIComponent(child.path);
        } catch(e) {
          return currentUrl === child.path;
        }
      });
    }
    return currentUrl === item.path;
  };

  const isChildActive = (childPath) => {
    const currentUrl = location.pathname + location.search;
    try {
      return decodeURIComponent(currentUrl) === decodeURIComponent(childPath);
    } catch(e) {
      return currentUrl === childPath;
    }
  };

  return (
    <>
      <nav className={`nav-main ${scrolled ? "nav-scrolled" : ""}`}>
        <div className="nav-container">
          {/* Mobile Hamburger Button (Left Side) */}
          <button 
            onClick={() => setMobileOpen(!mobileOpen)} 
            className="nav-hamburger mobile-only"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <CloseIcon /> : <MenuIcon />}
          </button>

          <Link to={`/${language}`} className="nav-logo" aria-label="Ir a Inicio ULEAM IoT">
            <div className="nav-logo-uleam-wrapper">
              <img
                src={LogoImg}
                alt="Universidad Laica Eloy Alfaro de Manabí"
                className="nav-logo-img-uleam"
              />
            </div>
            <span className="nav-logo-divider" aria-hidden="true" />
            <div className="nav-logo-iot-wrapper">
              <img
                src={IotLogoImg}
                alt="Proyecto IoT ULEAM"
                className="nav-logo-img-iot"
              />
            </div>
          </Link>

          <div className="nav-desktop-links">
            {NAV_ITEMS.map((item) => (
              <div
                key={item.label}
                className="nav-item-wrapper"
                onClick={(e) => {
                  if (item.children) {
                    e.stopPropagation();
                    setOpenDropdown(openDropdown === item.label ? null : item.label);
                  }
                }}
              >
                {item.children ? (
                  <button
                    type="button"
                    className={`nav-link ${isItemActive(item) ? "active" : ""} ${openDropdown === item.label ? "dropdown-open" : ""}`}
                  >
                    <span>{item.label}</span>
                    <ChevronDownIcon className={openDropdown === item.label ? "rotated" : ""} />
                  </button>
                ) : (
                  <Link
                    to={item.path}
                    className={`nav-link ${isItemActive(item) ? "active" : ""}`}
                  >
                    <span>{item.label}</span>
                  </Link>
                )}
                
                {item.children && openDropdown === item.label && (
                  <div className="nav-dropdown">
                    {item.children.map((child) => (
                      <Link 
                        key={child.label} 
                        to={child.path} 
                        onClick={() => setOpenDropdown(null)}
                        className={`nav-dropdown-link ${isChildActive(child.path) ? "active" : ""}`}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="nav-actions">
            {/* Desktop Lang Selector */}
            <div className="nav-lang-selector desktop-only" onClick={(e) => e.stopPropagation()}>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowProfileMenu(false);
                  setShowLangDropdown((prev) => !prev);
                }} 
                className="nav-btn-lang"
              >
                <GlobeIcon />
                <span className="nav-btn-text">
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

            {isLoggedIn && sessionUser ? (
              <div className="nav-profile-container desktop-only" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowLangDropdown(false);
                    setShowProfileMenu((prev) => !prev);
                  }}
                  className="nav-profile-badge"
                >
                  <div className="nav-profile-avatar notranslate" translate="no">
                    {sessionUser.name.charAt(0).toUpperCase()}
                  </div>
                  <ChevronDownIcon className={`nav-profile-chevron ${showProfileMenu ? 'open' : ''}`} />
                </button>

                {showProfileMenu && (
                  <div className="nav-profile-dropdown-menu">
                    <div className="nav-profile-dropdown-header">
                      <span className="nav-profile-dropdown-title">{t("nav.my_account", "Mi Cuenta")}</span>
                      <span className="nav-profile-dropdown-name notranslate" translate="no">{sessionUser.name}</span>
                      <span className="nav-profile-dropdown-email notranslate" translate="no">{sessionUser.email}</span>
                    </div>
                    
                    <Link
                      to={`/${language}/admin/dashboard`}
                      onClick={() => setShowProfileMenu(false)}
                      className="nav-profile-dropdown-item"
                    >
                      <DashboardIcon />
                      {t("nav.admin", "Panel Admin")}
                    </Link>

                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        handleLogoutClick();
                      }}
                      className="nav-profile-dropdown-item logout"
                    >
                      <LogoutIcon />
                      {t("nav.logout", "Cerrar Sesión")}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={() => navigate(`/${language}/login`)} className="nav-btn-access desktop-only">
                <LoginIcon />
                <span className="nav-btn-text">
                  {t("nav.login", "Acceso")}
                </span>
              </button>
            )}

            {canEditMode && (
              <button 
                onClick={toggleEditMode}
                className="nav-edit-mode-text-only-btn desktop-only"
              >
                <span>{t("nav.edit_mode", "Modo Edición")}</span>
                <svg viewBox="0 0 38 22" width="28" height="16" fill="none">
                  <rect 
                    x="1" 
                    y="1" 
                    width="36" 
                    height="20" 
                    rx="10" 
                    fill={editMode ? '#94C11F' : 'rgba(255, 255, 255, 0.15)'} 
                    stroke={editMode ? '#94C11F' : 'rgba(255, 255, 255, 0.4)'} 
                    strokeWidth="1.5" 
                  />
                  <circle 
                    cx={editMode ? '27' : '11'} 
                    cy="11" 
                    r="6" 
                    fill="#ffffff" 
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* ── MOBILE SIDEBAR DRAWER (SLIDE ANIMATED FROM LEFT TO RIGHT) ── */}
        <div 
          className={`nav-mobile-overlay ${mobileOpen ? "open" : ""}`}
          onClick={() => setMobileOpen(false)}
        >
          <div 
            className="nav-mobile-drawer" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Sidebar */}
            <div className="nav-mobile-drawer-header">
              <span className="nav-mobile-drawer-title">IoT ULEAM</span>
              <button 
                type="button" 
                className="nav-mobile-close-btn"
                onClick={() => setMobileOpen(false)}
              >
                <CloseIcon />
              </button>
            </div>

            {/* Ítems del Menú Navegación */}
            <div className="nav-mobile-scrollable">
              {NAV_ITEMS.map((item) => (
                <div key={item.label} className="nav-mobile-item">
                  {item.children ? (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenDropdown(openDropdown === item.label ? null : item.label);
                        }}
                        className={`nav-mobile-btn ${isItemActive(item) ? "active" : ""} ${openDropdown === item.label ? "dropdown-open" : ""}`}
                      >
                        {item.label} <ChevronDownIcon className={openDropdown === item.label ? "rotated" : ""} />
                      </button>
                      {openDropdown === item.label && (
                        <div className="nav-mobile-dropdown">
                          {item.children.map((child) => (
                            <Link 
                              key={child.label} 
                              to={child.path} 
                              onClick={() => {
                                setMobileOpen(false);
                                setOpenDropdown(null);
                              }}
                              className={`nav-mobile-dropdown-link ${isChildActive(child.path) ? "active" : ""}`}
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
                      onClick={() => setMobileOpen(false)}
                      className={`nav-mobile-btn ${isItemActive(item) ? "active" : ""}`}
                    >
                      {item.label}
                    </Link>
                  )}
                </div>
              ))}

              {/* Panel Admin debajo de "Acerca de" con Avatar inicial (A) */}
              {isLoggedIn && sessionUser && (
                <div className="nav-mobile-item">
                  <Link
                    to={`/${language}/admin/dashboard`}
                    onClick={() => setMobileOpen(false)}
                    className="nav-mobile-btn nav-mobile-admin-btn"
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      <div className="nav-profile-avatar notranslate" translate="no" style={{ width: '22px', height: '22px', fontSize: '0.72rem' }}>
                        {sessionUser.name ? sessionUser.name.charAt(0).toUpperCase() : 'A'}
                      </div>
                      {t("nav.admin", "Panel Admin")}
                    </span>
                    <DashboardIcon />
                  </Link>
                </div>
              )}

              {/* Modo Edición debajo de Panel Admin */}
              {canEditMode && (
                <div className="nav-mobile-item">
                  <button 
                    type="button"
                    onClick={() => {
                      if (!editMode) {
                        toggleEditMode();
                        setMobileOpen(false);
                      } else {
                        toggleEditMode();
                      }
                    }}
                    className="nav-mobile-btn"
                    style={{ justifyContent: 'space-between' }}
                  >
                    <span>{t("nav.edit_mode", "Modo edición")}</span>
                    <svg viewBox="0 0 38 22" width="26" height="15" fill="none">
                      <rect 
                        x="1" 
                        y="1" 
                        width="36" 
                        height="20" 
                        rx="10" 
                        fill={editMode ? '#94C11F' : 'rgba(255, 255, 255, 0.15)'} 
                        stroke={editMode ? '#94C11F' : 'rgba(255, 255, 255, 0.4)'} 
                        strokeWidth="1.5" 
                      />
                      <circle 
                        cx={editMode ? '27' : '11'} 
                        cy="11" 
                        r="6" 
                        fill="#ffffff" 
                      />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* Footer del Sidebar con Selector de Idioma y Cerrar Sesión */}
            <div className="nav-mobile-fixed-bottom">
              {/* Selector Español / Inglés arriba de Cerrar Sesión */}
              <div className="nav-mobile-lang-selector">
                <button
                  type="button"
                  className={`nav-mobile-lang-opt ${language === 'es' ? 'active' : ''}`}
                  onClick={() => setLanguage('es')}
                >
                  Español
                </button>
                <span className="nav-mobile-lang-sep">|</span>
                <button
                  type="button"
                  className={`nav-mobile-lang-opt ${language === 'en' ? 'active' : ''}`}
                  onClick={() => setLanguage('en')}
                >
                  English
                </button>
              </div>

              {/* Cerrar Sesión con Texto e Ícono */}
              {isLoggedIn ? (
                <button 
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    handleLogoutClick();
                  }} 
                  className="nav-mobile-logout-btn"
                >
                  <span>{t("nav.logout", "Cerrar sesión")}</span>
                  <LogoutIcon />
                </button>
              ) : (
                <button 
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    navigate(`/${language}/login`);
                  }} 
                  className="nav-mobile-logout-btn"
                >
                  <span>{t("nav.login", "Acceso")}</span>
                  <LoginIcon />
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}