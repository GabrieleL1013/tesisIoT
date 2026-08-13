import { API_BASE_URL, fetchDeduplicated } from '../config/api';
import SEO from "../components/SEO";
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, useParams, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { useInterfaceText } from '../context/InterfaceTextContext';
import '../styles/NoticiasPublicas.css';
import '../styles/ArticulosPublicos.css';
import EditableText from '../components/EditableText';
import EditableImage from '../components/EditableImage';
import IotJpg from '../assets/IOT.jpg';

const formatImageUrl = (urlStr) => {
  if (!urlStr) return '';
  if (urlStr.startsWith('data:') || urlStr.startsWith('http://') || urlStr.startsWith('https://')) {
    return urlStr;
  }
  const backendHost = API_BASE_URL.replace(/\/api\/?$/, '');
  return `${backendHost}${urlStr.startsWith('/') ? '' : '/'}${urlStr}`;
};

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

const formatFecha = (dateStr, lang) => {
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

const PublicCarousel = ({ images }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isInteracted, setIsInteracted] = useState(false);

  useEffect(() => {
    if (isInteracted) return;

    const interval = setInterval(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 3500);

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
        <img src={formatImageUrl(images[activeIndex])} alt={`Slide ${activeIndex + 1}`} className="pub-news-carousel-image" />
      </div>

      {images.length > 1 && (
        <>
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
  const navigate = useNavigate();
  const location = useLocation();
  const { pageNum } = useParams();
  const { language, t } = useLanguage();
  const { texts } = useInterfaceText();
  usePageTitle(language === 'en' ? 'News' : 'Noticias');
  const [searchParams, setSearchParams] = useSearchParams();
  const [noticias, setNoticias] = useState([]);
  const [noticiaSeleccionada, setNoticiaSeleccionada] = useState(null);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [aniosDisponibles, setAniosDisponibles] = useState([]);
  const [modalImagenFull, setModalImagenFull] = useState(null);

  const [busqueda, setBusqueda] = useState('');
  const [debouncedBusqueda, setDebouncedBusqueda] = useState('');
  const [filtroAnio, setFiltroAnio] = useState(null);
  const [criterioOrden, setCriterioOrden] = useState(null);
  const [ordenFecha, setOrdenFecha] = useState('desc');
  const [ordenAlfa, setOrdenAlfa] = useState('asc');
  const [loading, setLoading] = useState(true);

  const newsSlug = language === 'en' ? 'news' : 'noticias';
  const routePage = pageNum ? parseInt(pageNum, 10) : null;
  const queryPage = searchParams.get('pag') || searchParams.get('page');
  const initialPagina = routePage && !isNaN(routePage) ? Math.max(1, routePage) : (queryPage ? Math.max(1, parseInt(queryPage, 10) || 1) : 1);
  const [paginaActual, setPaginaActual] = useState(initialPagina);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const searchInputRef = useRef(null);

  // Sync state with route params and searchParams when user navigates
  useEffect(() => {
    let target = 1;
    if (pageNum) {
      const p = parseInt(pageNum, 10);
      if (!isNaN(p) && p > 0) target = p;
    } else if (searchParams.get('pag') || searchParams.get('page')) {
      const p = parseInt(searchParams.get('pag') || searchParams.get('page'), 10);
      if (!isNaN(p) && p > 0) target = p;
    }
    if (target !== paginaActual) {
      setPaginaActual(target);
    }
  }, [pageNum, searchParams]);

  const cambiarPagina = (nuevaPagina) => {
    setPaginaActual(nuevaPagina);
    const basePath = `/${language}/${newsSlug}`;
    const currentParamsStr = searchParams.toString();
    const searchString = currentParamsStr ? `?${currentParamsStr}` : '';
    if (nuevaPagina > 1) {
      navigate(`${basePath}/page/${nuevaPagina}${searchString}`);
    } else {
      navigate(`${basePath}${searchString}`);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cargar años únicos con noticias en la base de datos
  useEffect(() => {
    fetchDeduplicated(`${API_BASE_URL}/noticias/anios`)
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

  // Debounce para evitar llamadas API repetidas mientras el usuario escribe en el buscador
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedBusqueda(busqueda);
    }, 350);
    return () => clearTimeout(handler);
  }, [busqueda]);

  useEffect(() => {
    if (searchExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchExpanded]);

  const prevFilterStateRef = useRef({
    busqueda: debouncedBusqueda,
    filtroAnio,
    criterioOrden,
    ordenFecha,
    ordenAlfa
  });

  useEffect(() => {
    const prev = prevFilterStateRef.current;
    const filterChanged =
      prev.busqueda !== debouncedBusqueda ||
      prev.filtroAnio !== filtroAnio ||
      prev.criterioOrden !== criterioOrden ||
      prev.ordenFecha !== ordenFecha ||
      prev.ordenAlfa !== ordenAlfa;

    prevFilterStateRef.current = {
      busqueda: debouncedBusqueda,
      filtroAnio,
      criterioOrden,
      ordenFecha,
      ordenAlfa
    };

    if (filterChanged && paginaActual !== 1) {
      cambiarPagina(1);
    }
  }, [debouncedBusqueda, filtroAnio, criterioOrden, ordenFecha, ordenAlfa]);

  // Cargar noticias con paginación backend (9 por página)
  useEffect(() => {
    setLoading(true);
    let sortParam = 'recientes';
    if (criterioOrden === 'fecha') {
      sortParam = ordenFecha === 'desc' ? 'recientes' : 'antiguos';
    } else if (criterioOrden === 'alfabetico') {
      sortParam = ordenAlfa === 'asc' ? 'alfa_asc' : 'alfa_desc';
    }

    let url = `${API_BASE_URL}/noticias?lang=${language}&estado=Publicado&page=${paginaActual}&per_page=9&sort=${sortParam}`;
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

        const publicadas = rawList.map(item => ({
          id: item.id,
          titulo: item.titulo,
          autor: item.autor,
          contenido: item.contenido,
          imagenUrl: item.imagen_url || item.imagenUrl || '',
          fecha: formatFecha(item.updated_at || item.created_at, language),
          updated_at: item.updated_at
        }));
        setNoticias(publicadas);
      })
      .catch(err => {
        console.error("Error fetching news:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [language, paginaActual, debouncedBusqueda, filtroAnio, criterioOrden, ordenFecha, ordenAlfa]);

  const noticiaIdParam = searchParams.get('id');

  // Manejar detalle de noticia si viene id en la URL
  useEffect(() => {
    if (noticiaIdParam) {
      const encontrada = noticias.find(n => String(n.id) === String(noticiaIdParam));
      if (encontrada) {
        setNoticiaSeleccionada(encontrada);
      } else {
        fetchDeduplicated(`${API_BASE_URL}/noticias/${noticiaIdParam}?lang=${language}`)
          .then(res => res.json())
          .then(item => {
            if (item && item.id) {
              setNoticiaSeleccionada({
                id: item.id,
                titulo: item.titulo,
                autor: item.autor,
                contenido: item.contenido,
                imagenUrl: item.imagen_url || item.imagenUrl || '',
                fecha: formatFecha(item.updated_at || item.created_at, language),
                updated_at: item.updated_at
              });
            }
          })
          .catch(() => {});
      }
    } else {
      setNoticiaSeleccionada(null);
    }
  }, [noticiaIdParam, noticias, language]);

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


  const obtenerTextoFiltro = () => {
    const filtrosActivos = [];
    if (filtroAnio !== null && filtroAnio !== 'todos') {
      filtrosActivos.push(filtroAnio);
    }
    if (criterioOrden === 'fecha') {
      filtrosActivos.push(
        ordenFecha === 'desc'
          ? (language === 'en' ? 'Newest first' : 'Más recientes')
          : (language === 'en' ? 'Oldest first' : 'Más antiguos')
      );
    } else if (criterioOrden === 'alfabetico') {
      filtrosActivos.push(
        ordenAlfa === 'asc'
          ? (language === 'en' ? 'By A-Z' : 'Por A-Z')
          : (language === 'en' ? 'By Z-A' : 'Por Z-A')
      );
    }

    if (filtrosActivos.length === 0) {
      return null;
    }
    return filtrosActivos.join(' • ');
  };
  const newsCarouselRef = useRef(null);
  const noticiasPaginadas = noticias;

  const scrollCarousel = (direction) => {
    if (!newsCarouselRef.current) return;
    const scrollAmount = newsCarouselRef.current.clientWidth * 0.85;
    newsCarouselRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

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

  const handleLeerMasClick = (n) => {
    const slug = slugify(n.titulo);
    setSearchParams({ id: n.id, slug: slug });
    setNoticiaSeleccionada(n);
    window.scrollTo(0, 0);
  };

  // Mantener actualizado el slug en la URL al cambiar de idioma dentro de una noticia
  useEffect(() => {
    if (noticiaSeleccionada && noticiaIdParam) {
      const slug = slugify(noticiaSeleccionada.titulo);
      if (searchParams.get('slug') !== slug) {
        setSearchParams({ id: noticiaSeleccionada.id, slug: slug }, { replace: true });
      }
    }
  }, [language, noticiaSeleccionada, noticiaIdParam]);

  const handleVolverClick = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setNoticiaSeleccionada(null);
    setSearchParams({}, { replace: true });
  };

  const parseAndNormalizeBlocks = (contenidoRaw) => {
    if (!contenidoRaw) return [];
    let blocks = [];
    try {
      if (typeof contenidoRaw === 'string' && contenidoRaw.trim().startsWith('[')) {
        blocks = JSON.parse(contenidoRaw);
      } else if (Array.isArray(contenidoRaw)) {
        blocks = contenidoRaw;
      } else {
        return [{ id: 1, type: 'text', value: String(contenidoRaw) }];
      }
    } catch (e) {
      return [{ id: 1, type: 'text', value: String(contenidoRaw) }];
    }

    if (!Array.isArray(blocks)) return [];

    return blocks.map((b, idx) => {
      let type = b.type;
      const val = (b.value || '').trim();
      const isImgUrl = val.startsWith('data:image') || val.startsWith('http://') || val.startsWith('https://') || val.startsWith('/') || val.startsWith('blob:');

      if (type === 'texto' || type === 'text') {
        type = 'text';
      } else if (type === 'imagen' || type === 'image') {
        type = 'image';
      } else {
        type = isImgUrl ? 'image' : 'text';
      }

      if (type === 'image' && val && !isImgUrl) {
        type = 'text';
      }

      return {
        id: b.id || idx,
        type,
        value: b.value || ''
      };
    });
  };

  const obtenerResumen = (contenidoRaw) => {
    const blocks = parseAndNormalizeBlocks(contenidoRaw);
    const textBlocks = blocks.filter(b => b.type === 'text' && b.value);
    if (textBlocks.length > 0) {
      const firstText = textBlocks[0].value;
      return firstText.length > 400 ? `${firstText.substring(0, 400)}...` : firstText;
    }
    return contenidoRaw && typeof contenidoRaw === 'string' && contenidoRaw.length > 400 ? `${contenidoRaw.substring(0, 400)}...` : (contenidoRaw || '');
  };

  const renderContenidoArticulo = (contenidoRaw) => {
    const blocks = parseAndNormalizeBlocks(contenidoRaw);
    if (blocks.length > 0) {
      return blocks.map((block, idx) => {
        if (block.type === 'text') {
          return (
            <p key={block.id || idx} className="pub-news-reader-text-block" style={{ marginBottom: '1.5rem' }}>
              {block.value}
            </p>
          );
        } else if (block.type === 'image') {
          return block.value ? (
            <div key={block.id || idx} className="pub-news-reader-image-block-wrapper" style={{ margin: '2rem 0', borderRadius: '12px', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
              <img src={formatImageUrl(block.value)} alt="Noticia" style={{ width: '100%', maxHeight: '480px', objectFit: 'contain', background: '#f8fafc', display: 'block' }} />
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
    return <p className="pub-news-reader-text-block">{contenidoRaw}</p>;
  };

  if (noticiaSeleccionada) {
    const heroImgSrc = noticiaSeleccionada.imagenUrl ? formatImageUrl(noticiaSeleccionada.imagenUrl) : IotJpg;

    return (
      <div className="pub-news-reader-container">
        <SEO 
          title={`${noticiaSeleccionada.titulo} - ${language === 'en' ? 'News' : 'Noticias'}`}
          description={language === 'en' ? "News detail from IoT ULEAM." : "Detalle de la noticia de IoT ULEAM."}
        />
        <div className="pub-news-reader-nav">
          <button onClick={handleVolverClick} className="pub-news-btn-back">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}>
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            <EditableText textKey="news_btn_back" defaultText={t("common.close", "Volver")} />
          </button>
        </div>

        <div className="pub-news-reader-hero" style={{ position: 'relative' }}>
          <img
            src={heroImgSrc}
            alt={noticiaSeleccionada.titulo}
            className="pub-news-reader-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = IotJpg;
            }}
          />
          <button
            type="button"
            onClick={() => setModalImagenFull(heroImgSrc)}
            className="pub-news-fullscreen-img-btn"
            title={language === 'en' ? "View full screen" : "Ver en pantalla completa"}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'rgba(15, 23, 42, 0.75)',
              color: '#ffffff',
              border: '1.5px solid rgba(255, 255, 255, 0.5)',
              borderRadius: '10px',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              backdropFilter: 'blur(6px)',
              transition: 'all 0.2s ease',
              zIndex: 10
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
              <polyline points="15 3 21 3 21 9" />
              <polyline points="9 21 3 21 3 15" />
              <line x1="21" y1="3" x2="14" y2="10" />
              <line x1="3" y1="21" x2="10" y2="14" />
            </svg>
          </button>
        </div>

        <article className="pub-news-reader-article">
          <div className="pub-news-reader-meta">
            <CalendarIcon />
            <span style={{ marginLeft: '6px' }}>{noticiaSeleccionada.fecha}</span>
          </div>

          <h1 className="pub-news-reader-title">{noticiaSeleccionada.titulo}</h1>

          <div className="pub-news-reader-author-row">
            <div className="pub-news-reader-avatar notranslate" translate="no">
              {noticiaSeleccionada.autor ? noticiaSeleccionada.autor.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="pub-news-reader-author-info">
              <span className="pub-news-reader-author-name notranslate" translate="no">{noticiaSeleccionada.autor}</span>
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
              <EditableText textKey="news_btn_back" defaultText={t("common.close", "Volver")} />
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
    <div className="pub-news-container">
      <SEO 
        title={language === 'en' ? "News - IoT ULEAM" : "Noticias - IoT ULEAM"}
        description={language === 'en' ? "Stay updated with IoT deployment progress, news, and research." : "Mantente al tanto del progreso de los despliegues de hardware y noticias del proyecto IoT ULEAM."}
      />
      <div className="pub-news-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem', marginBottom: '2.5rem', textAlign: 'left' }}>
        <div className="pub-news-title-group" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ color: '#d0182b', display: 'inline-flex', alignItems: 'center' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="32" height="32">
              <path d="M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1m2 13a2 2 0 0 1-2-2V7m2 13a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2m-4-3H9M9 9h6m-6 4h6m-6 4h4" />
            </svg>
          </span>
          <h1 className="pub-news-main-title" style={{ margin: 0, textAlign: 'left' }}>
            <EditableText textKey="news_main_title" defaultText={t("news.title", "Noticias & Divulgación")} />
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
                        className={`filter-panel-option-item ${criterioOrden === 'fecha' && ordenFecha === 'desc' ? 'active' : ''}`}
                        onClick={() => { 
                          if (criterioOrden === 'fecha' && ordenFecha === 'desc') setCriterioOrden(null);
                          else { setCriterioOrden('fecha'); setOrdenFecha('desc'); setOrdenAlfa('asc'); }
                        }}
                      >
                        <EditableText textKey="news_sort_newest" defaultText={t("common.newest", "Más recientes primero")} />
                      </button>
                      <button
                        type="button"
                        className={`filter-panel-option-item ${criterioOrden === 'fecha' && ordenFecha === 'asc' ? 'active' : ''}`}
                        onClick={() => { 
                          if (criterioOrden === 'fecha' && ordenFecha === 'asc') setCriterioOrden(null);
                          else { setCriterioOrden('fecha'); setOrdenFecha('asc'); setOrdenAlfa('asc'); }
                        }}
                      >
                        <EditableText textKey="news_sort_oldest" defaultText={t("common.oldest", "Más antiguos primero")} />
                      </button>
                      <button
                        type="button"
                        className={`filter-panel-option-item ${criterioOrden === 'alfabetico' && ordenAlfa === 'asc' ? 'active' : ''}`}
                        onClick={() => { 
                          if (criterioOrden === 'alfabetico' && ordenAlfa === 'asc') setCriterioOrden(null);
                          else { setCriterioOrden('alfabetico'); setOrdenAlfa('asc'); setOrdenFecha('desc'); }
                        }}
                      >
                        <EditableText textKey="news_sort_az" defaultText={t("common.az", "Por A-Z")} />
                      </button>
                      <button
                        type="button"
                        className={`filter-panel-option-item ${criterioOrden === 'alfabetico' && ordenAlfa === 'desc' ? 'active' : ''}`}
                        onClick={() => { 
                          if (criterioOrden === 'alfabetico' && ordenAlfa === 'desc') setCriterioOrden(null);
                          else { setCriterioOrden('alfabetico'); setOrdenAlfa('desc'); setOrdenFecha('desc'); }
                        }}
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
              placeholder={texts['news_search_placeholder'] || t("common.search", "Buscar noticia...")}
              className="pub-news-search-input"
            />
            {busqueda.trim() && (
              <button
                type="button"
                className="pub-news-search-clear-btn"
                onClick={() => { setBusqueda(''); setSearchExpanded(false); }}
                title={language === 'en' ? 'Clear' : 'Limpiar'}
                aria-label="Limpiar búsqueda"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Banner de "Búsqueda relacionada con" */}
      {busqueda.trim() !== '' && (
        <div className="pub-news-search-related-banner">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <span>
            {language === 'en' ? 'Search related to:' : 'Búsqueda relacionada con:'} <strong>"{busqueda.trim()}"</strong>
          </span>
          <button
            type="button"
            className="pub-news-search-related-clear"
            onClick={() => { setBusqueda(''); setSearchExpanded(false); }}
            title={language === 'en' ? 'Clear search' : 'Limpiar búsqueda'}
            aria-label="Limpiar búsqueda"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem 1rem', gap: '1rem', minHeight: '300px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="spinner-dot" style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#2563eb', animation: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite' }}></span>
            <span style={{ fontSize: '0.95rem', fontWeight: '600', color: '#64748b' }}>
              {language === 'en' ? 'Loading news...' : 'Cargando noticias...'}
            </span>
          </div>
        </div>
      ) : (
        <>
          {/* Controles de flecha para carrusel en teléfono (SOLO si hay más de 1 noticia) */}
          {noticiasPaginadas.length > 1 && (
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

          <div className="pub-news-grid" ref={newsCarouselRef}>
            {noticiasPaginadas.length === 0 ? (
              <div className="pub-news-empty">
                <span><EditableText textKey="news_empty_message" defaultText={t("news.no_news", "No se encontraron noticias con los filtros establecidos.")} /></span>
              </div>
            ) : (
              noticiasPaginadas.map((n, index) => (
                <div key={n.id} id={`news-card-${n.id}`} className="pub-news-card">
                  <div className="pub-news-image-wrapper">
                    <img 
                      src={n.imagenUrl ? formatImageUrl(n.imagenUrl) : IotJpg} 
                      alt={n.titulo} 
                      className="pub-news-image" 
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = IotJpg;
                      }}
                    />
                  </div>

                  <div className="pub-news-content">
                    <h3 className="pub-news-card-title">{n.titulo}</h3>

                    <div className="pub-news-meta">
                      <span>{n.fecha ? n.fecha.toUpperCase() : ''}</span>
                    </div>

                    <p className="pub-news-excerpt">{obtenerResumen(n.contenido)}</p>

                    <div className="pub-news-footer">
                      <button
                        onClick={() => handleLeerMasClick(n)}
                        className="pub-news-btn-read"
                      >
                        <EditableText textKey="news_read_more" defaultText={t("home.read_more", "SEGUIR LEYENDO")} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* BARRA DE PAGINACIÓN */}
          {totalPaginas > 1 && (
            <div className="pub-art-pagination">
              <button
                className="pub-art-pagination-btn"
                onClick={() => cambiarPagina(Math.max(paginaActual - 1, 1))}
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
                    onClick={() => cambiarPagina(num)}
                  >
                    {num}
                  </button>
                ))}
              </div>

              <button
                className="pub-art-pagination-btn"
                onClick={() => cambiarPagina(Math.min(paginaActual + 1, totalPaginas))}
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
