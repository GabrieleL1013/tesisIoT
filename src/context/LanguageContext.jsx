import { createContext, useState, useContext, useEffect } from "react";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";
import { getUrlLanguage, getEquivalentRoute } from "../utils/routeMapping";
import { API_BASE_URL } from "../config/api";

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const { t: i18nT } = useTranslation();
  const [language, setLanguageState] = useState(() => getUrlLanguage());
  const [isContentLoading, setIsContentLoading] = useState(false);

  // Sincronizar i18next y html lang attribute con el idioma detectado en la URL
  useEffect(() => {
    const currentUrlLang = getUrlLanguage();
    if (currentUrlLang !== language) {
      setLanguageState(currentUrlLang);
    }
    i18n.changeLanguage(currentUrlLang);
    document.documentElement.setAttribute("lang", currentUrlLang);
  }, [language]);

  /**
   * Cambiar idioma y navegar a la versión mapeada equivalente en la URL
   */
  const changeLanguage = async (targetLang) => {
    if (targetLang !== "es" && targetLang !== "en") return;

    setLanguageState(targetLang);
    i18n.changeLanguage(targetLang);
    document.documentElement.setAttribute("lang", targetLang);
    localStorage.setItem("app_lang", targetLang);

    const currentPath = window.location.pathname;
    const currentSearch = window.location.search;
    let targetPath = getEquivalentRoute(currentPath, targetLang);

    if (currentSearch) {
      const searchParams = new URLSearchParams(currentSearch);
      const cat = searchParams.get('categoria');
      if (cat) {
        try {
          const res = await fetch(`${API_BASE_URL}/categorias`);
          const catData = await res.json();
          if (Array.isArray(catData)) {
            const catNorm = cat.toLowerCase().trim();
            const found = catData.find(c =>
              (c.nombre && c.nombre.toLowerCase().trim() === catNorm) ||
              (c.nombre_es && c.nombre_es.toLowerCase().trim() === catNorm) ||
              (c.nombre_en && c.nombre_en.toLowerCase().trim() === catNorm)
            );
            if (found) {
              const canonicalName = targetLang === 'en'
                ? (found.nombre_en || found.nombre_es || found.nombre)
                : (found.nombre_es || found.nombre || found.nombre_en);
              if (canonicalName) {
                searchParams.set('categoria', canonicalName);
              }
            }
          }
        } catch (e) {
          console.error("Error fetching dynamic category translation:", e);
        }
      }
      targetPath += '?' + searchParams.toString();
    }

    window.dispatchEvent(new CustomEvent("languageChanged", { detail: targetLang }));

    window.location.href = targetPath;
  };

  /**
   * Función t(key) que consulta i18next y retorna la traducción o la clave fallback
   */
  const t = (key, fallback) => {
    const translated = i18nT(key);
    if (translated && translated !== key) {
      return translated;
    }
    return fallback !== undefined ? fallback : key;
  };

  const triggerContentLoading = (customDelay) => {
    setIsContentLoading(true);
    const delay = customDelay || (language === "en" ? 400 : 300);
    setTimeout(() => {
      setIsContentLoading(false);
    }, delay);
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage: changeLanguage,
        t,
        isContentLoading,
        setIsContentLoading,
        triggerContentLoading
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage debe usarse dentro de un LanguageProvider");
  }
  return context;
};
