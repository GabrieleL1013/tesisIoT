import SEO from "../components/SEO";
import { API_BASE_URL } from "../config/api";
import { useState, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import { usePageTitle } from "../hooks/usePageTitle";
import "../styles/Contacto.css";
import IotBgImg from "../assets/IOT.jpg";
import EditableText from "../components/EditableText";
import EditableImage from "../components/EditableImage";
import { useInterfaceText } from "../context/InterfaceTextContext";
import { useInterfaceImage } from "../context/InterfaceImageContext";
import { checkEditPermission } from "../utils/checkEditPermission";
import Swal from "sweetalert2";

const PencilIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z" />
  </svg>
);

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

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);

const TwitterIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
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
  const { language, t } = useLanguage();
  const { texts, updateText, loading, editMode } = useInterfaceText();
  const [hasPermission, setHasPermission] = useState(false);

  usePageTitle(language === 'en' ? 'Contact' : 'Contacto');

  useEffect(() => {
    const checkRole = () => {
      checkEditPermission().then(res => setHasPermission(res));
    };
    checkRole();
    window.addEventListener("userProfileUpdated", checkRole);
    window.addEventListener("appInterfacesUpdated", checkRole);
    return () => {
      window.removeEventListener("userProfileUpdated", checkRole);
      window.removeEventListener("appInterfacesUpdated", checkRole);
    };
  }, [language]);

  const handleEditSocialLinks = async () => {
    const isEn = language === 'en';
    const permitted = await checkEditPermission();
    if (!permitted) {
      Swal.fire({
        title: isEn ? "Permission Denied" : "Permiso Denegado",
        text: isEn
          ? "You do not have the required permissions in Interface Management to edit this content."
          : "No cumples con el nivel de permiso o rol configurado en Gestión de Interfaces para editar este contenido.",
        icon: "error",
        background: "#0b0f19",
        color: "#ffffff",
        confirmButtonColor: "#d0182b"
      });
      return;
    }

    const fbDefault = texts['contacto_social_facebook'] ?? "https://facebook.com/UleamEc";
    const twDefault = texts['contacto_social_twitter'] ?? "https://twitter.com/UleamEc";
    const ytDefault = texts['contacto_social_youtube'] ?? "https://youtube.com";
    const ghDefault = texts['contacto_social_github'] ?? "https://github.com";

    const fbHide = texts['contacto_social_facebook_hide'] === "1";
    const twHide = texts['contacto_social_twitter_hide'] === "1";
    const ytHide = texts['contacto_social_youtube_hide'] === "1";
    const ghHide = texts['contacto_social_github_hide'] === "1";

    const hideLabel = isEn ? "Hide" : "Ocultar";

    const { value: formValues } = await Swal.fire({
      title: isEn ? 'Edit Social Media Links' : 'Editar Enlaces de Redes Sociales',
      html: `
        <div style="text-align: left; font-size: 0.9rem; color: #cbd5e1;">
          <div style="margin-bottom: 12px;">
            <label style="display:block; margin-bottom:4px; font-weight:600;">Facebook URL:</label>
            <div style="display:flex; gap:8px; align-items:center;">
              <input id="swal-input-fb" class="swal2-input" style="flex:1; margin:0;" value="${fbDefault}" placeholder="https://facebook.com/..." />
              <label style="font-size:0.8rem; display:flex; align-items:center; gap:4px; cursor:pointer; white-space:nowrap;">
                <input type="checkbox" id="swal-hide-fb" ${fbHide ? "checked" : ""} /> ${hideLabel}
              </label>
            </div>
          </div>

          <div style="margin-bottom: 12px;">
            <label style="display:block; margin-bottom:4px; font-weight:600;">X (Twitter) URL:</label>
            <div style="display:flex; gap:8px; align-items:center;">
              <input id="swal-input-tw" class="swal2-input" style="flex:1; margin:0;" value="${twDefault}" placeholder="https://twitter.com/..." />
              <label style="font-size:0.8rem; display:flex; align-items:center; gap:4px; cursor:pointer; white-space:nowrap;">
                <input type="checkbox" id="swal-hide-tw" ${twHide ? "checked" : ""} /> ${hideLabel}
              </label>
            </div>
          </div>

          <div style="margin-bottom: 12px;">
            <label style="display:block; margin-bottom:4px; font-weight:600;">YouTube URL:</label>
            <div style="display:flex; gap:8px; align-items:center;">
              <input id="swal-input-yt" class="swal2-input" style="flex:1; margin:0;" value="${ytDefault}" placeholder="https://youtube.com/..." />
              <label style="font-size:0.8rem; display:flex; align-items:center; gap:4px; cursor:pointer; white-space:nowrap;">
                <input type="checkbox" id="swal-hide-yt" ${ytHide ? "checked" : ""} /> ${hideLabel}
              </label>
            </div>
          </div>

          <div style="margin-bottom: 12px;">
            <label style="display:block; margin-bottom:4px; font-weight:600;">GitHub URL:</label>
            <div style="display:flex; gap:8px; align-items:center;">
              <input id="swal-input-gh" class="swal2-input" style="flex:1; margin:0;" value="${ghDefault}" placeholder="https://github.com/..." />
              <label style="font-size:0.8rem; display:flex; align-items:center; gap:4px; cursor:pointer; white-space:nowrap;">
                <input type="checkbox" id="swal-hide-gh" ${ghHide ? "checked" : ""} /> ${hideLabel}
              </label>
            </div>
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: isEn ? 'Save Links' : 'Guardar Enlaces',
      cancelButtonText: isEn ? 'Cancel' : 'Cancelar',
      background: '#0b0f19',
      color: '#ffffff',
      confirmButtonColor: '#d0182b',
      cancelButtonColor: '#475569',
      didOpen: () => {
        const popup = Swal.getPopup();
        if (popup) {
          popup.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              Swal.clickConfirm();
            } else if (e.key === "Escape") {
              e.preventDefault();
              Swal.clickCancel();
            }
          });
        }
      },
      preConfirm: () => {
        return {
          facebook: document.getElementById('swal-input-fb').value.trim(),
          facebook_hide: document.getElementById('swal-hide-fb').checked ? "1" : "0",
          twitter: document.getElementById('swal-input-tw').value.trim(),
          twitter_hide: document.getElementById('swal-hide-tw').checked ? "1" : "0",
          youtube: document.getElementById('swal-input-yt').value.trim(),
          youtube_hide: document.getElementById('swal-hide-yt').checked ? "1" : "0",
          github: document.getElementById('swal-input-gh').value.trim(),
          github_hide: document.getElementById('swal-hide-gh').checked ? "1" : "0"
        };
      }
    });

    if (formValues) {
      Swal.fire({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true,
        icon: "success",
        title: isEn ? "Social media links updated" : "Enlaces de redes sociales actualizados"
      });

      Promise.all([
        updateText('contacto_social_facebook', formValues.facebook, '/global'),
        updateText('contacto_social_facebook_hide', formValues.facebook_hide, '/global'),

        updateText('contacto_social_twitter', formValues.twitter, '/global'),
        updateText('contacto_social_twitter_hide', formValues.twitter_hide, '/global'),

        updateText('contacto_social_youtube', formValues.youtube, '/global'),
        updateText('contacto_social_youtube_hide', formValues.youtube_hide, '/global'),

        updateText('contacto_social_github', formValues.github, '/global'),
        updateText('contacto_social_github_hide', formValues.github_hide, '/global')
      ]).catch(err => {
        console.error("Error al guardar redes sociales:", err);
        Swal.fire({
          title: 'Error',
          text: 'No se pudieron guardar los enlaces.',
          icon: 'error',
          background: '#0b0f19',
          color: '#ffffff',
          confirmButtonColor: '#d0182b'
        });
      });
    }
  };

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

  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [phoneVal, setPhoneVal] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const filteredCountries = COUNTRIES.filter(c => 
    c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
    c.code.includes(countrySearch) ||
    c.abbrev.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const [activeFaq, setActiveFaq] = useState(null);

  

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

    fetch(`${API_BASE_URL}/contactos?lang=${language}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Accept-Language": language
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
        setServerError(err.message || t("contact.error_message", "No se pudo conectar con el servidor."));
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
      <SEO 
        title={language === 'en' ? "Contact - IoT ULEAM" : "Contacto - IoT ULEAM"}
        description={language === 'en' ? "Get in touch with the IoT ULEAM telemetry project team." : "Ponte en contacto con el equipo del proyecto de telemetría IoT ULEAM."}
      />
      
      {/* ── SECCIÓN HÉROE (CONTACTO) ── */}
      <section className="contact-hero">
        <EditableImage
          imageKey="contacto_hero_bg"
          defaultSrc={IotBgImg}
          alt="Fondo Sección Contacto"
          recommendedWidth={1920}
          recommendedHeight={600}
          aspectRatio={1920 / 600}
          hint="Imagen de fondo principal de la sección Héroe en la página de Contacto."
          wrapperClassName="contact-hero-bg-wrapper"
          className="contact-hero-bg-img"
        />
        <div className="contact-hero-bg-overlay" />
        <div className="contact-hero-overlay" />
        <div className="contact-hero-grid" />
        <div className="contact-hero-container" style={{ textAlign: "center" }}>
          <h1 className="contact-hero-title" style={{ fontSize: "3.5rem", margin: 0 }}>
            <EditableText textKey="contacto_hero_title" />
          </h1>
        </div>
      </section>

      <section className="contact-main-section">
        <div className="contact-section-container">
          <div className="contact-grid">
            <div className="contact-info-col">
              <div className="info-wrapper">
                <div className="info-cards-list">
                  <div className="info-card">
                    <div className="info-icon-box"><MailIcon /></div>
                    <div>
                      <h3><EditableText textKey="contacto_correo_titulo" /></h3>
                      <p className="info-detail"><EditableText textKey="contacto_correo_detalle" /></p>
                      <p className="info-sub"><EditableText textKey="contacto_correo_sub" /></p>
                    </div>
                  </div>

                  <div className="info-card">
                    <div className="info-icon-box"><PhoneIcon /></div>
                    <div>
                      <h3><EditableText textKey="contacto_telefono_titulo" /></h3>
                      <p className="info-detail"><EditableText textKey="contacto_telefono_detalle" /></p>
                      <p className="info-sub"><EditableText textKey="contacto_telefono_sub" /></p>
                    </div>
                  </div>

                  <div className="info-card">
                    <div className="info-icon-box"><MapPinIcon /></div>
                    <div>
                      <h3><EditableText textKey="contacto_ubicacion_titulo" /></h3>
                      <p className="info-detail"><EditableText textKey="contacto_ubicacion_detalle" /></p>
                      <p className="info-sub"><EditableText textKey="contacto_ubicacion_sub" /></p>
                    </div>
                  </div>
                </div>

                <div className="social-networks-section">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                    <h3 style={{ margin: 0 }}><EditableText textKey="contacto_social_titulo" /></h3>
                    {editMode && hasPermission && (
                      <button
                        type="button"
                        onClick={handleEditSocialLinks}
                        className="btn-edit-social-links"
                        style={{
                          background: 'rgba(239, 68, 68, 0.12)',
                          border: '1px solid rgba(239, 68, 68, 0.35)',
                          color: '#ef4444',
                          borderRadius: '6px',
                          padding: '4px 10px',
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontWeight: 600
                        }}
                      >
                        <PencilIcon /> Editar Links
                      </button>
                    )}
                  </div>
                  <p className="social-networks-desc">
                    <EditableText textKey="contacto_social_desc" isTextArea={true} />
                  </p>
                  <div className="social-only-icons-row">
                    {(texts['contacto_social_facebook'] ?? "https://facebook.com/UleamEc").trim() !== '' && texts['contacto_social_facebook_hide'] !== "1" && (
                      <a href={texts['contacto_social_facebook'] || "https://facebook.com/UleamEc"} target="_blank" rel="noopener noreferrer" className="social-icon-circle facebook" title="Facebook">
                        <FacebookIcon />
                      </a>
                    )}
                    {(texts['contacto_social_twitter'] ?? "https://twitter.com/UleamEc").trim() !== '' && texts['contacto_social_twitter_hide'] !== "1" && (
                      <a href={texts['contacto_social_twitter'] || "https://twitter.com/UleamEc"} target="_blank" rel="noopener noreferrer" className="social-icon-circle twitter" title="X (Twitter)">
                        <TwitterIcon />
                      </a>
                    )}
                    {(texts['contacto_social_youtube'] ?? "https://youtube.com").trim() !== '' && texts['contacto_social_youtube_hide'] !== "1" && (
                      <a href={texts['contacto_social_youtube'] || "https://youtube.com"} target="_blank" rel="noopener noreferrer" className="social-icon-circle youtube" title="YouTube">
                        <YoutubeIcon />
                      </a>
                    )}
                    {(texts['contacto_social_github'] ?? "https://github.com").trim() !== '' && texts['contacto_social_github_hide'] !== "1" && (
                      <a href={texts['contacto_social_github'] || "https://github.com"} target="_blank" rel="noopener noreferrer" className="social-icon-circle github" title="GitHub">
                        <GithubIcon />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="contact-form-col">
              <div className="form-wrapper">
                {submitSuccess ? (
                  <div className="success-banner">
                    <div className="success-icon-wrapper"><CheckCircleIcon /></div>
                    <h2><EditableText textKey="contacto_success_title" /></h2>
                    <p>
                      <EditableText textKey="contacto_success_desc" isTextArea={true} />
                    </p>
                    <button onClick={() => setSubmitSuccess(false)} className="btn-success-reset">
                      <EditableText textKey="contacto_success_btn" />
                    </button>
                  </div>
                ) : (
                  <>
                    <h2><EditableText textKey="contacto_form_title" /></h2>
                    <form onSubmit={handleSubmit} noValidate>
                      <div className="form-group">
                        <label htmlFor="nombre"><EditableText textKey="contacto_label_nombre" /></label>
                        <input
                          type="text"
                          id="nombre"
                          name="nombre"
                          value={formData.nombre}
                          onChange={handleInputChange}
                          className={errors.nombre ? "input-error" : ""}
                          placeholder={t("contact.name_label", "Nombre Completo")}
                          required
                        />
                        {errors.nombre && <span className="error-message">{errors.nombre}</span>}
                      </div>

                      <div className="form-group">
                        <label htmlFor="correo"><EditableText textKey="contacto_label_correo" /></label>
                        <input
                          type="email"
                          id="correo"
                          name="correo"
                          value={formData.correo}
                          onChange={handleInputChange}
                          className={errors.correo ? "input-error" : ""}
                          placeholder={t("contact.email_label", "Correo Electrónico")}
                          required
                        />
                        {errors.correo && <span className="error-message">{errors.correo}</span>}
                      </div>

                      <div className="form-group">
                        <label htmlFor="telefono"><EditableText textKey="contacto_label_telefono" /></label>
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
                              placeholder={t("common.search", "Buscar...")}
                              required
                            />
                            <ChevronDownIcon 
                              className="selector-chevron" 
                              style={{ marginRight: "10px", pointerEvents: "none", color: "#64748b" }} 
                            />
                            
                            {showDropdown && (
                              <div className="countries-dropdown-list">
                                {filteredCountries.length === 0 ? (
                                  <div className="country-dropdown-no-results">{t("common.no_results", "Sin resultados")}</div>
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
                            type="tel"
                            inputMode="numeric"
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
                        {errors.telefono && <span className="error-message">{errors.telefono}</span>}
                      </div>

                      <div className="form-group">
                        <label htmlFor="mensaje"><EditableText textKey="contacto_label_mensaje" /></label>
                        <textarea
                          id="mensaje"
                          name="mensaje"
                          rows="6"
                          value={formData.mensaje}
                          onChange={handleInputChange}
                          className={errors.mensaje ? "input-error" : ""}
                          placeholder={t("contact.message_label", "Escribe tu mensaje...")}
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
                            {t("contact.sending", "Enviando...")}
                          </>
                        ) : (
                          <>
                            <SendIcon />
                            {t("contact.send_button", "Enviar Mensaje")}
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

      <section className="contact-faq-section">
        <div className="contact-section-container">
          <div className="faq-header">
            <span className="contact-label-red"><EditableText textKey="contacto_faq_badge" /></span>
            <h2><EditableText textKey="contacto_faq_title" /></h2>
            <p><EditableText textKey="contacto_faq_subtitle" isTextArea={true} /></p>
          </div>

          <div className="faq-list">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className={`faq-item ${activeFaq === idx ? "active" : ""}`}>
                <button className="faq-question" onClick={() => toggleFaq(idx)}>
                  <div className="faq-q-text">
                    <span className="faq-icon"><HelpCircleIcon /></span>
                    <h3><EditableText textKey={`contacto_faq_q_${idx}`} /></h3>
                  </div>
                  <span className="faq-chevron"><ChevronDownIcon /></span>
                </button>
                <div className="faq-answer">
                  <div className="faq-answer-content">
                    <p><EditableText textKey={`contacto_faq_a_${idx}`} isTextArea={true} /></p>
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
