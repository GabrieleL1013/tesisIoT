import { API_BASE_URL } from "../config/api";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Inicio.css";
import "../styles/ArticulosPublicos.css";
import EditableText from "../components/EditableText";
import HideableSection from "../components/HideableSection";
import IotJpg from "../assets/IOT.jpg";

const formatFecha = (dateStr) => {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
};

// ── Iconos SVG Autocontenidos para la Página Informativa ──
const ShieldCheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="22" height="22" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
const ZapIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="22" height="22" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);
const ActivityIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="22" height="22" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);
const CpuIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
    <rect x="9" y="9" width="6" height="6" />
    <line x1="9" y1="1" x2="9" y2="4" />
    <line x1="15" y1="1" x2="15" y2="4" />
    <line x1="9" y1="20" x2="9" y2="23" />
    <line x1="15" y1="20" x2="15" y2="23" />
    <line x1="20" y1="9" x2="23" y2="9" />
    <line x1="20" y1="15" x2="23" y2="15" />
    <line x1="1" y1="9" x2="4" y2="9" />
    <line x1="1" y1="15" x2="4" y2="15" />
  </svg>
);
const DatabaseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
  </svg>
);
const WifiIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12.55a11 11 0 0 1 14.08 0" />
    <path d="M1.42 9a16 16 0 0 1 21.16 0" />
    <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
    <line x1="12" y1="20" x2="12.01" y2="20" />
  </svg>
);
const GlobeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);
const DropletIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
  </svg>
);
const LightbulbIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18h6M10 22h4" />
    <path d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17h8v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7z" />
  </svg>
);
const WaveIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 6c.6 0 1.2-.2 1.5-.5.6-.6 1.5-.6 2.1 0 .6.6 1.5.6 2.1 0 .6-.6 1.5-.6 2.1 0 .6.6 1.5.6 2.1 0 .6-.6 1.5-.6 2.1 0 .6.6 1.5.6 2.1 0 .3.3.5.5.5" />
    <path d="M2 12c.6 0 1.2-.2 1.5-.5.6-.6 1.5-.6 2.1 0 .6.6 1.5.6 2.1 0 .6-.6 1.5-.6 2.1 0 .6.6 1.5.6 2.1 0 .6-.6 1.5-.6 2.1 0 .6.6 1.5.6 2.1 0 .3.3.5.5.5" />
    <path d="M2 18c.6 0 1.2-.2 1.5-.5.6-.6 1.5-.6 2.1 0 .6.6 1.5.6 2.1 0 .6-.6 1.5-.6 2.1 0 .6.6 1.5.6 2.1 0 .6-.6 1.5-.6 2.1 0 .6.6 1.5.6 2.1 0 .3.3.5.5.5" />
  </svg>
);
const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const BookOpenIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);



const ARCHITECTURE_STEPS = [
  {
    step: "01",
    title: "Sensores Físicos",
    desc: "Puntos terminales calibrados de medición (temperatura, humedad, flujo, presencia y niveles hídricos) desplegados en campo.",
    icon: <CpuIcon />
  },
  {
    step: "02",
    title: "Red Inalámbrica",
    desc: "Transmisión de paquetes a través de gateways LoRaWAN dedicados y la red Wi-Fi institucional de la universidad.",
    icon: <WifiIcon />
  },
  {
    step: "03",
    title: "Broker & DB",
    desc: "Recepción centralizada mediante broker MQTT y persistencia segura en base de datos para análisis histórico.",
    icon: <DatabaseIcon />
  },
  {
    step: "04",
    title: "Portal de Gestión",
    desc: "Interfaces web responsivas y paneles de control analíticos para la toma de decisiones operativas de la administración.",
    icon: <GlobeIcon />
  }
];

export default function Inicio() {
  const navigate = useNavigate();
  const [novedades, setNovedades] = useState([]);
  const [nodosCount, setNodosCount] = useState(0);
  const [categoriasCount, setCategoriasCount] = useState(0);

  const handleItemClick = (n) => {
    if (n.tipo === 'articulo') {
      if (n.tipo_registro === 'PDF' && n.url_pdf) {
        window.open(n.url_pdf, '_blank');
      } else {
        navigate(`/articulos?id=${n.id}`);
      }
    } else {
      navigate(`/noticias?id=${n.id}`);
    }
  };

  useEffect(() => {
    const fetchNoticias = fetch(`${API_BASE_URL}/noticias`).then(res => res.json()).catch(() => []);
    const fetchArticulos = fetch(`${API_BASE_URL}/articulos`).then(res => res.json()).catch(() => []);
    const fetchNodos = fetch(`${API_BASE_URL}/nodos`).then(res => res.json()).catch(() => []);
    const fetchCategorias = fetch(`${API_BASE_URL}/categorias`).then(res => res.json()).catch(() => []);

    Promise.all([fetchNoticias, fetchArticulos, fetchNodos, fetchCategorias])
      .then(([dataNoticias, dataArticulos, dataNodos, dataCategorias]) => {
        if (Array.isArray(dataNodos)) {
          setNodosCount(dataNodos.length);
        }
        if (Array.isArray(dataCategorias)) {
          setCategoriasCount(dataCategorias.length);
        }

        const noticiasList = Array.isArray(dataNoticias)
          ? dataNoticias
              .filter(item => item.estado === 'Publicado')
              .map(item => ({
                id: item.id,
                tipo: 'noticia',
                titulo: item.titulo,
                autor: item.autor,
                contenido: item.contenido,
                imagenUrl: item.imagen_url || item.imagenUrl || '',
                createdAt: item.created_at ? new Date(item.created_at) : new Date(0),
                fechaStr: item.created_at
                  ? new Date(item.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
                  : new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
              }))
          : [];

        const articulosList = Array.isArray(dataArticulos)
          ? dataArticulos
              .filter(item => item.estado === 'Publicado')
              .map(item => ({
                id: item.id,
                tipo: 'articulo',
                tipo_registro: item.tipo_registro,
                revista: item.revista,
                titulo: item.titulo,
                autores: item.autores,
                url_pdf: item.url_pdf,
                createdAt: item.created_at ? new Date(item.created_at) : new Date(0),
                created_at: item.created_at
              }))
          : [];

        // Combinar, ordenar de más reciente a más antigua y tomar las 3 últimas novedades
        const combinadas = [...noticiasList, ...articulosList]
          .sort((a, b) => b.createdAt - a.createdAt)
          .slice(0, 3);

        setNovedades(combinadas);
      })
      .catch(err => {
        console.error("Error loading updates for home portal:", err);
      });
  }, []);

  // Helper para extraer un resumen en formato de texto plano de los bloques
  const obtenerResumen = (contenidoRaw) => {
    try {
      if (contenidoRaw && contenidoRaw.startsWith('[')) {
        const blocks = JSON.parse(contenidoRaw);
        const textBlocks = blocks.filter(b => b.type === 'text' && b.value);
        if (textBlocks.length > 0) {
          const firstText = textBlocks[0].value;
          return firstText.length > 170 ? `${firstText.substring(0, 170)}...` : firstText;
        }
        return "Ver imágenes de investigación adjuntas.";
      }
    } catch (e) {}

    return contenidoRaw && contenidoRaw.length > 170 ? `${contenidoRaw.substring(0, 170)}...` : (contenidoRaw || '');
  };

  return (
    <main className="public-portal-main">
      
      {/* ── HERO CON FOTO DE FONDO E INTERFAZ DE IOT ── */}
      <HideableSection sectionKey="home_hero">
        <section 
          className="portal-hero"
          style={{ backgroundImage: `linear-gradient(rgba(11, 15, 25, 0.72), rgba(11, 15, 25, 0.88)), url(${IotJpg})` }}
        >
          <div className="hero-bg-overlay" />
          <div className="hero-grid-pattern" />

          <div className="hero-container">
            <div className="hero-badge">
              <span className="badge-line" />
              <span className="badge-text"><EditableText textKey="home_hero_badge" defaultText="UNIVERSIDAD LAICA ELOY ALFARO DE MANABÍ" /></span>
            </div>
            <h1 className="hero-title-main">
              <EditableText textKey="home_hero_title" defaultText="Ecosistema de Internet de las Cosas IoT" />
            </h1>
            <p className="hero-desc">
              <EditableText textKey="home_hero_desc" defaultText="Una plataforma diseñada para la automatización, monitorización de recursos y la investigación académica. Conectamos los campus de la ULEAM para recolectar telemetría crítica de manera sustentable y eficiente." isTextArea={true} />
            </p>
            <div className="hero-actions">
              <Link to="/mapa-tiempo-real" className="btn-portal-primary">
                <EditableText textKey="home_hero_btn_live" defaultText="Monitoreo en Vivo" />
              </Link>
            </div>
          </div>
        </section>
      </HideableSection>

      {/* ── SECCIÓN: SOBRE EL PROYECTO ── */}
      <HideableSection sectionKey="home_about">
        <section id="proyecto" className="about-project-section">
          <div className="about-container">
            <div className="about-text-content">
              <span className="section-label"><EditableText textKey="home_about_badge" defaultText="Smart Campus" /></span>
              <h2 className="section-title"><EditableText textKey="home_about_title" defaultText="Sobre la Red IoT ULEAM" /></h2>
              <p className="body-text">
                <EditableText textKey="home_about_desc1" defaultText="La plataforma de monitoreo IoT es un proyecto interdisciplinario liderado por la Facultad de Ciencias Informáticas (FACCI) y la Dirección de Innovación Tecnológica & Telecomunicaciones (DIT)." isTextArea={true} />
              </p>
              <p className="body-text">
                <EditableText textKey="home_about_desc2" defaultText="El objetivo principal es proveer infraestructura tecnológica para la digitalización y el monitoreo ambiental del campus universitario, sirviendo simultáneamente como un entorno de experimentación real para la formación académica y desarrollo de tesis de grado." isTextArea={true} />
              </p>
              <div className="about-bullets">
                <div className="bullet-item">
                  <span className="bullet-check">✓</span>
                  <span><EditableText textKey="home_bullet1" defaultText="Optimización del uso de energía y recursos hídricos." /></span>
                </div>
                <div className="bullet-item">
                  <span className="bullet-check">✓</span>
                  <span><EditableText textKey="home_bullet2" defaultText="Almacenamiento de datos históricos para análisis científico." /></span>
                </div>
                <div className="bullet-item">
                  <span className="bullet-check">✓</span>
                  <span><EditableText textKey="home_bullet3" defaultText="Despliegue de sensores de hardware y software abierto." /></span>
                </div>
              </div>
            </div>

            {/* Tarjetas de Estadísticas Estáticas */}
            <div className="about-stats-grid">
              <div className="about-stat-card">
                <div className="stat-icon-wrapper"><ShieldCheckIcon /></div>
                <span className="card-stat-num">{nodosCount}</span>
                <span className="card-stat-title"><EditableText textKey="home_stat_title_1" defaultText="Sensores Desplegados" /></span>
                <p className="card-stat-desc"><EditableText textKey="home_stat_desc_1" defaultText="Puntos de control registrando variables físicas continuamente." isTextArea={true} /></p>
              </div>
              <div className="about-stat-card">
                <div className="stat-icon-wrapper"><ActivityIcon /></div>
                <span className="card-stat-num">{categoriasCount}</span>
                <span className="card-stat-title"><EditableText textKey="home_stat_title_2" defaultText="Áreas Clave" /></span>
                <p className="card-stat-desc"><EditableText textKey="home_stat_desc_2" defaultText="Sectores estratégicos bajo supervisión automatizada." isTextArea={true} /></p>
              </div>
              <div className="about-stat-card">
                <div className="stat-icon-wrapper"><ZapIcon /></div>
                <span className="card-stat-num"><EditableText textKey="home_stat_num_3" defaultText="24/7" /></span>
                <span className="card-stat-title"><EditableText textKey="home_stat_title_3" defaultText="Operatividad" /></span>
                <p className="card-stat-desc"><EditableText textKey="home_stat_desc_3" defaultText="Servidor centralizado recopilando tramas de telemetría constantemente." isTextArea={true} /></p>
              </div>
              <div className="about-stat-card">
                <div className="stat-icon-wrapper"><BookOpenIcon /></div>
                <span className="card-stat-num"><EditableText textKey="home_stat_num_4" defaultText="FACCI" /></span>
                <span className="card-stat-title"><EditableText textKey="home_stat_title_4" defaultText="Semillero Académico" /></span>
                <p className="card-stat-desc"><EditableText textKey="home_stat_desc_4" defaultText="Integrado en proyectos integradores y de tesis estudiantiles." isTextArea={true} /></p>
              </div>
            </div>
          </div>
        </section>
      </HideableSection>



      {/* ── SECCIÓN: ARQUITECTURA DE LA RED (FLUJO DE FUNCIONAMIENTO) ── */}
      <HideableSection sectionKey="home_infra">
        <section className="architecture-section">
          <div className="section-header text-center">
            <span className="section-label text-red"><EditableText textKey="home_infra_badge" defaultText="Infraestructura" /></span>
            <h2 className="section-title text-white"><EditableText textKey="home_infra_title" defaultText="¿Cómo Funciona la Red IoT?" /></h2>
            <p className="section-subtitle-text text-gray">
              <EditableText textKey="home_infra_desc" defaultText="La architecture de adquisición de datos del campus se divide en cuatro capas tecnológicas integradas." isTextArea={true} />
            </p>
          </div>

          <div className="architecture-grid">
            {ARCHITECTURE_STEPS.map((step, i) => (
              <div key={i} className="arch-card glassmorphic">
                <div className="arch-step-header">
                  <span className="arch-step-num">{step.step}</span>
                  <div className="arch-step-icon">{step.icon}</div>
                </div>
                <h3><EditableText textKey={`home_arch_title_${i}`} defaultText={step.title} /></h3>
                <p><EditableText textKey={`home_arch_desc_${i}`} defaultText={step.desc} isTextArea={true} /></p>
              </div>
            ))}
          </div>
        </section>
      </HideableSection>

      {/* ── SECCIÓN: NOTICIAS / INVESTIGACIÓN (DINÁMICA DESDE BASE DE DATOS) ── */}
      <HideableSection sectionKey="home_news">
        <section className="portal-news-section">
          <div className="section-header text-center">
            <span className="section-label"><EditableText textKey="home_news_badge" defaultText="Actualizaciones" /></span>
            <h2 className="section-title"><EditableText textKey="home_news_title" defaultText="Hitos e Investigación IoT" /></h2>
            <p className="section-subtitle-text">
              <EditableText textKey="home_news_desc" defaultText="Mantente al tanto del progreso de los despliegues de hardware y las publicaciones académicas asociadas al proyecto." isTextArea={true} />
            </p>
          </div>

          <div className="news-cards-grid">
            {novedades.length === 0 ? (
              <div className="no-news-banner" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3.5rem 1.5rem', color: '#64748b', fontStyle: 'italic', border: '2px dashed #cbd5e1', borderRadius: '16px', background: '#ffffff', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48" style={{ color: '#cbd5e1' }}>
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <path d="M16 8h2M16 12h2M8 8h4v8H8z" />
                </svg>
                <span>No hay novedades registradas en el sistema.</span>
              </div>
            ) : (
              novedades.map((n, index) => {
                if (n.tipo === 'articulo') {
                  return (
                    <div 
                      key={`articulo-${n.id}`} 
                      className={`pub-art-card ${n.tipo_registro === 'PDF' ? 'card-pdf' : 'card-internal'}`}
                    >
                      {/* LEFT VERTICAL SPINE */}
                      <div className="pub-art-card-spine">
                        <div className="pub-art-card-spine-text-wrapper">
                          <div className="pub-art-card-spine-text">
                            {n.revista || 'REPOSITORIO CIENTÍFICO ULEAM'}
                          </div>
                        </div>
                        <div className="pub-art-card-spine-logo">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="15" height="15">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                          </svg>
                        </div>
                      </div>

                      {/* RIGHT CONTENT PANE */}
                      <div className="pub-art-card-right-content">
                        <div className="pub-art-card-badge-row">
                          {n.tipo_registro === 'PDF' ? (
                            <span className="pub-art-card-badge pdf-badge">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="10" height="10" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px', marginTop: '-2px' }}>
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                <polyline points="15 3 21 3 21 9" />
                                <line x1="10" y1="14" x2="21" y2="3" />
                              </svg>
                              Enlace Externo
                            </span>
                          ) : (
                            <span className="pub-art-card-badge internal-badge">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="10" height="10" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px', marginTop: '-2px' }}>
                                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                              </svg>
                              Lectura Digital
                            </span>
                          )}
                        </div>

                        <div className="pub-art-card-journal-banner">
                          Artículo Científico • {n.revista || 'Facultad de Ciencias Informáticas (FACCI)'}
                        </div>

                        <h3 className="pub-art-card-title">
                          {n.titulo}
                        </h3>

                        <div className="pub-art-card-prepared-by">
                          <div className="pub-art-prepared-label">Preparado por:</div>
                          <div className="pub-art-card-authors-text">{n.autores}</div>
                          <div className="pub-art-card-revista-text">{n.revista || 'Facultad de Ciencias Informáticas (FACCI)'}</div>
                          <div className="pub-art-card-date-text">Publicado: {formatFecha(n.created_at)}</div>
                        </div>

                        <div className="pub-art-card-footer" style={{ borderTop: 'none', paddingTop: 0, marginTop: 'auto' }}>
                          <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '500' }}>
                            {n.tipo_registro === 'PDF' ? 'Enlace Externo' : 'Formato Interactivo'}
                          </span>

                          <span 
                            className="pub-art-click-indicator"
                            onClick={() => handleItemClick(n)}
                            style={{ cursor: 'pointer' }}
                          >
                            {n.tipo_registro === 'PDF' ? 'Abrir enlace' : 'Leer completo'}
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="12" height="12" className="pub-art-click-arrow">
                              <line x1="5" y1="12" x2="19" y2="12" />
                              <polyline points="12 5 19 12 12 19" />
                            </svg>
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={`noticia-${n.id}`} className="portal-news-card">
                    {n.imagenUrl ? (
                      <img 
                        src={n.imagenUrl} 
                        alt={n.titulo} 
                        className="portal-news-image" 
                        style={{ height: '190px', width: '100%', objectFit: 'cover', borderBottom: '1px solid var(--border-light)' }} 
                      />
                    ) : (
                      <div className={`news-tag-banner ${['news-green', 'news-blue'][index % 2]}`} />
                    )}
                    <div className="news-card-content">
                      <div className="pub-art-card-journal-banner">
                        Noticia de Divulgación
                      </div>
                      
                      <div className="news-date-row" style={{ marginTop: '0.2rem' }}>
                        <CalendarIcon />
                        <span>{n.fechaStr}</span>
                      </div>

                      <h3>
                        {n.titulo}
                      </h3>

                      <p style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '4.5rem', textAlign: 'justify' }}>
                        {obtenerResumen(n.contenido)}
                      </p>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '1rem' }}>
                        <span className="news-academic-tag" style={{
                          background: 'rgba(46, 204, 113, 0.06)',
                          borderColor: 'rgba(46, 204, 113, 0.1)',
                          color: 'var(--accent-green)'
                        }}>
                          Noticia
                        </span>

                        <span 
                          className="pub-news-btn-read" 
                          onClick={() => handleItemClick(n)}
                          style={{ 
                            color: '#2563eb',
                            fontWeight: '800',
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          Leer más <span style={{ transition: 'transform 0.2s', display: 'inline-block' }}>→</span>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </HideableSection>

    </main>
  );
}