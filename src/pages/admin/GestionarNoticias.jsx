import { API_BASE_URL } from '../../config/api';
import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import '../../styles/components/admin/GestionarNoticias.css';

export default function GestionarNoticias() {
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

  // Cargar datos al iniciar
  const cargarNoticias = () => {
    fetch(`${API_BASE_URL}/noticias`)
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
    if (filtroEstado === 'Publicado') return 'Publicado';
    if (filtroEstado === 'Borrador') return 'Borrador';
    return 'Estado';
  };

  const textoOrden = () => {
    if (orden === 'asc') return 'Más antiguos';
    if (orden === 'desc') return 'Más recientes';
    if (orden === 'name_asc') return 'Título (A-Z)';
    if (orden === 'name_desc') return 'Título (Z-A)';
    return 'Ordenar';
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

  const handleBlockImageChange = (e, blockId) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        Swal.fire({ icon: 'error', title: 'Archivo demasiado grande', text: 'La imagen debe ser menor a 2MB.', confirmButtonColor: '#0f2c59' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => actualizarBloque(blockId, reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        Swal.fire({ icon: 'error', title: 'Archivo demasiado grande', text: 'La imagen debe ser menor a 2MB.', confirmButtonColor: '#0f2c59' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setImagenUrl(reader.result);
      reader.readAsDataURL(file);
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

    fetch(endpoint, {
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

  const cargarEdicion = (noticia) => {
    setEditandoId(noticia.id);
    setTitulo(noticia.titulo);
    setAutor(noticia.autor);
    setImagenUrl(noticia.imagenUrl || '');
    setEstado(noticia.estado);

    let blocks = [];
    try {
      if (noticia.contenido && noticia.contenido.startsWith('[')) {
        blocks = JSON.parse(noticia.contenido);
      } else {
        blocks = [{ id: Date.now(), type: 'text', value: noticia.contenido || '' }];
      }
    } catch (e) {
      blocks = [{ id: Date.now(), type: 'text', value: noticia.contenido || '' }];
    }
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
        fetch(`${API_BASE_URL}/noticias/${id}`, { method: 'DELETE' })
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
  
  const cerrarFormulario = () => {
    const tieneCambios = titulo.trim() !== '' || autor.trim() !== '' || imagenUrl.trim() !== '' || (bloques.length > 1 || (bloques.length === 1 && bloques[0].value.trim() !== ''));
    
    if (tieneCambios || editandoId !== null) {
      Swal.fire({
        title: '¿Descartar cambios?',
        text: 'Hay datos en el formulario. Si sales, se perderán los cambios no guardados.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#4b5563',
        confirmButtonText: 'Sí, salir',
        cancelButtonText: 'Seguir editando'
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
                  Editar Artículo Científico
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="22" height="22" style={{ display: 'inline-block', marginRight: '8px', verticalAlign: 'middle' }}>
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  Redactar Nueva Noticia
                </>
              )}
            </h2>
            <p className="news-subheading">
              Publica avances de proyectos, boletines meteorológicos o artículos informativos con secciones dinámicas.
            </p>
          </div>

          <button onClick={cerrarFormulario} className="news-btn-back">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="15" height="15">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Volver al Listado
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
                  <label className="news-label">Título de la Noticia / Hallazgo</label>
                  <input
                    type="text"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder="Ej. Implementación de nuevos nodos de medición de CO2 en el Campus Manta"
                    className="news-input"
                  />
                </div>

                <div className="news-field-group">
                  <label className="news-label">Investigador / Autor Responsable</label>
                  <input
                    type="text"
                    value={autor}
                    onChange={(e) => setAutor(e.target.value)}
                    placeholder="Ej. Dr. Willian Zamora"
                    className="news-input"
                  />
                </div>

                <div className="news-field-group">
                  <label className="news-label">Estado de Publicación</label>
                  <select value={estado} onChange={(e) => setEstado(e.target.value)} className="news-select">
                    <option value="Publicado">Publicado (Visible en Portal Público)</option>
                    <option value="Borrador">Borrador (Oculto al Público)</option>
                  </select>
                </div>

                {/* Imagen de portada — solo subida manual */}
                <div className="news-field-group" style={{ marginTop: '0.5rem' }}>
                  <label className="news-label">Imagen de Portada Principal</label>

                  {imagenUrl ? (
                    <div className="news-image-preview-container">
                      <img src={imagenUrl} alt="Vista previa" className="news-image-preview" />
                      <button type="button" className="news-btn-remove-image" onClick={() => setImagenUrl('')} title="Quitar imagen">
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
                      <span className="news-upload-text">Subir imagen de portada</span>
                      <span className="news-upload-hint">PNG, JPG, WEBP · Máx. 2MB</span>
                    </label>
                  )}
                </div>
              </div>

              {/* Column 2: Editor de Bloques Reordenables */}
              <div className="news-media-column">
                <div className="news-field-group" style={{ flex: 1 }}>
                  <label className="news-label" style={{ marginBottom: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Cuerpo del Artículo (Secciones Reordenables)</span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '500' }}>Reordena usando ▲ o ▼</span>
                  </label>

                  <div className="news-blocks-list">
                    {bloques.map((block, index) => (
                      <div key={block.id} className="news-block-item">

                        {/* Block Header / Control bar */}
                        <div className="news-block-header">
                          <span className="news-block-type-badge">
                            {block.type === 'text' ? 'Sección de Texto' : 'Sección de Imagen'}
                          </span>

                          <div className="news-block-controls">
                            <button type="button" onClick={() => moverBloqueArriba(index)} disabled={index === 0} className="news-btn-block-control" title="Subir sección">▲</button>
                            <button type="button" onClick={() => moverBloqueAbajo(index)} disabled={index === bloques.length - 1} className="news-btn-block-control" title="Bajar sección">▼</button>
                            <button type="button" onClick={() => eliminarBloque(block.id)} className="news-btn-block-delete" title="Eliminar sección">×</button>
                          </div>
                        </div>

                        {/* Block Content Body */}
                        <div className="news-block-body">
                          {block.type === 'text' ? (
                            <textarea
                              value={block.value}
                              onChange={(e) => actualizarBloque(block.id, e.target.value)}
                              placeholder="Escribe el contenido de esta sección de texto..."
                              className="news-block-textarea"
                            />
                          ) : (
                            <div className="news-block-image-upload-wrapper">
                              {block.value ? (
                                <div className="news-block-image-preview-container">
                                  <img src={block.value} alt="Sección del artículo" className="news-block-image-preview" />
                                  <button type="button" onClick={() => actualizarBloque(block.id, '')} className="news-block-btn-remove-image">Quitar Imagen</button>
                                </div>
                              ) : (
                                <label className="news-block-dropzone">
                                  <input type="file" accept="image/*" onChange={(e) => handleBlockImageChange(e, block.id)} style={{ display: 'none' }} />
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20" className="news-block-upload-icon">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                    <circle cx="8.5" cy="8.5" r="1.5" />
                                    <polyline points="21 15 16 10 5 21" />
                                  </svg>
                                  <span>Subir imagen para esta sección</span>
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
                      + Añadir Sección de Texto
                    </button>
                    <button type="button" onClick={() => agregarBloque('image')} className="news-btn-add-block image">
                      + Añadir Sección de Imagen
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
                Cancelar
              </button>
              <button type="submit" className="news-btn-save">
                {editandoId ? (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="15" height="15">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                      <polyline points="17 21 17 13 7 13 7 21" />
                      <polyline points="7 3 7 8 15 8" />
                    </svg>
                    Actualizar
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="15" height="15">
                      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Publicar Noticia
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
                placeholder="Buscar noticia por título o autor..."
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
              Redactar Noticia
            </button>
          </div>

          {/* Tabla de Artículos */}
          <div className="news-table-wrapper">
            <table className="news-table">
              <thead>
                <tr>
                  <th style={{ width: '4rem' }}>#</th>
                  <th>Título de la Noticia / Artículo</th>
                  <th style={{ width: '10rem' }}>Estado</th>
                  <th style={{ width: '12rem' }}>Fecha de Publicación</th>
                  <th style={{ width: '16rem', textAlign: 'right' }}>Operaciones Escritura</th>
                </tr>
              </thead>
              <tbody>
                {noticiasFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="news-empty-cell">
                      No se encontraron artículos científicos que coincidan con la búsqueda.
                    </td>
                  </tr>
                ) : (
                  noticiasFiltradas.map((n, i) => (
                    <tr key={n.id} className="news-row">
                      <td className="news-idx">{String(i + 1).padStart(2, '0')}</td>
                      <td>
                        <div className="news-title-cell-wrapper">
                          {n.imagenUrl ? (
                            <img src={n.imagenUrl} alt="Miniatura" className="news-thumb-mini" />
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
                            <span className="news-author">Por: {n.autor}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge-status ${n.estado === 'Publicado' ? 'status-published' : 'status-draft'}`}>
                          {n.estado}
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
                            Editar
                          </button>
                          <button onClick={() => eliminarNoticia(n.id)} className="news-btn-delete">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              <line x1="10" y1="11" x2="10" y2="17" />
                              <line x1="14" y1="11" x2="14" y2="17" />
                            </svg>
                            Borrar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}