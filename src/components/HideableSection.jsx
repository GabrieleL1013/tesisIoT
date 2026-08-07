import React, { useState, useEffect } from 'react';
import { useInterfaceText } from '../context/InterfaceTextContext';
import { useLanguage } from '../context/LanguageContext';
import { checkEditPermission } from '../utils/checkEditPermission';
import Swal from 'sweetalert2';

export default function HideableSection({ sectionKey, children, className = '', id = '', style = {} }) {
  const { texts, updateText, editMode } = useInterfaceText();
  const { language } = useLanguage();
  const isEn = language === 'en';
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    const checkRole = () => {
      checkEditPermission().then(res => setCanEdit(res));
    };
    checkRole();
    window.addEventListener("userProfileUpdated", checkRole);
    window.addEventListener("appInterfacesUpdated", checkRole);
    return () => {
      window.removeEventListener("userProfileUpdated", checkRole);
      window.removeEventListener("appInterfacesUpdated", checkRole);
    };
  }, []);

  const isHidden = texts[`visibility_${sectionKey}`] === 'hidden';

  // If not editMode and hidden, do not render at all (page layout will adjust automatically)
  if (!editMode && isHidden) {
    return null;
  }

  const handleToggleVisibility = async (e) => {
    e.stopPropagation();
    e.preventDefault();

    const action = isHidden 
      ? (isEn ? 'show' : 'mostrar') 
      : (isEn ? 'hide' : 'ocultar');

    const result = await Swal.fire({
      title: isEn 
        ? `Do you want to ${action} this section?` 
        : `¿Desea ${action} esta sección?`,
      text: isHidden 
        ? (isEn ? 'The section will become visible to all public visitors.' : 'La sección volverá a ser visible para todos los visitantes públicos.') 
        : (isEn ? 'The section will only be visible to administrators in Edit Mode.' : 'La sección solo será visible para administradores en Modo Edición.'),
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: isHidden 
        ? (isEn ? 'Yes, show' : 'Sí, mostrar') 
        : (isEn ? 'Yes, hide' : 'Sí, ocultar'),
      cancelButtonText: isEn ? 'Cancel' : 'Cancelar'
    });

    if (result.isConfirmed) {
      const newValue = isHidden ? 'visible' : 'hidden';
      await updateText(`visibility_${sectionKey}`, newValue);
      Swal.fire({
        title: isHidden 
          ? (isEn ? 'Section Visible' : 'Sección Visible') 
          : (isEn ? 'Section Hidden' : 'Sección Ocultada'),
        text: isHidden 
          ? (isEn ? 'The section is now public.' : 'La sección ahora es pública.') 
          : (isEn ? 'The section is now hidden from the public.' : 'La sección se ha ocultado del público.'),
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
    }
  };

  return (
    <div 
      id={id}
      className={`hideable-section-container ${isHidden ? 'section-hidden-admin' : ''} ${className}`}
      style={{
        ...style,
        position: 'relative',
        transition: 'all 0.3s ease',
        ...(isHidden && editMode ? {
          opacity: 0.5,
          outline: '2.5px dashed #ef4444',
          outlineOffset: '-4px',
          paddingTop: '50px',
          backgroundColor: 'rgba(239, 68, 68, 0.05)',
          minHeight: '120px'
        } : {})
      }}
    >
      {/* Visibility control badge overlay visible only in Edit Mode for authorized user */}
      {canEdit && editMode && (
        <div style={{
          position: 'absolute',
          top: '15px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 100,
          display: 'flex',
          gap: '8px',
          alignItems: 'center'
        }}>
          <button
            onClick={handleToggleVisibility}
            type="button"
            style={{
              padding: '8px 16px',
              borderRadius: '25px',
              backgroundColor: isHidden ? '#ef4444' : '#3b82f6',
              color: '#ffffff',
              border: 'none',
              fontWeight: '800',
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
              transition: 'all 0.25s ease',
              fontFamily: "'Plus Jakarta Sans', sans-serif"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
            }}
          >
            {isHidden ? (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="14" height="14">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                {isEn ? 'Show Section' : 'Mostrar Sección'}
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="14" height="14">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
                {isEn ? 'Hide Section' : 'Ocultar Sección'}
              </>
            )}
          </button>
        </div>
      )}
      {children}
    </div>
  );
}
