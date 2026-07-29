import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import "../styles/AcercaDe.css";
import EditableText from "../components/EditableText";
import EditableImage from "../components/EditableImage";
import { useInterfaceText } from "../context/InterfaceTextContext";
import { checkEditPermission } from "../utils/checkEditPermission";

import LogoIoTDark from "../assets/uleam_iot_oscuro.svg";
import ArchitectureImg from "../assets/architecture_iotuleam.jpeg";
import WZamoraImg from "../assets/wzamora.png";
import MMachucaImg from "../assets/mikemachuca.jpeg";
import EToalaImg from "../assets/erick.jpeg";

// ── Social Icons Map ──
const SocialIcons = {
  web: (
    <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="20" width="20">
      <circle cx="12" cy="12" r="9"></circle>
      <line x1="3.6" y1="9" x2="20.4" y2="9"></line>
      <line x1="3.6" y1="15" x2="20.4" y2="15"></line>
      <path d="M11.5 3a17 17 0 0 0 0 18"></path>
      <path d="M12.5 3a17 17 0 0 1 0 18"></path>
    </svg>
  ),
  github: (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 496 512" height="20" width="20">
      <path d="M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3.3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5.3-6.2 2.3zm44.2-1.7c-2.9.7-4.9 2.6-4.6 4.9.3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3.7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3.3 2.9 2.3 3.9 1.6 1 3.6.7 4.3-.7.7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3.7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3.7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z"></path>
    </svg>
  ),
  facebook: (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="20" width="20">
      <path d="M504 256C504 119 393 8 256 8S8 119 8 256c0 123.78 90.69 226.38 209.25 245V327.69h-63V256h63v-54.64c0-62.15 37-96.48 93.67-96.48 27.14 0 55.52 4.84 55.52 4.84v61h-31.28c-30.8 0-40.41 19.12-40.41 38.73V256h68.78l-11 71.69h-57.78V501C413.31 482.38 504 379.78 504 256z"></path>
    </svg>
  ),
  instagram: (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" height="20" width="20">
      <path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"></path>
    </svg>
  ),
  twitter: (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="20" width="20">
      <path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z"></path>
    </svg>
  ),
  linkedin: (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" height="20" width="20">
      <path d="M100.28 448H7.4V148.9h92.88zM53.79 108.1C24.09 108.1 0 83.5 0 53.8a53.79 53.79 0 0 1 107.58 0c0 29.7-24.1 54.3-53.79 54.3zM447.9 448h-92.68V302.4c0-34.7-.7-79.2-48.29-79.2-48.3 0-55.7 37.7-55.7 76.7V448h-92.78V148.9h89.08v40.8h1.3c12.4-23.5 42.7-48.3 87.9-48.3 94 0 111.3 61.9 111.3 142.3V448z"></path>
    </svg>
  ),
  youtube: (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 576 512" height="20" width="20">
      <path d="M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.78 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305zm-317.51 213.508V175.185l142.739 81.205-142.739 81.201z"></path>
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
      <div className="dev-social-row" style={{ alignItems: "center", minHeight: "28px", marginTop: "8px" }}>
        {activeKeys.map((key) => (
          <a
            key={key}
            href={currentData[key]}
            target="_blank"
            rel="noopener noreferrer"
            className="dev-social-link"
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
                ✕
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
                  {saving ? "Guardando…" : "💾 Guardar Redes"}
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
const DEFAULT_TEACHERS = [
  "Robert Wilfrido Moreira Centeno",
  "Edison Ernesto Almeida Zambrano",
  "Oscar Armando González López",
  "Luis Jacinto Mendoza Cuzme",
  "Henry Neurio Mero Briones",
];

const DEFAULT_COLLABS = [
  { name: "Carlos Tavares Calafate", link: "https://grc.webs.upv.es/members/calafate/" },
  { name: "Pietro Manzoni", link: "https://pmanzoni.notion.site/" },
];

const DEFAULT_STUDENTS = [
  "Joseline Malena Cedeño Rivera",
  "Stefany Michelle Alonzo Merizaldes",
  "Tomy Arnol Anchundia Triviño",
  "Luis Alfredo Sánchez Briones",
  "Edwin Dennis Rivadeniera Salvatierra",
];

const DEFAULT_INTERNS = [
  "Rómulo Manuel Palacios Rivas",
  "Anthony Adrian Zamora Villaruel",
];

export default function AcercaDe() {
  const { texts, updateText, editMode } = useInterfaceText();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    document.title = "IoT ULEAM - Investigación Multidisciplinaria con IoT e IA";
  }, []);

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
  const leadsCount    = parseInt(texts["ad-leads-count"]    || "2", 10);
  const devsCount     = parseInt(texts["ad-devs-count"]     || "1", 10);
  const teachersCount = parseInt(texts["ad-teachers-count"] || "5", 10);
  const collabsCount  = parseInt(texts["ad-collabs-count"]  || "2", 10);
  const studentsCount = parseInt(texts["ad-students-count"] || "5", 10);
  const internsCount  = parseInt(texts["ad-interns-count"]  || "2", 10);

  // Add a new member to a category
  const handleAddMember = async (countKey, currentCount, defaultText, keyPrefix) => {
    const newCount = currentCount + 1;
    const newKey = `${keyPrefix}${newCount}`;
    await updateText(newKey, `${defaultText} ${newCount}`);
    await updateText(countKey, String(newCount));
    Swal.fire({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 2000,
      icon: 'success',
      title: 'Integrante añadido'
    });
  };

  // Remove a member from a category at a specific index
  const handleRemoveMember = async (countKey, currentCount, removeIndex, keyPrefix) => {
    if (currentCount <= 1) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000,
        icon: 'warning',
        title: 'Debe haber al menos 1 integrante en esta sección'
      });
      return;
    }

    const res = await Swal.fire({
      title: '¿Eliminar integrante?',
      text: 'Se removerá este integrante de la lista.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b'
    });

    if (!res.isConfirmed) return;

    // Shift keys down if removing from middle
    for (let i = removeIndex; i < currentCount; i++) {
      const nextKey = `${keyPrefix}${i + 1}`;
      const curKey = `${keyPrefix}${i}`;
      if (texts[nextKey] !== undefined) {
        await updateText(curKey, texts[nextKey]);
      }
    }

    await updateText(countKey, String(currentCount - 1));
    Swal.fire({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 2000,
      icon: 'info',
      title: 'Integrante eliminado'
    });
  };

  return (
    <div className="about-page">
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
              <EditableText textKey="ad-main-title" defaultText="Acerca de IoT ULEAM" />
            </h1>
            <p className="about-subtitle-main">
              <EditableText textKey="ad-main-subtitle" defaultText="Plataforma de Investigación Multidisciplinaria con IoT" />
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
              defaultText="IoT ULEAM es una plataforma desarrollada por estudiantes y docentes de la Universidad Laica Eloy Alfaro de Manabí, enfocada en la investigación multidisciplinaria mediante el uso de sensores inteligentes, redes inalámbricas y análisis de datos. Su objetivo es integrar áreas como ingeniería, salud, medio ambiente y educación a través de tecnologías IoT."
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
                <EditableText textKey="ad-tech-1" defaultText="Next.js" />
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
                <EditableText textKey="ad-tech-2" defaultText="Django" />
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
                <EditableText textKey="ad-tech-3" defaultText="PostgreSQL" />
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
                <EditableText textKey="ad-tech-4" defaultText="SCRUM" />
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
                <EditableText textKey="ad-tech-5" defaultText="Sensores IoT" />
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
                wrapperStyle={{ minHeight: '300px', borderRadius: '10px' }}
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
              <EditableText textKey="ad-obj-item1" defaultText="Desarrollar una plataforma web para la adquisición y análisis de datos en tiempo real." />
            </li>
            <li>
              <EditableText textKey="ad-obj-item2" defaultText="Facilitar la investigación multidisciplinaria mediante el uso de tecnologías IoT e IA." />
            </li>
            <li>
              <EditableText textKey="ad-obj-item3" defaultText="Promover la colaboración entre estudiantes, docentes e investigadores en diversas áreas del conocimiento." />
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
                    <EditableText textKey="ad-feat-1" defaultText="Integración de sensores IoT para la captura de datos ambientales." />
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
                    <EditableText textKey="ad-feat-2" defaultText="Presenta los datos con gráficos dinámicos y mapas interactivos." />
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
                    <EditableText textKey="ad-feat-3" defaultText="Muestra la ubicación de los sensores con un resumen de los datos." />
                  </p>
                </div>

                <div className="info-item-row">
                  <span className="info-item-icon">
                    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" height="1em" width="1em">
                      <path d="M448 73.143v45.714C448 159.143 347.667 192 224 192S0 159.143 0 118.857V73.143C0 32.857 100.333 0 224 0s224 32.857 224 73.143zM448 176v102.857C448 319.143 347.667 352 224 352S0 319.143 0 278.857V176c48.125 33.143 136.208 48.572 224 48.572S399.874 209.143 448 176zm0 160v102.857C448 479.143 347.667 512 224 512S0 479.143 0 438.857V336c48.125 33.143 136.208 48.572 224 48.572S399.874 369.143 448 336z"></path>
                    </svg>
                  </span>
                  <p className="info-item-text">
                    <EditableText textKey="ad-feat-4" defaultText="Procesamiento y almacenamiento de datos en una base de datos organizada por tiempo y ubicación." />
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
                    <EditableText textKey="ad-method-1" defaultText="Ágil (Scrum)." />
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
                    <EditableText textKey="ad-method-2" defaultText="Levantamiento de requerimientos, desarrollo, pruebas y despliegue." />
                  </p>
                </div>

                <div className="info-item-row">
                  <span className="info-item-icon">
                    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" version="1.1" viewBox="0 0 32 32" height="1em" width="1em">
                      <path d="M20.649 21.349c0.064 0.004 0.133 0.012 0.202 0.012 0.977 0.001 1.955-0.005 2.932 0.005 0.214 0.002 0.278-0.071 0.267-0.276-0.014-0.267-0.003-0.535-0.003-0.865 1.109 0.816 2.181 1.604 3.281 2.414-1.092 0.804-2.164 1.593-3.281 2.416 0-0.311 0-0.568-0-0.825-0-0.332-0-0.333-0.323-0.333-6.247 0-12.495 0-18.742 0-0.302 0-0.302-0-0.302-0.304 0-0.659 0.009-1.318-0.005-1.976-0.005-0.214 0.064-0.262 0.269-0.261 3.359 0.006 6.718 0.011 10.077 0.002 1.722-0.005 3.081-0.718 3.98-2.202 1.622-2.68-0.069-6.19-3.177-6.642-2.4-0.349-4.631 1.262-5.038 3.703-0.043 0.254-0.046 0.515-0.071 0.821 0.393-0.053 0.749-0.102 1.152-0.156-0.631 1.22-1.24 2.398-1.858 3.592-0.947-0.976-1.88-1.937-2.792-2.877 0.229-0.038 0.533-0.082 0.834-0.145 0.057-0.012 0.141-0.104 0.139-0.157-0.017-0.639 0.027-1.271 0.152-1.898 0.004-0.019-0.005-0.041-0.011-0.078-0.61-0.104-1.176-0.324-1.689-0.678-1.254-0.868-1.91-2.483-1.602-3.955 0.335-1.604 1.545-2.803 3.109-3.099 1.014-0.191 1.954-0.009 2.827 0.527 0.154 0.095 0.248 0.109 0.349-0.056 0.059-0.097 0.148-0.175 0.25-0.293 0.127 0.512 0.246 0.991 0.364 1.47 0.040 0.161 0.071 0.325 0.118 0.484 0.051 0.172-0.001 0.249-0.183 0.237-0.526-0.036-1.053-0.068-1.579-0.103-0.13-0.009-0.259-0.023-0.426-0.039 0.13-0.164 0.248-0.311 0.377-0.472-0.284-0.216-0.597-0.324-0.923-0.377-1.576-0.258-2.965 0.953-2.933 2.548 0.024 1.224 1.056 2.318 2.275 2.422 0.158 0.013 0.213-0.067 0.274-0.185 0.864-1.658 2.165-2.83 3.935-3.44 4.095-1.412 8.37 1.118 9.159 5.259 0.389 2.039-0.054 3.901-1.291 5.57-0.034 0.046-0.065 0.095-0.095 0.144-0.006 0.009 0.002 0.027 0.007 0.065z"></path>
                    </svg>
                  </span>
                  <p className="info-item-text">
                    <EditableText textKey="ad-method-3" defaultText="Ciclos iterativos con revisiones continuas" />
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
                const isFirst = i === 1;
                const isSecond = i === 2;
                const defaultPhoto = isFirst ? WZamoraImg : isSecond ? MMachucaImg : WZamoraImg;
                const defaultName  = isFirst ? "Willian Zamora" : isSecond ? "Mike Machuca" : `Líder ${i}`;
                const defaultRole  = isFirst ? "Líder de Proyecto" : isSecond ? "Co-Líder del Proyecto" : "Líder de Proyecto";
                const defaultEmail = isFirst ? "willian.zamora@uleam.edu.ec" : isSecond ? "mike.machuca@uleam.edu.ec" : "correo@uleam.edu.ec";
                const defaultLink  = isFirst ? "https://sites.google.com/view/willianzamora/home" : isSecond ? "https://sites.google.com/view/mike-machuca-avalos" : undefined;

                return (
                  <div className="lead-card" key={`lead-${i}`} style={{ position: "relative" }}>
                    {canEdit && leadsCount > 1 && (
                      <button
                        type="button"
                        className="card-delete-btn"
                        title="Eliminar este líder"
                        onClick={() => handleRemoveMember('ad-leads-count', leadsCount, i, 'ad-lead-name-')}
                      >
                        ✕
                      </button>
                    )}
                    <div className="lead-avatar-wrapper">
                      <EditableImage
                        imageKey={`ad-lead${i}-photo`}
                        defaultSrc={defaultPhoto}
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
                      {defaultLink ? (
                        <a href={defaultLink} target="_blank" rel="noopener noreferrer" className="lead-name-link">
                          <EditableText textKey={`ad-lead${i}-name`} defaultText={defaultName} />
                        </a>
                      ) : (
                        <span className="lead-name-link">
                          <EditableText textKey={`ad-lead${i}-name`} defaultText={defaultName} />
                        </span>
                      )}
                      <p className="lead-role">
                        <EditableText textKey={`ad-lead${i}-role`} defaultText={defaultRole} />
                      </p>
                      <p className="lead-email">
                        <EditableText textKey={`ad-lead${i}-email`} defaultText={defaultEmail} />
                      </p>

                      {/* Redes Sociales del Líder */}
                      <EditableSocials
                        textKey={`ad-lead${i}-socials`}
                        defaultData={defaultLink ? { web: defaultLink } : {}}
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
                  onClick={() => handleAddMember("ad-leads-count", leadsCount, "Nuevo Líder", "ad-lead-name-")}
                >
                  +
                </button>
              </div>
            )}
          </div>

          {/* Estudiante a cargo del desarrollo */}
          <div className="about-dev-section">
            <h3 className="about-dev-section-title">
              <EditableText textKey="ad-dev-header" defaultText="Estudiante a cargo del desarrollo de la plataforma" />
            </h3>
            <div className="about-dev-cards-grid">
              {Array.from({ length: devsCount }).map((_, idx) => {
                const i = idx + 1;
                const isFirst = i === 1;
                const defaultPhoto = isFirst ? EToalaImg : EToalaImg;
                const defaultName  = isFirst ? "Erick Alexander Toala Intriago" : `Desarrollador ${i}`;
                const defaultRole  = isFirst ? "Desarrollador Full Stack" : "Desarrollador";
                const defaultEmail = isFirst ? "e0803413111@live.uleam.edu.ec" : "correo@uleam.edu.ec";
                const defaultBio   = isFirst ? "Desarrollador de la plataforma web. Encargado de todo el sistema backend con Django REST y la interfaz frontend con Next.js." : "Descripción del desarrollador...";
                const defaultDevSocials = isFirst ? {
                  web: "https://erick-dev-zeta.vercel.app/",
                  github: "https://github.com/Erick-Toala",
                  facebook: "https://www.facebook.com/erick.toala.92",
                  instagram: "https://www.instagram.com/toalaerick56/"
                } : {};

                return (
                  <div className="dev-card" key={`dev-${i}`} style={{ position: "relative" }}>
                    {canEdit && devsCount > 1 && (
                      <button
                        type="button"
                        className="card-delete-btn"
                        title="Eliminar este desarrollador"
                        onClick={() => handleRemoveMember('ad-devs-count', devsCount, i, 'ad-dev-name-')}
                      >
                        ✕
                      </button>
                    )}
                    <div className="dev-avatar-wrapper">
                      <EditableImage
                        imageKey={isFirst ? "ad-dev-photo" : `ad-dev${i}-photo`}
                        defaultSrc={defaultPhoto}
                        alt={defaultName}
                        className="dev-avatar-img"
                        wrapperStyle={{ width: '100%', height: '100%', borderRadius: '50%' }}
                        recommendedWidth={200}
                        recommendedHeight={200}
                        hint={`Foto de perfil del estudiante desarrollador ${i}.`}
                        circular={true}
                      />
                    </div>
                    <h3 className="dev-name">
                      <EditableText textKey={isFirst ? "ad-dev-name" : `ad-dev${i}-name`} defaultText={defaultName} />
                    </h3>
                    <p className="dev-role">
                      <EditableText textKey={isFirst ? "ad-dev-role" : `ad-dev${i}-role`} defaultText={defaultRole} />
                    </p>
                    <p className="dev-email">
                      <EditableText textKey={isFirst ? "ad-dev-email" : `ad-dev${i}-email`} defaultText={defaultEmail} />
                    </p>
                    <p className="dev-bio">
                      <EditableText 
                        textKey={isFirst ? "ad-dev-bio" : `ad-dev${i}-bio`} 
                        defaultText={defaultBio} 
                        isTextArea={true} 
                      />
                    </p>
                    
                    {/* Redes Sociales del Desarrollador */}
                    <EditableSocials
                      textKey={isFirst ? "ad-dev-socials" : `ad-dev${i}-socials`}
                      defaultData={defaultDevSocials}
                      canEdit={canEdit}
                    />
                  </div>
                );
              })}
            </div>
            {canEdit && (
              <button
                type="button"
                className="add-member-btn"
                title="Añadir desarrollador"
                onClick={() => handleAddMember("ad-devs-count", devsCount, "Nuevo Desarrollador", "ad-dev-name-")}
              >
                +
              </button>
            )}
          </div>

          {/* Miembros en Categorías / Chips */}
          <div className="about-members-group">
            
            {/* Docentes */}
            <div className="members-category-box">
              <h3 className="members-category-title">
                <EditableText textKey="ad-teachers-title" defaultText="Docentes del grupo de investigación" />
              </h3>
              <div className="members-chips-wrap">
                {Array.from({ length: teachersCount }).map((_, idx) => {
                  const i = idx + 1;
                  const defaultName = DEFAULT_TEACHERS[idx] || `Docente ${i}`;
                  return (
                    <span className="chip-wrapper-editable" key={`teacher-${i}`}>
                      <span className="member-chip">
                        <EditableText textKey={`ad-teacher${i}`} defaultText={defaultName} />
                      </span>
                      {canEdit && teachersCount > 1 && (
                        <button
                          type="button"
                          className="chip-delete-btn"
                          title="Eliminar este docente"
                          onClick={() => handleRemoveMember("ad-teachers-count", teachersCount, i, "ad-teacher")}
                        >
                          ✕
                        </button>
                      )}
                    </span>
                  );
                })}
              </div>
              {canEdit && (
                <button
                  type="button"
                  className="add-member-btn"
                  title="Añadir docente"
                  onClick={() => handleAddMember("ad-teachers-count", teachersCount, "Nuevo docente", "ad-teacher")}
                >
                  +
                </button>
              )}
            </div>

            {/* Colaboradores externos */}
            <div className="members-category-box">
              <h3 className="members-category-title">
                <EditableText textKey="ad-collab-title" defaultText="Colaboradores externos" />
              </h3>
              <div className="members-chips-wrap">
                {Array.from({ length: collabsCount }).map((_, idx) => {
                  const i = idx + 1;
                  const item = DEFAULT_COLLABS[idx];
                  const defaultName = item ? item.name : `Colaborador ${i}`;
                  const link = item ? item.link : undefined;

                  return (
                    <span className="chip-wrapper-editable" key={`collab-${i}`}>
                      {link ? (
                        <a href={link} target="_blank" rel="noopener noreferrer" className="member-chip member-chip-link">
                          <EditableText textKey={`ad-collab${i}`} defaultText={defaultName} />
                        </a>
                      ) : (
                        <span className="member-chip">
                          <EditableText textKey={`ad-collab${i}`} defaultText={defaultName} />
                        </span>
                      )}
                      {canEdit && collabsCount > 1 && (
                        <button
                          type="button"
                          className="chip-delete-btn"
                          title="Eliminar este colaborador"
                          onClick={() => handleRemoveMember("ad-collabs-count", collabsCount, i, "ad-collab")}
                        >
                          ✕
                        </button>
                      )}
                    </span>
                  );
                })}
              </div>
              {canEdit && (
                <button
                  type="button"
                  className="add-member-btn"
                  title="Añadir colaborador"
                  onClick={() => handleAddMember("ad-collabs-count", collabsCount, "Nuevo colaborador", "ad-collab")}
                >
                  +
                </button>
              )}
            </div>

            {/* Estudiantes */}
            <div className="members-category-box">
              <h3 className="members-category-title">
                <EditableText textKey="ad-students-title" defaultText="Estudiantes" />
              </h3>
              <div className="members-chips-wrap">
                {Array.from({ length: studentsCount }).map((_, idx) => {
                  const i = idx + 1;
                  const defaultName = DEFAULT_STUDENTS[idx] || `Estudiante ${i}`;
                  return (
                    <span className="chip-wrapper-editable" key={`student-${i}`}>
                      <span className="member-chip">
                        <EditableText textKey={`ad-student${i}`} defaultText={defaultName} />
                      </span>
                      {canEdit && studentsCount > 1 && (
                        <button
                          type="button"
                          className="chip-delete-btn"
                          title="Eliminar este estudiante"
                          onClick={() => handleRemoveMember("ad-students-count", studentsCount, i, "ad-student")}
                        >
                          ✕
                        </button>
                      )}
                    </span>
                  );
                })}
              </div>
              {canEdit && (
                <button
                  type="button"
                  className="add-member-btn"
                  title="Añadir estudiante"
                  onClick={() => handleAddMember("ad-students-count", studentsCount, "Nuevo estudiante", "ad-student")}
                >
                  +
                </button>
              )}
            </div>

            {/* Estudiantes de prácticas profesionales */}
            <div className="members-category-box">
              <h3 className="members-category-title">
                <EditableText textKey="ad-interns-title" defaultText="Estudiantes de prácticas profesionales" />
              </h3>
              <div className="members-chips-wrap">
                {Array.from({ length: internsCount }).map((_, idx) => {
                  const i = idx + 1;
                  const defaultName = DEFAULT_INTERNS[idx] || `Practicante ${i}`;
                  return (
                    <span className="chip-wrapper-editable" key={`intern-${i}`}>
                      <span className="member-chip">
                        <EditableText textKey={`ad-intern${i}`} defaultText={defaultName} />
                      </span>
                      {canEdit && internsCount > 1 && (
                        <button
                          type="button"
                          className="chip-delete-btn"
                          title="Eliminar este practicante"
                          onClick={() => handleRemoveMember("ad-interns-count", internsCount, i, "ad-intern")}
                        >
                          ✕
                        </button>
                      )}
                    </span>
                  );
                })}
              </div>
              {canEdit && (
                <button
                  type="button"
                  className="add-member-btn"
                  title="Añadir practicante"
                  onClick={() => handleAddMember("ad-interns-count", internsCount, "Nuevo practicante", "ad-intern")}
                >
                  +
                </button>
              )}
            </div>

          </div>

        </section>

        {/* ── ¿QUIERES SABER MÁS? ── */}
        <section className="about-cta-section">
          <h4 className="about-cta-title">
            <EditableText textKey="ad-cta-title" defaultText="¿Quieres saber más?" />
          </h4>
          <div className="about-cta-btn-wrap">
            <Link to="/contacto" className="about-cta-btn">
              <EditableText textKey="ad-cta-btn" defaultText="Contáctanos" />
            </Link>
          </div>
        </section>

      </main>
    </div>
  );
}
