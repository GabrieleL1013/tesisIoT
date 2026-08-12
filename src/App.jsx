import React, { useEffect, lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation, useParams, useNavigationType } from "react-router-dom";
import i18n from "./i18n";
import { LanguageProvider, useLanguage } from "./context/LanguageContext";
import { AuthProvider } from "./context/AuthContext";
import { InterfaceTextProvider, useInterfaceText } from "./context/InterfaceTextContext";
import { InterfaceImageProvider } from "./context/InterfaceImageContext";
import { getUrlLanguage } from "./utils/routeMapping";
import "./App.css";

import Inicio from "./pages/Inicio";
import Navbar from "../src/components/Navbar";
import Footer from "../src/components/Footer";
import IotTicker from "./components/IotTicker";

// Code Splitting (Lazy Loading) para evitar cargar scripts de administracion u otras paginas innecesarias en la pagina de Inicio
const VisualizarMapa = lazy(() => import("./pages/VisualizarMapa"));
const VisualizarHistorico = lazy(() => import("./pages/VisualizarHistorico"));
const Login = lazy(() => import("./pages/Login"));
const NoticiasPublicas = lazy(() => import("./pages/NoticiasPublicas"));
const ArticulosPublicos = lazy(() => import("./pages/ArticulosPublicos"));
const AcercaDe = lazy(() => import("./pages/AcercaDe"));
const Contacto = lazy(() => import("./pages/Contacto"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Interfaces de Administrador cargadas bajo demanda
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const RegistrarNodo = lazy(() => import("./pages/admin/RegistrarNodo"));
const GestionarSensores = lazy(() => import("./pages/admin/GestionarSensores"));
const GestionarCategorias = lazy(() => import("./pages/admin/GestionarCategorias"));
const GestionarMetricas = lazy(() => import("./pages/admin/GestionarMetricas"));
const GestionarUbicaciones = lazy(() => import("./pages/admin/GestionarUbicaciones"));
const GestionarUsuarios = lazy(() => import("./pages/admin/GestionarUsuarios"));
const GestionarRoles = lazy(() => import("./pages/admin/GestionarRoles"));
const GestionarInterfaces = lazy(() => import("./pages/admin/GestionarInterfaces"));
const GestionarNoticias = lazy(() => import("./pages/admin/GestionarNoticias"));
const GestionarArticulos = lazy(() => import("./pages/admin/GestionarArticulos"));
const MonitorEnVivo = lazy(() => import("./pages/admin/MonitorEnVivo"));
const HistoricoAgregado = lazy(() => import("./pages/admin/HistoricoAgregado"));
const Notificaciones = lazy(() => import("./pages/admin/Notificaciones"));
const Error403 = lazy(() => import("./pages/admin/Error403"));
const AdminLayout = lazy(() => import("./components/admin/AdminLayout"));

// Componente helper para validación y sincronización de idioma en la URL
function LanguageRouteSync() {
  const { lang } = useParams();
  const location = useLocation();
  const { refreshTexts } = useInterfaceText();

  useEffect(() => {
    const activeLang = (lang === "es" || lang === "en") ? lang : getUrlLanguage(location.pathname);
    if (i18n.language !== activeLang) {
      i18n.changeLanguage(activeLang);
      document.documentElement.setAttribute("lang", activeLang);
    }
    if (refreshTexts) {
      refreshTexts(true);
    }
  }, [lang, location.pathname]);

  return <Outlet />;
}

// Redirección para rutas raíz o no localizadas
function RedirectToLocalizedRoute() {
  const { language } = useLanguage();
  const location = useLocation();
  const currentLang = getUrlLanguage(location.pathname) || language || 'es';
  const pathname = location.pathname;

  if (pathname === "/") {
    return <Navigate to={`/${currentLang}`} replace />;
  }

  if (pathname === "/login") {
    return <Navigate to={`/${currentLang}/login`} replace />;
  }

  return <Navigate to={`/${currentLang}/404`} replace />;
}

function ScrollToTop() {
  const location = useLocation();
  const navType = useNavigationType();

  // Permite la gestión manual de la posición de scroll
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  // Guarda continuamente la posición del scroll antes de cambiar de página
  useEffect(() => {
    const handleScroll = () => {
      if (location.key) {
        sessionStorage.setItem(`scroll_pos_${location.key}`, window.scrollY.toString());
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.key]);

  useEffect(() => {
    // Si la navegación es retroceder/avanzar en la flecha del navegador ("POP")
    if (navType === 'POP') {
      const savedPos = location.key ? sessionStorage.getItem(`scroll_pos_${location.key}`) : null;
      if (savedPos !== null) {
        const y = parseInt(savedPos, 10);
        setTimeout(() => {
          window.scrollTo(0, y);
        }, 60);
      }
    } else {
      // Si se hizo clic explícito en un enlace/menú ("PUSH" o "REPLACE"), se reinicia arriba
      window.scrollTo(0, 0);
      if (document.documentElement) document.documentElement.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;
    }
  }, [location.pathname, location.key, navType]);

  return null;
}

const PublicLayout = () => {
  const { loading: textsLoading } = useInterfaceText();
  const { language } = useLanguage();
  const loadingText = language === "en" ? "LOADING..." : "CARGANDO...";

  return (
    <>
      <Navbar />
      {textsLoading ? (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 40,
          backgroundColor: '#f9fafb',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: '85px'
        }}>
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes custom-spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}} />
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            border: '4px solid transparent',
            borderTopColor: '#dc2626',
            borderBottomColor: '#dc2626',
            animation: 'custom-spin 1s linear infinite',
            marginBottom: '16px'
          }}></div>
          <p style={{
            color: '#334155',
            fontWeight: 'bold',
            fontFamily: 'sans-serif',
            letterSpacing: '0.1em',
            fontSize: '1.125rem'
          }}>
            {loadingText}
          </p>
        </div>
      ) : (
        <>
          <div className="min-h-screen bg-gray-50 pb-8 main-content-wrapper">
            <Outlet />
          </div>
          <IotTicker />
          <Footer />
        </>
      )}
    </>
  );
};

export default function App() {
  return (
    <Router>
      <LanguageProvider>
        <AuthProvider>
          <InterfaceTextProvider>
            <InterfaceImageProvider>
              <ScrollToTop />
              <Suspense fallback={null}>
                <Routes>

                  {/* ── RUTAS EXCLUSIVAS EN ESPAÑOL (/es) ── */}
                  <Route path="/es" element={<LanguageRouteSync />}>
                    <Route path="login" element={<Login />} />
                    <Route path="404" element={<NotFound />} />

                    {/* Panel Admin en Español */}
                    <Route path="admin" element={<AdminLayout />}>
                      <Route index element={<Navigate to="dashboard" replace />} />
                      <Route path="dashboard" element={<Dashboard />} />
                      <Route path="nodos" element={<RegistrarNodo />} />
                      <Route path="sensores" element={<GestionarSensores />} />
                      <Route path="metricas" element={<GestionarMetricas />} />
                      <Route path="categorias" element={<GestionarCategorias />} />
                      <Route path="ubicaciones" element={<GestionarUbicaciones />} />
                      <Route path="usuarios" element={<GestionarUsuarios />} />
                      <Route path="roles" element={<GestionarRoles />} />
                      <Route path="interfaces" element={<GestionarInterfaces />} />
                      <Route path="noticias" element={<GestionarNoticias />} />
                      <Route path="articulos" element={<GestionarArticulos />} />
                      <Route path="monitor-en-vivo" element={<MonitorEnVivo />} />
                      <Route path="historico" element={<HistoricoAgregado />} />
                      <Route path="notificaciones" element={<Notificaciones />} />
                      <Route path="403" element={<Error403 />} />
                      <Route path="*" element={<NotFound />} />
                    </Route>

                    {/* Portal Público en Español */}
                    <Route element={<PublicLayout />}>
                      <Route index element={<Inicio />} />
                      <Route path="categorias" element={<VisualizarMapa />} />
                      <Route path="category" element={<Navigate to="/es/categorias" replace />} />
                      <Route path="analisis-historico" element={<VisualizarHistorico />} />
                      <Route path="noticias" element={<NoticiasPublicas />} />
                      <Route path="articulos" element={<ArticulosPublicos />} />
                      <Route path="software" element={<AcercaDe />} />
                      <Route path="contacto" element={<Contacto />} />
                    </Route>

                    {/* 404 fuera de PublicLayout */}
                    <Route path="*" element={<NotFound />} />
                  </Route>

                  {/* ── RUTAS EXCLUSIVAS EN INGLÉS (/en) ── */}
                  <Route path="/en" element={<LanguageRouteSync />}>
                    <Route path="login" element={<Login />} />
                    <Route path="404" element={<NotFound />} />

                    {/* Panel Admin en Inglés */}
                    <Route path="admin" element={<AdminLayout />}>
                      <Route index element={<Navigate to="dashboard" replace />} />
                      <Route path="dashboard" element={<Dashboard />} />
                      <Route path="nodes" element={<RegistrarNodo />} />
                      <Route path="sensors" element={<GestionarSensores />} />
                      <Route path="metrics" element={<GestionarMetricas />} />
                      <Route path="categories" element={<GestionarCategorias />} />
                      <Route path="locations" element={<GestionarUbicaciones />} />
                      <Route path="users" element={<GestionarUsuarios />} />
                      <Route path="roles" element={<GestionarRoles />} />
                      <Route path="interfaces" element={<GestionarInterfaces />} />
                      <Route path="news" element={<GestionarNoticias />} />
                      <Route path="articles" element={<GestionarArticulos />} />
                      <Route path="live-monitor" element={<MonitorEnVivo />} />
                      <Route path="history" element={<HistoricoAgregado />} />
                      <Route path="notifications" element={<Notificaciones />} />
                      <Route path="403" element={<Error403 />} />
                      <Route path="*" element={<NotFound />} />
                    </Route>

                    {/* Portal Público en Inglés */}
                    <Route element={<PublicLayout />}>
                      <Route index element={<Inicio />} />
                      <Route path="categories" element={<VisualizarMapa />} />
                      <Route path="category" element={<Navigate to="/en/categories" replace />} />
                      <Route path="historical-analysis" element={<VisualizarHistorico />} />
                      <Route path="news" element={<NoticiasPublicas />} />
                      <Route path="articles" element={<ArticulosPublicos />} />
                      <Route path="software" element={<AcercaDe />} />
                      <Route path="contact" element={<Contacto />} />
                    </Route>

                    {/* 404 fuera de PublicLayout */}
                    <Route path="*" element={<NotFound />} />
                  </Route>

                  {/* ── REDIRECCIÓN / O 404 GLOBAL ── */}
                  <Route path="*" element={<RedirectToLocalizedRoute />} />
                </Routes>
              </Suspense>
            </InterfaceImageProvider>
          </InterfaceTextProvider>
        </AuthProvider>
      </LanguageProvider>
    </Router>
  );
}