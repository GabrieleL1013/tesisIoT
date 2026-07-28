import { API_BASE_URL } from "../config/api";
import { useState, useEffect } from "react";
import "../styles/Contacto.css";
import IotBgImg from "../assets/IOT.jpg";
import EditableText from "../components/EditableText";

// ── Iconos SVG Autocontenidos para Contacto ──
const MailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const MapPinIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const ChevronDownIcon = ({ className, style }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16" className={className} style={style} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const HelpCircleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="56" height="56" style={{ color: "#2ecc71" }} strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const SendIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const LoaderIcon = () => (
  <svg className="animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="18" height="18" style={{ marginRight: "8px" }} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" style={{ opacity: 0.25 }} />
    <path d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" style={{ opacity: 0.75 }} />
  </svg>
);

// Iconos Redes Sociales
const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);

const TwitterIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/>
  </svg>
);

const YoutubeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/>
    <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/>
  </svg>
);

const GithubIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
  </svg>
);

// Códigos de País y Reglas de validación
const COUNTRIES = [
  { code: "+593", flag: "🇪🇨", name: "Ecuador", abbrev: "EC", limit: 9 },
  { code: "+57", flag: "🇨🇴", name: "Colombia", abbrev: "CO", limit: 10 },
  { code: "+51", flag: "🇵🇪", name: "Perú", abbrev: "PE", limit: 9 },
  { code: "+54", flag: "🇦🇷", name: "Argentina", abbrev: "AR", limit: 10 },
  { code: "+52", flag: "🇲🇽", name: "México", abbrev: "MX", limit: 10 },
  { code: "+34", flag: "🇪🇸", name: "España", abbrev: "ES", limit: 9 },
  { code: "+1", flag: "🇺🇸", name: "USA", abbrev: "US", limit: 10 },
];

export default function Contacto() {
  useEffect(() => {
    document.title = "Contacto - Ecosistema IoT ULEAM";
  }, []);

  // ── ESTADO DEL FORMULARIO ──
  const [formData, setFormData] = useState({
    nombre: "",
    correo: "",
    telefono: "",
    mensaje: ""
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [serverError, setServerError] = useState("");

  // Selector de Código de País con Búsqueda/Filtrado
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]); // default Ecuador
  const [phoneVal, setPhoneVal] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Filtrado de países según término de búsqueda
  const filteredCountries = COUNTRIES.filter(c => 
    c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
    c.code.includes(countrySearch) ||
    c.abbrev.toLowerCase().includes(countrySearch.toLowerCase())
  );

  // ── ESTADO DE FAQ (ACORDEÓN) ──
  const [activeFaq, setActiveFaq] = useState(null);

  const faqs = [
    {
      q: "¿Cómo puedo solicitar acceso a las APIs de telemetría para una tesis?",
      a: "Los estudiantes y docentes de la ULEAM pueden solicitar credenciales de lectura de la API mediante un correo institucional dirigido a dit@uleam.edu.ec, detallando el título de la investigación, el director de tesis y las variables requeridas (por ejemplo, flujos hídricos o consumo eléctrico)."
    },
    {
      q: "¿Qué tecnologías inalámbricas utilizan los nodos sensores?",
      a: "Utilizamos una arquitectura híbrida. En interiores o áreas cercanas a laboratorios usamos WiFi (protocolo MQTT). Para exteriores o campus externos distantes, implementamos tecnología LoRaWAN transmitiendo a gateways de grado industrial conectados a la red troncal de la universidad."
    },
    {
      q: "¿Es posible proponer una nueva ubicación para un nodo sensor?",
      a: "¡Sí! Si tu facultad o proyecto de investigación requiere monitorizar una zona específica dentro o fuera de la universidad, puedes enviar una propuesta en la sección de contacto. Nuestro equipo técnico evaluará la viabilidad de la cobertura inalámbrica y el suministro de energía."
    },
    {
      q: "¿Los datos recopilados son públicos?",
      a: "Sí, todos los datos en tiempo real mostrados en el portal son de libre acceso para fines académicos y de divulgación. Para la descarga de históricos masivos (formato CSV o JSON) para análisis de datos, se requiere una cuenta institucional aprobada."
    }
  ];

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleOutsideClick = () => {
      setShowDropdown(false);
      setIsSearching(false);
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    setServerError("");
  };

  const validateForm = () => {
    const tempErrors = {};
    if (!formData.nombre.trim()) tempErrors.nombre = "El nombre es obligatorio.";
    if (!formData.correo.trim()) {
      tempErrors.correo = "El correo electrónico es obligatorio.";
    } else if (!/\S+@\S+\.\S+/.test(formData.correo)) {
      tempErrors.correo = "El correo electrónico no es válido.";
    }
    
    // Validación de Teléfono
    if (!phoneVal.trim()) {
      tempErrors.telefono = "El teléfono es obligatorio.";
    } else if (phoneVal.length !== selectedCountry.limit) {
      tempErrors.telefono = `El número de teléfono para ${selectedCountry.name} debe tener exactamente ${selectedCountry.limit} dígitos.`;
    }

    if (!formData.mensaje.trim()) {
      tempErrors.mensaje = "El mensaje no puede estar vacío.";
    } else if (formData.mensaje.length < 10) {
      tempErrors.mensaje = "El mensaje debe tener al menos 10 caracteres.";
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setServerError("");

    // Enviar datos reales al backend Laravel
    fetch(`${API_BASE_URL}/contactos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(formData)
    })
      .then(async (res) => {
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Error al procesar la solicitud en el servidor.");
        }
        return res.json();
      })
      .then(() => {
        setSubmitSuccess(true);
        setPhoneVal("");
        setFormData({ nombre: "", correo: "", telefono: "", mensaje: "" });
      })
      .catch((err) => {
        console.error("Error submitting contact form:", err);
        setServerError(err.message || "No se pudo conectar con el servidor de base de datos.");
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const toggleFaq = (idx) => {
    setActiveFaq(activeFaq === idx ? null : idx);
  };

  return (
    <div className="contact-page">
      {/* ── HERO BANNER CON IMAGEN DE FONDO IOT.png ── */}
      <section 
        className="contact-hero" 
        style={{ backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.72), rgba(15, 23, 42, 0.88)), url(${IotBgImg})` }}
      >
        <div className="contact-hero-overlay" />
        <div className="contact-hero-grid" />
        <div className="contact-hero-container" style={{ textAlign: "center" }}>
          <h1 className="contact-hero-title" style={{ fontSize: "3.5rem", margin: 0 }}>
            <EditableText textKey="contacto_hero_title" defaultText="Contacto" />
          </h1>
        </div>
      </section>

      {/* ── SECCIÓN: CONTACTO & REDES SOCIALES ── */}
      <section className="contact-main-section">
        <div className="contact-section-container">
          <div className="contact-grid">
            {/* Columna 1: Tarjetas de Información y Redes Sociales */}
            <div className="contact-info-col">
              <div className="info-wrapper">
                <div className="info-cards-list">
                  <div className="info-card">
                    <div className="info-icon-box"><MailIcon /></div>
                    <div>
                      <h3><EditableText textKey="contacto_correo_titulo" defaultText="Correo Institucional" /></h3>
                      <p className="info-detail">dit@uleam.edu.ec</p>
                      <p className="info-sub"><EditableText textKey="contacto_correo_sub" defaultText="Consultas técnicas e investigación" /></p>
                    </div>
                  </div>

                  <div className="info-card">
                    <div className="info-icon-box"><PhoneIcon /></div>
                    <div>
                      <h3><EditableText textKey="contacto_telefono_titulo" defaultText="Teléfono / Extensión" /></h3>
                      <p className="info-detail">+593 (5) 2623-026</p>
                      <p className="info-sub"><EditableText textKey="contacto_telefono_sub" defaultText="Ext. 2400 (Soporte DIT - Telecomunicaciones)" /></p>
                    </div>
                  </div>

                  <div className="info-card">
                    <div className="info-icon-box"><MapPinIcon /></div>
                    <div>
                      <h3><EditableText textKey="contacto_ubicacion_titulo" defaultText="Ubicación Física" /></h3>
                      <p className="info-detail">Av. Circunvalación, Manta - Ecuador</p>
                      <p className="info-sub"><EditableText textKey="contacto_ubicacion_sub" defaultText="Edificio de Innovación y Tecnología (Planta Baja)" /></p>
                    </div>
                  </div>
                </div>

                {/* GRILA DE REDES SOCIALES: SOLO EL LOGO */}
                <div className="social-networks-section">
                  <h3><EditableText textKey="contacto_social_titulo" defaultText="Redes Sociales y Comunidad" /></h3>
                  <p className="social-networks-desc">
                    <EditableText textKey="contacto_social_desc" defaultText="Sigue los canales oficiales del ecosistema de Internet de las Cosas." isTextArea={true} />
                  </p>
                  <div className="social-only-icons-row">
                    <a href="https://facebook.com/UleamEc" target="_blank" rel="noopener noreferrer" className="social-icon-circle facebook" title="Facebook">
                      <FacebookIcon />
                    </a>
                    <a href="https://twitter.com/UleamEc" target="_blank" rel="noopener noreferrer" className="social-icon-circle twitter" title="X (Twitter)">
                      <TwitterIcon />
                    </a>
                    <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="social-icon-circle youtube" title="YouTube">
                      <YoutubeIcon />
                    </a>
                    <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="social-icon-circle github" title="GitHub">
                      <GithubIcon />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Columna 2: Formulario de Contacto */}
            <div className="contact-form-col">
              <div className="form-wrapper">
                {submitSuccess ? (
                  <div className="success-banner">
                    <div className="success-icon-wrapper"><CheckCircleIcon /></div>
                    <h2><EditableText textKey="contacto_success_title" defaultText="¡Mensaje Registrado con Éxito!" /></h2>
                    <p>
                      <EditableText textKey="contacto_success_desc" defaultText="Hemos guardado tu requerimiento en nuestra base de datos. Un miembro de la Dirección de Innovación Tecnológica (DIT) o la Facultad de Ciencias Informáticas (FACCI) se comunicará contigo en un plazo máximo de 48 horas laborables." isTextArea={true} />
                    </p>
                    <button onClick={() => setSubmitSuccess(false)} className="btn-success-reset">
                      <EditableText textKey="contacto_success_btn" defaultText="Enviar otro mensaje" />
                    </button>
                  </div>
                ) : (
                  <>
                    <h2><EditableText textKey="contacto_form_title" defaultText="Formulario de Contacto" /></h2>
                    <form onSubmit={handleSubmit} noValidate>
                      <div className="form-group">
                        <label htmlFor="nombre"><EditableText textKey="contacto_label_nombre" defaultText="Nombre Completo *" /></label>
                        <input
                          type="text"
                          id="nombre"
                          name="nombre"
                          value={formData.nombre}
                          onChange={handleInputChange}
                          className={errors.nombre ? "input-error" : ""}
                          placeholder="Nombre Completo"
                          required
                        />
                        {errors.nombre && <span className="error-message">{errors.nombre}</span>}
                      </div>

                      <div className="form-group">
                        <label htmlFor="correo"><EditableText textKey="contacto_label_correo" defaultText="Correo Electrónico *" /></label>
                        <input
                          type="email"
                          id="correo"
                          name="correo"
                          value={formData.correo}
                          onChange={handleInputChange}
                          className={errors.correo ? "input-error" : ""}
                          placeholder="Correo Electrónico"
                          required
                        />
                        {errors.correo && <span className="error-message">{errors.correo}</span>}
                      </div>

                      {/* INPUT DE TELÉFONO DINÁMICO CON BÚSQUEDA */}
                      <div className="form-group">
                        <label htmlFor="telefono"><EditableText textKey="contacto_label_telefono" defaultText="Teléfono de Contacto *" /></label>
                        <div className="phone-input-group">
                          <div className="country-selector-wrapper" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="text"
                              className="country-search-input"
                              value={isSearching ? countrySearch : `${selectedCountry.flag} ${selectedCountry.abbrev} (${selectedCountry.code})`}
                              onFocus={() => {
                                setIsSearching(true);
                                setCountrySearch("");
                                setShowDropdown(true);
                              }}
                              onChange={(e) => {
                                setCountrySearch(e.target.value);
                                setShowDropdown(true);
                              }}
                              placeholder="Buscar..."
                              required
                            />
                            <ChevronDownIcon 
                              className="selector-chevron" 
                              style={{ marginRight: "10px", pointerEvents: "none", color: "#64748b" }} 
                            />
                            
                            {showDropdown && (
                              <div className="countries-dropdown-list">
                                {filteredCountries.length === 0 ? (
                                  <div className="country-dropdown-no-results">Sin resultados</div>
                                ) : (
                                  filteredCountries.map((c) => (
                                    <div 
                                      key={c.code} 
                                      className={`country-dropdown-item ${selectedCountry.code === c.code ? 'active' : ''}`}
                                      onClick={() => {
                                        setSelectedCountry(c);
                                        setPhoneVal("");
                                        setFormData(prev => ({ ...prev, telefono: "" }));
                                        setIsSearching(false);
                                        setShowDropdown(false);
                                      }}
                                    >
                                      <span className="dropdown-flag">{c.flag}</span>
                                      <span className="dropdown-code">{c.code}</span>
                                      <span className="dropdown-abbrev">({c.abbrev})</span>
                                      <span className="dropdown-name" style={{ fontSize: "0.78rem", color: "#94a3b8", marginLeft: "auto" }}>{c.name}</span>
                                    </div>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                          
                          <input
                            type="text"
                            id="telefono"
                            name="telefono"
                            value={phoneVal}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, "");
                              if (val.length <= selectedCountry.limit) {
                                setPhoneVal(val);
                                setFormData(prev => ({ 
                                  ...prev, 
                                  telefono: `${selectedCountry.code} ${val}` 
                                }));
                              }
                            }}
                            className={errors.telefono ? "input-error" : ""}
                            placeholder="Número de Teléfono"
                            required
                          />
                        </div>
                        <div className="phone-info-spelling">
                          <EditableText textKey="contacto_phone_limit_prefix" defaultText="Límite: " /> <strong>{selectedCountry.flag} {selectedCountry.name}</strong> <EditableText textKey="contacto_phone_limit_middle" defaultText=" requiere exactamente " /> <strong>{selectedCountry.limit} <EditableText textKey="contacto_phone_limit_suffix" defaultText=" dígitos" /></strong>
                        </div>
                        {errors.telefono && <span className="error-message">{errors.telefono}</span>}
                      </div>

                      <div className="form-group">
                        <label htmlFor="mensaje"><EditableText textKey="contacto_label_mensaje" defaultText="Mensaje / Detalle de Requerimiento *" /></label>
                        <textarea
                          id="mensaje"
                          name="mensaje"
                          rows="6"
                          value={formData.mensaje}
                          onChange={handleInputChange}
                          className={errors.mensaje ? "input-error" : ""}
                          placeholder="Escribe tu mensaje..."
                          required
                        />
                        {errors.mensaje && <span className="error-message">{errors.mensaje}</span>}
                      </div>

                      {serverError && (
                        <div className="server-error-message" style={{ color: "#ef4444", fontSize: "0.85rem", fontWeight: "750", marginBottom: "1rem" }}>
                          ⚠️ {serverError}
                        </div>
                      )}

                      <button type="submit" className="btn-submit-form" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <LoaderIcon />
                            Registrando en Base de Datos...
                          </>
                        ) : (
                          <>
                            <SendIcon />
                            Enviar Mensaje
                          </>
                        )}
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECCIÓN: PREGUNTAS FRECUENTES (FAQ) ── */}
      <section className="contact-faq-section">
        <div className="contact-section-container">
          <div className="faq-header">
            <span className="contact-label-red"><EditableText textKey="contacto_faq_badge" defaultText="Centro de Ayuda" /></span>
            <h2><EditableText textKey="contacto_faq_title" defaultText="Preguntas Frecuentes (FAQ)" /></h2>
            <p><EditableText textKey="contacto_faq_subtitle" defaultText="Resuelve de forma rápida tus inquietudes sobre el funcionamiento del portal y el acceso a los datos de telemetría." isTextArea={true} /></p>
          </div>

          <div className="faq-list">
            {faqs.map((faq, idx) => (
              <div key={idx} className={`faq-item ${activeFaq === idx ? "active" : ""}`}>
                <button className="faq-question" onClick={() => toggleFaq(idx)}>
                  <div className="faq-q-text">
                    <span className="faq-icon"><HelpCircleIcon /></span>
                    <h3><EditableText textKey={`contacto_faq_q_${idx}`} defaultText={faq.q} /></h3>
                  </div>
                  <span className="faq-chevron"><ChevronDownIcon /></span>
                </button>
                <div className="faq-answer">
                  <div className="faq-answer-content">
                    <p><EditableText textKey={`contacto_faq_a_${idx}`} defaultText={faq.a} isTextArea={true} /></p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
