import { API_BASE_URL, fetchDeduplicated } from '../config/api';
import SEO from "../components/SEO";
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { useInterfaceText } from '../context/InterfaceTextContext';
import EditableText from '../components/EditableText';
import { formatExternalUrl } from '../utils/urlUtils';

const formatImageUrl = (urlStr) => {
  if (!urlStr) return '';
  if (urlStr.startsWith('data:') || urlStr.startsWith('http://') || urlStr.startsWith('https://')) {
    return urlStr;
  }
  const backendHost = API_BASE_URL.replace(/\/api\/?$/, '');
  return `${backendHost}${urlStr.startsWith('/') ? '' : '/'}${urlStr}`;
};

export default function ArticulosPublicos() {
  const { language, t } = useLanguage();
  const { texts } = useInterfaceText();
  usePageTitle(language === 'en' ? 'Articles' : 'Artículos');
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [articulos, setArticulos] = useState([]);
  const [articuloSeleccionado, setArticuloSeleccionado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [busqueda, setBusqueda] = useState('');
  const [debouncedBusqueda, setDebouncedBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState(null);
  const [filtroAnio, setFiltroAnio] = useState(null);
  const [ordenarPor, setOrdenarPor] = useState(null);
  const [paginaActual, setPaginaActual] = useState(1);
  const [aniosDisponibles, setAniosDisponibles] = useState([]);
  const [modalImagenFull, setModalImagenFull] = useState(null);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  
  const searchInputRef = useRef(null);
  const artCarouselRef = useRef(null);

  // Debounce para evitar llamadas repetidas a la API al escribir
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedBusqueda(busqueda);
    }, 350);
    return () => clearTimeout(handler);
  }, [busqueda]);

  // Cargar años únicos desde la base de datos
  useEffect(() => {
    fetchDeduplicated(`${API_BASE_URL}/articulos/anios`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setAniosDisponibles(data);
        } else {
          setAniosDisponibles([new Date().getFullYear()]);
        }
      })
      .catch(() => {
        setAniosDisponibles([new Date().getFullYear()]);
      });
  }, []);

  useEffect(() => {
    if (searchExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchExpanded]);

  useEffect(() => {
    setPaginaActual(1);
  }, [debouncedBusqueda, filtroTipo, filtroAnio, ordenarPor]);

  const articuloIdParam = searchParams.get('id');

  // Cargar artículos científicos desde el backend con paginación y búsqueda
  useEffect(() => {
    setLoading(true);
    let sortParam = 'recientes';
    if (ordenarPor === 'Antiguo') {
      sortParam = 'antiguos';
    } else if (ordenarPor === 'Titulo_ASC') {
      sortParam = 'alfa_asc';
    } else if (ordenarPor === 'Titulo_DESC') {
      sortParam = 'alfa_desc';
    }

    let url = `${API_BASE_URL}/articulos?lang=${language}&estado=Publicado&page=${paginaActual}&per_page=9&sort=${sortParam}`;
    if (debouncedBusqueda.trim()) {
      url += `&search=${encodeURIComponent(debouncedBusqueda.trim())}`;
    }
    if (filtroAnio !== null && filtroAnio !== 'todos') {
      url += `&year=${encodeURIComponent(filtroAnio)}`;
    }

    fetchDeduplicated(url)
      .then(res => res.json())
      .then(data => {
        let rawList = [];
        if (data && data.data && Array.isArray(data.data)) {
          rawList = data.data;
          setTotalPaginas(data.last_page || 1);
          setTotalItems(data.total || 0);
        } else if (Array.isArray(data)) {
          rawList = data;
          setTotalPaginas(Math.ceil(data.length / 9) || 1);
          setTotalItems(data.length);
        }
        setArticulos(rawList);
      })
      .catch(err => {
        console.error("Error loading public articles:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [language, paginaActual, debouncedBusqueda, filtroAnio, ordenarPor]);

  useEffect(() => {
    if (articulos.length > 0 && articuloIdParam) {
      const encontrado = articulos.find(a => String(a.id) === String(articuloIdParam));
      if (encontrado && (encontrado.tipo_registro !== 'PDF' || !encontrado.url_pdf)) {
        setArticuloSeleccionado(encontrado);
      } else {
        setArticuloSeleccionado(null);
      }
    } else if (!articuloIdParam) {
      setArticuloSeleccionado(null);
    }
  }, [articuloIdParam, articulos]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (e.target && typeof e.target.closest === 'function') {
        if (!e.target.closest('.pub-news-filter-group')) {
          setShowFilterPanel(false);
        }
        if (!e.target.closest('.pub-news-search-box')) {
          const searchInput = document.querySelector('.pub-news-search-input');
          if (!searchInput || !searchInput.value) {
            setSearchExpanded(false);
          }
        }
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  const slugify = (text) => {
    if (!text) return '';
    return text
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  const handleLeerMasClick = (art) => {
    if (art.tipo_registro === 'PDF' && art.url_pdf) {
      window.open(formatExternalUrl(art.url_pdf), '_blank');
      return;
    }
    const slug = slugify(art.titulo);
    setSearchParams({ id: art.id, slug: slug });
    setArticuloSeleccionado(art);
    window.scrollTo(0, 0);
  };

  // Mantener actualizado el slug en la URL al cambiar de idioma dentro de un artículo
  useEffect(() => {
    if (articuloSeleccionado) {
      const slug = slugify(articuloSeleccionado.titulo);
      setSearchParams({ id: articuloSeleccionado.id, slug: slug });
    }
  }, [language, articuloSeleccionado]);

  const handleVolverClick = (e) => {
    if (e) e.stopPropagation();
    setArticuloSeleccionado(null);
    setSearchParams({});
    window.scrollTo(0, 0);
  };

  const scrollCarousel = (direction) => {
    if (!artCarouselRef.current) return;
    const scrollAmount = artCarouselRef.current.clientWidth * 0.85;
    artCarouselRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  const formatReferences = (refsText) => {
    if (!refsText) return [];
    return refsText.split('\n').filter(line => line.trim() !== '');
  };

  const formatFecha = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString(language === 'en' ? 'en-US' : 'es-ES', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
  };

  const obtenerTextoFiltro = () => {
    const filtrosActivos = [];
    if (filtroAnio !== null && filtroAnio !== 'todos') {
      filtrosActivos.push(filtroAnio);
    }
    if (ordenarPor === 'Antiguo') {
      filtrosActivos.push(language === 'en' ? 'Oldest first' : 'Más antiguos');
    } else if (ordenarPor === 'Reciente') {
      filtrosActivos.push(language === 'en' ? 'Newest first' : 'Más recientes');
    } else if (ordenarPor === 'Titulo_ASC') {
      filtrosActivos.push(language === 'en' ? 'By A-Z' : 'Por A-Z');
    } else if (ordenarPor === 'Titulo_DESC') {
      filtrosActivos.push(language === 'en' ? 'By Z-A' : 'Por Z-A');
    }

    if (filtrosActivos.length === 0) {
      return null;
    }
    return filtrosActivos.join(' • ');
  };

  if (articuloSeleccionado) {
    return (
      <div className="pub-art-reader-container">
        <SEO 
          title={`${articuloSeleccionado.titulo} - ${language === 'en' ? 'Articles' : 'Artículos'}`}
          description={articuloSeleccionado.resumen || (language === 'en' ? "Scientific article details." : "Detalles del artículo científico.")}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <button onClick={handleVolverClick} className="pub-art-btn-back">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}>
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            <EditableText textKey="art_btn_back" defaultText={t("common.close", "Volver")} />
          </button>

          {articuloSeleccionado.url_pdf && (
            <a
              href={formatExternalUrl(articuloSeleccionado.url_pdf)}
              target="_blank"
              rel="noopener noreferrer"
              className="pub-paper-btn-pdf"
            >
              {t("articles.download_pdf", "Descargar PDF Original")}
            </a>
          )}
        </div>

        <article className="pub-paper-sheet">
          <span className="pub-paper-badge">
            <EditableText textKey="paper_badge" defaultText="Repositorio Institucional" />
          </span>

          <header className="pub-paper-header">
            <div className="pub-paper-journal">
              {articuloSeleccionado.revista || 'REVISTA ULEAM'}
            </div>

            <h1 className="pub-paper-title">{articuloSeleccionado.titulo}</h1>

            <div className="pub-paper-authors notranslate" translate="no">
              {articuloSeleccionado.autores}
            </div>
          </header>

          <div className="pub-paper-abstract-section">
            <p className="pub-paper-abstract-text">
              <strong>{t("articles.abstract", "Resumen")}—</strong>
              {articuloSeleccionado.resumen}
            </p>

            {articuloSeleccionado.palabras_clave && (
              <div className="pub-paper-keywords">
                <strong>{t("articles.keywords", "Palabras Clave")}—</strong>
                {articuloSeleccionado.palabras_clave}
              </div>
            )}
          </div>

          {articuloSeleccionado.tipo_registro === 'PDF' ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '4rem', padding: '2rem 1rem' }}>
              <a
                href={articuloSeleccionado.url_pdf ? formatExternalUrl(articuloSeleccionado.url_pdf) : '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="pub-paper-btn-pdf"
              >
                <EditableText textKey="paper_btn_pdf" defaultText={t("articles.download_pdf", "Abrir Documento PDF Completo")} />
              </a>
            </div>
          ) : (
            <div className="pub-paper-body">
              {(articuloSeleccionado.introduccion || articuloSeleccionado.introduccion_imagen) && (
                <div className="pub-paper-section">
                  <h2 className="pub-paper-section-title">I. {t("articles.introduction", "Introducción")}</h2>
                  {articuloSeleccionado.introduccion && (
                    <div className="pub-paper-text pub-ieee-dropcap">
                      {articuloSeleccionado.introduccion}
                    </div>
                  )}
                  {articuloSeleccionado.introduccion_imagen && (
                    <div className="pub-paper-figure">
                      <img
                        src={formatImageUrl(articuloSeleccionado.introduccion_imagen)}
                        alt="Fig 1"
                        className="pub-paper-figure-img"
                        onClick={() => setModalImagenFull(formatImageUrl(articuloSeleccionado.introduccion_imagen))}
                        style={{ cursor: 'pointer' }}
                        title={language === 'en' ? 'Click to view full size' : 'Haz clic para ver en tamaño completo'}
                      />
                      <div className="pub-paper-figure-caption">
                        <strong>Fig. 1.</strong> {articuloSeleccionado.introduccion_imagen_descripcion || (language === 'en' ? 'Illustration corresponding to Introduction section.' : 'Ilustración correspondiente a la sección de Introducción.')}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {(articuloSeleccionado.metodologia || articuloSeleccionado.metodologia_imagen) && (
                <div className="pub-paper-section">
                  <h2 className="pub-paper-section-title">II. {t("articles.methodology", "Metodología")}</h2>
                  {articuloSeleccionado.metodologia && (
                    <div className="pub-paper-text">
                      {articuloSeleccionado.metodologia}
                    </div>
                  )}
                  {articuloSeleccionado.metodologia_imagen && (
                    <div className="pub-paper-figure">
                      <img
                        src={formatImageUrl(articuloSeleccionado.metodologia_imagen)}
                        alt="Fig 2"
                        className="pub-paper-figure-img"
                        onClick={() => setModalImagenFull(formatImageUrl(articuloSeleccionado.metodologia_imagen))}
                        style={{ cursor: 'pointer' }}
                        title={language === 'en' ? 'Click to view full size' : 'Haz clic para ver en tamaño completo'}
                      />
                      <div className="pub-paper-figure-caption">
                        <strong>Fig. 2.</strong> {articuloSeleccionado.metodologia_imagen_descripcion || (language === 'en' ? 'Methodological diagram.' : 'Esquema metodológico.')}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {(articuloSeleccionado.resultados || articuloSeleccionado.resultados_imagen) && (
                <div className="pub-paper-section">
                  <h2 className="pub-paper-section-title">III. {t("articles.results", "Resultados")}</h2>
                  {articuloSeleccionado.resultados && (
                    <div className="pub-paper-text">
                      {articuloSeleccionado.resultados}
                    </div>
                  )}
                  {articuloSeleccionado.resultados_imagen && (
                    <div className="pub-paper-figure">
                      <img
                        src={formatImageUrl(articuloSeleccionado.resultados_imagen)}
                        alt="Fig 3"
                        className="pub-paper-figure-img"
                        onClick={() => setModalImagenFull(formatImageUrl(articuloSeleccionado.resultados_imagen))}
                        style={{ cursor: 'pointer' }}
                        title={language === 'en' ? 'Click to view full size' : 'Haz clic para ver en tamaño completo'}
                      />
                      <div className="pub-paper-figure-caption">
                        <strong>Fig. 3.</strong> {articuloSeleccionado.resultados_imagen_descripcion || (language === 'en' ? 'Variable graph and discussion.' : 'Gráfica de variables y discusión.')}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {(articuloSeleccionado.conclusiones || articuloSeleccionado.conclusiones_imagen) && (
                <div className="pub-paper-section">
                  <h2 className="pub-paper-section-title">IV. {t("articles.conclusions", "Conclusiones")}</h2>
                  {articuloSeleccionado.conclusiones && (
                    <div className="pub-paper-text">
                      {articuloSeleccionado.conclusiones}
                    </div>
                  )}
                  {articuloSeleccionado.conclusiones_imagen && (
                    <div className="pub-paper-figure">
                      <img
                        src={formatImageUrl(articuloSeleccionado.conclusiones_imagen)}
                        alt="Fig 4"
                        className="pub-paper-figure-img"
                        onClick={() => setModalImagenFull(formatImageUrl(articuloSeleccionado.conclusiones_imagen))}
                        style={{ cursor: 'pointer' }}
                        title={language === 'en' ? 'Click to view full size' : 'Haz clic para ver en tamaño completo'}
                      />
                      <div className="pub-paper-figure-caption">
                        <strong>Fig. 4.</strong> {articuloSeleccionado.conclusiones_imagen_descripcion || (language === 'en' ? 'Final illustration of implemented solution.' : 'Ilustración final de la solución implementada.')}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {articuloSeleccionado.referencias && (
                <div className="pub-paper-section">
                  <h2 className="pub-paper-section-title">{t("articles.references", "Referencias")}</h2>
                  <ol className="pub-paper-references-list">
                    {formatReferences(articuloSeleccionado.referencias).map((ref, idx) => (
                      <li key={idx} className="pub-paper-reference-item">{ref}</li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}

          <div className="pub-news-reader-footer" style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e2e8f0' }}>
            <button onClick={handleVolverClick} className="pub-art-btn-back">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}>
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              <EditableText textKey="art_btn_back" defaultText={t("common.close", "Volver")} />
            </button>
          </div>
        </article>

        {/* MODAL LIGHTBOX DE IMAGEN A PANTALLA COMPLETA */}
        {modalImagenFull && (
          <div
            onClick={() => setModalImagenFull(null)}
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              zIndex: 9999,
              backgroundColor: 'rgba(0, 0, 0, 0.92)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.5rem',
              backdropFilter: 'blur(8px)',
              animation: 'fadeIn 0.2s ease'
            }}
          >
            <button
              type="button"
              onClick={() => setModalImagenFull(null)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                border: '1.5px solid rgba(255, 255, 255, 0.4)',
                borderRadius: '50%',
                width: '44px',
                height: '44px',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}
              title={language === 'en' ? 'Close' : 'Cerrar'}
            >
              ✕
            </button>
            <img
              src={modalImagenFull}
              alt="Full screen preview"
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: '92vw',
                maxHeight: '90vh',
                objectFit: 'contain',
                borderRadius: '12px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
              }}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="pub-art-container">
      <SEO 
        title={language === 'en' ? "Scientific Articles - IoT ULEAM" : "Artículos Científicos - IoT ULEAM"}
        description={language === 'en' ? "Read our latest scientific articles related to IoT telemetry and research." : "Lee nuestros últimos artículos científicos relacionados a la telemetría IoT e investigación."}
      />
      <div className="pub-news-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem', marginBottom: '2.5rem', textAlign: 'left' }}>
        <div className="pub-news-title-group" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ color: '#d0182b', display: 'inline-flex', alignItems: 'center' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="32" height="32">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              <line x1="8" y1="7" x2="16" y2="7" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
          </span>
          <h1 className="pub-news-main-title" style={{ margin: 0, textAlign: 'left' }}>
            <EditableText textKey="articles_main_title" defaultText={t("articles.title", "Artículos Científicos")} />
          </h1>
        </div>

        <div className="pub-news-toolbar">
          <div className="pub-news-filter-group" style={{ position: 'relative' }}>
            <button
              type="button"
              className={`pub-news-unified-filter-btn ${showFilterPanel ? 'open' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setShowFilterPanel(!showFilterPanel);
              }}
            >
              {(() => {
                const text = obtenerTextoFiltro();
                if (!text) {
                  return (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16" style={{ marginRight: '8px' }}>
                        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                      </svg>
                      <span>{t("common.filter", "Filtrar")}</span>
                    </>
                  );
                }
                return <span>{text}</span>;
              })()}
            </button>

            {showFilterPanel && (
              <div className="pub-news-unified-filter-panel" style={{ minWidth: '350px' }}>
                <div style={{ display: 'flex', gap: '2rem' }}>
                  <div className="filter-panel-section" style={{ flex: 1 }}>
                    <span className="filter-panel-section-title">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="14" height="14" style={{ marginRight: '6px', verticalAlign: 'middle' }}>
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      <EditableText textKey="news_filter_year" defaultText={t("common.date", "Año")} />
                    </span>
                    <div className="filter-panel-options-list">
                      {aniosDisponibles.map(yr => (
                        <button
                          key={yr}
                          type="button"
                          className={`filter-panel-option-item ${String(filtroAnio) === String(yr) ? 'active' : ''}`}
                          onClick={() => setFiltroAnio(filtroAnio === String(yr) ? null : String(yr))}
                        >
                          {yr}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="filter-panel-section" style={{ flex: 1.5 }}>
                    <span className="filter-panel-section-title">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="14" height="14" style={{ marginRight: '6px', verticalAlign: 'middle' }}>
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <polyline points="19 12 12 19 5 12"></polyline>
                      </svg>
                      <EditableText textKey="news_filter_sort" defaultText={t("common.sort", "Ordenar por")} />
                    </span>
                    <div className="filter-panel-options-list">
                      <button
                        type="button"
                        className={`filter-panel-option-item ${ordenarPor === 'Reciente' ? 'active' : ''}`}
                        onClick={() => setOrdenarPor(ordenarPor === 'Reciente' ? null : 'Reciente')}
                      >
                        <EditableText textKey="news_sort_newest" defaultText={t("common.newest", "Más recientes primero")} />
                      </button>
                      <button
                        type="button"
                        className={`filter-panel-option-item ${ordenarPor === 'Antiguo' ? 'active' : ''}`}
                        onClick={() => setOrdenarPor(ordenarPor === 'Antiguo' ? null : 'Antiguo')}
                      >
                        <EditableText textKey="news_sort_oldest" defaultText={t("common.oldest", "Más antiguos primero")} />
                      </button>
                      <button
                        type="button"
                        className={`filter-panel-option-item ${ordenarPor === 'Titulo_ASC' ? 'active' : ''}`}
                        onClick={() => setOrdenarPor(ordenarPor === 'Titulo_ASC' ? null : 'Titulo_ASC')}
                      >
                        <EditableText textKey="news_sort_az" defaultText={t("common.az", "Por A-Z")} />
                      </button>
                      <button
                        type="button"
                        className={`filter-panel-option-item ${ordenarPor === 'Titulo_DESC' ? 'active' : ''}`}
                        onClick={() => setOrdenarPor(ordenarPor === 'Titulo_DESC' ? null : 'Titulo_DESC')}
                      >
                        <EditableText textKey="news_sort_za" defaultText={t("common.za", "Por Z-A")} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className={`pub-news-search-box ${searchExpanded ? 'expanded' : ''}`}>
            <button 
              type="button"
              className="pub-news-search-toggle-btn" 
              onClick={(e) => {
                e.stopPropagation();
                setSearchExpanded(!searchExpanded);
              }}
              title={t("common.search", "Buscar")}
            >
              <svg className="pub-news-search-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
            <input
              ref={searchInputRef}
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onBlur={() => { if(!busqueda.trim()) setSearchExpanded(false); }}
              placeholder={texts['articles_search_placeholder'] || t("common.search", "Buscar artículo...")}
              className="pub-news-search-input"
            />
            {busqueda.trim() && (
              <button
                type="button"
                className="pub-news-search-clear-btn"
                onClick={() => { setBusqueda(''); setSearchExpanded(false); }}
                title="Limpiar"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Banner de "Búsqueda relacionada con" */}
      {debouncedBusqueda.trim() !== '' && (
        <div className="pub-news-search-related-banner">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <span>
            {language === 'en' ? 'Search related to:' : 'Búsqueda relacionada con:'} <strong>"{debouncedBusqueda.trim()}"</strong>
          </span>
          <button
            type="button"
            className="pub-news-search-related-clear"
            onClick={() => { setBusqueda(''); setSearchExpanded(false); }}
            title={language === 'en' ? 'Clear search' : 'Limpiar búsqueda'}
          >
            ✕
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem 1rem', gap: '1rem', minHeight: '300px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="spinner-dot" style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#2563eb', animation: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite' }}></span>
            <span style={{ fontSize: '0.95rem', fontWeight: '600', color: '#64748b' }}>
              {language === 'en' ? 'Loading articles...' : 'Cargando artículos...'}
            </span>
          </div>
        </div>
      ) : (
        <>
          {/* Controles de flecha para carrusel en teléfono (SOLO si hay más de 1 artículo) */}
          {articulos.length > 1 && (
            <div className="pub-news-mobile-arrows-row">
              <button
                type="button"
                className="pub-news-mobile-arrow-btn"
                onClick={() => scrollCarousel('left')}
                aria-label="Anterior"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <button
                type="button"
                className="pub-news-mobile-arrow-btn"
                onClick={() => scrollCarousel('right')}
                aria-label="Siguiente"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          )}

          {articulos.length === 0 ? (
            <div className="pub-art-empty">
              <h3><EditableText textKey="art_empty_title" defaultText={t("articles.no_articles", "No se encontraron publicaciones")} /></h3>
            </div>
          ) : (
            <div className="pub-art-grid" ref={artCarouselRef}>
              {articulos.map((art) => (
                <div
                  key={art.id}
                  id={`article-card-${art.id}`}
                  className={`pub-art-card ${art.tipo_registro === 'PDF' ? 'card-pdf' : 'card-internal'}`}
                  onClick={() => handleLeerMasClick(art)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="pub-art-card-spine">
                    <div className="pub-art-card-spine-text-wrapper">
                      <div className="pub-art-card-spine-text">
                        {art.revista || 'REPOSITORIO CIENTÍFICO ULEAM'}
                      </div>
                    </div>
                  </div>

                  <div className="pub-art-card-right-content">
                    <h3 className="pub-art-card-title">{art.titulo}</h3>

                    <div className="pub-art-card-prepared-by">
                      <div className="pub-art-prepared-label"><EditableText textKey="art_prepared_label" defaultText={t("articles.authors", "Autores")} />:</div>
                      <div className="pub-art-card-authors-text">{art.autores}</div>
                      <div className="pub-art-card-date-text">{formatFecha(art.updated_at || art.created_at)}</div>
                    </div>

                    <div className="pub-art-card-footer" style={{ borderTop: 'none', paddingTop: 0, marginTop: 'auto' }}>
                      <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '600' }}>
                        {t("home.read_more", "Leer más")} →
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* BARRA DE PAGINACIÓN */}
          {totalPaginas > 1 && (
            <div className="pub-art-pagination">
              <button
                className="pub-art-pagination-btn"
                onClick={() => { setPaginaActual(prev => Math.max(prev - 1, 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                disabled={paginaActual === 1}
                title={language === 'en' ? 'Previous page' : 'Página anterior'}
              >
                <svg className="pub-art-pagination-arrow-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                <span className="pub-art-pagination-btn-text">{language === 'en' ? '← Previous' : '← Anterior'}</span>
              </button>
              
              <div className="pub-art-pagination-numbers">
                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(num => (
                  <button
                    key={num}
                    className={`pub-art-pagination-number ${num === paginaActual ? 'active' : ''}`}
                    onClick={() => { setPaginaActual(num); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  >
                    {num}
                  </button>
                ))}
              </div>

              <button
                className="pub-art-pagination-btn"
                onClick={() => { setPaginaActual(prev => Math.min(prev + 1, totalPaginas)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                disabled={paginaActual === totalPaginas}
                title={language === 'en' ? 'Next page' : 'Página siguiente'}
              >
                <span className="pub-art-pagination-btn-text">{language === 'en' ? 'Next →' : 'Siguiente →'}</span>
                <svg className="pub-art-pagination-arrow-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          )}
        </>
      )}

      {/* MODAL LIGHTBOX DE IMAGEN A PANTALLA COMPLETA */}
      {modalImagenFull && (
        <div
          onClick={() => setModalImagenFull(null)}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(0, 0, 0, 0.92)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            backdropFilter: 'blur(8px)',
            animation: 'fadeIn 0.2s ease'
          }}
        >
          <button
            type="button"
            onClick={() => setModalImagenFull(null)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              border: '1.5px solid rgba(255, 255, 255, 0.4)',
              borderRadius: '50%',
              width: '44px',
              height: '44px',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
            title={language === 'en' ? 'Close' : 'Cerrar'}
          >
            ✕
          </button>
          <img
            src={modalImagenFull}
            alt="Full screen preview"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '92vw',
              maxHeight: '90vh',
              objectFit: 'contain',
              borderRadius: '12px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
            }}
          />
        </div>
      )}
    </div>
  );
}
