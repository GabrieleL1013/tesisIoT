import { API_BASE_URL } from '../../config/api';
import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import '../../styles/components/admin/GestionarUbicaciones.css';

export default function GestionarUbicaciones() {
  const [ubicaciones, setUbicaciones] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [orden, setOrden] = useState(null);
  const [showOrdenPanel, setShowOrdenPanel] = useState(false);

  const ubicacionesFiltradas = ubicaciones
    .filter(u => {
      const query = busqueda.toLowerCase().trim();
      if (!query) return true;
      return u.nombre.toLowerCase().includes(query) || (u.descripcion && u.descripcion.toLowerCase().includes(query));
    })
    .sort((a, b) => {
      if (orden === 'name_asc') return a.nombre.localeCompare(b.nombre);
      if (orden === 'name_desc') return b.nombre.localeCompare(a.nombre);
      if (orden === 'asc') return Number(a.id) - Number(b.id);
      return Number(b.id) - Number(a.id);
    });

  // Estados del Formulario
  const [editandoId, setEditandoId] = useState(null);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [latitud, setLatitud] = useState('');
  const [longitud, setLongitud] = useState('');

  // Estados para búsqueda de geocodificación en el mapa
  const [busquedaMapa, setBusquedaMapa] = useState('');
  const [buscandoMapa, setBuscandoMapa] = useState(false);
  const [sugerencias, setSugerencias] = useState([]);
  const [obteniendoUbicacion, setObteniendoUbicacion] = useState(false);
  const [mapStyle, setMapStyle] = useState('google'); // google, satellite, dark

  // Auto-fetch suggestions on input change (with debounce)
  useEffect(() => {
    if (!busquedaMapa.trim()) {
      setSugerencias([]);
      return;
    }

    const delayDebounce = setTimeout(() => {
      fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(busquedaMapa)}`)
        .then(res => res.json())
        .then(data => {
          if (data) {
            setSugerencias(data);
          }
        })
        .catch(err => console.error("Error fetching suggestions:", err));
    }, 450);

    return () => clearTimeout(delayDebounce);
  }, [busquedaMapa]);

  const seleccionarSugerencia = (sug) => {
    const lat = parseFloat(sug.lat);
    const lon = parseFloat(sug.lon);

    setLatitud(lat.toFixed(6));
    setLongitud(lon.toFixed(6));
    setBusquedaMapa(sug.display_name);
    setSugerencias([]);

    if (window.leafletMapInstance) {
      window.leafletMapInstance.setView([lat, lon], 17);
      window.leafletMapInstance.eachLayer((layer) => {
        if (layer instanceof window.L.Marker) {
          layer.setLatLng([lat, lon]);
        }
      });
    }
  };

  const buscarEnMapa = () => {
    if (!busquedaMapa.trim()) return;
    setBuscandoMapa(true);

    fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(busquedaMapa)}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          seleccionarSugerencia(data[0]);
        } else {
          Swal.fire({
            icon: 'info',
            title: 'Sin Resultados',
            text: 'No se encontraron coordenadas para el lugar o dirección ingresada.',
            confirmButtonColor: '#ff9f1c'
          });
        }
      })
      .catch(err => {
        console.error("Geocoding search error:", err);
        Swal.fire({
          icon: 'error',
          title: 'Error de Búsqueda',
          text: 'Ocurrió un problema al consultar el servicio de geolocalización.',
          confirmButtonColor: '#ff9f1c'
        });
      })
      .finally(() => {
        setBuscandoMapa(false);
      });
  };

  const usarUbicacionActual = () => {
    if (!navigator.geolocation) {
      Swal.fire({
        icon: 'error',
        title: 'No compatible',
        text: 'La geolocalización no está soportada por tu navegador.',
        confirmButtonColor: '#ff9f1c'
      });
      return;
    }

    setObteniendoUbicacion(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        setLatitud(lat.toFixed(6));
        setLongitud(lon.toFixed(6));

        if (window.leafletMapInstance) {
          window.leafletMapInstance.setView([lat, lon], 17);
          window.leafletMapInstance.eachLayer((layer) => {
            if (layer instanceof window.L.Marker) {
              layer.setLatLng([lat, lon]);
            }
          });
        }

        Swal.fire({
          icon: 'success',
          title: 'Ubicación Obtenida',
          text: 'Se han cargado las coordenadas de tu ubicación actual.',
          timer: 2000,
          showConfirmButton: false
        });
        setObteniendoUbicacion(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        let msg = 'No se pudo acceder a tu ubicación.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Permiso denegado. Por favor, habilita el acceso a la ubicación en tu navegador.';
        }
        Swal.fire({
          icon: 'warning',
          title: 'Acceso Denegado',
          text: msg,
          confirmButtonColor: '#ff9f1c'
        });
        setObteniendoUbicacion(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  // Fetch locations from PostgreSQL backend
  const cargarUbicaciones = () => {
    fetch(`${API_BASE_URL}/ubicaciones`)
      .then(res => res.json())
      .then(data => {
        setUbicaciones(Array.isArray(data) ? data : []);
      })
      .catch(err => {
        console.error("Error loading locations from database:", err);
        setUbicaciones([]);
      });
  };

  useEffect(() => {
    cargarUbicaciones();
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

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.ubi-filter-group-orden')) {
        setShowOrdenPanel(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  const obtenerTextoOrden = () => {
    if (orden === 'desc') return 'Más recientes primero';
    if (orden === 'name_asc') return 'Nombre (A-Z)';
    if (orden === 'name_desc') return 'Nombre (Z-A)';
    if (orden === 'asc') return 'Más antiguos primero';
    return 'Ordenar';
  };

  // Leaflet Map Initialization and Synchronization
  useEffect(() => {
    if (!mostrarFormulario) {
      // Clean up map reference when form closes
      if (window.leafletMapInstance) {
        window.leafletMapInstance.remove();
        window.leafletMapInstance = null;
      }
      return;
    }

    // Load Leaflet assets dynamically if not present
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    const initMapInstance = () => {
      // Clear existing map instance to prevent duplication
      if (window.leafletMapInstance) {
        window.leafletMapInstance.remove();
        window.leafletMapInstance = null;
      }

      // Initial center coordinates (Manta, Ecuador campus is ~ -0.9517, -80.7476)
      const initialLat = parseFloat(latitud) || -0.9517;
      const initialLng = parseFloat(longitud) || -80.7476;

      const map = window.L.map('leaflet-map-admin').setView([initialLat, initialLng], 16);
      window.leafletMapInstance = map;

      // Add dynamic Google / CartoDB map tiles based on mapStyle selection
      let tileUrl = 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}'; // Google Roadmap by default
      let tileAttr = '&copy; Google Maps';
      if (mapStyle === 'satellite') {
        tileUrl = 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'; // Google Hybrid (Satellite + labels)
        tileAttr = '&copy; Google Maps';
      } else if (mapStyle === 'dark') {
        tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
        tileAttr = '&copy; OpenStreetMap contributors &copy; CARTO';
      } else if (mapStyle === 'voyager') {
        tileUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
        tileAttr = '&copy; OpenStreetMap contributors &copy; CARTO';
      }

      window.leafletTileLayerInstance = window.L.tileLayer(tileUrl, {
        attribution: tileAttr,
        maxZoom: 20
      }).addTo(map);

      // Custom Map Pin SVG Icon
      const mapPinIcon = window.L.divIcon({
        html: `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="36" height="36" style="filter: drop-shadow(0 3px 6px rgba(0,0,0,0.4));">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill="#ef4444" stroke="#ffffff" stroke-width="1.5"/>
            <circle cx="12" cy="10" r="3" fill="#ffffff"/>
          </svg>
        `,
        className: 'custom-map-pin-icon',
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36]
      });

      // Create draggable marker
      const marker = window.L.marker([initialLat, initialLng], {
        icon: mapPinIcon,
        draggable: true
      }).addTo(map);

      // Sync coordinate inputs when marker is dragged
      marker.on('dragend', function () {
        const position = marker.getLatLng();
        setLatitud(position.lat.toFixed(6));
        setLongitud(position.lng.toFixed(6));
      });

      // Sync coordinate inputs when map is clicked
      map.on('click', function (event) {
        const position = event.latlng;
        marker.setLatLng(position);
        setLatitud(position.lat.toFixed(6));
        setLongitud(position.lng.toFixed(6));
      });

      // Custom center-on-marker control (below zoom buttons)
      const CenterControl = window.L.Control.extend({
        options: { position: 'topleft' },
        onAdd: function () {
          const btn = window.L.DomUtil.create('button', 'leaflet-bar leaflet-control leaflet-center-btn');
          btn.type = 'button';
          btn.title = 'Centrar mapa en el marcador';
          btn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16">
              <circle cx="12" cy="12" r="10"/>
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill="currentColor" stroke="none" opacity="0.15"/>
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill="none" stroke="currentColor" stroke-width="2"/>
              <circle cx="12" cy="10" r="2.5" fill="currentColor"/>
            </svg>`;
          window.L.DomEvent.on(btn, 'click', function (e) {
            window.L.DomEvent.stopPropagation(e);
            const latlng = marker.getLatLng();
            map.flyTo(latlng, 17, { duration: 0.8 });
          });
          return btn;
        }
      });
      new CenterControl().addTo(map);
    };

    if (!window.L) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = () => {
        initMapInstance();
      };
      document.body.appendChild(script);
    } else {
      // Tiny delay to ensure DOM container is fully rendered in React layout
      const timer = setTimeout(() => {
        initMapInstance();
      }, 100);
      return () => clearTimeout(timer);
    }

    return () => {
      if (window.leafletMapInstance) {
        window.leafletMapInstance.remove();
        window.leafletMapInstance = null;
      }
    };
  }, [mostrarFormulario]);

  // Change tile layer dynamically when mapStyle changes
  useEffect(() => {
    if (!window.leafletMapInstance || !window.L) return;

    if (window.leafletTileLayerInstance) {
      window.leafletTileLayerInstance.remove();
    }

    let tileUrl = 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}'; // Google Roadmap
    let tileAttr = '&copy; Google Maps';
    if (mapStyle === 'satellite') {
      tileUrl = 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'; // Google Hybrid (Satellite + labels)
      tileAttr = '&copy; Google Maps';
    } else if (mapStyle === 'dark') {
      tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
      tileAttr = '&copy; OpenStreetMap contributors &copy; CARTO';
    } else if (mapStyle === 'voyager') {
      tileUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
      tileAttr = '&copy; OpenStreetMap contributors &copy; CARTO';
    }

    window.leafletTileLayerInstance = window.L.tileLayer(tileUrl, {
      attribution: tileAttr,
      maxZoom: 20
    }).addTo(window.leafletMapInstance);
  }, [mapStyle]);

  // Sync Leaflet marker when input fields for Lat/Lng change manually
  useEffect(() => {
    if (window.leafletMapInstance) {
      const currentLat = parseFloat(latitud);
      const currentLng = parseFloat(longitud);
      if (!isNaN(currentLat) && !isNaN(currentLng)) {
        // Find existing marker and update it, or re-center map
        window.leafletMapInstance.setView([currentLat, currentLng]);
        // Re-find marker in layer list and move it
        window.leafletMapInstance.eachLayer((layer) => {
          if (layer instanceof window.L.Marker) {
            layer.setLatLng([currentLat, currentLng]);
          }
        });
      }
    }
  }, [latitud, longitud]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!nombre || !latitud || !longitud) {
      Swal.fire({
        icon: 'error',
        title: 'Campos Vacíos',
        text: 'Por favor, ingresa el nombre y las coordenadas geográficas de la ubicación.',
        confirmButtonColor: '#ff9f1c'
      });
      return;
    }

    const payload = {
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      latitud: parseFloat(latitud),
      longitud: parseFloat(longitud)
    };

    if (editandoId) {
      // API UPDATE (PUT)
      fetch(`${API_BASE_URL}/ubicaciones/${editandoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(res => {
          if (!res.ok) throw new Error("Server error");
          return res.json();
        })
        .then(updatedItem => {
          const list = ubicaciones.map(u => u.id === editandoId ? updatedItem : u);
          setUbicaciones(list);
          setEditandoId(null);
          setMostrarFormulario(false);

          Swal.fire({
            icon: 'success',
            title: 'Ubicación Actualizada',
            text: 'Los cambios se han guardado con éxito en la base de datos.',
            confirmButtonColor: '#ff9f1c'
          });
          limpiarFormulario();
        })
        .catch(err => {
          console.error("Error updating location:", err);
          Swal.fire({ icon: 'error', title: 'Error de Red', text: 'No se pudo guardar la ubicación en la base de datos.', confirmButtonColor: '#ff9f1c' });
        });
    } else {
      // API CREATE (POST)
      fetch(`${API_BASE_URL}/ubicaciones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(res => {
          if (!res.ok) throw new Error("Server error");
          return res.json();
        })
        .then(newItem => {
          const list = [...ubicaciones, newItem];
          setUbicaciones(list);
          setMostrarFormulario(false);

          Swal.fire({
            icon: 'success',
            title: 'Ubicación Registrada',
            text: 'El nuevo punto de telemetría ha sido añadido con éxito.',
            confirmButtonColor: '#ff9f1c'
          });
          limpiarFormulario();
        })
        .catch(err => {
          console.error("Error creating location:", err);
          Swal.fire({ icon: 'error', title: 'Error de Red', text: 'No se pudo registrar la ubicación en la base de datos.', confirmButtonColor: '#ff9f1c' });
        });
    }
  };

  const cargarEdicion = (ubi) => {
    setEditandoId(ubi.id);
    setNombre(ubi.nombre);
    setDescripcion(ubi.descripcion || '');
    setLatitud(ubi.latitud);
    setLongitud(ubi.longitud);
    setMostrarFormulario(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const eliminarUbicacion = (id) => {
    const ubi = ubicaciones.find(u => u.id === id);
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Esta acción eliminará la ubicación "${ubi?.nombre}" de la base de datos. Los nodos asociados podrían verse afectados.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#374151',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        // API DELETE
        fetch(`${API_BASE_URL}/ubicaciones/${id}`, { method: 'DELETE' })
          .then(async res => {
            const data = await res.json();
            if (!res.ok) {
              throw new Error(data.error || 'Server error');
            }
            return data;
          })
          .then(() => {
            const list = ubicaciones.filter(u => u.id !== id);
            setUbicaciones(list);

            Swal.fire({
              icon: 'success',
              title: 'Eliminado',
              text: 'La ubicación ha sido removida de la base de datos con éxito.',
              confirmButtonColor: '#ff9f1c'
            });

            if (editandoId === id) {
              limpiarFormulario();
              setMostrarFormulario(false);
            }
          })
          .catch(err => {
            console.error("Error deleting location:", err);
            Swal.fire({
              icon: 'error',
              title: 'Restricción de Relación',
              text: err.message || 'No se pudo eliminar la ubicación del servidor.',
              confirmButtonColor: '#ff9f1c'
            });
          });
      }
    });
  };

  const limpiarFormulario = () => {
    setEditandoId(null);
    setNombre('');
    setDescripcion('');
    setLatitud('');
    setLongitud('');
    setBusquedaMapa('');
  };

  const abrirFormulario = () => {
    limpiarFormulario();
    setMostrarFormulario(true);
  };

  const cerrarFormulario = () => {
    const tieneCambios = nombre.trim() !== '' || descripcion.trim() !== '' || latitud !== '' || longitud !== '';
    
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
    <div className="ubi-page">

      {/* CABECERA DINÁMICA */}
      {mostrarFormulario && (
        <div className="ubi-header">
          <div>
            <h2 className="ubi-heading">
              {editandoId ? (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="22" height="22" style={{ display: 'inline-block', marginRight: '8px', verticalAlign: 'middle' }}>
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z" />
                  </svg>
                  Modificar Ubicación Territorial
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="22" height="22" style={{ display: 'inline-block', marginRight: '8px', verticalAlign: 'middle' }}>
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  Nueva Ubicación IoT
                </>
              )}
            </h2>
            <p className="ubi-subheading">
              Mapea y asigna las coordenadas geográficas precisas usando Leaflet.
            </p>
          </div>

          <button
            onClick={cerrarFormulario}
            className="ubi-btn-back"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="15" height="15">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Volver al Listado
          </button>
        </div>
      )}

      {/* MODO FORMULARIO: REGISTRO / EDICIÓN */}
      {mostrarFormulario ? (
        <div className="ubi-form-panel">
          <form onSubmit={handleSubmit} className="ubi-form">
            <div className="ubi-grid">

              {/* Form Input fields */}
              <div className="ubi-fields-column">
                <div className="ubi-field-group">
                  <label className="ubi-label">Nombre de la Ubicación / Campus</label>
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej. Facultad de Ingeniería"
                    className="ubi-input"
                  />
                </div>

                <div className="ubi-field-group">
                  <label className="ubi-label">Descripción / Detalles de Acceso</label>
                  <input
                    type="text"
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    placeholder="Ej. Junto a laboratorio de telecomunicaciones"
                    className="ubi-input"
                  />
                </div>

                <div className="ubi-coords-row">
                  <div className="ubi-field-group">
                    <label className="ubi-label">Latitud</label>
                    <input
                      type="text"
                      value={latitud}
                      onChange={(e) => setLatitud(e.target.value)}
                      placeholder="-0.9517"
                      className="ubi-input ubi-input-mono"
                    />
                  </div>
                  <div className="ubi-field-group">
                    <label className="ubi-label">Longitud</label>
                    <input
                      type="text"
                      value={longitud}
                      onChange={(e) => setLongitud(e.target.value)}
                      placeholder="-80.7476"
                      className="ubi-input ubi-input-mono"
                    />
                  </div>
                </div>
              </div>

              {/* REAL MAP DISPLAY */}
              <div className="ubi-map-column">
                <label className="ubi-label mb-2">Punto de Georreferenciación (Leaflet OpenStreetMap)</label>

                {/* MAP SEARCH BAR */}
                <div className="ubi-map-search-wrapper">
                  <div className="ubi-map-search-bar">
                    <input
                      type="text"
                      value={busquedaMapa}
                      onChange={(e) => setBusquedaMapa(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          buscarEnMapa();
                        }
                      }}
                      placeholder="🔍 Buscar dirección, ciudad o campus..."
                      className="ubi-map-search-input"
                    />
                    <button
                      type="button"
                      onClick={buscarEnMapa}
                      disabled={buscandoMapa}
                      className="ubi-map-search-btn"
                    >
                      {buscandoMapa ? '...' : 'Buscar'}
                    </button>
                  </div>

                  {sugerencias.length > 0 && (
                    <ul className="ubi-suggestions-list">
                      {sugerencias.map((sug, i) => (
                        <li
                          key={i}
                          onClick={() => seleccionarSugerencia(sug)}
                          className="ubi-suggestion-item"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14" style={{ marginRight: '6px', flexShrink: 0, color: '#ef4444' }}>
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                            <circle cx="12" cy="10" r="3" />
                          </svg>
                          {sug.display_name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* MAP ACTIONS ROW */}
                <div className="ubi-map-actions-row">
                  <button
                    type="button"
                    onClick={usarUbicacionActual}
                    disabled={obteniendoUbicacion}
                    className="ubi-btn-current-location"
                  >
                    {obteniendoUbicacion ? (
                      <>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="15" height="15" style={{ marginRight: '5px' }}>
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        GPS...
                      </>
                    ) : (
                      <>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="15" height="15" style={{ marginRight: '5px' }}>
                          <circle cx="12" cy="12" r="3" />
                          <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
                          <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />
                        </svg>
                        Ubicación actual
                      </>
                    )}
                  </button>

                  <div className="ubi-map-style-selector">
                    <button
                      type="button"
                      onClick={() => setMapStyle('google')}
                      className={`ubi-btn-style ${mapStyle === 'google' ? 'active' : ''}`}
                      title="Google Maps Estándar"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13" style={{ marginRight: '4px' }}>
                        <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
                        <line x1="9" y1="3" x2="9" y2="18" />
                        <line x1="15" y1="6" x2="15" y2="21" />
                      </svg>
                      Mapa
                    </button>
                    <button
                      type="button"
                      onClick={() => setMapStyle('satellite')}
                      className={`ubi-btn-style ${mapStyle === 'satellite' ? 'active' : ''}`}
                      title="Google Maps Satélite (Híbrido)"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13" style={{ marginRight: '4px' }}>
                        <circle cx="12" cy="12" r="10" />
                        <line x1="2" y1="12" x2="22" y2="12" />
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                      </svg>
                      Satélite
                    </button>
                    <button
                      type="button"
                      onClick={() => setMapStyle('dark')}
                      className={`ubi-btn-style ${mapStyle === 'dark' ? 'active' : ''}`}
                      title="Mapa Oscuro"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13" style={{ marginRight: '4px' }}>
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                      </svg>
                      Oscuro
                    </button>
                  </div>
                </div>

                <div id="leaflet-map-admin" className="leaflet-map-container"></div>
                <p className="ubi-map-tip">
                  Arrastra el punto rojo, haz clic en cualquier lugar del mapa, usa el buscador de arriba o haz clic en "Ubicación actual" para fijar coordenadas.
                </p>
              </div>

            </div>

            <div className="ubi-form-actions">
              <button type="button" onClick={cerrarFormulario} className="ubi-btn-cancel">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                Cancelar
              </button>
              <button type="submit" className="ubi-btn-save">
                {editandoId ? (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="15" height="15">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                      <polyline points="17 21 17 13 7 13 7 21" />
                      <polyline points="7 3 7 8 15 8" />
                    </svg>
                    Actualizar Zona
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="15" height="15">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    Completar Registro
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* MODO LISTADO DE UBICACIONES ACTIVO */
        <>
          <div className="ubi-toolbar" style={{ position: 'relative', zIndex: 30 }}>
            {/* Búsqueda */}
            <div className="ubi-search-wrapper" style={{ flex: '1 1 200px' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="14" height="14" className="ubi-search-icon">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Buscar ubicación..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                className="ubi-filter-input ubi-search-input"
              />
            </div>

            {/* Ordenar */}
            <div className="pub-news-filter-group ubi-filter-group-orden" style={{ position: 'relative' }}>
              <button
                type="button"
                className={`pub-news-unified-filter-btn ${showOrdenPanel ? 'open' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowOrdenPanel(!showOrdenPanel);
                }}
                style={{ height: '42px', borderRadius: '12px' }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                  <path d="M3 12h18M3 6h18M3 18h18" />
                </svg>
                <span>{obtenerTextoOrden()}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12" className="select-arrow-icon">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {showOrdenPanel && (
                <div className="pub-news-unified-filter-panel" style={{ minWidth: '220px', left: 0 }}>
                  <div className="filter-panel-section" style={{ width: '100%' }}>
                    <span className="filter-panel-section-title">Ordenar por</span>
                    <div className="filter-panel-options-list">
                      <button
                        type="button"
                        className={`filter-panel-option-item ${orden === 'asc' ? 'active' : ''}`}
                        onClick={() => {
                          if (orden === 'asc') {
                            setOrden(null);
                          } else {
                            setOrden('asc');
                          }
                          setShowOrdenPanel(false);
                        }}
                      >
                        Más antiguos primero
                      </button>
                      <button
                        type="button"
                        className={`filter-panel-option-item ${orden === 'desc' ? 'active' : ''}`}
                        onClick={() => {
                          if (orden === 'desc') {
                            setOrden(null);
                          } else {
                            setOrden('desc');
                          }
                          setShowOrdenPanel(false);
                        }}
                      >
                        Más recientes primero
                      </button>
                      <button
                        type="button"
                        className={`filter-panel-option-item ${orden === 'name_asc' ? 'active' : ''}`}
                        onClick={() => {
                          if (orden === 'name_asc') {
                            setOrden(null);
                          } else {
                            setOrden('name_asc');
                          }
                          setShowOrdenPanel(false);
                        }}
                      >
                        Nombre (A-Z)
                      </button>
                      <button
                        type="button"
                        className={`filter-panel-option-item ${orden === 'name_desc' ? 'active' : ''}`}
                        onClick={() => {
                          if (orden === 'name_desc') {
                            setOrden(null);
                          } else {
                            setOrden('name_desc');
                          }
                          setShowOrdenPanel(false);
                        }}
                      >
                        Nombre (Z-A)
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Botón agregar */}
            <button className="ubi-btn-add" onClick={abrirFormulario} style={{ flexShrink: 0, height: '42px', borderRadius: '12px' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="15" height="15">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Registrar Nueva Ubicación
            </button>
          </div>

          <div className="ubi-table-wrapper">
            <table className="ubi-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nombre / Detalle</th>
                  <th>Coordenadas GPS</th>
                  <th style={{ textAlign: 'right' }}>Operaciones Escritura</th>
                </tr>
              </thead>
              <tbody>
                {ubicaciones.length === 0 ? (
                  <tr><td colSpan="4" className="ubi-empty-cell">Cargando ubicaciones...</td></tr>
                ) : ubicacionesFiltradas.length === 0 ? (
                  <tr><td colSpan="4" className="ubi-empty-cell">No se encontraron ubicaciones que coincidan con la búsqueda.</td></tr>
                ) : (
                  ubicacionesFiltradas.map((ubi, index) => (
                    <tr key={ubi.id} className="ubi-row">
                      <td className="ubi-idx">{index + 1}</td>
                      <td>
                        <span className="ubi-name">{ubi.nombre}</span>
                        <span className="ubi-desc">{ubi.descripcion || 'Sin descripción adicional'}</span>
                      </td>
                      <td className="ubi-coords-cell">
                        <span className="ubi-coord-pill ubi-coord-pill-lat">Lat: {ubi.latitud}</span>
                        <span className="ubi-coord-pill ubi-coord-pill-lng">Lng: {ubi.longitud}</span>
                      </td>
                      <td>
                        <div className="ubi-row-actions">
                          <button
                            onClick={() => cargarEdicion(ubi)}
                            className="ubi-btn-edit"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                            Modificar
                          </button>
                          <button
                            onClick={() => eliminarUbicacion(ubi.id)}
                            className="ubi-btn-delete"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

    </div>
  );
}