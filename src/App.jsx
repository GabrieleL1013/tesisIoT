import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { LanguageProvider } from "./context/LanguageContext";
import { AuthProvider } from "./context/AuthContext";
import { InterfaceTextProvider } from "./context/InterfaceTextContext";
import { InterfaceImageProvider } from "./context/InterfaceImageContext";
import Inicio from "./pages/Inicio";
import Navbar from "../src/components/Navbar";
import Footer from "../src/components/Footer";
import IotTicker from "./components/IotTicker";

// ── IMPORTACIÓN DE NUESTRAS NUEVAS INTERFACES TESIS ──
import VisualizarMapa from "./pages/VisualizarMapa";
import VisualizarHistorico from "./pages/VisualizarHistorico";
import Login from "./pages/Login";
import NoticiasPublicas from "./pages/NoticiasPublicas";
import ArticulosPublicos from "./pages/ArticulosPublicos";
import AcercaDe from "./pages/AcercaDe";
import Contacto from "./pages/Contacto";

//INTERFACES DE ADMINISTRADOR
import Dashboard from "./pages/admin/Dashboard";
import RegistrarNodo from "./pages/admin/RegistrarNodo";
import GestionarCategorias from "./pages/admin/GestionarCategorias";
import GestionarMetricas from "./pages/admin/GestionarMetricas";
import GestionarUbicaciones from "./pages/admin/GestionarUbicaciones";
import GestionarUsuarios from "./pages/admin/GestionarUsuarios";
import GestionarRoles from "./pages/admin/GestionarRoles";
import GestionarInterfaces from "./pages/admin/GestionarInterfaces";
import GestionarNoticias from "./pages/admin/GestionarNoticias";
import GestionarArticulos from "./pages/admin/GestionarArticulos";
import MonitorEnVivo from "./pages/admin/MonitorEnVivo";
import HistoricoAgregado from "./pages/admin/HistoricoAgregado";
import Notificaciones from "./pages/admin/Notificaciones";
import Error403 from "./pages/admin/Error403";

// ── IMPORTACIÓN DEL LAYOUT DE ADMINISTRACIÓN ──
import AdminLayout from "./components/admin/AdminLayout";

// ── COMPONENTE PARA RESTAURAR EL SCROLL AL CAMBIAR DE RUTA ──
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

// ── LAYOUT PORTAL PÚBLICO (Navbar & Footer con Outlet) ──
const PublicLayout = () => {
  return (
    <>
      <Navbar />
      {/* Añadimos padding top de 85px para compensar la posición fixed del Navbar */}
      <div className="min-h-screen bg-gray-50 pb-8" style={{ paddingTop: "85px" }}>
        <Outlet />
      </div>
      <IotTicker />
      <Footer />
    </>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <InterfaceTextProvider>
          <InterfaceImageProvider>
          <Router>
            {/* Restaura el scroll vertical a 0 en cada cambio de ruta */}
            <ScrollToTop />
            
            <Routes>
              {/* Dedicated Login Route (Standalone, no Navbar/Footer) */}
              <Route path="/login" element={<Login />} />

              {/* ── SECCIÓN DE ADMINISTRACIÓN (Protegida por AdminLayout, sin Navbar/Footer públicos) ── */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="nodos" element={<RegistrarNodo />} />
                <Route path="categorias" element={<GestionarCategorias />} />
                <Route path="metricas" element={<GestionarMetricas />} />
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
              </Route>

              {/* ── PORTAL PÚBLICO (Renderiza Navbar y Footer públicos mediante PublicLayout) ── */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<Inicio />} />
                <Route path="/mapa-tiempo-real" element={<VisualizarMapa />} />
                <Route path="/analisis-historico" element={<VisualizarHistorico />} />
                <Route path="/noticias" element={<NoticiasPublicas />} />
                <Route path="/articulos" element={<ArticulosPublicos />} />
                <Route path="/acerca-de" element={<AcercaDe />} />
                <Route path="/software" element={<AcercaDe />} />
                <Route path="/contacto" element={<Contacto />} />
              </Route>

              {/* Redirección por defecto para cualquier ruta no mapeada */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
          </InterfaceImageProvider>
        </InterfaceTextProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}