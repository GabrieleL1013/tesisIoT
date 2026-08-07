import { API_BASE_URL, fetchWithAuth } from '../../config/api';
import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import { useLanguage } from '../../context/LanguageContext';
import { usePageTitle } from '../../hooks/usePageTitle';
import '../../styles/components/admin/GestionarNoticias.css';

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

export default function GestionarNoticias() {
  const { t, language } = useLanguage();
  usePageTitle({ es: 'Gestionar Noticias', en: 'Manage News' }, 'Admin · IoT ULEAM');
  const [noticias, setNoticias] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  // Filtros de lista
  const [filtroEstado, setFiltroEstado] = useState(null);
  const [orden, setOrden] = useState(null);
  const [showEstadoPanel, setShowEstadoPanel] = useState(false);
  const [showOrdenPanel, setShowOrdenPanel] = useState(false);

  // Estados del Formulario
  const [editandoId, setEditandoId] = useState(null);
  const [titulo, setTitulo] = useState('');
  const [autor, setAutor] = useState('');
  const [imagenUrl, setImagenUrl] = useState('');
  const [estado, setEstado] = useState('Publicado');

  // Estado para secciones/bloques dinámicos
  const [bloques, setBloques] = useState([
    { id: Date.now(), type: 'text', value: '' }
  ]);

  // Estados de Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Resetear página actual al cambiar filtros o búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [busqueda, filtroEstado, orden]);

  // Filtrado y ordenamiento de la lista
  const noticiasFiltradas = noticias
    .filter(n => {
      const query = busqueda.toLowerCase().trim();
      const matchQuery = !query || n.titulo.toLowerCase().includes(query) || n.autor.toLowerCase().includes(query);
      const matchEstado = !filtroEstado || n.estado === filtroEstado;
      return matchQuery && matchEstado;
    })
    .sort((a, b) => {
      if (orden === 'name_asc') return a.titulo.localeCompare(b.titulo);
      if (orden === 'name_desc') return b.titulo.localeCompare(a.titulo);
      if (orden === 'asc') return Number(a.id) - Number(b.id);
      return Number(b.id) - Number(a.id); // desc por defecto
    });

  const totalPages = Math.ceil(noticiasFiltradas.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const noticiasPaginadas = noticiasFiltradas.slice(startIndex, startIndex + itemsPerPage);

  // Cargar datos al iniciar
  const cargarNoticias = () => {
    fetchWithAuth(`${API_BASE_URL}/noticias`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          const mapped = data.map(item => ({
            id: item.id,
            titulo: item.titulo,
            autor: item.autor,
            contenido: item.contenido,
            imagenUrl: item.imagen_url || item.imagenUrl || '',
            estado: item.estado,
            fecha: item.created_at ? new Date(item.created_at).toLocaleDateString() : new Date().toLocaleDateString()
          }));
          setNoticias(mapped);
        }
      })
      .catch(err => {
        console.error("Error loading news articles:", err);
      });
  };

  useEffect(() => {
    cargarNoticias();
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
      if (!e.target.closest('.news-filter-group-estado')) setShowEstadoPanel(false);
      if (!e.target.closest('.news-filter-group-orden')) setShowOrdenPanel(false);
    };
    document.addEventListener('click', handleOutside);
    return () => document.removeEventListener('click', handleOutside);
  }, []);

  // Helpers texto filtros
  const textoEstado = () => {
    if (filtroEstado === 'Publicado') return t("manage_news.status_published", "Publicado");
    if (filtroEstado === 'Borrador') return t("manage_news.status_draft", "Borrador");
    return t("manage_news.col_status", "Estado");
  };

  const textoOrden = () => {
    if (orden === 'asc') return language === 'en' ? 'Oldest first' : 'Más antiguos';
    if (orden === 'desc') return language === 'en' ? 'Newest first' : 'Más recientes';
    if (orden === 'name_asc') return language === 'en' ? 'Title (A-Z)' : 'Título (A-Z)';
    if (orden === 'name_desc') return language === 'en' ? 'Title (Z-A)' : 'Título (Z-A)';
    return language === 'en' ? 'Sort' : 'Ordenar';
  };

  // Controladores de bloques dinámicos
  const agregarBloque = (type) => {
    setBloques([...bloques, { id: Date.now() + Math.random(), type, value: '' }]);
  };

  const eliminarBloque = (id) => {
    if (bloques.length === 1) {
      Swal.fire({
        icon: 'info',
        title: 'Operación no permitida',
        text: 'El artículo debe tener al menos una sección de contenido.',
        confirmButtonColor: '#0f2c59'
      });
      return;
    }
    setBloques(bloques.filter(b => b.id !== id));
  };

  const actualizarBloque = (id, value) => {
    setBloques(bloques.map(b => b.id === id ? { ...b, value } : b));
  };

  const moverBloqueArriba = (index) => {
    if (index === 0) return;
    const nuevosBloques = [...bloques];
    const temp = nuevosBloques[index];
    nuevosBloques[index] = nuevosBloques[index - 1];
    nuevosBloques[index - 1] = temp;
    setBloques(nuevosBloques);
  };

  const moverBloqueAbajo = (index) => {
    if (index === bloques.length - 1) return;
    const nuevosBloques = [...bloques];
    const temp = nuevosBloques[index];
    nuevosBloques[index] = nuevosBloques[index + 1];
    nuevosBloques[index + 1] = temp;
    setBloques(nuevosBloques);
  };

  const handleBlockImageChange = async (e, blockId) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire({ icon: 'error', title: 'Archivo demasiado grande', text: 'La imagen debe ser menor a 5MB.', confirmButtonColor: '#0f2c59' });
        return;
      }
      try {
        const webpBase64 = await convertImageToWebP(file);
        actualizarBloque(blockId, webpBase64);
      } catch (err) {
        const reader = new FileReader();
        reader.onloadend = () => actualizarBloque(blockId, reader.result);
        reader.readAsDataURL(file);
      }
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire({ icon: 'error', title: 'Archivo demasiado grande', text: 'La imagen debe ser menor a 5MB.', confirmButtonColor: '#0f2c59' });
        return;
      }
      try {
        const webpBase64 = await convertImageToWebP(file);
        setImagenUrl(webpBase64);
      } catch (err) {
        const reader = new FileReader();
        reader.onloadend = () => setImagenUrl(reader.result);
        reader.readAsDataURL(file);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!titulo.trim() || !autor.trim()) {
      Swal.fire({ icon: 'warning', title: 'Campos Incompletos', text: 'Por favor, completa los campos de título y autor del artículo.', confirmButtonColor: '#0f2c59' });
      return;
    }

    const bloquesFiltrados = bloques.filter(b => b.value && b.value.trim() !== '');
    if (bloquesFiltrados.length === 0) {
      Swal.fire({ icon: 'warning', title: 'Contenido Vacío', text: 'Por favor, escribe texto o sube una imagen en al menos una de las secciones del artículo.', confirmButtonColor: '#0f2c59' });
      return;
    }

    const payload = {
      titulo: titulo.trim(),
      autor: autor.trim(),
      contenido: JSON.stringify(bloques),
      imagen_url: imagenUrl,
      estado
    };

    const endpoint = editandoId
      ? `${API_BASE_URL}/noticias/${editandoId}`
      : `${API_BASE_URL}/noticias`;

    const method = editandoId ? 'PUT' : 'POST';

    fetchWithAuth(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(res => { if (!res.ok) throw new Error("Server error"); return res.json(); })
      .then(() => {
        Swal.fire({
          icon: 'success',
          title: editandoId ? '¡Actualizado!' : '¡Publicado!',
          text: editandoId ? 'El artículo científico se actualizó correctamente.' : 'La noticia se ha publicado correctamente en el sistema.',
          confirmButtonColor: '#0f2c59',
          timer: 2000
        });
        cargarNoticias();
        setMostrarFormulario(false);
        limpiarFormulario();
      })
      .catch(err => {
        console.error("Error saving article:", err);
        Swal.fire({ icon: 'error', title: 'Error de Red', text: 'No se pudo guardar la noticia en la base de datos.', confirmButtonColor: '#0f2c59' });
      });
  };

  const parseAndNormalizeBlocks = (contenidoRaw) => {
    if (!contenidoRaw) return [{ id: Date.now(), type: 'text', value: '' }];
    let blocks = [];
    try {
      if (typeof contenidoRaw === 'string' && contenidoRaw.trim().startsWith('[')) {
        blocks = JSON.parse(contenidoRaw);
      } else if (Array.isArray(contenidoRaw)) {
        blocks = contenidoRaw;
      } else {
        return [{ id: Date.now(), type: 'text', value: String(contenidoRaw) }];
      }
    } catch (e) {
      return [{ id: Date.now(), type: 'text', value: String(contenidoRaw) }];
    }

    if (!Array.isArray(blocks) || blocks.length === 0) {
      return [{ id: Date.now(), type: 'text', value: '' }];
    }

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
        id: b.id || (Date.now() + idx),
        type,
        value: b.value || ''
      };
    });
  };

  const cargarEdicion = (noticia) => {
    setEditandoId(noticia.id);
    setTitulo(noticia.titulo);
    setAutor(noticia.autor);
    setImagenUrl(noticia.imagenUrl || '');
    setEstado(noticia.estado);

    const blocks = parseAndNormalizeBlocks(noticia.contenido);
    setBloques(blocks);
    setMostrarFormulario(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const eliminarNoticia = (id) => {
    const noticia = noticias.find(n => n.id === id);
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Esta acción eliminará la noticia "${noticia?.titulo}" de la base de datos de forma permanente.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#4b5563',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        fetchWithAuth(`${API_BASE_URL}/noticias/${id}`, { method: 'DELETE' })
          .then(res => { if (!res.ok) throw new Error("Server error"); return res.json(); })
          .then(() => {
            Swal.fire({ icon: 'success', title: 'Eliminado', text: 'Artículo eliminado correctamente.', confirmButtonColor: '#0f2c59' });
            cargarNoticias();
            if (editandoId === id) { limpiarFormulario(); setMostrarFormulario(false); }
          })
          .catch(err => {
            console.error("Error deleting article:", err);
            Swal.fire({ icon: 'error', title: 'Error de Red', text: 'No se pudo eliminar el artículo en el servidor.', confirmButtonColor: '#0f2c59' });
          });
      }
    });
  };

  const limpiarFormulario = () => {
    setEditandoId(null);
    setTitulo('');
    setAutor('');
    setImagenUrl('');
    setEstado('Publicado');
    setBloques([{ id: Date.now(), type: 'text', value: '' }]);
  };

  const abrirFormulario = () => { limpiarFormulario(); setMostrarFormulario(true); };

  const isEn = language === 'en';

  const cerrarFormulario = () => {
    const tieneCambios = titulo.trim() !== '' || autor.trim() !== '' || imagenUrl.trim() !== '' || (bloques.length > 1 || (bloques.length === 1 && bloques[0].value.trim() !== ''));

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

  return (
    <div className="news-container">

      {/* CABECERA DINÁMICA */}
      {mostrarFormulario && (
        <div className="news-header">
          <div>
            <h2 className="news-heading">
              {editandoId ? (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="22" height="22" style={{ display: 'inline-block', marginRight: '8px', verticalAlign: 'middle' }}>
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z" />
                  </svg>
                  {t("manage_news.edit_title", "Modificar Noticia Informativa")}
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="22" height="22" style={{ display: 'inline-block', marginRight: '8px', verticalAlign: 'middle' }}>
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  {t("manage_news.new_title", "Publicar Nueva Noticia")}
                </>
              )}
            </h2>
            <p className="news-subheading">
              {t("manage_news.form_subheading", "Redacta el contenido, sube la portada y organiza los bloques de texto e imágenes.")}
            </p>
          </div>

          <button onClick={cerrarFormulario} className="news-btn-back">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="15" height="15">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            {t("manage_news.back_to_list", "Volver al Listado")}
          </button>
        </div>
      )}

      {/* MODO FORMULARIO: REGISTRO / EDICIÓN */}
      {mostrarFormulario ? (
        <div className="news-form-panel">
          <form onSubmit={handleSubmit} className="news-form">
            <div className="news-grid">

              {/* Column 1: Metadatos e Imagen Principal */}
              <div className="news-fields-column">
                <div className="news-field-group">
                  <label className="news-label">{t("manage_news.news_title_label", isEn ? "News Title / Finding" : "Título de la Noticia / Hallazgo")}</label>
                  <input
                    type="text"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder={t("manage_news.news_title_ph", isEn ? "E.g. Implementation of new CO2 measurement nodes at Manta Campus" : "Ej. Implementación de nuevos nodos de medición de CO2 en el Campus Manta")}
                    className="news-input"
                  />
                </div>

                <div className="news-field-group">
                  <label className="news-label">{t("manage_news.author_label", isEn ? "Researcher / Responsible Author" : "Investigador / Autor Responsable")}</label>
                  <input
                    type="text"
                    value={autor}
                    onChange={(e) => setAutor(e.target.value)}
                    placeholder={t("manage_news.author_ph", isEn ? "E.g. Dr. Willian Zamora" : "Ej. Dr. Willian Zamora")}
                    className="news-input"
                  />
                </div>

                <div className="news-field-group">
                  <label className="news-label">{t("manage_news.status_label", isEn ? "Publication Status" : "Estado de Publicación")}</label>
                  <select value={estado} onChange={(e) => setEstado(e.target.value)} className="news-select">
                    <option value="Publicado">{isEn ? "Published (Visible in Public Portal)" : "Publicado (Visible en Portal Público)"}</option>
                    <option value="Borrador">{isEn ? "Draft (Hidden from Public)" : "Borrador (Oculto al Público)"}</option>
                  </select>
                </div>

                {/* Imagen de portada — solo subida manual */}
                <div className="news-field-group" style={{ marginTop: '0.5rem' }}>
                  <label className="news-label">{t("manage_news.cover_label", isEn ? "Main Cover Image" : "Imagen de Portada Principal")}</label>

                  {imagenUrl ? (
                    <div className="news-image-preview-container">
                      <img src={imagenUrl} alt="Vista previa" className="news-image-preview" />
                      <button type="button" className="news-btn-remove-image" onClick={() => setImagenUrl('')} title={isEn ? "Remove image" : "Quitar imagen"}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="14" height="14">
                          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <label className="news-dropzone">
                      <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="44" height="44" className="news-upload-icon">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      <span className="news-upload-text">{isEn ? "Upload cover image" : "Subir imagen de portada"}</span>
                      <span className="news-upload-hint">PNG, JPG, WEBP · {isEn ? "Max. 2MB" : "Máx. 2MB"}</span>
                    </label>
                  )}
                </div>
              </div>

              {/* Column 2: Editor de Bloques Reordenables */}
              <div className="news-media-column">
                <div className="news-field-group" style={{ flex: 1 }}>
                  <label className="news-label" style={{ marginBottom: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{t("manage_news.body_label", isEn ? "Article Body (Reorderable Sections)" : "Cuerpo del Artículo (Secciones Reordenables)")}</span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '500' }}>{t("manage_news.body_hint", isEn ? "Reorder using ▲ or ▼" : "Reordena usando ▲ o ▼")}</span>
                  </label>

                  <div className="news-blocks-list">
                    {bloques.map((block, index) => (
                      <div key={block.id} className="news-block-item">

                        {/* Block Header / Control bar */}
                        <div className="news-block-header">
                          <span className="news-block-type-badge">
                            {block.type === 'text' ? (isEn ? 'Text Section' : 'Sección de Texto') : (isEn ? 'Image Section' : 'Sección de Imagen')}
                          </span>

                          <div className="news-block-controls">
                            <button type="button" onClick={() => moverBloqueArriba(index)} disabled={index === 0} className="news-btn-block-control" title={isEn ? "Move section up" : "Subir sección"}>▲</button>
                            <button type="button" onClick={() => moverBloqueAbajo(index)} disabled={index === bloques.length - 1} className="news-btn-block-control" title={isEn ? "Move section down" : "Bajar sección"}>▼</button>
                            <button type="button" onClick={() => eliminarBloque(block.id)} className="news-btn-block-delete" title={isEn ? "Delete section" : "Eliminar sección"}>×</button>
                          </div>
                        </div>

                        {/* Block Content Body */}
                        <div className="news-block-body">
                          {block.type === 'text' ? (
                            <textarea
                              value={block.value}
                              onChange={(e) => actualizarBloque(block.id, e.target.value)}
                              placeholder={t("manage_news.text_ph", isEn ? "Write content for this text section..." : "Escribe el contenido de esta sección de texto...")}
                              className="news-block-textarea"
                            />
                          ) : (
                            <div className="news-block-image-upload-wrapper">
                              {block.value ? (
                                <div className="news-block-image-preview-container">
                                  <img src={formatImageUrl(block.value)} alt="Sección del artículo" className="news-block-image-preview" />
                                  <button type="button" onClick={() => actualizarBloque(block.id, '')} className="news-block-btn-remove-image">{isEn ? "Remove Image" : "Quitar Imagen"}</button>
                                </div>
                              ) : (
                                <label className="news-block-dropzone">
                                  <input type="file" accept="image/*" onChange={(e) => handleBlockImageChange(e, block.id)} style={{ display: 'none' }} />
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20" className="news-block-upload-icon">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                    <circle cx="8.5" cy="8.5" r="1.5" />
                                    <polyline points="21 15 16 10 5 21" />
                                  </svg>
                                  <span>{t("manage_news.upload_img_section", isEn ? "Upload image for this section" : "Subir imagen para esta sección")}</span>
                                </label>
                              )}
                            </div>
                          )}
                        </div>

                      </div>
                    ))}
                  </div>

                  {/* Add Block Toolbar */}
                  <div className="news-add-block-buttons">
                    <button type="button" onClick={() => agregarBloque('text')} className="news-btn-add-block text">
                      {t("manage_news.add_text_section", isEn ? "+ Add Text Section" : "+ Añadir Sección de Texto")}
                    </button>
                    <button type="button" onClick={() => agregarBloque('image')} className="news-btn-add-block image">
                      {t("manage_news.add_img_section", isEn ? "+ Add Image Section" : "+ Añadir Sección de Imagen")}
                    </button>
                  </div>
                </div>
              </div>

            </div>

            <div className="news-form-actions">
              <button type="button" onClick={cerrarFormulario} className="news-btn-cancel">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                {isEn ? "Cancel" : "Cancelar"}
              </button>
              <button type="submit" className="news-btn-save">
                {editandoId ? (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="15" height="15">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                      <polyline points="17 21 17 13 7 13 7 21" />
                      <polyline points="7 3 7 8 15 8" />
                    </svg>
                    {t("manage_news.update_btn", isEn ? "Update Article" : "Actualizar Noticia")}
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="15" height="15">
                      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    {t("manage_news.publish_btn", isEn ? "Publish News" : "Publicar Noticia")}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* MODO LISTADO */
        <div className="news-list-panel">

          {/* Barra de Búsqueda, Filtros y Botón Registrar */}
          <div className="news-toolbar">

            {/* Buscador */}
            <div className="news-search-box" style={{ flex: '1 1 200px', position: 'relative', display: 'flex', alignItems: 'center' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16" className="news-search-icon">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder={t("manage_news.search_ph", "Buscar noticia por título o autor...")}
                className="news-search-input"
              />
            </div>

            {/* Filtro por Estado */}
            <div className="news-filter-popover-group news-filter-group-estado" style={{ position: 'relative' }}>
              <button
                type="button"
                className={`pub-news-unified-filter-btn ${showEstadoPanel ? 'open' : ''} ${filtroEstado ? 'active-filter' : ''}`}
                onClick={(e) => { e.stopPropagation(); setShowEstadoPanel(!showEstadoPanel); setShowOrdenPanel(false); }}
                style={{ height: '42px', borderRadius: '12px' }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span>{textoEstado()}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12" className="select-arrow-icon">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {showEstadoPanel && (
                <div className="pub-news-unified-filter-panel" style={{ minWidth: '200px', left: 0 }}>
                  <div className="filter-panel-section" style={{ width: '100%' }}>
                    <span className="filter-panel-section-title">Filtrar por estado</span>
                    <div className="filter-panel-options-list">
                      {['Publicado', 'Borrador'].map(opt => (
                        <button
                          key={opt}
                          type="button"
                          className={`filter-panel-option-item ${filtroEstado === opt ? 'active' : ''}`}
                          onClick={() => {
                            setFiltroEstado(filtroEstado === opt ? null : opt);
                            setShowEstadoPanel(false);
                          }}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Filtro Ordenar */}
            <div className="news-filter-popover-group news-filter-group-orden" style={{ position: 'relative' }}>
              <button
                type="button"
                className={`pub-news-unified-filter-btn ${showOrdenPanel ? 'open' : ''} ${orden ? 'active-filter' : ''}`}
                onClick={(e) => { e.stopPropagation(); setShowOrdenPanel(!showOrdenPanel); setShowEstadoPanel(false); }}
                style={{ height: '42px', borderRadius: '12px' }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                  <path d="M3 12h18M3 6h18M3 18h18" />
                </svg>
                <span>{textoOrden()}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12" className="select-arrow-icon">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {showOrdenPanel && (
                <div className="pub-news-unified-filter-panel" style={{ minWidth: '220px', left: 0 }}>
                  <div className="filter-panel-section" style={{ width: '100%' }}>
                    <span className="filter-panel-section-title">Ordenar por</span>
                    <div className="filter-panel-options-list">
                      {[
                        { key: 'desc', label: 'Más recientes primero' },
                        { key: 'asc', label: 'Más antiguos primero' },
                        { key: 'name_asc', label: 'Título (A-Z)' },
                        { key: 'name_desc', label: 'Título (Z-A)' },
                      ].map(opt => (
                        <button
                          key={opt.key}
                          type="button"
                          className={`filter-panel-option-item ${orden === opt.key ? 'active' : ''}`}
                          onClick={() => { setOrden(orden === opt.key ? null : opt.key); setShowOrdenPanel(false); }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Botón agregar */}
            <button onClick={abrirFormulario} className="news-btn-add" style={{ flexShrink: 0, height: '42px', borderRadius: '12px' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="16" height="16">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              {t("manage_news.add_news", "Crear Noticia")}
            </button>
          </div>

          {/* Tabla de Artículos */}
          <div className="news-table-wrapper">
            <table className="news-table">
              <thead>
                <tr>
                  <th style={{ width: '4rem' }}>#</th>
                  <th>{t("manage_news.col_news", "Noticia")}</th>
                  <th style={{ width: '10rem' }}>{t("manage_news.col_status", "Estado")}</th>
                  <th style={{ width: '12rem' }}>{t("manage_news.col_date", "Fecha de Publicación")}</th>
                  <th style={{ width: '16rem', textAlign: 'right' }}>{t("manage_news.col_ops", "Operaciones")}</th>
                </tr>
              </thead>
              <tbody>
                {noticiasFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="news-empty-cell">
                      {t("manage_news.empty", "No se encontraron noticias registradas.")}
                    </td>
                  </tr>
                ) : (
                  noticiasPaginadas.map((n, i) => (
                    <tr key={n.id} className="news-row">
                      <td className="news-idx">{String(startIndex + i + 1).padStart(2, '0')}</td>
                      <td>
                        <div className="news-title-cell-wrapper">
                          {n.imagenUrl ? (
                            <img src={formatImageUrl(n.imagenUrl)} alt="Miniatura" className="news-thumb-mini" />
                          ) : (
                            <div className="news-thumb-placeholder">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18">
                                <rect x="3" y="3" width="18" height="18" rx="2" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <polyline points="21 15 16 10 5 21" />
                              </svg>
                            </div>
                          )}
                          <div>
                            <span className="news-name">{n.titulo}</span>
                            <span className="news-author">{t("manage_news.by_author", "Por:")} {n.autor}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge-status ${n.estado === 'Publicado' ? 'status-published' : 'status-draft'}`}>
                          {n.estado === 'Publicado' ? t("manage_articles.status_published", "Publicado") : t("manage_articles.status_draft", "Borrador")}
                        </span>
                      </td>
                      <td className="news-date-cell">
                        <span className="news-date-pill">{n.fecha}</span>
                      </td>
                      <td>
                        <div className="news-row-actions">
                          <button onClick={() => cargarEdicion(n)} className="news-btn-edit">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z" />
                            </svg>
                            {t("admin.edit", "Editar")}
                          </button>
                          <button onClick={() => eliminarNoticia(n.id)} className="news-btn-delete">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              <line x1="10" y1="11" x2="10" y2="17" />
                              <line x1="14" y1="11" x2="14" y2="17" />
                            </svg>
                            {t("manage_news.delete", "Borrar")}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* CONTROLES DE PAGINACIÓN */}
          {noticiasFiltradas.length > 0 && (
            <div className="news-pagination-bar">
              <div className="news-pagination-info">
                {language === 'en'
                  ? `Showing ${Math.min(startIndex + 1, noticiasFiltradas.length)} to ${Math.min(startIndex + itemsPerPage, noticiasFiltradas.length)} of ${noticiasFiltradas.length} news items`
                  : `Mostrando ${Math.min(startIndex + 1, noticiasFiltradas.length)} a ${Math.min(startIndex + itemsPerPage, noticiasFiltradas.length)} de ${noticiasFiltradas.length} noticias`}
              </div>

              <div className="news-pagination-controls">
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
                  className="news-pagination-btn prev-btn"
                  title={language === 'en' ? 'Previous page' : 'Página anterior'}
                >
                  <svg className="news-pagination-arrow-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                  <span className="news-pagination-btn-text">{language === 'en' ? '← Prev' : '← Anterior'}</span>
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setCurrentPage(p)}
                    className={`news-pagination-page-btn ${p === currentPage ? 'active' : ''}`}
                  >
                    {p}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="news-pagination-btn next-btn"
                  title={language === 'en' ? 'Next page' : 'Página siguiente'}
                >
                  <span className="news-pagination-btn-text">{language === 'en' ? 'Next →' : 'Siguiente →'}</span>
                  <svg className="news-pagination-arrow-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}