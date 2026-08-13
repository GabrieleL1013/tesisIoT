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
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return String(dateStr);
    const monthNamesEs = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const monthNamesEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const month = lang === 'en' ? monthNamesEn[date.getMonth()] : monthNamesEs[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month.toUpperCase()} ${day}, ${year}`;
  } catch (e) {
    return String(dateStr);
  }
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

const NewspaperIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="36" height="36">
    <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
    <path d="M18 14h-8" />
    <path d="M15 18h-5" />
    <rect x="10" y="6" width="8" height="4" rx="1" fill="currentColor" opacity="0.3" />
  </svg>
);

export default function Inicio() {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  usePageTitle(language === 'en' ? 'Home' : 'Inicio');
  const { images } = useInterfaceImage();
  
  const [noticias, setNoticias] = useState([]);
  const [articulos, setArticulos] = useState([]);
  const [openNoticias, setOpenNoticias] = useState(true);
  const [openArticulos, setOpenArticulos] = useState(false);

  const noticiasCarouselRef = useRef(null);
  const articulosCarouselRef = useRef(null);

  const [nodosCount, setNodosCount] = useState(0);
  const [categoriasCount, setCategoriasCount] = useState(0);
  
  const [canScrollLeftNoticias, setCanScrollLeftNoticias] = useState(false);
  const [canScrollRightNoticias, setCanScrollRightNoticias] = useState(true);
  const [canScrollLeftArticulos, setCanScrollLeftArticulos] = useState(false);
  const [canScrollRightArticulos, setCanScrollRightArticulos] = useState(true);

  const checkNoticiasScrollPosition = () => {
    if (noticiasCarouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = noticiasCarouselRef.current;
      setCanScrollLeftNoticias(scrollLeft > 0);
      setCanScrollRightNoticias(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
    }
  };

  const checkArticulosScrollPosition = () => {
    if (articulosCarouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = articulosCarouselRef.current;
      setCanScrollLeftArticulos(scrollLeft > 0);
      setCanScrollRightArticulos(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
    }
  };

  useEffect(() => {
    checkNoticiasScrollPosition();
    checkArticulosScrollPosition();
    window.addEventListener('resize', checkNoticiasScrollPosition);
    window.addEventListener('resize', checkArticulosScrollPosition);
    return () => {
      window.removeEventListener('resize', checkNoticiasScrollPosition);
      window.removeEventListener('resize', checkArticulosScrollPosition);
    };
  }, [noticias, articulos, openNoticias, openArticulos]);

  const [noticiasTimerKey, setNoticiasTimerKey] = useState(0);
  const [articulosTimerKey, setArticulosTimerKey] = useState(0);
  const [noticiasAnimDir, setNoticiasAnimDir] = useState('right');
  const [articulosAnimDir, setArticulosAnimDir] = useState('right');

  const scrollNoticias = (direction) => {
    if (!noticiasCarouselRef.current) return;
    const container = noticiasCarouselRef.current;
    const firstCard = container.querySelector('.portal-news-card');
    const cardWidth = firstCard ? firstCard.offsetWidth : 360;
    const scrollStep = cardWidth + 35;

    if (direction === 'left') {
      if (container.scrollLeft <= 10) {
        container.scrollTo({ left: container.scrollWidth, behavior: 'smooth' });
      } else {
        container.scrollBy({ left: -scrollStep, behavior: 'smooth' });
      }
    } else {
      if (Math.ceil(container.scrollLeft + container.clientWidth) >= container.scrollWidth - 10) {
        container.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        container.scrollBy({ left: scrollStep, behavior: 'smooth' });
      }
    }
    setNoticiasTimerKey(k => k + 1);
  };

  const scrollArticulos = (direction) => {
    if (!articulosCarouselRef.current) return;
    const container = articulosCarouselRef.current;
    const firstCard = container.querySelector('.pub-art-card');
    const cardWidth = firstCard ? firstCard.offsetWidth : 360;
    const scrollStep = cardWidth + 35;

    if (direction === 'left') {
      if (container.scrollLeft <= 10) {
        container.scrollTo({ left: container.scrollWidth, behavior: 'smooth' });
      } else {
        container.scrollBy({ left: -scrollStep, behavior: 'smooth' });
      }
    } else {
      if (Math.ceil(container.scrollLeft + container.clientWidth) >= container.scrollWidth - 10) {
        container.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        container.scrollBy({ left: scrollStep, behavior: 'smooth' });
      }
    }
    setArticulosTimerKey(k => k + 1);
  };

  const [isNoticiasHovered, setIsNoticiasHovered] = useState(false);
  const [isArticulosHovered, setIsArticulosHovered] = useState(false);

  // Auto-scroll de noticias cada 3s si no hay interacción (reinicia temporizador al hacer clic)
  useEffect(() => {
    if (isNoticiasHovered || !openNoticias || noticias.length <= 1) return;
    const timer = setInterval(() => {
      scrollNoticias('right');
    }, 3000);
    return () => clearInterval(timer);
  }, [isNoticiasHovered, openNoticias, noticias.length, noticiasTimerKey]);

  // Auto-scroll de artículos cada 3s si no hay interacción (reinicia temporizador al hacer clic)
  useEffect(() => {
    if (isArticulosHovered || !openArticulos || articulos.length <= 1) return;
    const timer = setInterval(() => {
      scrollArticulos('right');
    }, 3000);
    return () => clearInterval(timer);
  }, [isArticulosHovered, openArticulos, articulos.length, articulosTimerKey]);

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
    const fetchNoticias = fetchDeduplicated(`${API_BASE_URL}/noticias?estado=Publicado&limit=15&lang=${language}`).then(res => res.json()).catch(() => []);
    const fetchArticulos = fetchDeduplicated(`${API_BASE_URL}/articulos?estado=Publicado&limit=15&lang=${language}`).then(res => res.json()).catch(() => []);
    const fetchNodosCount = fetchDeduplicated(`${API_BASE_URL}/nodos/count`).then(res => res.json()).catch(() => ({ count: 0 }));
    const fetchCategoriasCount = fetchDeduplicated(`${API_BASE_URL}/categorias/count`).then(res => res.json()).catch(() => ({ count: 0 }));

    Promise.all([fetchNoticias, fetchArticulos, fetchNodosCount, fetchCategoriasCount])
      .then(([dataNoticias, dataArticulos, resNodos, resCategorias]) => {
        setNodosCount(resNodos?.count ?? 0);
        setCategoriasCount(resCategorias?.count ?? 0);

        const listNoticias = (dataNoticias && Array.isArray(dataNoticias.data)) 
          ? dataNoticias.data 
          : (Array.isArray(dataNoticias) ? dataNoticias : []);

        const listArticulos = (dataArticulos && Array.isArray(dataArticulos.data)) 
          ? dataArticulos.data 
          : (Array.isArray(dataArticulos) ? dataArticulos : []);

        const noticiasList = listNoticias
          .filter(item => item.estado === 'Publicado')
          .sort((a, b) => {
            const dateA = new Date(a.updated_at || a.updatedAt || a.created_at || a.createdAt || 0);
            const dateB = new Date(b.updated_at || b.updatedAt || b.created_at || b.createdAt || 0);
            return dateB - dateA;
          })
          .map(item => {
            const dateToUse = item.updated_at || item.updatedAt || item.created_at || item.createdAt;
            return {
              id: item.id,
              tipo: 'noticia',
              titulo: item.titulo,
              autor: item.autor,
              contenido: item.contenido,
              imagenUrl: item.imagen_url || item.imagenUrl || '',
              createdAt: dateToUse ? new Date(dateToUse) : new Date(0),
              fechaStr: formatFecha(dateToUse, language)
            };
          });

        const articulosList = listArticulos
          .filter(item => item.estado === 'Publicado')
          .sort((a, b) => {
            const dateA = new Date(a.updated_at || a.updatedAt || a.created_at || a.createdAt || 0);
            const dateB = new Date(b.updated_at || b.updatedAt || b.created_at || b.createdAt || 0);
            return dateB - dateA;
          })
          .map(item => {
            const dateToUse = item.updated_at || item.updatedAt || item.created_at || item.createdAt;
            return {
              id: item.id,
              tipo: 'articulo',
              tipo_registro: item.tipo_registro,
              revista: item.revista,
              titulo: item.titulo,
              autores: item.autores,
              url_pdf: item.url_pdf,
              createdAt: dateToUse ? new Date(dateToUse) : new Date(0),
              created_at: dateToUse
            };
          });

        setNoticias(noticiasList);
        setArticulos(articulosList);
      })
      .catch(err => {
        console.error("Error loading updates for home portal:", err);
      });
  }, [language]);

  const obtenerResumen = (contenidoRaw) => {
    let text = '';
    try {
      if (contenidoRaw && contenidoRaw.startsWith('[')) {
        const blocks = JSON.parse(contenidoRaw);
        const textBlocks = blocks.filter(b => b.type === 'text' && b.value);
        if (textBlocks.length > 0) {
          text = textBlocks[0].value;
        }
      }
    } catch (e) {}
    if (!text) {
      text = contenidoRaw || '';
    }

    text = text.trim();

    if (text.length > 170) {
      const truncated = text.substring(0, 170);
      const lastSpace = truncated.lastIndexOf(' ');
      const cleanText = lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated;
      return `${cleanText} [...]`;
    }
    return text;
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
          {/* Header con Icono Circular y Hitos e Investigación en la MISMA LÍNEA */}
          <div className="uleam-accordion-header-main text-center">
            <div className="uleam-header-title-row">
              <div className="uleam-circle-icon-badge">
                <NewspaperIcon />
              </div>
              <h2 className="uleam-accordion-main-title">
                <EditableText textKey="home_news_title" defaultText={t("home.featured_news", "Hitos e Investigación IoT")} />
              </h2>
            </div>
          </div>

          <div className="uleam-accordions-container">
            {/* Apartado 1: Noticias ULEAM (Estilo Imagen 1) */}
            <div className="uleam-accordion-item">
              <button
                type="button"
                className="uleam-accordion-btn"
                onClick={() => setOpenNoticias(!openNoticias)}
              >
                <span>{t("nav.news", "Noticias")}</span>
                <svg 
                  className={`uleam-accordion-chevron ${openNoticias ? 'open' : ''}`} 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2.5" 
                  width="18" 
                  height="18"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {openNoticias && (
                <div className="uleam-accordion-content">
                  <div className="carousel-with-side-arrows-wrapper">
                    {noticias.length > 0 && (
                      <button 
                        type="button"
                        className="carousel-side-arrow prev-arrow" 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          scrollNoticias('left');
                        }} 
                        aria-label="Anterior"
                      >
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                      </button>
                    )}

                    <div 
                      className="news-cards-grid" 
                      ref={noticiasCarouselRef} 
                      onScroll={checkNoticiasScrollPosition}
                      onMouseEnter={() => setIsNoticiasHovered(true)}
                      onMouseLeave={() => setIsNoticiasHovered(false)}
                      onTouchStart={() => setIsNoticiasHovered(true)}
                      onTouchEnd={() => setIsNoticiasHovered(false)}
                    >
                      {noticias.length === 0 ? (
                        <div className="no-news-banner" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3.5rem 1.5rem', color: '#64748b', fontStyle: 'italic', border: '2px dashed #cbd5e1', borderRadius: '16px', background: '#ffffff', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48" style={{ color: '#cbd5e1' }}>
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                            <path d="M16 8h2M16 12h2M8 8h4v8H8z" />
                          </svg>
                          <span>{t("common.no_news", "No hay noticias registradas en el sistema.")}</span>
                        </div>
                      ) : (
                        noticias.map((n) => (
                          <div key={`noticia-${n.id}`} className="portal-news-card news-card-uleam-style">
                            <img 
                              src={n.imagenUrl || IotJpg} 
                              alt={n.titulo} 
                              className="portal-news-image" 
                              style={{ height: '200px', width: '100%', objectFit: 'cover' }} 
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = IotJpg;
                              }}
                            />
                            <div className="news-card-content news-card-body-uleam">
                              <h3 className="news-card-title-red">{n.titulo}</h3>

                              <div className="news-card-date-centered">
                                {n.fechaStr ? n.fechaStr.toUpperCase() : ''}
                              </div>

                              <p className="news-card-summary-centered">
                                {obtenerResumen(n.contenido)}
                              </p>

                              <div className="news-card-footer-btn-wrapper">
                                <Link
                                  to={`/${language}/${newsSlug}?id=${n.id}`}
                                  className="btn-read-more-solid"
                                >
                                  {t("home.read_more", "LEER MÁS")}
                                </Link>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {noticias.length > 0 && (
                      <button 
                        type="button"
                        className="carousel-side-arrow next-arrow" 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          scrollNoticias('right');
                        }} 
                        aria-label="Siguiente"
                      >
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                      </button>
                    )}
                  </div>

                  <div className="uleam-accordion-more-btn-wrapper">
                    <Link 
                      to={`/${language}/${newsSlug}`}
                      className="btn-mas-noticias"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                        <polyline points="15 3 21 3 21 9"></polyline>
                        <line x1="10" y1="14" x2="21" y2="3"></line>
                      </svg>
                      {t("home.more_news", "MÁS NOTICIAS")}
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Apartado 2: Artículos Científicos */}
            <div className="uleam-accordion-item">
              <button
                type="button"
                className="uleam-accordion-btn"
                onClick={() => setOpenArticulos(!openArticulos)}
              >
                <span>{t("nav.articles", "Artículos")}</span>
                <svg 
                  className={`uleam-accordion-chevron ${openArticulos ? 'open' : ''}`} 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2.5" 
                  width="18" 
                  height="18"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {openArticulos && (
                <div className="uleam-accordion-content">
                  <div className="carousel-with-side-arrows-wrapper">
                    {articulos.length > 0 && (
                      <button 
                        type="button"
                        className="carousel-side-arrow prev-arrow" 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          scrollArticulos('left');
                        }} 
                        aria-label="Anterior"
                      >
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                      </button>
                    )}

                    <div 
                      className="news-cards-grid" 
                      ref={articulosCarouselRef} 
                      onScroll={checkArticulosScrollPosition}
                      onMouseEnter={() => setIsArticulosHovered(true)}
                      onMouseLeave={() => setIsArticulosHovered(false)}
                      onTouchStart={() => setIsArticulosHovered(true)}
                      onTouchEnd={() => setIsArticulosHovered(false)}
                    >
                      {articulos.length === 0 ? (
                        <div className="no-news-banner" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3.5rem 1.5rem', color: '#64748b', fontStyle: 'italic', border: '2px dashed #cbd5e1', borderRadius: '16px', background: '#ffffff', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                          <BookOpenIcon />
                          <span>{t("common.no_articles", "No hay artículos científicos registrados en el sistema.")}</span>
                        </div>
                      ) : (
                        articulos.map((n) => (
                          <Link 
                            key={`articulo-${n.id}`} 
                            to={n.tipo_registro === 'PDF' && n.url_pdf ? formatExternalUrl(n.url_pdf) : `/${language}/${articlesSlug}?id=${n.id}`}
                            target={n.tipo_registro === 'PDF' && n.url_pdf ? "_blank" : "_self"}
                            rel="noopener noreferrer"
                            className={`pub-art-card ${n.tipo_registro === 'PDF' ? 'card-pdf' : 'card-internal'}`}
                            style={{ textDecoration: 'none', color: 'inherit' }}
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
                            </div>
                          </Link>
                        ))
                      )}
                    </div>

                    {articulos.length > 0 && (
                      <button 
                        type="button"
                        className="carousel-side-arrow next-arrow" 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          scrollArticulos('right');
                        }} 
                        aria-label="Siguiente"
                      >
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                      </button>
                    )}
                  </div>

                  <div className="uleam-accordion-more-btn-wrapper">
                    <Link 
                      to={`/${language}/${articlesSlug}`}
                      className="btn-mas-noticias"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                        <polyline points="15 3 21 3 21 9"></polyline>
                        <line x1="10" y1="14" x2="21" y2="3"></line>
                      </svg>
                      {t("home.more_articles", "MÁS ARTÍCULOS")}
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </HideableSection>
    </main>
  );
}