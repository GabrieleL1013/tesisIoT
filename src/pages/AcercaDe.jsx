import SEO from "../components/SEO";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import "../styles/AcercaDe.css";
import EditableText from "../components/EditableText";
import EditableImage from "../components/EditableImage";
import { useInterfaceText } from "../context/InterfaceTextContext";
import { useInterfaceImage } from "../context/InterfaceImageContext";
import { checkEditPermission } from "../utils/checkEditPermission";
import { useLanguage } from "../context/LanguageContext";
import { usePageTitle } from "../hooks/usePageTitle";

import LogoIoTDark from "../assets/uleam_iot_oscuro.svg";
import ArchitectureImg from "../assets/architecture_iotuleam.jpeg";

// ── Social Icons Map ──
const SocialIcons = {
  web: (
    <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="20" width="20">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="2" y1="12" x2="22" y2="12"></line>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
    </svg>
  ),
  github: (
    <svg viewBox="0 0 24 24" fill="currentColor" height="20" width="20">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
    </svg>
  ),
  facebook: (
    <svg fill="currentColor" viewBox="0 0 24 24" height="20" width="20">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  ),
  instagram: (
    <svg fill="currentColor" viewBox="0 0 24 24" height="20" width="20">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
    </svg>
  ),
  twitter: (
    <svg fill="currentColor" viewBox="0 0 24 24" height="20" width="20">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  ),
  linkedin: (
    <svg fill="currentColor" viewBox="0 0 24 24" height="20" width="20">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  ),
  youtube: (
    <svg fill="currentColor" viewBox="0 0 24 24" height="20" width="20">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  ),
};

const SocialNames = {
  web: "Sitio Web",
  github: "GitHub",
  facebook: "Facebook",
  instagram: "Instagram",
  twitter: "X (Twitter)",
  linkedin: "LinkedIn",
  youtube: "YouTube",
};

// ── Editable Social Networks Component ──
function EditableSocials({ textKey, defaultData = {}, canEdit = false }) {
  const { texts, updateText } = useInterfaceText();
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  let currentData = defaultData;
  if (texts[textKey]) {
    try {
      currentData = JSON.parse(texts[textKey]);
    } catch (e) {
      currentData = defaultData;
    }
  }

  const [formData, setFormData] = useState({
    web: "",
    github: "",
    facebook: "",
    instagram: "",
    twitter: "",
    linkedin: "",
    youtube: "",
    ...currentData,
  });

  const handleOpen = () => {
    setFormData({
      web: "",
      github: "",
      facebook: "",
      instagram: "",
      twitter: "",
      linkedin: "",
      youtube: "",
      ...currentData,
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateText(textKey, JSON.stringify(formData));
      setShowModal(false);
      Swal.fire({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2000,
        icon: "success",
        title: "Redes sociales actualizadas",
      });
    } catch (err) {
      Swal.fire({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        icon: "error",
        title: "Error al guardar redes sociales",
      });
    } finally {
      setSaving(false);
    }
  };

  const activeKeys = Object.keys(SocialIcons).filter(
    (key) => currentData[key] && currentData[key].trim() !== ""
  );

  if (activeKeys.length === 0 && !canEdit) {
    return null;
  }

  return (
    <>
      <div className="dev-social-row" style={{ display: "inline-flex", alignItems: "center", gap: "5px", verticalAlign: "middle" }}>
        {activeKeys.map((key) => (
          <a
            key={key}
            href={currentData[key]}
            target="_blank"
            rel="noopener noreferrer"
            className={`dev-social-link dev-social-${key}`}
            title={SocialNames[key] || key}
          >
            {SocialIcons[key]}
          </a>
        ))}

        {canEdit && (
          <button
            type="button"
            className="social-pencil-btn"
            title="Editar redes sociales"
            onClick={handleOpen}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z" />
            </svg>
          </button>
        )}
      </div>

      {showModal && createPortal(
        <div className="eimg-modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="eimg-modal" style={{ maxWidth: "480px" }} onClick={(e) => e.stopPropagation()}>
            <div className="eimg-modal-header">
              <div>
                <h3 className="eimg-modal-title">Editar Redes Sociales</h3>
                <code className="eimg-modal-key">{textKey}</code>
              </div>
              <button type="button" className="eimg-modal-close" onClick={() => setShowModal(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <form onSubmit={handleSave} className="social-edit-form">
              {Object.keys(SocialIcons).map((netKey) => (
                <div key={netKey} className="social-input-group">
                  <span className="social-input-icon">{SocialIcons[netKey]}</span>
                  <span className="social-input-label">{SocialNames[netKey]}</span>
                  <input
                    type="url"
                    className="social-input-field"
                    placeholder={`URL de ${SocialNames[netKey]}`}
                    value={formData[netKey] || ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, [netKey]: e.target.value }))}
                  />
                </div>
              ))}

              <div className="eimg-modal-actions" style={{ marginTop: "1rem" }}>
                <button type="button" className="eimg-btn eimg-btn-ghost" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="eimg-btn eimg-btn-primary" disabled={saving}>
                  {saving ? "Guardando…" : (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px', verticalAlign: 'text-bottom' }}>
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                        <polyline points="17 21 17 13 7 13 7 21"></polyline>
                        <polyline points="7 3 7 8 15 8"></polyline>
                      </svg>
                      Guardar Redes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

// Initial default member lists








export default function AcercaDe() {
  const { language } = useLanguage();
  usePageTitle(language === 'en' ? 'About Us' : 'Acerca de');
  const { texts, updateText, editMode } = useInterfaceText();
    const [isAdmin, setIsAdmin] = useState(false);

  // SVG placeholder for new members without a photo yet
  const USER_SVG_PLACEHOLDER = `data:image/svg+xml;utf8,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#e2e8f0"/><circle cx="50" cy="36" r="20" fill="#94a3b8"/><ellipse cx="50" cy="88" rx="34" ry="26" fill="#94a3b8"/>'
    + '</svg>'
  )}`;


  // Check admin role or /modo-edicion permission for edit mode
  useEffect(() => {
    const checkRole = () => {
      checkEditPermission().then(res => setIsAdmin(res));
    };
    checkRole();
    window.addEventListener("userProfileUpdated", checkRole);
    window.addEventListener("appInterfacesUpdated", checkRole);
    return () => {
      window.removeEventListener("userProfileUpdated", checkRole);
      window.removeEventListener("appInterfacesUpdated", checkRole);
    };
  }, []);

  const canEdit = editMode && isAdmin;

  
  // Counts from DB or defaults
  const leadsCount = parseInt(texts["ad-leads-count"] || "2", 10);
  const devsCount = parseInt(texts["ad-devs-count"] || "1", 10);
  const teachersCount = parseInt(texts["ad-teachers-count"] || "5", 10);
  const collabsCount = parseInt(texts["ad-collabs-count"] || "2", 10);
  const studentsCount = parseInt(texts["ad-students-count"] || "5", 10);
  const internsCount = parseInt(texts["ad-interns-count"] || "2", 10);

  // Add a new member to a category
  const handleAddMember = (countKey, currentCount, defaultText, keyPrefix, categoryType) => {
    const newCount = currentCount + 1;
    let newKey = `${keyPrefix}${newCount}`;
    let socialsKey = `${keyPrefix}${newCount}-socials`;

    if (categoryType === 'devs') {
      newKey = `ad-dev${newCount}-name`;
      socialsKey = `ad-dev${newCount}-socials`;
    } else if (categoryType === 'leads') {
      newKey = `ad-lead${newCount}-name`;
      socialsKey = `ad-lead${newCount}-socials`;
    }

    // Mostrar alerta de inmediato sin retardo
    Swal.fire({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 2000,
      icon: 'success',
      title: language === 'en' ? 'Member added' : 'Integrante añadido'
    });

    // Ejecución asíncrona en paralelo en segundo plano sin bloquear la UI
    Promise.all([
      updateText(countKey, String(newCount), null, false),
      updateText(newKey, `${defaultText} ${newCount}`, null, true),
      updateText(socialsKey, "", null, false)
    ]).catch(err => console.error("Error updating member on backend:", err));
  };

  // Remove a member from a category at a specific index
  const handleRemoveMember = async (categoryType, currentCount, removeIndex) => {
    if (currentCount <= 1) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000,
        icon: 'warning',
        title: language === 'en' ? 'There must be at least 1 member in this section' : 'Debe haber al menos 1 integrante en esta sección'
      });
      return;
    }

    const res = await Swal.fire({
      title: language === 'en' ? 'Delete member?' : '¿Eliminar integrante?',
      text: language === 'en' ? 'This member will be removed from the list.' : 'Se removerá este integrante de la lista.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: language === 'en' ? 'Yes, delete' : 'Sí, eliminar',
      cancelButtonText: language === 'en' ? 'Cancel' : 'Cancelar',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b'
    });

    if (!res.isConfirmed) return;

    // Helper to get text keys for a specific member index in a category
    const getKeysForIndex = (type, i) => {
      if (type === 'leads') {
        return [
          `ad-lead${i}-name`,
          `ad-lead${i}-role`,
          `ad-lead${i}-email`,
          `ad-lead${i}-socials`,
        ];
      }
      if (type === 'devs') {
        const p = i === 1 ? 'ad-dev' : `ad-dev${i}`;
        return [
          `${p}-name`,
          `${p}-role`,
          `${p}-email`,
          `${p}-bio`,
          `${p}-socials`,
        ];
      }
      if (type === 'teachers') return [`ad-teacher${i}`, `ad-teacher${i}-socials` ];
      if (type === 'collabs') return [`ad-collab${i}`, `ad-collab${i}-socials` ];
      if (type === 'students') return [`ad-student${i}`, `ad-student${i}-socials` ];
      if (type === 'interns') return [`ad-intern${i}`, `ad-intern${i}-socials` ];
      return [];
    };

    const countKeyMap = {
      leads: 'ad-leads-count',
      devs: 'ad-devs-count',
      teachers: 'ad-teachers-count',
      collabs: 'ad-collabs-count',
      students: 'ad-students-count',
      interns: 'ad-interns-count',
    };
    const countKey = countKeyMap[categoryType];

    // Alerta de eliminación inmediata
    Swal.fire({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 2000,
      icon: 'info',
      title: language === 'en' ? 'Member removed' : 'Integrante eliminado'
    });

    const updatePromises = [];

    // Shift all member keys down from removeIndex to currentCount - 1
    for (let i = removeIndex; i < currentCount; i++) {
      const curKeys = getKeysForIndex(categoryType, i);
      const nextKeys = getKeysForIndex(categoryType, i + 1);

      for (let k = 0; k < curKeys.length; k++) {
        const curK = curKeys[k];
        const nextK = nextKeys[k];
        const nextVal = texts[nextK] !== undefined ? texts[nextK] : '';
        updatePromises.push(updateText(curK, nextVal, null, false));
      }
    }

    // Clear the last member's old keys completely
    const lastKeys = getKeysForIndex(categoryType, currentCount);
    for (const lk of lastKeys) {
      updatePromises.push(updateText(lk, '', null, false));
    }

    // Finally update count key
    updatePromises.push(updateText(countKey, String(currentCount - 1), null, false));

    Promise.all(updatePromises).catch(err => console.error("Error removing member on backend:", err));
  };

  return (
    <div className="about-page">
      <SEO 
        title={language === 'en' ? "About Us / Software - IoT ULEAM" : "Acerca de / Software - IoT ULEAM"}
        description={language === 'en' ? "Learn about the developers and the technology behind the IoT ULEAM telemetry project." : "Conoce a los desarrolladores y la tecnología detrás del proyecto de telemetría IoT ULEAM."}
      />
      <main className="about-main-container">

        {/* ── SECCIÓN HÉROE / LOGO PRINCIPAL ── */}
        <div className="about-hero-block">
          <div className="about-logo-wrapper">
            <EditableImage
              imageKey="ad-logo"
              defaultSrc={LogoIoTDark}
              alt="Logo IoT ULEAM"
              className="about-main-logo"
              wrapperStyle={{ width: '372px', maxWidth: '100%', margin: '0 auto', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
              recommendedWidth={372}
              recommendedHeight={340}
              hint="Logo principal de la plataforma IoT ULEAM que aparece en la sección héroe de la página Acerca de."
            />
          </div>
          <div className="about-header-text">
            <h1 className="about-title-main">
              <EditableText textKey="ad-main-title" defaultText="Plataforma IoT ULEAM" />
            </h1>
            <p className="about-subtitle-main">
              <EditableText textKey="ad-main-subtitle" defaultText="Investigación Multidisciplinaria con IoT e Inteligencia Artificial" />
            </p>
          </div>
        </div>

        {/* ── ¿DE QUÉ TRATA ESTE PROYECTO? ── */}
        <section className="about-section">
          <h2 className="about-section-heading">
            <EditableText textKey="ad-about-title" defaultText="¿De qué trata este proyecto?" />
          </h2>
          <p className="about-paragraph">
            <EditableText
              textKey="ad-about-description"
              defaultText="El proyecto de Telemetría IoT ULEAM es una plataforma de investigación multidisciplinaria orientada a la recolección, procesamiento y visualización en tiempo real de datos meteorológicos y de sensores ambientales en la Universidad Laica Eloy Alfaro de Manabí."
              isTextArea={true}
            />
          </p>
        </section>

        {/* ── TECNOLOGÍAS UTILIZADAS ── */}
        <section className="about-section">
          <h2 className="about-section-heading">
            <EditableText textKey="ad-tech-title" defaultText="Tecnologías Utilizadas" />
          </h2>

          <div className="about-tech-grid">

            {/* Next.js */}
            <div className="tech-card">
              <EditableImage
                imageKey="ad-tech-icon-1"
                defaultSvg={
                  <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" className="tech-card-icon" height="1em" width="1em">
                    <path d="M9 15v-6l7.745 10.65a9 9 0 1 1 2.255 -1.993"></path>
                    <path d="M15 12v-3"></path>
                  </svg>
                }
                alt="Next.js icon"
                className="tech-card-icon"
                wrapperClassName="tech-card-icon-wrapper"
                recommendedWidth={80}
                recommendedHeight={80}
                hint="Ícono de Next.js en la sección Tecnologías Utilizadas."
              />
              <span className="tech-card-label">
                <EditableText textKey="ad-tech-1" defaultText="React / Vite" />
              </span>
            </div>

            {/* Django */}
            <div className="tech-card">
              <EditableImage
                imageKey="ad-tech-icon-2"
                defaultSvg={
                  <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" className="tech-card-icon" height="1em" width="1em">
                    <path d="M11.146 0h3.924v18.166c-2.013.382-3.491.535-5.096.535-4.791 0-7.288-2.166-7.288-6.32 0-4.002 2.65-6.6 6.753-6.6.637 0 1.121.05 1.707.203zm0 9.143a3.894 3.894 0 00-1.325-.204c-1.988 0-3.134 1.223-3.134 3.365 0 2.09 1.096 3.236 3.109 3.236.433 0 .79-.025 1.35-.102V9.142zM21.314 6.06v9.098c0 3.134-.229 4.638-.917 5.937-.637 1.249-1.478 2.039-3.211 2.905l-3.644-1.733c1.733-.815 2.574-1.53 3.109-2.625.561-1.121.739-2.421.739-5.835V6.059h3.924zM17.39.021h3.924v4.026H17.39z"></path>
                  </svg>
                }
                alt="Django icon"
                className="tech-card-icon"
                wrapperClassName="tech-card-icon-wrapper"
                recommendedWidth={80}
                recommendedHeight={80}
                hint="Ícono de Django en la sección Tecnologías Utilizadas."
              />
              <span className="tech-card-label">
                <EditableText textKey="ad-tech-2" defaultText="Laravel / Node.js" />
              </span>
            </div>

            {/* PostgreSQL */}
            <div className="tech-card">
              <EditableImage
                imageKey="ad-tech-icon-3"
                defaultSvg={
                  <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" className="tech-card-icon" height="1em" width="1em">
                    <path d="M10.74 12.89v-.11c.06-.15.12-.29.19-.43a5.15 5.15 0 0 0 .26-3.74.86.86 0 0 0-.66-.74 3.12 3.12 0 0 0-2.08.61v.18a11.34 11.34 0 0 1-.06 2.41 2.37 2.37 0 0 0 .62 2 2 2 0 0 0 1.43.63 8.05 8.05 0 0 1 .3-.81zM10 8.58a.36.36 0 0 1-.09-.23.19.19 0 0 1 .09-.12.74.74 0 0 1 .48-.07c.25 0 .5.16.48.34a.51.51 0 0 1-.49.33h-.06a.63.63 0 0 1-.41-.25z"></path>
                    <path d="M7.88 11a12.58 12.58 0 0 0 .06-2.3v-.28a7 7 0 0 1 1.54-4.55c-1-.32-3.4-1-4.87.1-.9.64-1.32 1.84-1.23 3.55a24.85 24.85 0 0 0 1 4.4c.68 2.22 1.45 3.62 2.11 3.85.1 0 .41.13.86-.41.64-.76 1.23-1.41 1.5-1.7l-.19-.19A2.89 2.89 0 0 1 7.88 11zm3.5 3.4c-.16-.06-.24-.1-.42.11a2.52 2.52 0 0 0-.29.35c-.35.43-.5.58-1.51.79a2 2 0 0 0-.4.11 1 1 0 0 0 .37.16 2.21 2.21 0 0 0 2.5-.8.41.41 0 0 0 0-.35.59.59 0 0 0-.25-.37zm6.29-5.82a5.29 5.29 0 0 0 .08-.79c-.66-.08-1.42-.07-1.72.36-.58.83.56 2.88 1 3.75a4.34 4.34 0 0 1 .26.48 1.79 1.79 0 0 0 .15.31 3.72 3.72 0 0 0 .16-2.13 7.51 7.51 0 0 1-.07-1.05 6 6 0 0 1 .14-.93zm-.56-.16a.6.6 0 0 1-.32.17h-.06a.47.47 0 0 1-.44-.3c0-.14.2-.24.44-.28s.48 0 .5.15a.38.38 0 0 1-.12.26z"></path>
                    <path d="M17 4.88a6.06 6.06 0 0 1 1.37 2.57.71.71 0 0 1 0 .15 5.67 5.67 0 0 1-.09 1.06 7.11 7.11 0 0 0-.09.86 6.61 6.61 0 0 0 .07 1 4 4 0 0 1-.36 2.71l.07.08c2.22-3.49 3-7.54 2.29-8.43a4.77 4.77 0 0 0-3.81-1.8 7.34 7.34 0 0 0-1.63.16A6.17 6.17 0 0 1 17 4.88z"></path>
                  </svg>
                }
                alt="PostgreSQL icon"
                className="tech-card-icon"
                wrapperClassName="tech-card-icon-wrapper"
                recommendedWidth={80}
                recommendedHeight={80}
                hint="Ícono de PostgreSQL en la sección Tecnologías Utilizadas."
              />
              <span className="tech-card-label">
                <EditableText textKey="ad-tech-3" defaultText="PostgreSQL / MySQL" />
              </span>
            </div>

            {/* SCRUM */}
            <div className="tech-card">
              <EditableImage
                imageKey="ad-tech-icon-4"
                defaultSvg={
                  <svg stroke="currentColor" fill="currentColor" strokeWidth="0" version="1.1" viewBox="0 0 32 32" className="tech-card-icon" height="1em" width="1em">
                    <path d="M20.649 21.349c0.064 0.004 0.133 0.012 0.202 0.012 0.977 0.001 1.955-0.005 2.932 0.005 0.214 0.002 0.278-0.071 0.267-0.276-0.014-0.267-0.003-0.535-0.003-0.865 1.109 0.816 2.181 1.604 3.281 2.414-1.092 0.804-2.164 1.593-3.281 2.416 0-0.311 0-0.568-0-0.825-0-0.332-0-0.333-0.323-0.333-6.247 0-12.495 0-18.742 0-0.302 0-0.302-0-0.302-0.304 0-0.659 0.009-1.318-0.005-1.976-0.005-0.214 0.064-0.262 0.269-0.261 3.359 0.006 6.718 0.011 10.077 0.002 1.722-0.005 3.081-0.718 3.98-2.202 1.622-2.68-0.069-6.19-3.177-6.642-2.4-0.349-4.631 1.262-5.038 3.703-0.043 0.254-0.046 0.515-0.071 0.821 0.393-0.053 0.749-0.102 1.152-0.156-0.631 1.22-1.24 2.398-1.858 3.592-0.947-0.976-1.88-1.937-2.792-2.877 0.229-0.038 0.533-0.082 0.834-0.145 0.057-0.012 0.141-0.104 0.139-0.157-0.017-0.639 0.027-1.271 0.152-1.898 0.004-0.019-0.005-0.041-0.011-0.078-0.61-0.104-1.176-0.324-1.689-0.678-1.254-0.868-1.91-2.483-1.602-3.955 0.335-1.604 1.545-2.803 3.109-3.099 1.014-0.191 1.954-0.009 2.827 0.527 0.154 0.095 0.248 0.109 0.349-0.056 0.059-0.097 0.148-0.175 0.25-0.293 0.127 0.512 0.246 0.991 0.364 1.47 0.040 0.161 0.071 0.325 0.118 0.484 0.051 0.172-0.001 0.249-0.183 0.237-0.526-0.036-1.053-0.068-1.579-0.103-0.13-0.009-0.259-0.023-0.426-0.039 0.13-0.164 0.248-0.311 0.377-0.472-0.284-0.216-0.597-0.324-0.923-0.377-1.576-0.258-2.965 0.953-2.933 2.548 0.024 1.224 1.056 2.318 2.275 2.422 0.158 0.013 0.213-0.067 0.274-0.185 0.864-1.658 2.165-2.83 3.935-3.44 4.095-1.412 8.37 1.118 9.159 5.259 0.389 2.039-0.054 3.901-1.291 5.57-0.034 0.046-0.065 0.095-0.095 0.144-0.006 0.009 0.002 0.027 0.007 0.065z"></path>
                  </svg>
                }
                alt="SCRUM icon"
                className="tech-card-icon"
                wrapperClassName="tech-card-icon-wrapper"
                recommendedWidth={80}
                recommendedHeight={80}
                hint="Ícono de SCRUM en la sección Tecnologías Utilizadas."
              />
              <span className="tech-card-label">
                <EditableText textKey="ad-tech-4" defaultText="Metodología SCRUM" />
              </span>
            </div>

            {/* Sensores IoT */}
            <div className="tech-card">
              <EditableImage
                imageKey="ad-tech-icon-5"
                defaultSvg={
                  <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" className="tech-card-icon" height="1em" width="1em">
                    <path d="M416 48v416c0 26.51-21.49 48-48 48H144c-26.51 0-48-21.49-48-48V48c0-26.51 21.49-48 48-48h224c26.51 0 48 21.49 48 48zm96 58v12a6 6 0 0 1-6 6h-18v6a6 6 0 0 1-6 6h-42V88h42a6 6 0 0 1 6 6v6h18a6 6 0 0 1 6 6zm0 96v12a6 6 0 0 1-6 6h-18v6a6 6 0 0 1-6 6h-42v-48h42a6 6 0 0 1 6 6v6h18a6 6 0 0 1 6 6zm0 96v12a6 6 0 0 1-6 6h-18v6a6 6 0 0 1-6 6h-42v-48h42a6 6 0 0 1 6 6v6h18a6 6 0 0 1 6 6zm0 96v12a6 6 0 0 1-6 6h-18v6a6 6 0 0 1-6 6h-42v-48h42a6 6 0 0 1 6 6v6h18a6 6 0 0 1 6 6zM30 376h42v48H30a6 6 0 0 1-6-6v-6H6a6 6 0 0 1-6-6v-12a6 6 0 0 1 6-6h18v-6a6 6 0 0 1 6-6zm0-96h42v48H30a6 6 0 0 1-6-6v-6H6a6 6 0 0 1-6-6v-12a6 6 0 0 1 6-6h18v-6a6 6 0 0 1 6-6zm0-96h42v48H30a6 6 0 0 1-6-6v-6H6a6 6 0 0 1-6-6v-12a6 6 0 0 1 6-6h18v-6a6 6 0 0 1 6-6zm0-96h42v48H30a6 6 0 0 1-6-6v-6H6a6 6 0 0 1-6-6v-12a6 6 0 0 1 6-6h18v-6a6 6 0 0 1 6-6z"></path>
                  </svg>
                }
                alt="Sensores IoT icon"
                className="tech-card-icon"
                wrapperClassName="tech-card-icon-wrapper"
                recommendedWidth={80}
                recommendedHeight={80}
                hint="Ícono de Sensores IoT en la sección Tecnologías Utilizadas."
              />
              <span className="tech-card-label">
                <EditableText textKey="ad-tech-5" defaultText="Sensores IoT / ESP32" />
              </span>
            </div>

            {/* Gráficas ChartJS */}
            <div className="tech-card">
              <EditableImage
                imageKey="ad-tech-icon-6"
                defaultSvg={
                  <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" className="tech-card-icon" height="1em" width="1em">
                    <path d="M332.8 320h38.4c6.4 0 12.8-6.4 12.8-12.8V172.8c0-6.4-6.4-12.8-12.8-12.8h-38.4c-6.4 0-12.8 6.4-12.8 12.8v134.4c0 6.4 6.4 12.8 12.8 12.8zm96 0h38.4c6.4 0 12.8-6.4 12.8-12.8V76.8c0-6.4-6.4-12.8-12.8-12.8h-38.4c-6.4 0-12.8 6.4-12.8 12.8v230.4c0 6.4 6.4 12.8 12.8 12.8zm-288 0h38.4c6.4 0 12.8-6.4 12.8-12.8v-70.4c0-6.4-6.4-12.8-12.8-12.8h-38.4c-6.4 0-12.8 6.4-12.8 12.8v70.4c0 6.4 6.4 12.8 12.8 12.8zm96 0h38.4c6.4 0 12.8-6.4 12.8-12.8V108.8c0-6.4-6.4-12.8-12.8-12.8h-38.4c-6.4 0-12.8 6.4-12.8 12.8v198.4c0 6.4 6.4 12.8 12.8 12.8zM496 384H64V80c0-8.84-7.16-16-16-16H16C7.16 64 0 71.16 0 80v336c0 17.67 14.33 32 32 32h464c8.84 0 16-7.16 16-16v-32c0-8.84-7.16-16-16-16z"></path>
                  </svg>
                }
                alt="ChartJS icon"
                className="tech-card-icon"
                wrapperClassName="tech-card-icon-wrapper"
                recommendedWidth={80}
                recommendedHeight={80}
                hint="Ícono de Gráficas ChartJS en la sección Tecnologías Utilizadas."
              />
              <span className="tech-card-label">
                <EditableText textKey="ad-tech-6" defaultText="Gráficas ChartJS" />
              </span>
            </div>

            {/* Mapas Leaflet.js */}
            <div className="tech-card">
              <EditableImage
                imageKey="ad-tech-icon-7"
                defaultSvg={
                  <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" className="tech-card-icon" height="1em" width="1em">
                    <path d="M12 13.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"></path>
                    <path d="M19.071 3.429h.001c3.905 3.905 3.905 10.237 0 14.142l-5.403 5.403a2.36 2.36 0 0 1-3.336 0l-5.375-5.375-.028-.028c-3.905-3.905-3.905-10.237 0-14.142 3.904-3.905 10.236-3.905 14.141 0ZM5.99 4.489v.001a8.5 8.5 0 0 0 0 12.02l.023.024.002.002 5.378 5.378a.859.859 0 0 0 1.214 0l5.403-5.404a8.5 8.5 0 0 0-.043-11.977A8.5 8.5 0 0 0 5.99 4.489Z"></path>
                  </svg>
                }
                alt="Leaflet.js icon"
                className="tech-card-icon"
                wrapperClassName="tech-card-icon-wrapper"
                recommendedWidth={80}
                recommendedHeight={80}
                hint="Ícono de Mapas Leaflet.js en la sección Tecnologías Utilizadas."
              />
              <span className="tech-card-label">
                <EditableText textKey="ad-tech-7" defaultText="Mapas Leaflet.js" />
              </span>
            </div>

            {/* Configuración Modular */}
            <div className="tech-card">
              <EditableImage
                imageKey="ad-tech-icon-8"
                defaultSvg={
                  <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" className="tech-card-icon" height="1em" width="1em">
                    <path d="M416.3 256c0-21 13.1-38.9 31.7-46.1-4.9-20.5-13-39.7-23.7-57.1-6.4 2.8-13.2 4.3-20.1 4.3-12.6 0-25.2-4.8-34.9-14.4-14.9-14.9-18.2-36.8-10.2-55-17.3-10.7-36.6-18.8-57-23.7C295 82.5 277 95.7 256 95.7S217 82.5 209.9 64c-20.5 4.9-39.7 13-57.1 23.7 8.1 18.1 4.7 40.1-10.2 55-9.6 9.6-22.3 14.4-34.9 14.4-6.9 0-13.7-1.4-20.1-4.3C77 170.3 68.9 189.5 64 210c18.5 7.1 31.7 25 31.7 46.1 0 21-13.1 38.9-31.6 46.1 4.9 20.5 13 39.7 23.7 57.1 6.4-2.8 13.2-4.2 20-4.2 12.6 0 25.2 4.8 34.9 14.4 14.8 14.8 18.2 36.8 10.2 54.9 17.4 10.7 36.7 18.8 57.1 23.7 7.1-18.5 25-31.6 46-31.6s38.9 13.1 46 31.6c20.5-4.9 39.7-13 57.1-23.7-8-18.1-4.6-40 10.2-54.9 9.6-9.6 22.2-14.4 34.9-14.4 6.8 0 13.7 1.4 20 4.2 10.7-17.4 18.8-36.7 23.7-57.1-18.4-7.2-31.6-25.1-31.6-46.2zm-159.4 79.9c-44.3 0-80-35.9-80-80s35.7-80 80-80 80 35.9 80 80-35.7 80-80 80z"></path>
                  </svg>
                }
                alt="Configuración Modular icon"
                className="tech-card-icon"
                wrapperClassName="tech-card-icon-wrapper"
                recommendedWidth={80}
                recommendedHeight={80}
                hint="Ícono de Configuración Modular en la sección Tecnologías Utilizadas."
              />
              <span className="tech-card-label">
                <EditableText textKey="ad-tech-8" defaultText="Configuración Modular" />
              </span>
            </div>

          </div>
        </section>

        {/* ── ARQUITECTURA IOT ULEAM ── */}
        <section className="about-section">
          <div className="about-arch-box">
            <h2 className="about-arch-title">
              <EditableText textKey="ad-arch-title" defaultText="Arquitectura IoT ULEAM" />
            </h2>
            <div className="about-arch-img-wrapper">
              <EditableImage
                imageKey="ad-arch-image"
                defaultSrc={ArchitectureImg}
                alt="Arquitectura IoT ULEAM"
                className="about-arch-img"
                wrapperStyle={{ borderRadius: '10px' }}
                recommendedWidth={900}
                recommendedHeight={500}
                hint="Diagrama de arquitectura de la plataforma IoT ULEAM que ilustra el flujo de datos desde los sensores hasta la nube."
              />
            </div>
          </div>
        </section>

        {/* ── OBJETIVOS DEL PROYECTO ── */}
        <section className="about-section">
          <h2 className="about-section-heading">
            <EditableText textKey="ad-obj-title" defaultText="Objetivos del Proyecto" />
          </h2>
          <ul className="about-bullet-list">
            <li>
              <EditableText textKey="ad-obj-item1" defaultText="Desplegar nodos sensores para monitoreo ambiental y climático en el campus." />
            </li>
            <li>
              <EditableText textKey="ad-obj-item2" defaultText="Visualizar métricas en tiempo real con dashboards gráficos e histórico agregado." />
            </li>
            <li>
              <EditableText textKey="ad-obj-item3" defaultText="Fomentar la investigación científica multidisciplinaria en telemetría e IA." />
            </li>
          </ul>
        </section>

        {/* ── CARACTERÍSTICAS & METODOLOGÍA (GRID 2 COLS) ── */}
        <section className="about-section">
          <div className="about-two-cols-grid">

            {/* Características Principales */}
            <div className="about-info-card">
              <h3 className="about-info-card-title">
                <EditableText textKey="ad-feat-title" defaultText="Características Principales" />
              </h3>
              <div className="about-info-card-list">

                <div className="info-item-row">
                  <span className="info-item-icon">
                    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1em" width="1em">
                      <path d="M416 48v416c0 26.51-21.49 48-48 48H144c-26.51 0-48-21.49-48-48V48c0-26.51 21.49-48 48-48h224c26.51 0 48 21.49 48 48zm96 58v12a6 6 0 0 1-6 6h-18v6a6 6 0 0 1-6 6h-42V88h42a6 6 0 0 1 6 6v6h18a6 6 0 0 1 6 6zm0 96v12a6 6 0 0 1-6 6h-18v6a6 6 0 0 1-6 6h-42v-48h42a6 6 0 0 1 6 6v6h18a6 6 0 0 1 6 6zm0 96v12a6 6 0 0 1-6 6h-18v6a6 6 0 0 1-6 6h-42v-48h42a6 6 0 0 1 6 6v6h18a6 6 0 0 1 6 6zm0 96v12a6 6 0 0 1-6 6h-18v6a6 6 0 0 1-6 6h-42v-48h42a6 6 0 0 1 6 6v6h18a6 6 0 0 1 6 6zM30 376h42v48H30a6 6 0 0 1-6-6v-6H6a6 6 0 0 1-6-6v-12a6 6 0 0 1 6-6h18v-6a6 6 0 0 1 6-6zm0-96h42v48H30a6 6 0 0 1-6-6v-6H6a6 6 0 0 1-6-6v-12a6 6 0 0 1 6-6h18v-6a6 6 0 0 1 6-6zm0-96h42v48H30a6 6 0 0 1-6-6v-6H6a6 6 0 0 1-6-6v-12a6 6 0 0 1 6-6h18v-6a6 6 0 0 1 6-6zm0-96h42v48H30a6 6 0 0 1-6-6v-6H6a6 6 0 0 1-6-6v-12a6 6 0 0 1 6-6h18v-6a6 6 0 0 1 6-6z"></path>
                    </svg>
                  </span>
                  <p className="info-item-text">
                    <EditableText textKey="ad-feat-1" defaultText="Sensores en tiempo real con métricas configurables" />
                  </p>
                </div>

                <div className="info-item-row">
                  <span className="info-item-icon">
                    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em">
                      <path fill="none" d="M0 0h24v24H0z"></path>
                      <path d="M4 9h4v11H4zM16 13h4v7h-4zM10 4h4v16h-4z"></path>
                    </svg>
                  </span>
                  <p className="info-item-text">
                    <EditableText textKey="ad-feat-2" defaultText="Visualización histórica y análisis estadístico" />
                  </p>
                </div>

                <div className="info-item-row">
                  <span className="info-item-icon">
                    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em">
                      <path d="M12 13.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"></path>
                      <path d="M19.071 3.429h.001c3.905 3.905 3.905 10.237 0 14.142l-5.403 5.403a2.36 2.36 0 0 1-3.336 0l-5.375-5.375-.028-.028c-3.905-3.905-3.905-10.237 0-14.142 3.904-3.905 10.236-3.905 14.141 0ZM5.99 4.489v.001a8.5 8.5 0 0 0 0 12.02l.023.024.002.002 5.378 5.378a.859.859 0 0 0 1.214 0l5.403-5.404a8.5 8.5 0 0 0-.043-11.977A8.5 8.5 0 0 0 5.99 4.489Z"></path>
                    </svg>
                  </span>
                  <p className="info-item-text">
                    <EditableText textKey="ad-feat-3" defaultText="Geolocalización interactiva en mapa Leaflet" />
                  </p>
                </div>

                <div className="info-item-row">
                  <span className="info-item-icon">
                    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" height="1em" width="1em">
                      <path d="M448 73.143v45.714C448 159.143 347.667 192 224 192S0 159.143 0 118.857V73.143C0 32.857 100.333 0 224 0s224 32.857 224 73.143zM448 176v102.857C448 319.143 347.667 352 224 352S0 319.143 0 278.857V176c48.125 33.143 136.208 48.572 224 48.572S399.874 209.143 448 176zm0 160v102.857C448 479.143 347.667 512 224 512S0 479.143 0 438.857V336c48.125 33.143 136.208 48.572 224 48.572S399.874 369.143 448 336z"></path>
                    </svg>
                  </span>
                  <p className="info-item-text">
                    <EditableText textKey="ad-feat-4" defaultText="Gestión de roles y control de edición dinámico" />
                  </p>
                </div>

              </div>
            </div>

            {/* Metodología de Desarrollo */}
            <div className="about-info-card">
              <h3 className="about-info-card-title">
                <EditableText textKey="ad-method-title" defaultText="Metodología de Desarrollo" />
              </h3>
              <div className="about-info-card-list">

                <div className="info-item-row">
                  <span className="info-item-icon">
                    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1em" width="1em">
                      <path d="M416.3 256c0-21 13.1-38.9 31.7-46.1-4.9-20.5-13-39.7-23.7-57.1-6.4 2.8-13.2 4.3-20.1 4.3-12.6 0-25.2-4.8-34.9-14.4-14.9-14.9-18.2-36.8-10.2-55-17.3-10.7-36.6-18.8-57-23.7C295 82.5 277 95.7 256 95.7S217 82.5 209.9 64c-20.5 4.9-39.7 13-57.1 23.7 8.1 18.1 4.7 40.1-10.2 55-9.6 9.6-22.3 14.4-34.9 14.4-6.9 0-13.7-1.4-20.1-4.3C77 170.3 68.9 189.5 64 210c18.5 7.1 31.7 25 31.7 46.1 0 21-13.1 38.9-31.6 46.1 4.9 20.5 13 39.7 23.7 57.1 6.4-2.8 13.2-4.2 20-4.2 12.6 0 25.2 4.8 34.9 14.4 14.8 14.8 18.2 36.8 10.2 54.9 17.4 10.7 36.7 18.8 57.1 23.7 7.1-18.5 25-31.6 46-31.6s38.9 13.1 46 31.6c20.5-4.9 39.7-13 57.1-23.7-8-18.1-4.6-40 10.2-54.9 9.6-9.6 22.2-14.4 34.9-14.4 6.8 0 13.7 1.4 20 4.2 10.7-17.4 18.8-36.7 23.7-57.1-18.4-7.2-31.6-25.1-31.6-46.2zm-159.4 79.9c-44.3 0-80-35.9-80-80s35.7-80 80-80 80 35.9 80 80-35.7 80-80 80z"></path>
                    </svg>
                  </span>
                  <p className="info-item-text">
                    <EditableText textKey="ad-method-1" defaultText="Arquitectura modular desacoplada" />
                  </p>
                </div>

                <div className="info-item-row">
                  <span className="info-item-icon">
                    <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em">
                      <path d="M8 5h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h5.697"></path>
                      <path d="M18 14v4h4"></path>
                      <path d="M18 11v-4a2 2 0 0 0 -2 -2h-2"></path>
                      <path d="M8 3m0 2a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v0a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2z"></path>
                      <path d="M18 18m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0"></path>
                      <path d="M8 11h4"></path>
                      <path d="M8 15h3"></path>
                    </svg>
                  </span>
                  <p className="info-item-text">
                    <EditableText textKey="ad-method-2" defaultText="Documentación OpenAPI / Swagger" />
                  </p>
                </div>

                <div className="info-item-row">
                  <span className="info-item-icon">
                    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" version="1.1" viewBox="0 0 32 32" height="1em" width="1em">
                      <path d="M20.649 21.349c0.064 0.004 0.133 0.012 0.202 0.012 0.977 0.001 1.955-0.005 2.932 0.005 0.214 0.002 0.278-0.071 0.267-0.276-0.014-0.267-0.003-0.535-0.003-0.865 1.109 0.816 2.181 1.604 3.281 2.414-1.092 0.804-2.164 1.593-3.281 2.416 0-0.311 0-0.568-0-0.825-0-0.332-0-0.333-0.323-0.333-6.247 0-12.495 0-18.742 0-0.302 0-0.302-0-0.302-0.304 0-0.659 0.009-1.318-0.005-1.976-0.005-0.214 0.064-0.262 0.269-0.261 3.359 0.006 6.718 0.011 10.077 0.002 1.722-0.005 3.081-0.718 3.98-2.202 1.622-2.68-0.069-6.19-3.177-6.642-2.4-0.349-4.631 1.262-5.038 3.703-0.043 0.254-0.046 0.515-0.071 0.821 0.393-0.053 0.749-0.102 1.152-0.156-0.631 1.22-1.24 2.398-1.858 3.592-0.947-0.976-1.88-1.937-2.792-2.877 0.229-0.038 0.533-0.082 0.834-0.145 0.057-0.012 0.141-0.104 0.139-0.157-0.017-0.639 0.027-1.271 0.152-1.898 0.004-0.019-0.005-0.041-0.011-0.078-0.61-0.104-1.176-0.324-1.689-0.678-1.254-0.868-1.91-2.483-1.602-3.955 0.335-1.604 1.545-2.803 3.109-3.099 1.014-0.191 1.954-0.009 2.827 0.527 0.154 0.095 0.248 0.109 0.349-0.056 0.059-0.097 0.148-0.175 0.25-0.293 0.127 0.512 0.246 0.991 0.364 1.47 0.040 0.161 0.071 0.325 0.118 0.484 0.051 0.172-0.001 0.249-0.183 0.237-0.526-0.036-1.053-0.068-1.579-0.103-0.13-0.009-0.259-0.023-0.426-0.039 0.13-0.164 0.248-0.311 0.377-0.472-0.284-0.216-0.597-0.324-0.923-0.377-1.576-0.258-2.965 0.953-2.933 2.548 0.024 1.224 1.056 2.318 2.275 2.422 0.158 0.013 0.213-0.067 0.274-0.185 0.864-1.658 2.165-2.83 3.935-3.44 4.095-1.412 8.37 1.118 9.159 5.259 0.389 2.039-0.054 3.901-1.291 5.57-0.034 0.046-0.065 0.095-0.095 0.144-0.006 0.009 0.002 0.027 0.007 0.065z"></path>
                    </svg>
                  </span>
                  <p className="info-item-text">
                    <EditableText textKey="ad-method-3" defaultText="Sprints ágiles con control de versiones Git" />
                  </p>
                </div>

              </div>
            </div>

          </div>
        </section>

        {/* ── EQUIPO DE TRABAJO ── */}
        <section className="about-section about-team-box">
          <h2 className="about-team-main-heading">
            <EditableText textKey="ad-team-title" defaultText="Equipo de Trabajo" />
          </h2>

          {/* Líderes de Proyecto */}
          <div className="about-leads-section" style={{ marginBottom: "2.25rem" }}>
            <div className="about-leads-grid">
              {Array.from({ length: leadsCount }).map((_, idx) => {
                const i = idx + 1;
                return (
                  <div className="lead-card" key={`lead-${i}`} style={{ position: "relative" }}>
                    {canEdit && leadsCount > 1 && (
                      <button
                        type="button"
                        className="card-delete-btn"
                        title="Eliminar este líder"
                        onClick={() => handleRemoveMember('leads', leadsCount, i)}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                      </button>
                    )}
                    <div className="lead-avatar-wrapper">
                      <EditableImage
                        imageKey={`ad-lead${i}-photo`}
                        defaultSrc={USER_SVG_PLACEHOLDER}
                        alt={`Líder ${i}`}
                        className="lead-avatar-img"
                        wrapperStyle={{ width: '100%', height: '100%', borderRadius: '50%' }}
                        recommendedWidth={200}
                        recommendedHeight={200}
                        hint={`Foto de perfil del líder ${i}.`}
                        circular={true}
                      />
                    </div>
                    <div className="lead-card-body">
                      <span className="lead-name-link">
                        <EditableText textKey={`ad-lead${i}-name`} defaultText={i === 1 ? "Dr. Gabriel Mendoza" : "Ing. María Fernanda López"} />
                      </span>
                      <p className="lead-role">
                        <EditableText textKey={`ad-lead${i}-role`} defaultText={i === 1 ? "Director del Proyecto Telemetría IoT" : "Coordinadora de Investigación IoT"} />
                      </p>
                      <p className="lead-email">
                        <EditableText textKey={`ad-lead${i}-email`} defaultText={i === 1 ? "gabriel.mendoza@uleam.edu.ec" : "maria.lopez@uleam.edu.ec"} />
                      </p>

                      {/* Redes Sociales del Líder */}
                      <EditableSocials
                        textKey={`ad-lead${i}-socials`}
                        defaultData={{}}
                        canEdit={canEdit}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            {canEdit && (
              <div style={{ textAlign: "center", marginTop: "1rem" }}>
                <button
                  type="button"
                  className="add-member-btn"
                  title="Añadir líder de proyecto"
                  onClick={() => handleAddMember("ad-leads-count", leadsCount, "Nuevo Líder", "ad-lead", "leads")}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </button>
              </div>
            )}
          </div>

          {/* Estudiante a cargo del desarrollo */}
          <div className="about-dev-section">
            <h3 className="about-dev-section-title">
              <EditableText textKey="ad-dev-header" defaultText="Estudiantes a Cargo del Desarrollo" />
            </h3>
            <div className="about-dev-cards-grid">
              {Array.from({ length: devsCount }).map((_, idx) => {
                const i = idx + 1;
                const devAvatarKey = i === 1 ? "ad-dev-photo" : `ad-dev${i}-photo`;
                return (
                  <div className="dev-card" key={`dev-${i}`} style={{ position: "relative" }}>
                    {canEdit && devsCount > 1 && (
                      <button
                        type="button"
                        className="card-delete-btn"
                        title="Eliminar este desarrollador"
                        onClick={() => handleRemoveMember('devs', devsCount, i)}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                      </button>
                    )}
                    <div className="dev-avatar-wrapper">
                      <EditableImage
                        imageKey={devAvatarKey}
                        defaultSrc={USER_SVG_PLACEHOLDER}
                        alt={`Miembro ${i}`}
                        className="dev-avatar-img"
                        wrapperStyle={{ width: '100%', height: '100%', borderRadius: '50%' }}
                        recommendedWidth={200}
                        recommendedHeight={200}
                        hint={`Foto de perfil del estudiante desarrollador ${i}.`}
                        circular={true}
                      />
                    </div>
                    <h3 className="dev-name">
                      <EditableText textKey={i === 1 ? "ad-dev-name" : `ad-dev${i}-name`} defaultText={i === 1 ? "Gabriele Lucas" : `Desarrollador ${i}`} />
                    </h3>
                    <p className="dev-role">
                      <EditableText textKey={i === 1 ? "ad-dev-role" : `ad-dev${i}-role`} defaultText={i === 1 ? "Desarrollador Full-Stack & Arquitecto IoT" : "Desarrollador de Software"} />
                    </p>
                    <p className="dev-email">
                      <EditableText textKey={i === 1 ? "ad-dev-email" : `ad-dev${i}-email`} defaultText={i === 1 ? "e1315585640@live.uleam.edu.ec" : `dev${i}@uleam.edu.ec`} />
                    </p>
                    <p className="dev-bio">
                      <EditableText
                        textKey={i === 1 ? "ad-dev-bio" : `ad-dev${i}-bio`}
                        defaultText={i === 1 ? "Estudiante de la carrera de Tecnologías de la Información, responsable del desarrollo integral de la plataforma de telemetría IoT." : "Estudiante investigador participante en el proyecto IoT ULEAM."}
                        isTextArea={true}
                      />
                    </p>

                    {/* Redes Sociales del Desarrollador */}
                    <EditableSocials
                      textKey={i === 1 ? "ad-dev-socials" : `ad-dev${i}-socials`}
                      defaultData={{}}
                      canEdit={canEdit}
                    />
                  </div>
                );
              })}
            </div>
            {canEdit && (
              <div className="add-member-btn-wrap">
                <button
                  type="button"
                  className="add-member-btn"
                  title="Añadir desarrollador"
                  onClick={() => handleAddMember("ad-devs-count", devsCount, "Nuevo Desarrollador", "ad-dev", "devs")}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </button>
              </div>
            )}
          </div>

          {/* Miembros en Categorías */}
          <div className="about-members-group">

            {/* Docentes */}
            <div className="members-category-box teachers-box">
              <div className="members-category-header">
                <span className="members-category-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                    <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                  </svg>
                </span>
                <h3 className="members-category-title">
                  <EditableText textKey="ad-teachers-title" defaultText="Docentes Directores y Tutores" />
                </h3>
              </div>
              <div className="members-chips-wrap">
                {Array.from({ length: teachersCount }).map((_, idx) => {
                  const i = idx + 1;
                  return (
                    <span className="chip-wrapper-editable" key={`teacher-${i}`}>
                      <span className="member-chip">
                        <span className="member-name-text">
                          <EditableText textKey={`ad-teacher${i}`} defaultText={["Dr. Gabriel Mendoza", "Ing. Carlos Villacreses", "Dra. Patricia Quiroz", "Ing. Roberto Delgado", "Ing. José Intriago"][i - 1] || `Docente ${i}`} />
                        </span>
                        <EditableSocials
                          textKey={`ad-teacher${i}-socials`}
                          defaultData={{}}
                          canEdit={canEdit}
                        />
                      </span>
                      {canEdit && teachersCount > 1 && (
                        <button type="button" className="chip-delete-btn" title="Eliminar este docente"
                          onClick={() => handleRemoveMember('teachers', teachersCount, i)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
                      )}
                    </span>
                  );
                })}
              </div>
              {canEdit && (
                <div className="add-member-btn-wrap">
                  <button type="button" className="add-member-btn" title="Añadir docente"
                    onClick={() => handleAddMember("ad-teachers-count", teachersCount, "Nuevo docente", "ad-teacher", "teachers")}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg></button>
                </div>
              )}
            </div>

            {/* Colaboradores externos */}
            <div className="members-category-box collabs-box">
              <div className="members-category-header">
                <span className="members-category-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="2" y1="12" x2="22" y2="12"/>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                  </svg>
                </span>
                <h3 className="members-category-title">
                  <EditableText textKey="ad-collab-title" defaultText="Colaboradores Externos e Investigadores" />
                </h3>
              </div>
              <div className="members-chips-wrap">
                {Array.from({ length: collabsCount }).map((_, idx) => {
                  const i = idx + 1;
                  return (
                    <span className="chip-wrapper-editable" key={`collab-${i}`}>
                      <span className="member-chip">
                        <span className="member-name-text">
                          <EditableText textKey={`ad-collab${i}`} defaultText={["Red Ecuatoriana de Tecnologías IoT (RETIoT)", "Laboratorio de Microelectrónica ULEAM"][i - 1] || `Colaborador ${i}`} />
                        </span>
                        <EditableSocials
                          textKey={`ad-collab${i}-socials`}
                          defaultData={{}}
                          canEdit={canEdit}
                        />
                      </span>
                      {canEdit && collabsCount > 1 && (
                        <button type="button" className="chip-delete-btn" title="Eliminar este colaborador"
                          onClick={() => handleRemoveMember('collabs', collabsCount, i)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
                      )}
                    </span>
                  );
                })}
              </div>
              {canEdit && (
                <div className="add-member-btn-wrap">
                  <button type="button" className="add-member-btn" title="Añadir colaborador"
                    onClick={() => handleAddMember("ad-collabs-count", collabsCount, "Nuevo colaborador", "ad-collab", "collabs")}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg></button>
                </div>
              )}
            </div>

            {/* Estudiantes */}
            <div className="members-category-box students-box">
              <div className="members-category-header">
                <span className="members-category-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                    <line x1="8" y1="21" x2="16" y2="21"/>
                    <line x1="12" y1="17" x2="12" y2="21"/>
                  </svg>
                </span>
                <h3 className="members-category-title">
                  <EditableText textKey="ad-students-title" defaultText="Estudiantes Investigadores" />
                </h3>
              </div>
              <div className="members-chips-wrap">
                {Array.from({ length: studentsCount }).map((_, idx) => {
                  const i = idx + 1;
                  return (
                    <span className="chip-wrapper-editable" key={`student-${i}`}>
                      <span className="member-chip">
                        <span className="member-name-text">
                          <EditableText textKey={`ad-student${i}`} defaultText={["Gabriele Lucas", "Alex Macías", "Diana Anchundia", "Kevin Zambrano", "Valeria Cedeño"][i - 1] || `Estudiante ${i}`} />
                        </span>
                        <EditableSocials
                          textKey={`ad-student${i}-socials`}
                          defaultData={{}}
                          canEdit={canEdit}
                        />
                      </span>
                      {canEdit && studentsCount > 1 && (
                        <button type="button" className="chip-delete-btn" title="Eliminar este estudiante"
                          onClick={() => handleRemoveMember('students', studentsCount, i)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
                      )}
                    </span>
                  );
                })}
              </div>
              {canEdit && (
                <div className="add-member-btn-wrap">
                  <button type="button" className="add-member-btn" title="Añadir estudiante"
                    onClick={() => handleAddMember("ad-students-count", studentsCount, "Nuevo estudiante", "ad-student", "students")}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg></button>
                </div>
              )}
            </div>

            {/* Estudiantes de prácticas profesionales */}
            <div className="members-category-box interns-box">
              <div className="members-category-header">
                <span className="members-category-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.71.79-1.81.2-2.55L4.5 16.5z"/>
                    <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-3.05 11a22.35 22.35 0 0 1-3.95 2z"/>
                  </svg>
                </span>
                <h3 className="members-category-title">
                  <EditableText textKey="ad-interns-title" defaultText="Prácticas Pre-Profesionales" />
                </h3>
              </div>
              <div className="members-chips-wrap">
                {Array.from({ length: internsCount }).map((_, idx) => {
                  const i = idx + 1;
                  return (
                    <span className="chip-wrapper-editable" key={`intern-${i}`}>
                      <span className="member-chip">
                        <span className="member-name-text">
                          <EditableText textKey={`ad-intern${i}`} defaultText={["Jean Carlos Bazurto", "Melissa Saltos"][i - 1] || `Practicante ${i}`} />
                        </span>
                        <EditableSocials
                          textKey={`ad-intern${i}-socials`}
                          defaultData={{}}
                          canEdit={canEdit}
                        />
                      </span>
                      {canEdit && internsCount > 1 && (
                        <button type="button" className="chip-delete-btn" title="Eliminar este practicante"
                          onClick={() => handleRemoveMember('interns', internsCount, i)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
                      )}
                    </span>
                  );
                })}
              </div>
              {canEdit && (
                <div className="add-member-btn-wrap">
                  <button type="button" className="add-member-btn" title="Añadir practicante"
                    onClick={() => handleAddMember("ad-interns-count", internsCount, "Nuevo practicante", "ad-intern", "interns")}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg></button>
                </div>
              )}
            </div>

          </div>

        </section>

        {/* ── ¿QUIERES SABER MÁS? ── */}
        <section className="about-cta-section">
          <div className="about-cta-badge">
            <span className="about-cta-badge-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </span>
            <span><EditableText textKey="ad-cta-badge" defaultText="¿Tienes alguna consulta o colaboración?" /></span>
          </div>
          <h3 className="about-cta-title">
            <EditableText textKey="ad-cta-title" defaultText="¿Quieres saber más sobre el proyecto?" />
          </h3>
          <p className="about-cta-subtext">
            <EditableText textKey="ad-cta-subtext" defaultText="Ponte en contacto con nuestro equipo de investigación o conoce cómo integrarte a los desarrollos de la plataforma IoT ULEAM." isTextArea={true} />
          </p>
          <div className="about-cta-btn-wrap">
            <Link to={language === 'en' ? '/en/contact' : '/es/contacto'} className="about-cta-btn">
              <EditableText textKey="ad-cta-btn" defaultText="Contáctanos aquí" />
              <span className="cta-arrow-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                  <polyline points="12 5 19 12 12 19"/>
                </svg>
              </span>
            </Link>
          </div>
        </section>

      </main>
    </div>
  );
}

