import SEO from "../components/SEO";
import { API_BASE_URL, fetchDeduplicated } from "../config/api";
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { usePageTitle } from "../hooks/usePageTitle";
import "../styles/Inicio.css";
import "../styles/ArticulosPublicos.css";
import EditableText from "../components/EditableText";
import EditableImage from "../components/EditableImage";
import HideableSection from "../components/HideableSection";
import { useInterfaceImage } from "../context/InterfaceImageContext";
import IotJpg from "../assets/IOT.jpg";
import { formatExternalUrl } from "../utils/urlUtils";

const formatFecha = (dateStr, lang = 'es') => {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  const locale = lang === 'en' ? 'en-US' : 'es-ES';
  return date.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
};

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

export default function Inicio() {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  usePageTitle(language === 'en' ? 'Home' : 'Inicio');
  const newsCarouselRef = useRef(null);
  const { images } = useInterfaceImage();
  const [novedades, setNovedades] = useState([]);
  const [nodosCount, setNodosCount] = useState(0);
  const [categoriasCount, setCategoriasCount] = useState(0);
  
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollPosition = () => {
    if (newsCarouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = newsCarouselRef.current;
      setCanScrollLeft(scrollLeft > 0);
      // Allow a 1px tolerance for rounding issues
      setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
    }
  };

  useEffect(() => {
    checkScrollPosition();
    window.addEventListener('resize', checkScrollPosition);
    return () => window.removeEventListener('resize', checkScrollPosition);
  }, [novedades]);

  const scrollCarousel = (direction) => {
    if (newsCarouselRef.current) {
      const container = newsCarouselRef.current;
      const scrollAmount = container.clientWidth;
      if (direction === 'left') {
        container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      } else {
        container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    }
  };

  const dbHeroEntry = images["home_hero_bg"];
  const heroBgUrl = dbHeroEntry?.image_data
    ? `data:${dbHeroEntry.mime_type};base64,${dbHeroEntry.image_data.replace(/^data:[^;]+;base64,/, "")}`
    : IotJpg;

  const mapSlug = language === "en" ? "categories" : "categorias";
  const articlesSlug = language === "en" ? "articles" : "articulos";
  const newsSlug = language === "en" ? "news" : "noticias";

  const handleItemClick = (n) => {
    if (n.tipo === 'articulo') {
      if (n.tipo_registro === 'PDF' && n.url_pdf) {
        window.open(formatExternalUrl(n.url_pdf), '_blank');
      } else {
        navigate(`/${language}/${articlesSlug}?id=${n.id}`);
      }
    } else {
      navigate(`/${language}/${newsSlug}?id=${n.id}`);
    }
  };

  useEffect(() => {
    const fetchNoticias = fetchDeduplicated(`${API_BASE_URL}/noticias?estado=Publicado&limit=5&lang=${language}`).then(res => res.json()).catch(() => []);
    const fetchArticulos = fetchDeduplicated(`${API_BASE_URL}/articulos?estado=Publicado&limit=5&lang=${language}`).then(res => res.json()).catch(() => []);
    const fetchNodosCount = fetchDeduplicated(`${API_BASE_URL}/nodos/count`).then(res => res.json()).catch(() => ({ count: 0 }));
    const fetchCategoriasCount = fetchDeduplicated(`${API_BASE_URL}/categorias/count`).then(res => res.json()).catch(() => ({ count: 0 }));

    Promise.all([fetchNoticias, fetchArticulos, fetchNodosCount, fetchCategoriasCount])
      .then(([dataNoticias, dataArticulos, resNodos, resCategorias]) => {
        setNodosCount(resNodos?.count ?? 0);
        setCategoriasCount(resCategorias?.count ?? 0);

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
                fechaStr: formatFecha(item.created_at, language)
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

        const combinadas = [...noticiasList, ...articulosList]
          .sort((a, b) => b.createdAt - a.createdAt)
          .slice(0, 5);

        setNovedades(combinadas);
      })
      .catch(err => {
        console.error("Error loading updates for home portal:", err);
      });
  }, [language]);

  const obtenerResumen = (contenidoRaw) => {
    try {
      if (contenidoRaw && contenidoRaw.startsWith('[')) {
        const blocks = JSON.parse(contenidoRaw);
        const textBlocks = blocks.filter(b => b.type === 'text' && b.value);
        if (textBlocks.length > 0) {
          const firstText = textBlocks[0].value;
          return firstText.length > 170 ? `${firstText.substring(0, 170)}...` : firstText;
        }
      }
    } catch (e) {}
    return contenidoRaw && contenidoRaw.length > 170 ? `${contenidoRaw.substring(0, 170)}...` : (contenidoRaw || '');
  };

  const ARCHITECTURE_STEPS = [
    { step: "01", title: t("home.arch_step_1_title", "Sensores Físicos"), desc: t("home.arch_step_1_desc", "Puntos terminales calibrados de medición desplegados en campo."), icon: <CpuIcon /> },
    { step: "02", title: t("home.arch_step_2_title", "Red Inalámbrica"), desc: t("home.arch_step_2_desc", "Transmisión de paquetes a través de gateways LoRaWAN dedicados y Wi-Fi."), icon: <WifiIcon /> },
    { step: "03", title: t("home.arch_step_3_title", "Broker & DB"), desc: t("home.arch_step_3_desc", "Recepción centralizada mediante broker MQTT y persistencia segura en base de datos."), icon: <DatabaseIcon /> },
    { step: "04", title: t("home.arch_step_4_title", "Portal de Gestión"), desc: t("home.arch_step_4_desc", "Interfaces web responsivas y paneles de control analíticos para toma de decisiones."), icon: <GlobeIcon /> }
  ];

  return (
    <main className="public-portal-main">
      <SEO 
        title={language === 'en' ? "Home - IoT ULEAM" : "Inicio - IoT ULEAM"}
        description={language === 'en' ? "IoT telemetry monitoring platform for ULEAM. Discover real-time data, historical analysis, and more." : "Plataforma de monitoreo de telemetría IoT para la ULEAM. Descubre datos en tiempo real, análisis histórico y más."}
      />
      <HideableSection sectionKey="home_hero">
        <section 
          className="portal-hero"
          style={{ backgroundImage: `linear-gradient(rgba(11, 15, 25, 0.76), rgba(11, 15, 25, 0.90)), url(${heroBgUrl})` }}
        >
          <EditableImage
            imageKey="home_hero_bg"
            defaultSrc={IotJpg}
            alt="Fondo Héroe IoT ULEAM"
            recommendedWidth={1920}
            recommendedHeight={1080}
            compress={false}
            hint="Imagen de fondo principal de la sección héroe de la página de Inicio (Recomendado 1920 × 1080 px)."
            style={{ display: "none" }}
            wrapperStyle={{ position: "absolute", top: "24px", right: "24px", zIndex: 30, width: "36px", height: "36px" }}
          />
          <div className="hero-bg-overlay" />
          <div className="hero-grid-pattern" />

          <div className="hero-container">
            <div className="hero-badge">
              <span className="badge-text"><EditableText textKey="home_hero_badge" defaultText="UNIVERSIDAD LAICA ELOY ALFARO DE MANABÍ" /></span>
            </div>
            <h1 className="hero-title-main">
              <EditableText textKey="home_hero_title" defaultText={t("home.hero_title", "Ecosistema de Internet de las Cosas IoT")} />
            </h1>
            <p className="hero-desc">
              <EditableText textKey="home_hero_desc" defaultText={t("home.hero_subtitle", "Una plataforma diseñada para la automatización, monitorización de recursos y la investigación académica.")} isTextArea={true} />
            </p>
            <div className="hero-actions">
              <Link to={`/${language}/${mapSlug}`} className="btn-portal-primary">
                <EditableText textKey="home_hero_btn_live" defaultText={t("home.explore_map", "Monitoreo en Vivo")} />
              </Link>
            </div>
          </div>
        </section>
      </HideableSection>

      <HideableSection sectionKey="home_about">
        <section id="proyecto" className="about-project-section">
          <div className="about-container">
            <div className="about-text-content">
              <span className="section-label"><EditableText textKey="home_about_badge" defaultText={t("home.about_badge", "Smart Campus")} /></span>
              <h2 className="section-title"><EditableText textKey="home_about_title" defaultText={t("home.about_title", "Sobre la Red IoT ULEAM")} /></h2>
              <p className="body-text">
                <EditableText textKey="home_about_desc1" defaultText={t("home.about_desc1", "La plataforma de monitoreo IoT es un proyecto interdisciplinario liderado por la Facultad de Ciencias Informáticas (FACCI) y la Dirección de Innovación Tecnológica & Telecomunicaciones (DIT).")} isTextArea={true} />
              </p>
              <p className="body-text">
                <EditableText textKey="home_about_desc2" defaultText={t("home.about_desc2", "El objetivo principal es proveer infraestructura tecnológica para la digitalización y el monitoreo ambiental del campus universitario.")} isTextArea={true} />
              </p>
              <div className="about-bullets">
                <div className="bullet-item">
                  <span className="bullet-check">✓</span>
                  <span><EditableText textKey="home_bullet1" defaultText={t("home.bullet1", "Optimización del uso de energía y recursos hídricos.")} /></span>
                </div>
                <div className="bullet-item">
                  <span className="bullet-check">✓</span>
                  <span><EditableText textKey="home_bullet2" defaultText={t("home.bullet2", "Almacenamiento de datos históricos para análisis científico.")} /></span>
                </div>
                <div className="bullet-item">
                  <span className="bullet-check">✓</span>
                  <span><EditableText textKey="home_bullet3" defaultText={t("home.bullet3", "Despliegue de sensores de hardware y software abierto.")} /></span>
                </div>
              </div>
            </div>

            <div className="about-stats-grid">
              <div className="about-stat-card">
                <div className="stat-icon-wrapper"><ShieldCheckIcon /></div>
                <span className="card-stat-num">{nodosCount}</span>
                <span className="card-stat-title"><EditableText textKey="home_stat_title_1" defaultText={t("home.active_nodes", "Sensores Desplegados")} /></span>
                <p className="card-stat-desc"><EditableText textKey="home_stat_desc_1" defaultText={t("home.stat_desc_1", "Puntos de control registrando variables físicas continuamente.")} isTextArea={true} /></p>
              </div>
              <div className="about-stat-card">
                <div className="stat-icon-wrapper"><ActivityIcon /></div>
                <span className="card-stat-num">{categoriasCount}</span>
                <span className="card-stat-title"><EditableText textKey="home_stat_title_2" defaultText={t("home.stat_title_2", "Áreas Clave")} /></span>
                <p className="card-stat-desc"><EditableText textKey="home_stat_desc_2" defaultText={t("home.stat_desc_2", "Sectores estratégicos bajo supervisión automatizada.")} isTextArea={true} /></p>
              </div>
              <div className="about-stat-card">
                <div className="stat-icon-wrapper"><ZapIcon /></div>
                <span className="card-stat-num"><EditableText textKey="home_stat_num_3" defaultText="24/7" /></span>
                <span className="card-stat-title"><EditableText textKey="home_stat_title_3" defaultText={t("home.system_health", "Operatividad")} /></span>
                <p className="card-stat-desc"><EditableText textKey="home_stat_desc_3" defaultText={t("home.stat_desc_3", "Servidor centralizado recopilando tramas de telemetría constantemente.")} isTextArea={true} /></p>
              </div>
              <div className="about-stat-card">
                <div className="stat-icon-wrapper"><BookOpenIcon /></div>
                <span className="card-stat-num"><EditableText textKey="home_stat_num_4" defaultText="FACCI" /></span>
                <span className="card-stat-title"><EditableText textKey="home_stat_title_4" defaultText={t("home.stat_title_4", "Semillero Académico")} /></span>
                <p className="card-stat-desc"><EditableText textKey="home_stat_desc_4" defaultText={t("home.stat_desc_4", "Integrado en proyectos integradores y de tesis estudiantiles.")} isTextArea={true} /></p>
              </div>
            </div>
          </div>
        </section>
      </HideableSection>

      <HideableSection sectionKey="home_infra">
        <section className="architecture-section">
          <div className="section-header text-center">
            <span className="section-label text-red"><EditableText textKey="home_infra_badge" defaultText={t("home.infra_badge", "Infraestructura")} /></span>
            <h2 className="section-title text-white"><EditableText textKey="home_infra_title" defaultText={t("home.infra_title", "¿Cómo Funciona la Red IoT?")} /></h2>
            <p className="section-subtitle-text text-gray">
              <EditableText textKey="home_infra_desc" defaultText={t("home.infra_desc", "La arquitectura de adquisición de datos del campus se divide en cuatro capas tecnológicas integradas.")} isTextArea={true} />
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

      <HideableSection sectionKey="home_news">
        <section className="portal-news-section">
          <div className="section-header text-center">
            <span className="section-label"><EditableText textKey="home_news_badge" defaultText={t("home.news_badge", "Actualizaciones")} /></span>
            <h2 className="section-title"><EditableText textKey="home_news_title" defaultText={t("home.featured_news", "Hitos e Investigación IoT")} /></h2>
            <p className="section-subtitle-text">
              <EditableText textKey="home_news_desc" defaultText={t("home.news_desc", "Mantente al tanto del progreso de los despliegues de hardware y las publicaciones académicas asociadas al proyecto.")} isTextArea={true} />
            </p>
          </div>

          <div className="news-carousel-wrapper" style={{ position: 'relative', maxWidth: '1280px', margin: '0 auto' }}>
            {novedades.length > 0 && (
              <button 
                className="carousel-btn prev-btn" 
                onClick={() => scrollCarousel('left')} 
                disabled={!canScrollLeft}
                aria-label="Anterior"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
              </button>
            )}

            <div className="news-cards-grid" ref={newsCarouselRef} onScroll={checkScrollPosition}>
              {novedades.length === 0 ? (
                <div className="no-news-banner" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3.5rem 1.5rem', color: '#64748b', fontStyle: 'italic', border: '2px dashed #cbd5e1', borderRadius: '16px', background: '#ffffff', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48" style={{ color: '#cbd5e1' }}>
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <path d="M16 8h2M16 12h2M8 8h4v8H8z" />
                  </svg>
                  <span>{t("common.no_results", "No hay novedades registradas en el sistema.")}</span>
                </div>
              ) : (
                novedades.map((n, index) => {
                if (n.tipo === 'articulo') {
                  return (
                    <div 
                      key={`articulo-${n.id}`} 
                      className={`pub-art-card ${n.tipo_registro === 'PDF' ? 'card-pdf' : 'card-internal'}`}
                    >
                      <div className="pub-art-card-spine">
                        <div className="pub-art-card-spine-text-wrapper">
                          <div className="pub-art-card-spine-text">
                            {n.revista || 'REPOSITORIO CIENTÍFICO ULEAM'}
                          </div>
                        </div>
                      </div>

                      <div className="pub-art-card-right-content">
                        <div className="pub-art-card-journal-banner">
                          {t("articles.title", "Artículo Científico")} • {n.revista || 'FACCI'}
                        </div>

                        <h3 className="pub-art-card-title">
                          {n.titulo}
                        </h3>

                        <div className="pub-art-card-prepared-by">
                          <div className="pub-art-prepared-label">{t("articles.authors", "Autores")}:</div>
                          <div className="pub-art-card-authors-text">{n.autores}</div>
                          <div className="pub-art-card-date-text">{formatFecha(n.created_at, language)}</div>
                        </div>

                        <div className="pub-art-card-footer" style={{ borderTop: 'none', paddingTop: 0, marginTop: 'auto' }}>
                          <span 
                            className="pub-art-click-indicator"
                            onClick={() => handleItemClick(n)}
                            style={{ cursor: 'pointer' }}
                          >
                            {t("home.read_more", "Leer más")} →
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
                        {t("news.title", "Noticias")}
                      </div>
                      
                      <div className="news-date-row" style={{ marginTop: '0.2rem' }}>
                        <CalendarIcon />
                        <span>{n.fechaStr}</span>
                      </div>

                      <h3>{n.titulo}</h3>

                      <p style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '4.5rem', textAlign: 'justify' }}>
                        {obtenerResumen(n.contenido)}
                      </p>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '1rem' }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleItemClick(n);
                          }}
                          className="btn-read-more"
                          style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: '800', cursor: 'pointer' }}
                        >
                          {t("home.read_more", "Leer más")} →
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            </div>
            {novedades.length > 0 && (
              <button 
                className="carousel-btn next-btn" 
                onClick={() => scrollCarousel('right')} 
                disabled={!canScrollRight}
                aria-label="Siguiente"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </button>
            )}
          </div>
        </section>
      </HideableSection>
    </main>
  );
}