import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import '../styles/NoticiasPublicas.css';
import '../styles/ArticulosPublicos.css';
import EditableText from '../components/EditableText';

// SVG Icons
const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

// Componente de Carrusel Interactivo para Fotos de Investigación
const PublicCarousel = ({ images }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isInteracted, setIsInteracted] = useState(false);

  useEffect(() => {
    if (isInteracted) return; // Si fue tocada, detener auto-play

    const interval = setInterval(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 3500); // Rotación automática cada 3.5 segundos

    return () => clearInterval(interval);
  }, [images.length, isInteracted]);

  const handlePrev = (e) => {
    e.stopPropagation();
    setIsInteracted(true);
    setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setIsInteracted(true);
    setActiveIndex((prev) => (prev + 1) % images.length);
  };

  if (!images || images.length === 0) return null;

  return (
    <div className="pub-news-carousel-wrapper">
      <div className="pub-news-carousel-slides">
        <img src={images[activeIndex]} alt={`Slide ${activeIndex + 1}`} className="pub-news-carousel-image" />
      </div>

      {images.length > 1 && (
        <>
          {/* Botones de control SVG */}
          <button onClick={handlePrev} className="pub-news-carousel-btn prev" aria-label="Anterior">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="18" height="18">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button onClick={handleNext} className="pub-news-carousel-btn next" aria-label="Siguiente">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="18" height="18">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          {/* Indicadores de puntos */}
          <div className="pub-news-carousel-dots">
            {images.map((_, i) => (
              <span
                key={i}
                onClick={() => { setIsInteracted(true); setActiveIndex(i); }}
                className={`pub-news-carousel-dot ${i === activeIndex ? 'active' : ''}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default function NoticiasPublicas() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [noticias, setNoticias] = useState([]);
  const [noticiaSeleccionada, setNoticiaSeleccionada] = useState(null);

  const [busqueda, setBusqueda] = useState('');
  const [filtroAnio, setFiltroAnio] = useState(null);
  const [criterioOrden, setCriterioOrden] = useState(null);
  const [ordenFecha, setOrdenFecha] = useState('desc');
  const [ordenAlfa, setOrdenAlfa] = useState('asc');
  const [paginaActual, setPaginaActual] = useState(1);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  const noticiaIdParam = searchParams.get('id');

  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda, filtroAnio, criterioOrden, ordenFecha, ordenAlfa]);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/noticias')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          // Filtrar por publicadas, mapear y ordenar del más reciente al más antiguo
          const publicadas = data
            .filter(item => item.estado === 'Publicado')
            .map(item => ({
              id: item.id,
              titulo: item.titulo,
              autor: item.autor,
              contenido: item.contenido,
              imagenUrl: item.imagen_url || item.imagenUrl || '',
              fecha: item.created_at ? new Date(item.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }) : new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }),
              created_at: item.created_at
            }));
          setNoticias(publicadas);

          // Sincronizar selección si viene el ID en la URL
          if (noticiaIdParam) {
            const encontrada = publicadas.find(n => String(n.id) === String(noticiaIdParam));
            if (encontrada) {
              setNoticiaSeleccionada(encontrada);
            }
          }
        }
      })
      .catch(err => {
        console.error("Error fetching news:", err);
      });
  }, [noticiaIdParam]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.pub-news-filter-group')) {
        setShowFilterPanel(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  // Dynamically compute available publication years
  const aniosDisponibles = Array.from(
    new Set(
      noticias
        .map(n => n.created_at ? new Date(n.created_at).getFullYear() : null)
        .filter(yr => yr !== null)
    )
  ).sort((a, b) => b - a);

  // Helper to construct dynamic button text
  const obtenerTextoFiltro = () => {
    const filtrosActivos = [];
    if (filtroAnio !== null) {
      filtrosActivos.push(filtroAnio);
    }
    if (criterioOrden === 'fecha') {
      filtrosActivos.push(ordenFecha === 'desc' ? 'Recientes' : 'Antiguos');
    } else if (criterioOrden === 'alfabetico') {
      filtrosActivos.push(ordenAlfa === 'asc' ? 'A-Z' : 'Z-A');
    }

    if (filtrosActivos.length === 0) {
      return 'Filtrar y Ordenar';
    }
    return filtrosActivos.join(' • ');
  };

  // Filter and Sort news list
  const noticiasFiltradas = noticias
    .filter(n => {
      // 1. Text Search
      const query = busqueda.toLowerCase().trim();
      const cumpleQuery = !query ||
        n.titulo.toLowerCase().includes(query) ||
        n.autor.toLowerCase().includes(query) ||
        n.contenido.toLowerCase().includes(query);

      // 2. Year Filter
      let cumpleAnio = true;
      if (filtroAnio !== null) {
        const year = n.created_at ? new Date(n.created_at).getFullYear() : null;
        cumpleAnio = String(year) === String(filtroAnio);
      }

      return cumpleQuery && cumpleAnio;
    })
    .sort((a, b) => {
      // 3. Sorting
      if (criterioOrden === 'fecha') {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return ordenFecha === 'desc' ? timeB - timeA : timeA - timeB;
      } else if (criterioOrden === 'alfabetico') {
        const comp = a.titulo.localeCompare(b.titulo);
        return ordenAlfa === 'asc' ? comp : -comp;
      } else {
        // default: newest first (Reciente desc)
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return timeB - timeA;
      }
    });

  // Pagination Calculations
  const itemsPerPage = 9;
  const totalItems = noticiasFiltradas.length;
  const totalPaginas = Math.ceil(totalItems / itemsPerPage);

  const indiceInicio = (paginaActual - 1) * itemsPerPage;
  const indiceFin = indiceInicio + itemsPerPage;
  const noticiasPaginadas = noticiasFiltradas.slice(indiceInicio, indiceFin);

  const handleLeerMasClick = (n) => {
    setSearchParams({ id: n.id });
    setNoticiaSeleccionada(n);
    window.scrollTo(0, 0); // Desplaza el scroll arriba para leer cómodamente
  };

  const handleVolverClick = () => {
    setSearchParams({});
    setNoticiaSeleccionada(null);
    window.scrollTo(0, 0);
  };

  // Helper para extraer un resumen en formato de texto plano
  const obtenerResumen = (contenidoRaw) => {
    try {
      if (contenidoRaw && contenidoRaw.startsWith('[')) {
        const blocks = JSON.parse(contenidoRaw);
        const textBlocks = blocks.filter(b => b.type === 'text' && b.value);
        if (textBlocks.length > 0) {
          const firstText = textBlocks[0].value;
          return firstText.length > 160 ? `${firstText.substring(0, 160)}...` : firstText;
        }
        return "Ver imágenes de investigación adjuntas en el artículo.";
      }
    } catch (e) { }

    return contenidoRaw && contenidoRaw.length > 160 ? `${contenidoRaw.substring(0, 160)}...` : (contenidoRaw || '');
  };

  // Helper para renderizar los bloques dinámicos secuencialmente en el lector
  const renderContenidoArticulo = (contenidoRaw) => {
    try {
      if (contenidoRaw && contenidoRaw.startsWith('[')) {
        const blocks = JSON.parse(contenidoRaw);
        return blocks.map((block, idx) => {
          if (block.type === 'text') {
            return (
              <p key={block.id || idx} className="pub-news-reader-text-block" style={{ marginBottom: '1.5rem' }}>
                {block.value}
              </p>
            );
          } else if (block.type === 'image') {
            return block.value ? (
              <div key={block.id || idx} className="pub-news-reader-image-block-wrapper" style={{ margin: '2rem 0', borderRadius: '12px', overflow: 'hidden', border: '1px solid #cbd5e1', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                <img src={block.value} alt="Gráfico de investigación" style={{ width: '100%', maxHeight: '480px', objectFit: 'contain', background: '#f8fafc', display: 'block' }} />
              </div>
            ) : null;
          } else if (block.type === 'carousel') {
            return (
              <PublicCarousel key={block.id || idx} images={block.value || []} />
            );
          }
          return null;
        });
      }
    } catch (e) {
      console.error("Error parsing content blocks", e);
    }
    return <p className="pub-news-reader-text-block">{contenidoRaw}</p>;
  };

  // MODO LECTURA A PANTALLA COMPLETA
  if (noticiaSeleccionada) {
    return (
      <div className="pub-news-reader-container">
        {/* Botón de Retorno */}
        <div className="pub-news-reader-nav">
          <button onClick={handleVolverClick} className="pub-news-btn-back">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}>
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            <EditableText textKey="news_btn_back" defaultText="Volver a noticias" />
          </button>
        </div>

        {/* Portada si existe */}
        {noticiaSeleccionada.imagenUrl && (
          <div className="pub-news-reader-hero">
            <img src={noticiaSeleccionada.imagenUrl} alt={noticiaSeleccionada.titulo} className="pub-news-reader-cover" />
          </div>
        )}

        <article className="pub-news-reader-article">
          <div className="pub-news-reader-meta">
            <CalendarIcon />
            <span style={{ marginLeft: '6px' }}>{noticiaSeleccionada.fecha}</span>
          </div>

          <h1 className="pub-news-reader-title">{noticiaSeleccionada.titulo}</h1>

          <div className="pub-news-reader-author-row">
            <div className="pub-news-reader-avatar">
              {noticiaSeleccionada.autor.charAt(0).toUpperCase()}
            </div>
            <div className="pub-news-reader-author-info">
              <span className="pub-news-reader-author-name">{noticiaSeleccionada.autor}</span>
              <span className="pub-news-reader-author-label">
                <EditableText textKey="news_author_label" defaultText="Investigador / Divulgador en IoT ULEAM" />
              </span>
            </div>
          </div>

          <div className="pub-news-reader-body">
            {renderContenidoArticulo(noticiaSeleccionada.contenido)}
          </div>

          <div className="pub-news-reader-footer">
            <button onClick={handleVolverClick} className="pub-news-btn-back">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}>
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              <EditableText textKey="news_btn_back" defaultText="Volver a noticias" />
            </button>
          </div>
        </article>
      </div>
    );
  }

  // MODO LISTADO DE NOTICIAS
  return (
    <div className="pub-news-container">
      {/* Cabecera de la Página y Barra de Filtros */}
      <div className="pub-news-header-row">
        <div className="pub-news-header" style={{ margin: 0, textAlign: 'left', display: 'inline-block', width: 'fit-content' }}>
          <h1 className="pub-news-main-title">
            <EditableText textKey="news_main_title" defaultText="Noticias & Divulgación" />
          </h1>
          <div className="pub-news-title-underline" />
        </div>

        {/* Sleek Filter and Search Toolbar */}
        <div className="pub-news-toolbar">
          {/* Unified Filter and Sort Component */}
          <div className="pub-news-filter-group" style={{ position: 'relative' }}>
            <button
              type="button"
              className={`pub-news-unified-filter-btn ${showFilterPanel ? 'open' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setShowFilterPanel(!showFilterPanel);
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              <span>{obtenerTextoFiltro()}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12" className="select-arrow-icon">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {showFilterPanel && (
              <div className="pub-news-unified-filter-panel">
                {/* Column 1: Year */}
                <div className="filter-panel-section">
                  <span className="filter-panel-section-title">Año</span>
                  <div className="filter-panel-options-list">
                    {aniosDisponibles.map(yr => (
                      <button
                        key={yr}
                        type="button"
                        className={`filter-panel-option-item ${String(filtroAnio) === String(yr) ? 'active' : ''}`}
                        onClick={() => {
                          if (filtroAnio === String(yr)) {
                            setFiltroAnio(null); // Deselect
                          } else {
                            setFiltroAnio(String(yr));
                          }
                        }}
                      >
                        {yr}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Divider line */}
                <div className="filter-panel-divider" />

                {/* Column 2: Sorting */}
                <div className="filter-panel-section">
                  <span className="filter-panel-section-title">Ordenar por</span>
                  <div className="filter-panel-options-list">
                    <button
                      type="button"
                      className={`filter-panel-option-item ${criterioOrden === 'fecha' && ordenFecha === 'desc' ? 'active' : ''}`}
                      onClick={() => {
                        if (criterioOrden === 'fecha' && ordenFecha === 'desc') {
                          setCriterioOrden(null); // Deselect
                        } else {
                          setCriterioOrden('fecha');
                          setOrdenFecha('desc');
                        }
                      }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <polyline points="19 12 12 19 5 12" />
                      </svg>
                      <span>Más recientes</span>
                    </button>

                    <button
                      type="button"
                      className={`filter-panel-option-item ${criterioOrden === 'fecha' && ordenFecha === 'asc' ? 'active' : ''}`}
                      onClick={() => {
                        if (criterioOrden === 'fecha' && ordenFecha === 'asc') {
                          setCriterioOrden(null); // Deselect
                        } else {
                          setCriterioOrden('fecha');
                          setOrdenFecha('asc');
                        }
                      }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12">
                        <line x1="12" y1="19" x2="12" y2="5" />
                        <polyline points="5 12 12 5 19 12" />
                      </svg>
                      <span>Más antiguos</span>
                    </button>

                    <button
                      type="button"
                      className={`filter-panel-option-item ${criterioOrden === 'alfabetico' && ordenAlfa === 'asc' ? 'active' : ''}`}
                      onClick={() => {
                        if (criterioOrden === 'alfabetico' && ordenAlfa === 'asc') {
                          setCriterioOrden(null); // Deselect
                        } else {
                          setCriterioOrden('alfabetico');
                          setOrdenAlfa('asc');
                        }
                      }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12">
                        <path d="M4 6h16M4 12h10M4 18h6" />
                      </svg>
                      <span>Título: A-Z</span>
                    </button>

                    <button
                      type="button"
                      className={`filter-panel-option-item ${criterioOrden === 'alfabetico' && ordenAlfa === 'desc' ? 'active' : ''}`}
                      onClick={() => {
                        if (criterioOrden === 'alfabetico' && ordenAlfa === 'desc') {
                          setCriterioOrden(null); // Deselect
                        } else {
                          setCriterioOrden('alfabetico');
                          setOrdenAlfa('desc');
                        }
                      }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12">
                        <path d="M4 6h16M4 12h10M4 18h6" />
                      </svg>
                      <span>Título: Z-A</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Expandable Search Input wrapper */}
          <div className={`pub-news-search-box ${searchExpanded ? 'expanded' : ''}`}>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar noticia..."
              className="pub-news-search-input"
              onBlur={() => {
                if (busqueda.trim() === '') {
                  setSearchExpanded(false);
                }
              }}
            />
            <button
              className="pub-news-search-toggle-btn"
              onClick={() => {
                setSearchExpanded(!searchExpanded);
                if (!searchExpanded) {
                  setTimeout(() => {
                    document.querySelector('.pub-news-search-input')?.focus();
                  }, 150);
                }
              }}
              aria-label="Buscar"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20" className="pub-news-search-icon-svg">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Grilla de Noticias */}
      <div className="pub-news-grid">
        {noticiasPaginadas.length === 0 ? (
          <div className="pub-news-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48" style={{ color: '#cbd5e1' }}>
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <path d="M16 8h2M16 12h2M8 8h4v8H8z" />
            </svg>
            <span><EditableText textKey="news_empty_message" defaultText="No se encontraron noticias con los filtros establecidos." /></span>
          </div>
        ) : (
          noticiasPaginadas.map((n, index) => (
            <div key={n.id} className="pub-news-card">
              <div className="pub-news-image-wrapper">
                {n.imagenUrl ? (
                  <img src={n.imagenUrl} alt={n.titulo} className="pub-news-image" />
                ) : (
                  <div className={`pub-news-fallback-banner ${['banner-green', 'banner-blue', 'banner-red'][index % 3]}`} style={{ height: '100%' }} />
                )}
              </div>

              <div className="pub-news-content">
                <div className="pub-news-meta">
                  <CalendarIcon />
                  <span style={{ marginLeft: '6px' }}>{n.fecha}</span>
                </div>
                <h3 className="pub-news-card-title">{n.titulo}</h3>
                <p className="pub-news-excerpt">{obtenerResumen(n.contenido)}</p>

                <div className="pub-news-footer">
                  <span className="pub-news-author-badge" title={`Autor: ${n.autor}`}>
                    <EditableText textKey="news_author_prefix" defaultText="Por: " /> {n.autor}
                  </span>
                  <button
                    onClick={() => handleLeerMasClick(n)}
                    className="pub-news-btn-read"
                  >
                    <EditableText textKey="news_read_more" defaultText="Leer más" /> <ArrowRightIcon />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* PAGINATION CONTROL (Google Scholar Style) */}
      {totalPaginas > 1 && (
        <div className="pub-art-pagination">
          <button
            className="pub-art-pagination-btn"
            disabled={paginaActual === 1}
            onClick={() => {
              setPaginaActual(prev => Math.max(prev - 1, 1));
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <EditableText textKey="news_pagination_prev" defaultText="Anterior" />
          </button>

          <div className="pub-art-pagination-numbers">
            {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((pg) => (
              <button
                key={pg}
                className={`pub-art-pagination-number ${paginaActual === pg ? 'active' : ''}`}
                onClick={() => {
                  setPaginaActual(pg);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                {pg}
              </button>
            ))}
          </div>

          <button
            className="pub-art-pagination-btn"
            disabled={paginaActual === totalPaginas}
            onClick={() => {
              setPaginaActual(prev => Math.min(prev + 1, totalPaginas));
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <EditableText textKey="news_pagination_next" defaultText="Siguiente" />
          </button>
        </div>
      )}
    </div>
  );
}
