import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import '../styles/ArticulosPublicos.css';
import EditableText from '../components/EditableText';

export default function ArticulosPublicos() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [articulos, setArticulos] = useState([]);
  const [articuloSeleccionado, setArticuloSeleccionado] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState(null);
  const [filtroAnio, setFiltroAnio] = useState(null);
  const [ordenarPor, setOrdenarPor] = useState(null);
  const [paginaActual, setPaginaActual] = useState(1);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda, filtroTipo, filtroAnio, ordenarPor]);

  const articuloIdParam = searchParams.get('id');

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/articulos')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          // Filter only published articles
          const publicos = data.filter(art => art.estado === 'Publicado');
          setArticulos(publicos);

          // Synchronize selection if ID is in the URL parameters
          if (articuloIdParam) {
            const encontrado = publicos.find(a => String(a.id) === String(articuloIdParam));
            if (encontrada) {
              if (encontrada.tipo_registro === 'PDF' && encontrada.url_pdf) {
                // Directly open external PDF and reset params to avoid empty reader state
                window.open(encontrada.url_pdf, '_blank');
                setSearchParams({});
              } else {
                setArticuloSeleccionado(encontrada);
              }
            }
          }
        }
      })
      .catch(err => {
        console.error("Error loading public articles:", err);
      });
  }, [articuloIdParam, setSearchParams]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.pub-news-filter-group')) {
        setShowFilterPanel(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  const handleLeerMasClick = (art) => {
    if (art.tipo_registro === 'PDF' && art.url_pdf) {
      window.open(art.url_pdf, '_blank');
      return;
    }
    setSearchParams({ id: art.id });
    setArticuloSeleccionado(art);
    window.scrollTo(0, 0);
  };

  const handleVolverClick = () => {
    setSearchParams({});
    setArticuloSeleccionado(null);
    window.scrollTo(0, 0);
  };

  const formatKeywords = (kwStr) => {
    if (!kwStr) return [];
    return kwStr.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
  };

  const formatReferences = (refsText) => {
    if (!refsText) return [];
    return refsText.split('\n').filter(line => line.trim() !== '');
  };

  const formatFecha = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  // Dynamically compute available publication years
  const aniosDisponibles = Array.from(
    new Set(
      articulos
        .map(art => art.created_at ? new Date(art.created_at).getFullYear() : null)
        .filter(yr => yr !== null)
    )
  ).sort((a, b) => b - a);

  // Helper to construct dynamic button text
  const obtenerTextoFiltro = () => {
    const filtrosActivos = [];
    if (filtroTipo !== null) {
      filtrosActivos.push(filtroTipo === 'Completo' ? 'Lectura Digital' : 'Enlaces Externos');
    }
    if (filtroAnio !== null) {
      filtrosActivos.push(filtroAnio);
    }
    if (ordenarPor === 'Antiguo') {
      filtrosActivos.push('Antiguos');
    } else if (ordenarPor === 'Titulo') {
      filtrosActivos.push('A-Z');
    } else if (ordenarPor === 'TituloDesc') {
      filtrosActivos.push('Z-A');
    } else if (ordenarPor === 'Reciente') {
      filtrosActivos.push('Recientes');
    }

    if (filtrosActivos.length === 0) {
      return 'Filtrar y Ordenar';
    }
    return filtrosActivos.join(' • ');
  };

  // Filter and Sort publications list
  const articulosFiltrados = articulos
    .filter(art => {
      // 1. Text Search
      const query = busqueda.toLowerCase().trim();
      const cumpleQuery = !query ||
        art.titulo.toLowerCase().includes(query) ||
        art.autores.toLowerCase().includes(query) ||
        (art.palabras_clave && art.palabras_clave.toLowerCase().includes(query)) ||
        (art.revista && art.revista.toLowerCase().includes(query));

      // 2. Format Type Filter
      let cumpleTipo = true;
      if (filtroTipo !== null) {
        cumpleTipo = art.tipo_registro === filtroTipo;
      }

      // 3. Year Filter
      let cumpleAnio = true;
      if (filtroAnio !== null) {
        const year = art.created_at ? new Date(art.created_at).getFullYear() : null;
        cumpleAnio = String(year) === String(filtroAnio);
      }

      return cumpleQuery && cumpleTipo && cumpleAnio;
    })
    .sort((a, b) => {
      // 4. Sorting
      if (ordenarPor === 'Antiguo') {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return timeA - timeB;
      } else if (ordenarPor === 'Titulo') {
        return a.titulo.localeCompare(b.titulo);
      } else if (ordenarPor === 'TituloDesc') {
        return b.titulo.localeCompare(a.titulo);
      } else if (ordenarPor === 'Reciente') {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return timeB - timeA;
      } else {
        // default: newest first
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return timeB - timeA;
      }
    });

  // Pagination Calculations
  const itemsPerPage = 6;
  const totalItems = articulosFiltrados.length;
  const totalPaginas = Math.ceil(totalItems / itemsPerPage);

  const indiceInicio = (paginaActual - 1) * itemsPerPage;
  const indiceFin = indiceInicio + itemsPerPage;
  const articulosPaginados = articulosFiltrados.slice(indiceInicio, indiceFin);

  // READER MODE: GORGEOUS IEEE DOUBLE COLUMN FORMAT
  if (articuloSeleccionado) {
    return (
      <div className="pub-art-reader-container">
        {/* Navigation row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <button onClick={handleVolverClick} className="pub-art-btn-back">
            <EditableText textKey="art_btn_back" defaultText="← Volver al listado" />
          </button>

          {articuloSeleccionado.url_pdf && (
            <a
              href={articuloSeleccionado.url_pdf}
              target="_blank"
              rel="noopener noreferrer"
              className="pub-paper-btn-pdf"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Descargar PDF Original
            </a>
          )}
        </div>

        {/* Paper Sheet Document styling */}
        <article className="pub-paper-sheet">
          <span className="pub-paper-badge">
            <EditableText textKey="paper_badge" defaultText="Repositorio Institucional" />
          </span>

          <header className="pub-paper-header">
            <div className="pub-paper-journal">
              {articuloSeleccionado.revista || 'REVISTA DE DIVULGACIÓN CIENTÍFICA ULEAM'}
            </div>

            <h1 className="pub-paper-title">{articuloSeleccionado.titulo}</h1>

            <div className="pub-paper-authors">
              {articuloSeleccionado.autores}
            </div>

            <div className="pub-paper-institution">
              <EditableText textKey="paper_institution" defaultText="Facultad de Ciencias Informáticas (FACCI), Universidad Laica Eloy Alfaro de Manabí" isTextArea={true} />
            </div>
          </header>

          {/* Abstract section */}
          <div className="pub-paper-abstract-section">
            <p className="pub-paper-abstract-text">
              <strong>Resumen—</strong>
              {articuloSeleccionado.resumen}
            </p>

            {articuloSeleccionado.palabras_clave && (
              <div className="pub-paper-keywords">
                <strong>Palabras Clave—</strong>
                {articuloSeleccionado.palabras_clave}
              </div>
            )}
          </div>

          {/* Conditional content depending on type */}
          {articuloSeleccionado.tipo_registro === 'PDF' ? (
            /* PDF MODE: ONLY THE COVER DATA + ACCENTED PDF BUTTON */
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '4rem', padding: '2rem 1rem', borderTop: '1px dashed #cbd5e1' }}>
              <div style={{ fontStyle: 'italic', fontSize: '0.85rem', color: '#64748b', marginBottom: '2rem', textAlign: 'center', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                <EditableText textKey="paper_pdf_desc" defaultText="Este artículo científico está indexado y disponible para lectura directa en formato PDF. Haz clic a continuación para abrir el documento original:" isTextArea={true} />
              </div>

              <a
                href={articuloSeleccionado.url_pdf || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="pub-paper-btn-pdf"
                style={{ padding: '0.9rem 2.5rem', fontSize: '0.95rem', borderRadius: '8px', boxShadow: '0 6px 15px rgba(5, 150, 105, 0.2)' }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18" style={{ marginRight: '8px' }}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <EditableText textKey="paper_btn_pdf" defaultText="Abrir Documento PDF Completo" />
              </a>
            </div>
          ) : (
            /* FULL MODE: DOUBLE COLUMN CONTENT SECTIONS */
            <div className="pub-paper-body">
              {articuloSeleccionado.introduccion && (
                <div className="pub-paper-section">
                  <h2 className="pub-paper-section-title">I. Introducción</h2>
                  <div className="pub-paper-text pub-ieee-dropcap">
                    {articuloSeleccionado.introduccion}
                  </div>
                  {articuloSeleccionado.introduccion_imagen && (
                    <div className="pub-paper-figure">
                      <img src={articuloSeleccionado.introduccion_imagen} alt="Fig 1" className="pub-paper-figure-img" />
                      <div className="pub-paper-figure-caption">
                        <strong>Fig. 1.</strong> {articuloSeleccionado.introduccion_imagen_descripcion || 'Ilustración o diagrama correspondiente a la sección de Introducción.'}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {(articuloSeleccionado.metodologia || articuloSeleccionado.metodologia_imagen) && (
                <div className="pub-paper-section">
                  <h2 className="pub-paper-section-title">II. Metodología</h2>
                  {articuloSeleccionado.metodologia && (
                    <div className="pub-paper-text">
                      {articuloSeleccionado.metodologia}
                    </div>
                  )}
                  {articuloSeleccionado.metodologia_imagen && (
                    <div className="pub-paper-figure">
                      <img src={articuloSeleccionado.metodologia_imagen} alt="Fig 2" className="pub-paper-figure-img" />
                      <div className="pub-paper-figure-caption">
                        <strong>Fig. 2.</strong> {articuloSeleccionado.metodologia_imagen_descripcion || 'Esquema metodológico del diseño experimental.'}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {(articuloSeleccionado.resultados || articuloSeleccionado.resultados_imagen) && (
                <div className="pub-paper-section">
                  <h2 className="pub-paper-section-title">III. Resultados y Discusión</h2>
                  {articuloSeleccionado.resultados && (
                    <div className="pub-paper-text">
                      {articuloSeleccionado.resultados}
                    </div>
                  )}
                  {articuloSeleccionado.resultados_imagen && (
                    <div className="pub-paper-figure">
                      <img src={articuloSeleccionado.resultados_imagen} alt="Fig 3" className="pub-paper-figure-img" />
                      <div className="pub-paper-figure-caption">
                        <strong>Fig. 3.</strong> {articuloSeleccionado.resultados_imagen_descripcion || 'Gráfica de variables y discusión de hallazgos.'}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {(articuloSeleccionado.conclusiones || articuloSeleccionado.conclusiones_imagen) && (
                <div className="pub-paper-section">
                  <h2 className="pub-paper-section-title">IV. Conclusiones</h2>
                  {articuloSeleccionado.conclusiones && (
                    <div className="pub-paper-text">
                      {articuloSeleccionado.conclusiones}
                    </div>
                  )}
                  {articuloSeleccionado.conclusiones_imagen && (
                    <div className="pub-paper-figure">
                      <img src={articuloSeleccionado.conclusiones_imagen} alt="Fig 4" className="pub-paper-figure-img" />
                      <div className="pub-paper-figure-caption">
                        <strong>Fig. 4.</strong> {articuloSeleccionado.conclusiones_imagen_descripcion || 'Ilustración final o fotografía de la solución implementada.'}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {articuloSeleccionado.referencias && (
                <div className="pub-paper-section" style={{ breakInside: 'avoid' }}>
                  <h2 className="pub-paper-section-title" style={{ textAlign: 'left', borderBottom: '1px solid #111111' }}>Referencias</h2>
                  <ol className="pub-paper-references-list">
                    {formatReferences(articuloSeleccionado.referencias).map((ref, idx) => (
                      <li key={idx} className="pub-paper-reference-item">
                        {ref}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}
        </article>

        {/* Back button at footer */}
        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-start' }}>
          <button onClick={handleVolverClick} className="pub-art-btn-back">
            <EditableText textKey="art_btn_back" defaultText="← Volver al listado" />
          </button>
        </div>
      </div>
    );
  }

  // LIST OF ARTICLES PUBLIC VIEW
  return (
    <div className="pub-art-container">
      {/* Cabecera de la Página y Barra de Filtros */}
      <div className="pub-news-header-row">
        <div className="pub-news-header" style={{ margin: 0, textAlign: 'left', display: 'inline-block', width: 'fit-content' }}>
          <h1 className="pub-news-main-title">
            <EditableText textKey="articles_main_title" defaultText="Artículos Científicos" />
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
              <div className="pub-news-unified-filter-panel" style={{ minWidth: '450px' }}>
                {/* Column 1: Formato */}
                <div className="filter-panel-section">
                  <span className="filter-panel-section-title">Formato</span>
                  <div className="filter-panel-options-list">
                    <button
                      type="button"
                      className={`filter-panel-option-item ${filtroTipo === 'Completo' ? 'active' : ''}`}
                      onClick={() => {
                        if (filtroTipo === 'Completo') {
                          setFiltroTipo(null);
                        } else {
                          setFiltroTipo('Completo');
                        }
                      }}
                    >
                      Lectura Digital
                    </button>
                    <button
                      type="button"
                      className={`filter-panel-option-item ${filtroTipo === 'PDF' ? 'active' : ''}`}
                      onClick={() => {
                        if (filtroTipo === 'PDF') {
                          setFiltroTipo(null);
                        } else {
                          setFiltroTipo('PDF');
                        }
                      }}
                    >
                      Enlaces Externos
                    </button>
                  </div>
                </div>

                {/* Divider 1 */}
                <div className="filter-panel-divider" />

                {/* Column 2: Año */}
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
                            setFiltroAnio(null);
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

                {/* Divider 2 */}
                <div className="filter-panel-divider" />

                {/* Column 3: Ordenar por */}
                <div className="filter-panel-section">
                  <span className="filter-panel-section-title">Ordenar por</span>
                  <div className="filter-panel-options-list">
                    <button
                      type="button"
                      className={`filter-panel-option-item ${ordenarPor === 'Reciente' ? 'active' : ''}`}
                      onClick={() => {
                        if (ordenarPor === 'Reciente') {
                          setOrdenarPor(null);
                        } else {
                          setOrdenarPor('Reciente');
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
                      className={`filter-panel-option-item ${ordenarPor === 'Antiguo' ? 'active' : ''}`}
                      onClick={() => {
                        if (ordenarPor === 'Antiguo') {
                          setOrdenarPor(null);
                        } else {
                          setOrdenarPor('Antiguo');
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
                      className={`filter-panel-option-item ${ordenarPor === 'Titulo' ? 'active' : ''}`}
                      onClick={() => {
                        if (ordenarPor === 'Titulo') {
                          setOrdenarPor(null);
                        } else {
                          setOrdenarPor('Titulo');
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
                      className={`filter-panel-option-item ${ordenarPor === 'TituloDesc' ? 'active' : ''}`}
                      onClick={() => {
                        if (ordenarPor === 'TituloDesc') {
                          setOrdenarPor(null);
                        } else {
                          setOrdenarPor('TituloDesc');
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
              placeholder="Buscar artículo..."
              className="pub-news-search-input"
              onBlur={() => {
                if (busqueda.trim() === '') {
                  setSearchExpanded(false);
                }
              }}
            />
            <button
              type="button"
              className="pub-news-search-toggle-btn"
              onClick={() => {
                setSearchExpanded(true);
                setTimeout(() => {
                  document.querySelector('.pub-news-search-input')?.focus();
                }, 100);
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20" className="pub-news-search-icon-svg">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Articles Grid (Library Shelf style) */}
      {articulosPaginados.length === 0 ? (
        <div className="pub-art-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="60" height="60" style={{ color: '#cbd5e1' }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          <h3><EditableText textKey="art_empty_title" defaultText="No se encontraron publicaciones" /></h3>
          <p><EditableText textKey="art_empty_desc" defaultText="Intenta cambiar los términos de búsqueda o filtros establecidos." isTextArea={true} /></p>
        </div>
      ) : (
        <>
          <div className="pub-art-grid">
            {articulosPaginados.map((art) => (
              <div
                key={art.id}
                className={`pub-art-card ${art.tipo_registro === 'PDF' ? 'card-pdf' : 'card-internal'}`}
                onClick={() => handleLeerMasClick(art)}
                style={{ cursor: 'pointer' }}
              >
                {/* LEFT VERTICAL SPINE (as shown in user image) */}
                <div className="pub-art-card-spine">
                  <div className="pub-art-card-spine-text-wrapper">
                    <div className="pub-art-card-spine-text">
                      {art.revista || 'REPOSITORIO CIENTÍFICO ULEAM'}
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
                    {art.tipo_registro === 'PDF' ? (
                      <span className="pub-art-card-badge pdf-badge">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="10" height="10" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px', marginTop: '-2px' }}>
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                        <EditableText textKey="art_badge_external" defaultText="Enlace Externo" />
                      </span>
                    ) : (
                      <span className="pub-art-card-badge internal-badge">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="10" height="10" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px', marginTop: '-2px' }}>
                          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                        </svg>
                        <EditableText textKey="art_badge_digital" defaultText="Lectura Digital" />
                      </span>
                    )}
                  </div>

                  <h3 className="pub-art-card-title">{art.titulo}</h3>

                  <div className="pub-art-card-prepared-by">
                    <div className="pub-art-prepared-label"><EditableText textKey="art_prepared_label" defaultText="Preparado por:" /></div>
                    <div className="pub-art-card-authors-text">{art.autores}</div>
                    <div className="pub-art-card-revista-text">{art.revista || 'Facultad de Ciencias Informáticas (FACCI)'}</div>
                    <div className="pub-art-card-date-text"><EditableText textKey="art_published_prefix" defaultText="Publicado: " /> {formatFecha(art.created_at)}</div>
                  </div>

                  <div className="pub-art-card-footer" style={{ borderTop: 'none', paddingTop: 0, marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '600' }}>
                      {art.tipo_registro === 'PDF' ? (
                        <EditableText textKey="art_footer_external" defaultText="Enlace Externo" />
                      ) : (
                        <EditableText textKey="art_footer_interactive" defaultText="Formato Interactivo" />
                      )}
                    </span>
                  </div>
                </div>
              </div>
            ))}
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
                <EditableText textKey="art_pagination_prev" defaultText="Anterior" />
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
                <EditableText textKey="art_pagination_next" defaultText="Siguiente" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
