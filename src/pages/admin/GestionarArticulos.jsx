import { API_BASE_URL, fetchWithAuth } from '../../config/api';
import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import { useLanguage } from '../../context/LanguageContext';
import { usePageTitle } from '../../hooks/usePageTitle';
import { formatExternalUrl } from '../../utils/urlUtils';
import '../../styles/components/admin/GestionarArticulos.css';
import '../../styles/ArticulosPublicos.css';

const CustomItemsPerPageSelect = ({ value, onChange, options = [10, 20, 50], language = 'es' }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const suffix = language === 'en' ? 'page' : 'pág';

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          borderRadius: '8px',
          border: '1px solid #cbd5e1',
          background: '#ffffff',
          color: '#1e293b',
          fontSize: '0.82rem',
          fontWeight: '700',
          cursor: 'pointer',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          transition: 'all 0.2s ease',
          outline: 'none'
        }}
      >
        <span>{value} / {suffix}</span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          width="12"
          height="12"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            right: 0,
            marginBottom: '6px',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            boxShadow: '0 10px 25px rgba(15, 23, 42, 0.15)',
            padding: '4px',
            minWidth: '110px',
            zIndex: 1000
          }}
        >
          {options.map((opt) => {
            const isSelected = Number(opt) === Number(value);
            return (
              <div
                key={opt}
                onClick={() => {
                  onChange(Number(opt));
                  setOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: '6px',
                  background: isSelected ? 'rgba(37, 99, 235, 0.08)' : 'transparent',
                  color: isSelected ? '#1e40af' : '#334155',
                  fontWeight: isSelected ? '800' : '600',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.15s ease',
                  boxSizing: 'border-box'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = '#f8fafc';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'transparent';
                }}
              >
                <span>{opt} / {suffix}</span>
                {isSelected && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="#1e40af" strokeWidth="3" width="12" height="12">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const formatImageUrl = (urlStr) => {
  if (!urlStr) return '';
  if (urlStr.startsWith('data:') || urlStr.startsWith('http://') || urlStr.startsWith('https://')) {
    return urlStr;
  }
  const backendHost = API_BASE_URL.replace(/\/api\/?$/, '');
  return `${backendHost}${urlStr.startsWith('/') ? '' : '/'}${urlStr}`;
};

const convertImageToWebP = (file, quality = 0.85) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.src = url;
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const webpDataUrl = canvas.toDataURL('image/webp', quality);
      resolve(webpDataUrl);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
  });
};

export default function GestionarArticulos() {
  const { t, language } = useLanguage();
  usePageTitle({ es: 'Gestionar Artículos', en: 'Manage Articles' }, 'Admin · IoT ULEAM');
  const [articulos, setArticulos] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  // Filtros lista
  const [filtroEstado, setFiltroEstado] = useState(null);
  const [filtroTipo, setFiltroTipo] = useState(null);
  const [orden, setOrden] = useState(null);
  const [showEstadoPanel, setShowEstadoPanel] = useState(false);
  const [showTipoPanel, setShowTipoPanel] = useState(false);
  const [showOrdenPanel, setShowOrdenPanel] = useState(false);

  // Form Fields State
  const [editandoId, setEditandoId] = useState(null);
  const [tipoRegistro, setTipoRegistro] = useState('Completo'); // Completo o PDF
  const [titulo, setTitulo] = useState('');
  const [autores, setAutores] = useState('');
  const [revista, setRevista] = useState('Universidad Laica Eloy Alfaro de Manabí (ULEAM)');
  const [resumen, setResumen] = useState('');
  const [palabrasClave, setPalabrasClave] = useState('');

  // Section text, image, and description states
  const [introduccion, setIntroduccion] = useState('');
  const [introduccionImagen, setIntroduccionImagen] = useState('');
  const [introduccionImagenDescripcion, setIntroduccionImagenDescripcion] = useState('');

  const [metodologia, setMetodologia] = useState('');
  const [metodologiaImagen, setMetodologiaImagen] = useState('');
  const [metodologiaImagenDescripcion, setMetodologiaImagenDescripcion] = useState('');

  const [resultados, setResultados] = useState('');
  const [resultadosImagen, setResultadosImagen] = useState('');
  const [resultadosImagenDescripcion, setResultadosImagenDescripcion] = useState('');

  const [conclusiones, setConclusiones] = useState('');
  const [conclusionesImagen, setConclusionesImagen] = useState('');
  const [conclusionesImagenDescripcion, setConclusionesImagenDescripcion] = useState('');

  const [referencias, setReferencias] = useState('');
  const [urlPdf, setUrlPdf] = useState('');
  const [estado, setEstado] = useState('Publicado');

  // Accordion active sections
  const [activeAccordion, setActiveAccordion] = useState('meta'); // meta, intro, method, results, conclusion, refs

  // Estados de Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Load articles on mount
  const cargarArticulos = () => {
    fetchWithAuth(`${API_BASE_URL}/articulos`)
      .then(res => {
        if (!res.ok) throw new Error("Network response error");
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setArticulos(data);
        }
      })
      .catch(err => {
        console.error("Error fetching articles:", err);
      });
  };

  useEffect(() => {
    cargarArticulos();
  }, []);

  // Alerta de cambios pendientes al intentar recargar o cerrar la página
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (mostrarFormulario) {
        e.preventDefault();
        e.returnValue = 'Tienes cambios sin guardar en el formulario. ¿Estás seguro de que deseas salir?';
        return 'Tienes cambios sin guardar en el formulario. ¿Estás seguro de que deseas salir?';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [mostrarFormulario]);

  // Cerrar popovers al hacer clic fuera
  useEffect(() => {
    const handleOutside = (e) => {
      if (!e.target.closest('.art-filter-group-estado')) setShowEstadoPanel(false);
      if (!e.target.closest('.art-filter-group-tipo')) setShowTipoPanel(false);
      if (!e.target.closest('.art-filter-group-orden')) setShowOrdenPanel(false);
    };
    document.addEventListener('click', handleOutside);
    return () => document.removeEventListener('click', handleOutside);
  }, []);

  const textoEstado = () => {
    if (filtroEstado === 'Publicado') return t("manage_articles.status_published", "Publicado");
    if (filtroEstado === 'Borrador') return t("manage_articles.status_draft", "Borrador");
    return t("manage_news.col_status", "Estado");
  };

  const textoTipo = () => {
    if (filtroTipo === 'Completo') return t("manage_articles.type_full", "Texto completo");
    if (filtroTipo === 'PDF') return t("manage_articles.type_pdf", "Enlace externo");
    return language === 'en' ? 'Type' : 'Tipo';
  };

  const textoOrden = () => {
    if (orden === 'asc') return language === 'en' ? 'Oldest first' : 'Más antiguos';
    if (orden === 'desc') return language === 'en' ? 'Newest first' : 'Más recientes';
    if (orden === 'name_asc') return language === 'en' ? 'Title (A-Z)' : 'Título (A-Z)';
    if (orden === 'name_desc') return language === 'en' ? 'Title (Z-A)' : 'Título (Z-A)';
    return language === 'en' ? 'Sort' : 'Ordenar';
  };

  // Resetear página actual al cambiar filtros o búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [busqueda, filtroEstado, filtroTipo, orden]);

  const articulosFiltrados = articulos
    .filter(art => {
      const query = busqueda.toLowerCase().trim();
      const matchQuery = !query || (
        art.titulo.toLowerCase().includes(query) ||
        art.autores.toLowerCase().includes(query) ||
        (art.palabras_clave && art.palabras_clave.toLowerCase().includes(query))
      );
      const matchEstado = !filtroEstado || art.estado === filtroEstado;
      const matchTipo = !filtroTipo || art.tipo_registro === filtroTipo;
      return matchQuery && matchEstado && matchTipo;
    })
    .sort((a, b) => {
      if (orden === 'name_asc') return a.titulo.localeCompare(b.titulo);
      if (orden === 'name_desc') return b.titulo.localeCompare(a.titulo);
      if (orden === 'asc') return Number(a.id) - Number(b.id);
      return Number(b.id) - Number(a.id);
    });

  const totalPages = Math.ceil(articulosFiltrados.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const articulosPaginados = articulosFiltrados.slice(startIndex, startIndex + itemsPerPage);

  const handleImageUpload = async (e, setImageState) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire({
          icon: 'error',
          title: 'Archivo demasiado grande',
          text: 'La imagen debe ser menor a 5MB.',
          confirmButtonColor: '#2563eb'
        });
        return;
      }
      try {
        const webpBase64 = await convertImageToWebP(file);
        setImageState(webpBase64);
      } catch (err) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImageState(reader.result);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // In both modes, title and authors are required
    if (!titulo.trim() || !autores.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos Obligatorios',
        text: 'Por favor, completa el título y los autores del artículo.',
        confirmButtonColor: '#2563eb'
      });
      return;
    }

    // In full text mode, abstract is required
    if (tipoRegistro === 'Completo' && !resumen.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Resumen Obligatorio',
        text: 'Por favor, completa el resumen/abstract del artículo para la modalidad de redacción completa.',
        confirmButtonColor: '#2563eb'
      });
      return;
    }

    // In PDF mode, PDF link is required
    if (tipoRegistro === 'PDF' && !urlPdf.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'PDF Requerido',
        text: 'En el modo "Solo PDF", debes ingresar el enlace o la dirección del documento PDF.',
        confirmButtonColor: '#2563eb'
      });
      return;
    }

    const payload = {
      tipo_registro: tipoRegistro,
      titulo: titulo.trim(),
      autores: autores.trim(),
      revista: revista.trim(),
      resumen: tipoRegistro === 'Completo' ? resumen.trim() : null,
      palabras_clave: tipoRegistro === 'Completo' ? palabrasClave.trim() : null,

      introduccion: tipoRegistro === 'Completo' ? introduccion.trim() : null,
      introduccion_imagen: tipoRegistro === 'Completo' ? (introduccionImagen || null) : null,
      introduccion_imagen_descripcion: tipoRegistro === 'Completo' ? (introduccionImagenDescripcion.trim() || null) : null,

      metodologia: tipoRegistro === 'Completo' ? metodologia.trim() : null,
      metodologia_imagen: tipoRegistro === 'Completo' ? (metodologiaImagen || null) : null,
      metodologia_imagen_descripcion: tipoRegistro === 'Completo' ? (metodologiaImagenDescripcion.trim() || null) : null,

      resultados: tipoRegistro === 'Completo' ? resultados.trim() : null,
      resultados_imagen: tipoRegistro === 'Completo' ? (resultadosImagen || null) : null,
      resultados_imagen_descripcion: tipoRegistro === 'Completo' ? (resultadosImagenDescripcion.trim() || null) : null,

      conclusiones: tipoRegistro === 'Completo' ? conclusiones.trim() : null,
      conclusiones_imagen: tipoRegistro === 'Completo' ? (conclusionesImagen || null) : null,
      conclusiones_imagen_descripcion: tipoRegistro === 'Completo' ? (conclusionesImagenDescripcion.trim() || null) : null,

      referencias: tipoRegistro === 'Completo' ? referencias.trim() : null,
      url_pdf: urlPdf.trim() ? formatExternalUrl(urlPdf) : null,
      estado
    };

    const endpoint = editandoId
      ? `${API_BASE_URL}/articulos/${editandoId}`
      : `${API_BASE_URL}/articulos`;

    const method = editandoId ? 'PUT' : 'POST';

    fetchWithAuth(endpoint, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(res => {
        if (!res.ok) throw new Error("Server error");
        return res.json();
      })
      .then(() => {
        Swal.fire({
          icon: 'success',
          title: editandoId ? '¡Artículo Actualizado!' : '¡Artículo Registrado!',
          text: editandoId
            ? 'Los cambios se han guardado con éxito.'
            : 'El artículo científico ha sido añadido al repositorio de la ULEAM.',
          confirmButtonColor: '#2563eb',
          timer: 2000
        });
        cargarArticulos();
        setMostrarFormulario(false);
        limpiarFormulario();
      })
      .catch(err => {
        console.error("Error saving article:", err);
        Swal.fire({
          icon: 'error',
          title: 'Error de Red',
          text: 'No se pudo guardar el artículo científico en la base de datos.',
          confirmButtonColor: '#2563eb'
        });
      });
  };

  const cargarEdicion = (art) => {
    setEditandoId(art.id);
    setTipoRegistro(art.tipo_registro || (art.resumen ? 'Completo' : 'PDF'));
    setTitulo(art.titulo);
    setAutores(art.autores);
    setRevista(art.revista || '');
    setResumen(art.resumen || '');
    setPalabrasClave(art.palabras_clave || '');

    setIntroduccion(art.introduccion || '');
    setIntroduccionImagen(art.introduccion_imagen || '');
    setIntroduccionImagenDescripcion(art.introduccion_imagen_descripcion || '');

    setMetodologia(art.metodologia || '');
    setMetodologiaImagen(art.metodologia_imagen || '');
    setMetodologiaImagenDescripcion(art.metodologia_imagen_descripcion || '');

    setResultados(art.resultados || '');
    setResultadosImagen(art.resultados_imagen || '');
    setResultadosImagenDescripcion(art.resultados_imagen_descripcion || '');

    setConclusiones(art.conclusiones || '');
    setConclusionesImagen(art.conclusiones_imagen || '');
    setConclusionesImagenDescripcion(art.conclusiones_imagen_descripcion || '');

    setReferencias(art.referencias || '');
    setUrlPdf(art.url_pdf || '');
    setEstado(art.estado || 'Publicado');
    setActiveAccordion('meta');
    setMostrarFormulario(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const eliminarArticulo = (id) => {
    const art = articulos.find(a => a.id === id);
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Esta acción eliminará de forma permanente el artículo "${art?.titulo}" de la base de datos de investigación.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#4b5563',
      confirmButtonText: 'Sí, eliminar artículo',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        fetchWithAuth(`${API_BASE_URL}/articulos/${id}`, {
          method: 'DELETE'
        })
          .then(res => {
            if (!res.ok) throw new Error("Server error");
            return res.json();
          })
          .then(() => {
            Swal.fire({
              icon: 'success',
              title: 'Artículo Eliminado',
              text: 'El registro científico se borró correctamente.',
              confirmButtonColor: '#2563eb'
            });
            cargarArticulos();
            if (editandoId === id) {
              limpiarFormulario();
              setMostrarFormulario(false);
            }
          })
          .catch(err => {
            console.error("Error deleting article:", err);
            Swal.fire({
              icon: 'error',
              title: 'Error de Red',
              text: 'No se pudo completar la eliminación en el servidor.',
              confirmButtonColor: '#2563eb'
            });
          });
      }
    });
  };

  const limpiarFormulario = () => {
    setEditandoId(null);
    setTipoRegistro('Completo');
    setTitulo('');
    setAutores('');
    setRevista('Universidad Laica Eloy Alfaro de Manabí (ULEAM)');
    setResumen('');
    setPalabrasClave('');

    setIntroduccion('');
    setIntroduccionImagen('');
    setIntroduccionImagenDescripcion('');

    setMetodologia('');
    setMetodologiaImagen('');
    setMetodologiaImagenDescripcion('');

    setResultados('');
    setResultadosImagen('');
    setResultadosImagenDescripcion('');

    setConclusiones('');
    setConclusionesImagen('');
    setConclusionesImagenDescripcion('');

    setReferencias('');
    setUrlPdf('');
    setEstado('Publicado');
    setActiveAccordion('meta');
  };

  const abrirFormulario = () => {
    limpiarFormulario();
    setMostrarFormulario(true);
  };

  const isEn = language === 'en';

  const cerrarFormulario = () => {
    const tieneCambios = titulo.trim() !== '' || autores.trim() !== '' || resumen.trim() !== '' || introduccion.trim() !== '' || metodologia.trim() !== '' || resultados.trim() !== '' || conclusiones.trim() !== '' || referencias.trim() !== '' || urlPdf.trim() !== '';
    
    if (tieneCambios || editandoId !== null) {
      Swal.fire({
        title: t("common.discard_title", isEn ? "Discard changes?" : "¿Descartar cambios?"),
        text: t("common.discard_text", isEn ? "There are unsaved form data. If you leave, unsaved changes will be lost." : "Hay datos en el formulario. Si sales, se perderán los cambios no guardados."),
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#4b5563',
        confirmButtonText: t("common.yes_exit", isEn ? "Yes, leave" : "Sí, salir"),
        cancelButtonText: t("common.keep_editing", isEn ? "Keep editing" : "Seguir editando")
      }).then((result) => {
        if (result.isConfirmed) {
          limpiarFormulario();
          setMostrarFormulario(false);
        }
      });
    } else {
      limpiarFormulario();
      setMostrarFormulario(false);
    }
  };

  const toggleAccordion = (section) => {
    setActiveAccordion(activeAccordion === section ? '' : section);
  };

  // Safe format for references in preview
  const formatReferences = (refsText) => {
    if (!refsText) return [];
    return refsText.split('\n').filter(line => line.trim() !== '');
  };

  return (
    <div className="articles-container">
      {/* CABECERA — solo visible en modo formulario */}
      {mostrarFormulario && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 className="articles-title">
              {editandoId ? (isEn ? 'Edit Scientific Article' : 'Editar Artículo Científico') : (isEn ? 'Register Scientific Article' : 'Registrar Artículo Científico')}
            </h2>
            <p className="articles-subtitle">
              {isEn ? 'Choose how to register the article (Full drafting or link to a PDF document with basic data).' : 'Elige la forma de registrar el artículo (Redacción completa o enlace a un documento PDF con datos básicos).'}
            </p>
          </div>

          <button onClick={cerrarFormulario} className="art-btn-back">
            {isEn ? '← Back to Repository' : '← Volver al Repositorio'}
          </button>
        </div>
      )}

      {mostrarFormulario ? (
        /* DUAL PANE LAYOUT: FORM + IEEE PREVIEW */
        <div className="articles-split-layout">
          {/* LEFT COLUMN: EDITING FORM (ACCORDION STYLE FOR SECTIONS) */}
          <div className="articles-section-box">
            <form onSubmit={handleSubmit} className="article-form">

              {/* Radio choice for type */}
              <div className="form-field" style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '0.5rem' }}>
                <label className="articles-label" style={{ color: '#0f2c59', fontSize: '0.8rem' }}>{isEn ? 'REGISTRATION MODE' : 'MODALIDAD DE REGISTRO'}</label>
                <div style={{ display: 'flex', gap: '2rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: '700', color: '#334155' }}>
                    <input
                      type="radio"
                      name="tipoRegistro"
                      value="Completo"
                      checked={tipoRegistro === 'Completo'}
                      onChange={() => setTipoRegistro('Completo')}
                      style={{ transform: 'scale(1.15)', cursor: 'pointer' }}
                    />
                    {isEn ? 'Draft Full Article' : 'Redactar Artículo Completo'}
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: '700', color: '#334155' }}>
                    <input
                      type="radio"
                      name="tipoRegistro"
                      value="PDF"
                      checked={tipoRegistro === 'PDF'}
                      onChange={() => setTipoRegistro('PDF')}
                      style={{ transform: 'scale(1.15)', cursor: 'pointer' }}
                    />
                    {isEn ? 'Link Repository / Web (Basic Data Only)' : 'Enlazar Repositorio / Web (Solo Datos Básicos)'}
                  </label>
                </div>
              </div>

              {/* Accordion 1: Información Básica / Metadatos */}
              <div className="form-accordion-section">
                <div
                  className={`form-accordion-header ${activeAccordion === 'meta' ? 'active' : ''}`}
                  onClick={() => toggleAccordion('meta')}
                >
                  <span>{isEn ? '1. Main Data and Metadata' : '1. Datos Principales y Metadatos'}</span>
                  <span className={`accordion-arrow ${activeAccordion === 'meta' ? 'rotated' : ''}`}>▼</span>
                </div>
                <div className={`form-accordion-content ${activeAccordion === 'meta' ? 'active' : ''}`}>
                  <div className="article-form">
                    <div className="form-field">
                      <label className="articles-label">{isEn ? 'Article Title *' : 'Título del Artículo *'}</label>
                      <input
                        type="text"
                        value={titulo}
                        onChange={(e) => setTitulo(e.target.value)}
                        placeholder={isEn ? 'Enter article title' : 'Ingresa el título del artículo'}
                        className="articles-input"
                      />
                    </div>

                    <div className="form-field">
                      <label className="articles-label">{isEn ? 'Authors (Comma separated) *' : 'Autores (Separados por coma) *'}</label>
                      <input
                        type="text"
                        value={autores}
                        onChange={(e) => setAutores(e.target.value)}
                        placeholder={isEn ? 'Enter authors (e.g. Dr. Willian Zamora, Ing. Juan Mero)' : 'Ingresa los autores de la investigación'}
                        className="articles-input"
                      />
                    </div>

                    <div className="form-field">
                      <label className="articles-label">{isEn ? 'Institution / Academic Journal' : 'Institución / Revista Académica'}</label>
                      <input
                        type="text"
                        value={revista}
                        onChange={(e) => setRevista(e.target.value)}
                        placeholder={isEn ? 'Enter institution or journal name' : 'Ingresa el nombre de la institución o revista'}
                        className="articles-input"
                      />
                    </div>

                    <div className="form-group-row">
                      {tipoRegistro === 'PDF' && (
                        <div className="form-field">
                          <label className="articles-label">
                            {isEn ? 'Repository / Web Link *' : 'Enlace del Repositorio / Web *'}
                          </label>
                          <input
                            type="text"
                            value={urlPdf}
                            onChange={(e) => setUrlPdf(e.target.value)}
                            placeholder={isEn ? 'Enter external URL link' : 'Ingresa el enlace del repositorio o sitio web'}
                            className="articles-input"
                          />
                        </div>
                      )}
                      <div className="form-field">
                        <label className="articles-label">{isEn ? 'Publication Status' : 'Estado de Publicación'}</label>
                        <select value={estado} onChange={(e) => setEstado(e.target.value)} className="articles-select">
                          <option value="Publicado">{isEn ? 'Published (Visible)' : 'Publicado (Visible)'}</option>
                          <option value="Borrador">{isEn ? 'Draft (Hidden)' : 'Borrador (Oculto)'}</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* HIDE ALL OTHER SECTION ACCORDIONS IF REGISTRATION TYPE IS PDF */}
              {tipoRegistro === 'Completo' && (
                <>
                  {/* Accordion 2: Resumen y Palabras Clave */}
                  <div className="form-accordion-section">
                    <div
                      className={`form-accordion-header ${activeAccordion === 'resumen' ? 'active' : ''}`}
                      onClick={() => toggleAccordion('resumen')}
                    >
                      <span>{isEn ? '2. Summary (Abstract) & Keywords *' : '2. Resumen (Abstract) & Palabras Clave *'}</span>
                      <span className={`accordion-arrow ${activeAccordion === 'resumen' ? 'rotated' : ''}`}>▼</span>
                    </div>
                    <div className={`form-accordion-content ${activeAccordion === 'resumen' ? 'active' : ''}`}>
                      <div className="article-form">
                        <div className="form-field">
                          <label className="articles-label">{isEn ? 'Summary / Abstract *' : 'Resumen / Abstract *'}</label>
                          <textarea
                            value={resumen}
                            onChange={(e) => setResumen(e.target.value)}
                            placeholder={isEn ? 'Write article abstract here...' : 'Ingresa el resumen del artículo científico aquí...'}
                            className="articles-textarea articles-textarea-large"
                          />
                        </div>

                        <div className="form-field">
                          <label className="articles-label">{isEn ? 'Keywords (Comma separated)' : 'Palabras Clave (Separadas por comas)'}</label>
                          <input
                            type="text"
                            value={palabrasClave}
                            onChange={(e) => setPalabrasClave(e.target.value)}
                            placeholder={isEn ? 'Enter keywords separated by comma' : 'Ingresa palabras clave separadas por coma'}
                            className="articles-input"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Accordion 3: Sección I. Introducción */}
                  <div className="form-accordion-section">
                    <div
                      className={`form-accordion-header ${activeAccordion === 'intro' ? 'active' : ''}`}
                      onClick={() => toggleAccordion('intro')}
                    >
                      <span>{isEn ? '3. Section I: Introduction' : '3. Sección I: Introducción'}</span>
                      <span className={`accordion-arrow ${activeAccordion === 'intro' ? 'rotated' : ''}`}>▼</span>
                    </div>
                    <div className={`form-accordion-content ${activeAccordion === 'intro' ? 'active' : ''}`}>
                      <div className="article-form">
                        <div className="form-field">
                          <label className="articles-label">{isEn ? 'Introduction Body' : 'Cuerpo de la Introducción'}</label>
                          <textarea
                            value={introduccion}
                            onChange={(e) => setIntroduccion(e.target.value)}
                            placeholder={isEn ? 'Draft background, rationale and objectives...' : 'Redacta los antecedentes, justificación y objetivos...'}
                            className="articles-textarea articles-textarea-large"
                          />
                        </div>

                        <div className="form-field" style={{ marginTop: '0.5rem' }}>
                          <label className="articles-label">{isEn ? 'Introduction Image (Optional)' : 'Imagen de Introducción (Opcional)'}</label>
                          {introduccionImagen ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              <div className="news-image-preview-container" style={{ maxHeight: '180px' }}>
                                <img src={formatImageUrl(introduccionImagen)} alt="Preview" className="news-image-preview" style={{ maxHeight: '160px', objectFit: 'contain' }} />
                                <button type="button" className="news-btn-remove-image" onClick={() => { setIntroduccionImagen(''); setIntroduccionImagenDescripcion(''); }} title={isEn ? "Remove image" : "Quitar imagen"}>
                                  ×
                                </button>
                              </div>
                              <div className="form-field">
                                <label className="articles-label" style={{ fontSize: '0.7rem' }}>{isEn ? 'Description / Figure 1 Caption' : 'Descripción / Pie de Figura 1'}</label>
                                <input
                                  type="text"
                                  value={introduccionImagenDescripcion}
                                  onChange={(e) => setIntroduccionImagenDescripcion(e.target.value)}
                                  placeholder={isEn ? 'Enter figure description' : 'Ingresa la descripción de la figura 1'}
                                  className="articles-input"
                                />
                              </div>
                            </div>
                          ) : (
                            <label className="news-dropzone" style={{ padding: '1rem' }}>
                              <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setIntroduccionImagen)} style={{ display: 'none' }} />
                              <span className="news-upload-text" style={{ fontSize: '0.8rem' }}>{isEn ? 'Upload Introduction Image' : 'Subir Imagen de Introducción'}</span>
                            </label>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Accordion 4: Sección II: Metodología */}
                  <div className="form-accordion-section">
                    <div
                      className={`form-accordion-header ${activeAccordion === 'method' ? 'active' : ''}`}
                      onClick={() => toggleAccordion('method')}
                    >
                      <span>{isEn ? '4. Section II: Methodology' : '4. Sección II: Metodología'}</span>
                      <span className={`accordion-arrow ${activeAccordion === 'method' ? 'rotated' : ''}`}>▼</span>
                    </div>
                    <div className={`form-accordion-content ${activeAccordion === 'method' ? 'active' : ''}`}>
                      <div className="article-form">
                        <div className="form-field">
                          <label className="articles-label">{isEn ? 'Methodology / Experimental Design' : 'Metodología / Diseño Experimental'}</label>
                          <textarea
                            value={metodologia}
                            onChange={(e) => setMetodologia(e.target.value)}
                            placeholder={isEn ? 'Write methodology content here...' : 'Ingresa el contenido de la metodología...'}
                            className="articles-textarea articles-textarea-large"
                          />
                        </div>

                        <div className="form-field" style={{ marginTop: '0.5rem' }}>
                          <label className="articles-label">{isEn ? 'Methodology Image (Optional)' : 'Imagen de Metodología (Opcional)'}</label>
                          {metodologiaImagen ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              <div className="news-image-preview-container" style={{ maxHeight: '180px' }}>
                                <img src={formatImageUrl(metodologiaImagen)} alt="Preview" className="news-image-preview" style={{ maxHeight: '160px', objectFit: 'contain' }} />
                                <button type="button" className="news-btn-remove-image" onClick={() => { setMetodologiaImagen(''); setMetodologiaImagenDescripcion(''); }} title={isEn ? "Remove image" : "Quitar imagen"}>
                                  ×
                                </button>
                              </div>
                              <div className="form-field">
                                <label className="articles-label" style={{ fontSize: '0.7rem' }}>{isEn ? 'Description / Figure 2 Caption' : 'Descripción / Pie de Figura 2'}</label>
                                <input
                                  type="text"
                                  value={metodologiaImagenDescripcion}
                                  onChange={(e) => setMetodologiaImagenDescripcion(e.target.value)}
                                  placeholder={isEn ? 'Enter figure description' : 'Ingresa la descripción de la figura 2'}
                                  className="articles-input"
                                />
                              </div>
                            </div>
                          ) : (
                            <label className="news-dropzone" style={{ padding: '1rem' }}>
                              <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setMetodologiaImagen)} style={{ display: 'none' }} />
                              <span className="news-upload-text" style={{ fontSize: '0.8rem' }}>{isEn ? 'Upload Methodology Image' : 'Subir Imagen de Metodología'}</span>
                            </label>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Accordion 5: Sección III: Resultados & IV: Conclusiones */}
                  <div className="form-accordion-section">
                    <div
                      className={`form-accordion-header ${activeAccordion === 'results' ? 'active' : ''}`}
                      onClick={() => toggleAccordion('results')}
                    >
                      <span>{isEn ? '5. Sections III & IV: Results & Conclusions' : '5. Secciones III y IV: Resultados & Conclusiones'}</span>
                      <span className={`accordion-arrow ${activeAccordion === 'results' ? 'rotated' : ''}`}>▼</span>
                    </div>
                    <div className={`form-accordion-content ${activeAccordion === 'results' ? 'active' : ''}`}>
                      <div className="article-form">
                        <div className="form-field">
                          <label className="articles-label">{isEn ? 'Section III: Obtained Results' : 'Sección III: Resultados Obtenidos'}</label>
                          <textarea
                            value={resultados}
                            onChange={(e) => setResultados(e.target.value)}
                            placeholder={isEn ? 'Write results content here...' : 'Ingresa el contenido de los resultados...'}
                            className="articles-textarea articles-textarea-large"
                          />
                        </div>

                        <div className="form-field" style={{ marginTop: '0.5rem', marginBottom: '1.5rem' }}>
                          <label className="articles-label">{isEn ? 'Results Image (Optional)' : 'Imagen de Resultados (Opcional)'}</label>
                          {resultadosImagen ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              <div className="news-image-preview-container" style={{ maxHeight: '180px' }}>
                                <img src={formatImageUrl(resultadosImagen)} alt="Preview" className="news-image-preview" style={{ maxHeight: '160px', objectFit: 'contain' }} />
                                <button type="button" className="news-btn-remove-image" onClick={() => { setResultadosImagen(''); setResultadosImagenDescripcion(''); }} title={isEn ? "Remove image" : "Quitar imagen"}>
                                  ×
                                </button>
                              </div>
                              <div className="form-field">
                                <label className="articles-label" style={{ fontSize: '0.7rem' }}>{isEn ? 'Description / Figure 3 Caption' : 'Descripción / Pie de Figura 3'}</label>
                                <input
                                  type="text"
                                  value={resultadosImagenDescripcion}
                                  onChange={(e) => setResultadosImagenDescripcion(e.target.value)}
                                  placeholder={isEn ? 'Enter figure description' : 'Ingresa la descripción de la figura 3'}
                                  className="articles-input"
                                />
                              </div>
                            </div>
                          ) : (
                            <label className="news-dropzone" style={{ padding: '1rem' }}>
                              <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setResultadosImagen)} style={{ display: 'none' }} />
                              <span className="news-upload-text" style={{ fontSize: '0.8rem' }}>{isEn ? 'Upload Results Image' : 'Subir Imagen de Resultados'}</span>
                            </label>
                          )}
                        </div>

                        <div className="form-field">
                          <label className="articles-label">{isEn ? 'Section IV: Conclusions and Discussion' : 'Sección IV: Conclusiones y Discusión'}</label>
                          <textarea
                            value={conclusiones}
                            onChange={(e) => setConclusiones(e.target.value)}
                            placeholder={isEn ? 'Write conclusions content here...' : 'Ingresa las conclusiones y discusión...'}
                            className="articles-textarea articles-textarea-large"
                          />
                        </div>

                        <div className="form-field" style={{ marginTop: '0.5rem' }}>
                          <label className="articles-label">{isEn ? 'Conclusions Image (Optional)' : 'Imagen de Conclusiones (Opcional)'}</label>
                          {conclusionesImagen ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              <div className="news-image-preview-container" style={{ maxHeight: '180px' }}>
                                <img src={formatImageUrl(conclusionesImagen)} alt="Preview" className="news-image-preview" style={{ maxHeight: '160px', objectFit: 'contain' }} />
                                <button type="button" className="news-btn-remove-image" onClick={() => { setConclusionesImagen(''); setConclusionesImagenDescripcion(''); }} title={isEn ? "Remove image" : "Quitar imagen"}>
                                  ×
                                </button>
                              </div>
                              <div className="form-field">
                                <label className="articles-label" style={{ fontSize: '0.7rem' }}>{isEn ? 'Description / Figure 4 Caption' : 'Descripción / Pie de Figura 4'}</label>
                                <input
                                  type="text"
                                  value={conclusionesImagenDescripcion}
                                  onChange={(e) => setConclusionesImagenDescripcion(e.target.value)}
                                  placeholder={isEn ? 'Enter figure description' : 'Ingresa la descripción de la figura 4'}
                                  className="articles-input"
                                />
                              </div>
                            </div>
                          ) : (
                            <label className="news-dropzone" style={{ padding: '1rem' }}>
                              <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setConclusionesImagen)} style={{ display: 'none' }} />
                              <span className="news-upload-text" style={{ fontSize: '0.8rem' }}>{isEn ? 'Upload Conclusions Image' : 'Subir Imagen de Conclusiones'}</span>
                            </label>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Accordion 6: Referencias */}
                  <div className="form-accordion-section">
                    <div
                      className={`form-accordion-header ${activeAccordion === 'refs' ? 'active' : ''}`}
                      onClick={() => toggleAccordion('refs')}
                    >
                      <span>{isEn ? '6. Bibliographic References' : '6. Referencias Bibliográficas'}</span>
                      <span className={`accordion-arrow ${activeAccordion === 'refs' ? 'rotated' : ''}`}>▼</span>
                    </div>
                    <div className={`form-accordion-content ${activeAccordion === 'refs' ? 'active' : ''}`}>
                      <div className="form-field">
                        <label className="articles-label">{isEn ? 'References (One per line, IEEE/APA format)' : 'Referencias (Una por línea, formato IEEE/APA)'}</label>
                        <textarea
                          value={referencias}
                          onChange={(e) => setReferencias(e.target.value)}
                          placeholder={isEn ? 'Enter references (one per line)...' : 'Ingresa las referencias bibliográficas (una por línea)...'}
                          className="articles-textarea"
                          style={{ minHeight: '120px' }}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Form Buttons */}
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" onClick={cerrarFormulario} className="art-btn-cancel">
                  {isEn ? 'Cancel' : 'Cancelar'}
                </button>
                <button type="submit" className="art-btn-save">
                  {editandoId ? (isEn ? 'Update Article' : 'Actualizar Artículo') : (isEn ? 'Publish in Repository' : 'Publicar en Repositorio')}
                </button>
              </div>

            </form>
          </div>

          {/* RIGHT COLUMN: REAL-TIME GORGEOUS IEEE 2-COLUMN PAPER PREVIEW */}
          <div className="paper-sticky-wrapper">
            <div className="paper-sheet">
              <span className="paper-badge">IEEE Template Format</span>

              <div className="paper-header">
                <div className="paper-journal">
                  {revista || (isEn ? 'INSTITUTIONAL RESEARCH JOURNAL - ULEAM' : 'REVISTA DE INVESTIGACIÓN INSTITUCIONAL - ULEAM')}
                </div>

                <h1 className="paper-title">
                  {titulo || (isEn ? 'SCIENTIFIC ARTICLE TITLE SHOULD BE WRITTEN HERE' : 'TÍTULO DEL ARTÍCULO CIENTÍFICO DEBE ESCRIBIRSE AQUÍ')}
                </h1>

                <div className="paper-authors">
                  {autores || (isEn ? 'Article Authors' : 'Autores del Artículo')}
                </div>

                <div className="paper-institution">
                  {isEn ? 'Faculty of Computer Science (FACCI), Universidad Laica Eloy Alfaro de Manabí' : 'Facultad de Ciencias Informáticas (FACCI), Universidad Laica Eloy Alfaro de Manabí'}
                </div>
              </div>

              {/* Conditional Preview depending on type */}
              {tipoRegistro === 'PDF' ? (
                /* PDF MODE: ONLY THE COVER DATA + BUTTON (NO ABSTRACT OR BODY) */
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '4rem', padding: '2rem', borderTop: '1px dashed #cbd5e1' }}>
                  <div style={{ fontStyle: 'italic', fontSize: '0.825rem', color: '#64748b', marginBottom: '1.5rem', textAlign: 'center' }}>
                    {isEn ? 'This article is indexed in an external repository or website. Click the link below to open full document:' : 'Este artículo se encuentra indexado en un repositorio externo o sitio web. Haz clic en el siguiente enlace para abrir el documento completo:'}
                  </div>

                  <a
                    href={urlPdf ? formatExternalUrl(urlPdf) : '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pub-paper-btn-pdf"
                    style={{ padding: '0.85rem 2rem', fontSize: '0.9rem', borderRadius: '8px', cursor: urlPdf ? 'pointer' : 'not-allowed', backgroundColor: '#2563eb' }}
                    onClick={(e) => { if (!urlPdf) e.preventDefault(); }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16" style={{ marginRight: '8px' }}>
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                    {urlPdf ? (isEn ? 'Go to External Repository' : 'Ir al Repositorio Externo') : (isEn ? 'Unspecified link' : 'Enlace no especificado')}
                  </a>
                </div>
              ) : (
                /* FULL MODE: DOUBLE COLUMN BODY SECTIONS WITH ABSTRACT */
                <>
                  {/* Abstract Full-Width Section */}
                  <div className="paper-abstract-section">
                    <div className="paper-abstract-text">
                      <strong>{isEn ? 'Abstract—' : 'Resumen—'}</strong>
                      {resumen || (isEn ? 'The scientific abstract describes in a continuous paragraph (typically between 150 and 250 words) the purpose of research, applied methodology, key results obtained, and conclusions. Fill out the form on the left to populate this segment.' : 'El resumen científico (Abstract) describe en un párrafo continuo (típicamente entre 150 y 250 palabras) el propósito de la investigación, la metodología aplicada, los resultados claves obtenidos y las conclusiones del estudio. Complete el formulario de la izquierda para poblar este segmento.')}
                    </div>

                    {palabrasClave && (
                      <div className="paper-keywords">
                        <strong>{isEn ? 'Keywords—' : 'Palabras Clave—'}</strong>
                        {palabrasClave}
                      </div>
                    )}
                  </div>

                  <div className="paper-body">
                    {/* Introduction Section */}
                    <div className="paper-section">
                      <h2 className="paper-section-title">{isEn ? 'I. Introduction' : 'I. Introducción'}</h2>
                      {introduccion ? (
                        <div className="paper-text ieee-dropcap">
                          {introduccion}
                        </div>
                      ) : (
                        <div className="paper-text">
                          {isEn ? '[The Introduction section presents general context, background, rationale and project objectives. Write in the respective section on the left to display content].' : '[La sección de Introducción presenta el contexto general, antecedentes, la problemática y los objetivos del proyecto. Escriba en la sección respectiva a la izquierda para visualizar el contenido].'}
                        </div>
                      )}
                      {introduccionImagen && (
                        <div className="paper-figure">
                          <img src={formatImageUrl(introduccionImagen)} alt="Fig 1" className="paper-figure-img" />
                          <div className="paper-figure-caption">
                            <strong>Fig. 1.</strong> {introduccionImagenDescripcion || (isEn ? 'Illustration or diagram corresponding to Introduction section.' : 'Ilustración o diagrama correspondiente a la sección de Introducción.')}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Methodology Section */}
                    {(metodologia || metodologiaImagen) && (
                      <div className="paper-section">
                        <h2 className="paper-section-title">{isEn ? 'II. Methodology' : 'II. Metodología'}</h2>
                        {metodologia && <div className="paper-text">{metodologia}</div>}
                        {metodologiaImagen && (
                          <div className="paper-figure">
                            <img src={formatImageUrl(metodologiaImagen)} alt="Fig 2" className="paper-figure-img" />
                            <div className="paper-figure-caption">
                              <strong>Fig. 2.</strong> {metodologiaImagenDescripcion || (isEn ? 'Methodological diagram of experimental design.' : 'Esquema metodológico del diseño experimental.')}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Results Section */}
                    {(resultados || resultadosImagen) && (
                      <div className="paper-section">
                        <h2 className="paper-section-title">{isEn ? 'III. Results and Discussion' : 'III. Resultados y Discusión'}</h2>
                        {resultados && <div className="paper-text">{resultados}</div>}
                        {resultadosImagen && (
                          <div className="paper-figure">
                            <img src={formatImageUrl(resultadosImagen)} alt="Fig 3" className="paper-figure-img" />
                            <div className="paper-figure-caption">
                              <strong>Fig. 3.</strong> {resultadosImagenDescripcion || (isEn ? 'Variable graph and discussion of findings.' : 'Gráfica de variables y discusión de hallazgos.')}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Conclusions Section */}
                    {(conclusiones || conclusionesImagen) && (
                      <div className="paper-section">
                        <h2 className="paper-section-title">{isEn ? 'IV. Conclusions' : 'IV. Conclusiones'}</h2>
                        {conclusiones && <div className="paper-text">{conclusiones}</div>}
                        {conclusionesImagen && (
                          <div className="paper-figure">
                            <img src={formatImageUrl(conclusionesImagen)} alt="Fig 4" className="paper-figure-img" />
                            <div className="paper-figure-caption">
                              <strong>Fig. 4.</strong> {conclusionesImagenDescripcion || (isEn ? 'Final illustration or photograph of implemented solution.' : 'Ilustración final o fotografía de la solución implementada.')}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* References Section */}
                    {referencias && (
                      <div className="paper-section" style={{ breakInside: 'avoid' }}>
                        <h2 className="paper-section-title" style={{ textAlign: 'left', borderBottom: '1px solid #000' }}>{isEn ? 'References' : 'Referencias'}</h2>
                        <ol className="paper-references-list">
                          {formatReferences(referencias).map((ref, idx) => (
                            <li key={idx} className="paper-reference-item">
                              {ref}
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>
                </>
              )}

            </div>
          </div>
        </div>
      ) : (
        /* LIST / GRID VIEW */
        <>
          {/* TOOLBAR */}
          <div className="articles-toolbar" style={{ position: 'relative', zIndex: 30 }}>

            {/* Buscador */}
            <div className="search-box-wrapper" style={{ flex: '1 1 220px' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16" className="search-box-icon">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder={t("manage_articles.search_ph", "Buscar por título, autores o palabras clave...")}
                className="art-search-input"
              />
            </div>

            {/* Filtro Estado */}
            <div className="art-filter-group-estado" style={{ position: 'relative' }}>
              <button
                type="button"
                className={`pub-news-unified-filter-btn ${showEstadoPanel ? 'open' : ''} ${filtroEstado ? 'active-filter' : ''}`}
                onClick={(e) => { e.stopPropagation(); setShowEstadoPanel(!showEstadoPanel); setShowTipoPanel(false); setShowOrdenPanel(false); }}
                style={{ height: '42px', borderRadius: '12px' }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
                <span>{textoEstado()}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {showEstadoPanel && (
                <div className="pub-news-unified-filter-panel art-order-dropdown-panel">
                  <div className="filter-panel-section" style={{ width: '100%' }}>
                    <span className="filter-panel-section-title">Filtrar por estado</span>
                    <div className="filter-panel-options-list">
                      {['Publicado', 'Borrador'].map(opt => (
                        <button key={opt} type="button"
                          className={`filter-panel-option-item ${filtroEstado === opt ? 'active' : ''}`}
                          onClick={() => { setFiltroEstado(filtroEstado === opt ? null : opt); setShowEstadoPanel(false); }}
                        >{opt}</button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Filtro Tipo */}
            <div className="art-filter-group-tipo" style={{ position: 'relative' }}>
              <button
                type="button"
                className={`pub-news-unified-filter-btn ${showTipoPanel ? 'open' : ''} ${filtroTipo ? 'active-filter' : ''}`}
                onClick={(e) => { e.stopPropagation(); setShowTipoPanel(!showTipoPanel); setShowEstadoPanel(false); setShowOrdenPanel(false); }}
                style={{ height: '42px', borderRadius: '12px' }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                </svg>
                <span>{textoTipo()}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {showTipoPanel && (
                <div className="pub-news-unified-filter-panel art-order-dropdown-panel">
                  <div className="filter-panel-section" style={{ width: '100%' }}>
                    <span className="filter-panel-section-title">Filtrar por tipo</span>
                    <div className="filter-panel-options-list">
                      <button type="button"
                        className={`filter-panel-option-item ${filtroTipo === 'Completo' ? 'active' : ''}`}
                        onClick={() => { setFiltroTipo(filtroTipo === 'Completo' ? null : 'Completo'); setShowTipoPanel(false); }}
                      >Texto completo</button>
                      <button type="button"
                        className={`filter-panel-option-item ${filtroTipo === 'PDF' ? 'active' : ''}`}
                        onClick={() => { setFiltroTipo(filtroTipo === 'PDF' ? null : 'PDF'); setShowTipoPanel(false); }}
                      >Enlace externo</button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Filtro Ordenar */}
            <div className="art-filter-group-orden" style={{ position: 'relative' }}>
              <button
                type="button"
                className={`pub-news-unified-filter-btn ${showOrdenPanel ? 'open' : ''} ${orden ? 'active-filter' : ''}`}
                onClick={(e) => { e.stopPropagation(); setShowOrdenPanel(!showOrdenPanel); setShowEstadoPanel(false); setShowTipoPanel(false); }}
                style={{ height: '42px', borderRadius: '12px' }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                  <path d="M3 12h18M3 6h18M3 18h18" />
                </svg>
                <span>{textoOrden()}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {showOrdenPanel && (
                <div className="pub-news-unified-filter-panel art-order-dropdown-panel">
                  <div className="filter-panel-section" style={{ width: '100%' }}>
                    <span className="filter-panel-section-title">Ordenar por</span>
                    <div className="filter-panel-options-list">
                      {[
                        { key: 'desc', label: 'Más recientes primero' },
                        { key: 'asc', label: 'Más antiguos primero' },
                        { key: 'name_asc', label: 'Título (A-Z)' },
                        { key: 'name_desc', label: 'Título (Z-A)' },
                      ].map(opt => (
                        <button key={opt.key} type="button"
                          className={`filter-panel-option-item ${orden === opt.key ? 'active' : ''}`}
                          onClick={() => { setOrden(orden === opt.key ? null : opt.key); setShowOrdenPanel(false); }}
                        >{opt.label}</button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button onClick={abrirFormulario} className="art-btn-add" style={{ marginLeft: 'auto' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="14" height="14">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              {t("manage_articles.add_article", "Registrar Artículo")}
            </button>
          </div>

          {/* GRID OF CARDS */}
          {articulosFiltrados.length === 0 ? (
            <div className="articles-empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="64" height="64" className="articles-empty-icon">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              <h3>{t("manage_articles.empty", "No se encontraron artículos registrados.")}</h3>
            </div>
          ) : (
            <>
              <div className="pub-art-grid">
                {articulosPaginados.map((art) => (
                  <div
                    key={art.id}
                    className={`pub-art-card ${art.tipo_registro === 'PDF' ? 'card-pdf' : 'card-internal'}`}
                    style={{ minHeight: '390px' }}
                  >
                    {/* LEFT VERTICAL SPINE */}
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
                            Enlace Externo
                          </span>
                        ) : (
                          <span className="pub-art-card-badge internal-badge">
                            Lectura Digital
                          </span>
                        )}
                      </div>

                      <h3 className="pub-art-card-title" style={{ fontSize: '1rem' }}>{art.titulo}</h3>

                      <div className="pub-art-card-prepared-by" style={{ margin: '0.5rem 0' }}>
                        <div className="pub-art-prepared-label">Preparado por:</div>
                        <div className="pub-art-card-authors-text" style={{ fontSize: '0.78rem' }}>{art.autores}</div>
                        <div className="pub-art-card-revista-text" style={{ fontSize: '0.68rem' }}>{art.revista || 'Facultad de Ciencias Informáticas (FACCI)'}</div>
                        <div className="pub-art-card-date-text" style={{ fontSize: '0.68rem' }}>
                          Publicado: {art.created_at ? new Date(art.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Reciente'}
                        </div>
                      </div>

                      <div className="pub-art-card-footer" style={{ borderTop: 'none', paddingTop: 0 }}>
                        <span className={`art-card-status-badge ${art.estado === 'Publicado' ? 'status-published' : 'status-draft'}`}>
                          {art.estado === 'Publicado' ? t("manage_articles.status_published", "Publicado") : t("manage_articles.status_draft", "Borrador")}
                        </span>

                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          {art.url_pdf && (
                            <a
                              href={formatExternalUrl(art.url_pdf)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="art-btn-link"
                              title={language === 'en' ? 'Open link' : 'Abrir enlace'}
                            >
                              <svg className="art-btn-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                <polyline points="15 3 21 3 21 9" />
                                <line x1="10" y1="14" x2="21" y2="3" />
                              </svg>
                              <span className="art-btn-text">Link</span>
                            </a>
                          )}
                          <button
                            onClick={() => cargarEdicion(art)}
                            className="art-btn-edit"
                            title={language === 'en' ? 'Edit article' : 'Editar artículo'}
                          >
                            <svg className="art-btn-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z" />
                            </svg>
                            <span className="art-btn-text">{t("admin.edit", "Editar")}</span>
                          </button>
                          <button
                            onClick={() => eliminarArticulo(art.id)}
                            className="art-btn-delete"
                            title={language === 'en' ? 'Delete article' : 'Eliminar artículo'}
                          >
                            <svg className="art-btn-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              <line x1="10" y1="11" x2="10" y2="17" />
                              <line x1="14" y1="11" x2="14" y2="17" />
                            </svg>
                            <span className="art-btn-text">{t("admin.delete", "Borrar")}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* CONTROLES DE PAGINACIÓN */}
              {articulosFiltrados.length > 0 && (
                <div className="articles-pagination-bar">
                  <div className="articles-pagination-info">
                    {language === 'en' 
                      ? `Showing ${Math.min(startIndex + 1, articulosFiltrados.length)} to ${Math.min(startIndex + itemsPerPage, articulosFiltrados.length)} of ${articulosFiltrados.length} articles`
                      : `Mostrando ${Math.min(startIndex + 1, articulosFiltrados.length)} a ${Math.min(startIndex + itemsPerPage, articulosFiltrados.length)} de ${articulosFiltrados.length} artículos`}
                  </div>

                  <div className="articles-pagination-controls">
                    <CustomItemsPerPageSelect
                      value={itemsPerPage}
                      onChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
                      options={[10, 20, 50]}
                      language={language}
                    />

                    <button
                      type="button"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="articles-pagination-btn prev-btn"
                      title={language === 'en' ? 'Previous page' : 'Página anterior'}
                    >
                      <svg className="articles-pagination-arrow-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                        <polyline points="15 18 9 12 15 6" />
                      </svg>
                      <span className="articles-pagination-btn-text">{language === 'en' ? '← Prev' : '← Anterior'}</span>
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setCurrentPage(p)}
                        className={`articles-pagination-page-btn ${p === currentPage ? 'active' : ''}`}
                      >
                        {p}
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="articles-pagination-btn next-btn"
                      title={language === 'en' ? 'Next page' : 'Página siguiente'}
                    >
                      <span className="articles-pagination-btn-text">{language === 'en' ? 'Next →' : 'Siguiente →'}</span>
                      <svg className="articles-pagination-arrow-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
