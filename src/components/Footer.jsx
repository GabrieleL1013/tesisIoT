import React, { useState, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useInterfaceText } from "../context/InterfaceTextContext";
import { checkEditPermission } from "../utils/checkEditPermission";
import EditableText from "./EditableText";
import EditableImage from "./EditableImage";
import Swal from "sweetalert2";
import Logo2 from "../assets/LOGO.png";
import "../styles/components/Footer.css";

const FacebookIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const TwitterXIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const YoutubeIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const GithubIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
  </svg>
);

const MailIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
    <rect x="2" y="4" width="20" height="16" rx="2"></rect>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
  </svg>
);

const ChevronUpIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="18 15 12 9 6 15"></polyline>
  </svg>
);

export default function Footer() {
  const { texts, updateText, editMode } = useInterfaceText();
  const { language } = useLanguage();
  const isEn = language === 'en';
  const [hasPermission, setHasPermission] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    checkEditPermission().then(res => setHasPermission(res));
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 250) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleEditSocialLinks = async () => {
    const permitted = await checkEditPermission();
    if (!permitted) {
      Swal.fire({
        title: isEn ? "Permission Denied" : "Permiso Denegado",
        text: isEn 
          ? "You do not have the required permissions to edit this content." 
          : "No cumples con el permiso requerido para editar este contenido.",
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

    const fbHide = texts['footer_social_facebook_hide'] === "1";
    const twHide = texts['footer_social_twitter_hide'] === "1";
    const ytHide = texts['footer_social_youtube_hide'] === "1";
    const ghHide = texts['footer_social_github_hide'] === "1";

    const hideLabel = isEn ? "Hide in Footer" : "Ocultar en Footer";

    const { value: formValues } = await Swal.fire({
      title: isEn ? 'Edit Footer Social Media Links' : 'Editar Redes Sociales del Footer',
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
        updateText('footer_social_facebook_hide', formValues.facebook_hide, '/global'),

        updateText('contacto_social_twitter', formValues.twitter, '/global'),
        updateText('footer_social_twitter_hide', formValues.twitter_hide, '/global'),

        updateText('contacto_social_youtube', formValues.youtube, '/global'),
        updateText('footer_social_youtube_hide', formValues.youtube_hide, '/global'),

        updateText('contacto_social_github', formValues.github, '/global'),
        updateText('footer_social_github_hide', formValues.github_hide, '/global'),
      ]).catch(err => console.error("Error al guardar redes sociales:", err));
    }
  };

  const fbUrl = texts['contacto_social_facebook'] ?? "https://facebook.com/UleamEc";
  const twUrl = texts['contacto_social_twitter'] ?? "https://twitter.com/UleamEc";
  const ytUrl = texts['contacto_social_youtube'] ?? "https://youtube.com";
  const ghUrl = texts['contacto_social_github'] ?? "https://github.com";

  const showFb = fbUrl.trim() !== '' && texts['footer_social_facebook_hide'] !== "1";
  const showTw = twUrl.trim() !== '' && texts['footer_social_twitter_hide'] !== "1";
  const showYt = ytUrl.trim() !== '' && texts['footer_social_youtube_hide'] !== "1";
  const showGh = ghUrl.trim() !== '' && texts['footer_social_github_hide'] !== "1";

  const emailVal = texts['footer_email_value'] || "incidencias.diit@uleam.edu.ec";
  const emailLabel = isEn ? "Email : " : "Correo electrónico : ";

  return (
    <>
      <footer className="portal-footer">
        <div className="footer-container">
          
          {/* Columna 1: Logo Institucional */}
          <div className="footer-brand-col">
            <EditableImage
              imageKey="footer_logo_primary"
              defaultSrc={Logo2}
              alt="ULEAM Logo"
              className="footer-logo-img"
              recommendedWidth={260}
              recommendedHeight={80}
              hint={isEn ? "Institutional ULEAM logo in footer." : "Logo institucional ULEAM en el pie de página."}
            />
          </div>

          {/* Columna 2: Contacta */}
          <div className="footer-contact-col">
            <h3 className="footer-col-title-red">
              <EditableText textKey="footer_contact_title" defaultText={isEn ? "Contact" : "Contacta"} forcePath="/global" />
            </h3>
            <p className="footer-address-text">
              <EditableText textKey="footer_address_val" defaultText="Av. Circunvalación Vía a San Mateo" forcePath="/global" />
            </p>
            <div className="footer-email-row">
              <MailIcon />
              <span>{emailLabel}</span>
              <a href={`mailto:${emailVal}`}>
                <EditableText textKey="footer_email_value" defaultText="incidencias.diit@uleam.edu.ec" forcePath="/global" />
              </a>
            </div>
          </div>

          {/* Columna 3: Síguenos */}
          <div className="footer-social-col">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 className="footer-col-title-red" style={{ margin: 0 }}>
                <EditableText textKey="footer_social_title" defaultText={isEn ? "Follow Us" : "Síguenos"} forcePath="/global" />
              </h3>
              {editMode && hasPermission && (
                <button
                  type="button"
                  onClick={handleEditSocialLinks}
                  className="btn-edit-social-footer"
                  title={isEn ? "Edit / Hide Footer Social Links" : "Editar / Ocultar Redes Sociales en Footer"}
                >
                  ✏️
                </button>
              )}
            </div>

            <div className="footer-social-boxes" style={{ marginTop: '0.6rem' }}>
              {showFb && (
                <a href={fbUrl} target="_blank" rel="noopener noreferrer" className="social-box facebook-box" title="Facebook">
                  <FacebookIcon />
                </a>
              )}
              {showTw && (
                <a href={twUrl} target="_blank" rel="noopener noreferrer" className="social-box twitter-box" title="X (Twitter)">
                  <TwitterXIcon />
                </a>
              )}
              {showYt && (
                <a href={ytUrl} target="_blank" rel="noopener noreferrer" className="social-box youtube-box" title="YouTube">
                  <YoutubeIcon />
                </a>
              )}
              {showGh && (
                <a href={ghUrl} target="_blank" rel="noopener noreferrer" className="social-box github-box" title="GitHub">
                  <GithubIcon />
                </a>
              )}
            </div>
          </div>

        </div>

        {/* Sub-footer Inferior */}
        <div className="footer-bottom-bar">
          <p>
            {isEn 
              ? "ULEAM © Copyright 2026, All rights reserved - Universidad Laica Eloy Alfaro de Manabí" 
              : "ULEAM © Copyright 2026, Todos los derechos reservados - Universidad Laica Eloy Alfaro de Manabí"}
          </p>
        </div>
      </footer>

      {/* Botón Flotante Estático "Volver Arriba" */}
      {showScrollTop && (
        <button
          type="button"
          onClick={scrollToTop}
          className="floating-scroll-top-btn"
          title={isEn ? "Scroll to top" : "Volver arriba"}
          aria-label={isEn ? "Scroll to top" : "Volver arriba"}
        >
          <ChevronUpIcon />
        </button>
      )}
    </>
  );
}