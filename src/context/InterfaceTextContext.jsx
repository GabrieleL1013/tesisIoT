import { API_BASE_URL, fetchWithAuth, fetchDeduplicated } from "../config/api";
import { createContext, useState, useContext, useEffect, useMemo } from "react";
import { getUrlLanguage } from "../utils/routeMapping";

const InterfaceTextContext = createContext();

/**
 * Returns the current URL path for matching against app_interfaces path_es/path_en.
 */
function getCurrentPath() {
  return window.location.pathname;
}

export function InterfaceTextProvider({ children }) {
  const [allTexts, setAllTexts] = useState(() => {
    try {
      const esSaved = localStorage.getItem("cached_interface_texts_es");
      const enSaved = localStorage.getItem("cached_interface_texts_en");
      return {
        es: esSaved ? JSON.parse(esSaved) : {},
        en: enSaved ? JSON.parse(enSaved) : {}
      };
    } catch {
      return { es: {}, en: {} };
    }
  });

  const [loading, setLoading] = useState(() => {
    return Object.keys(allTexts.es || {}).length === 0 && Object.keys(allTexts.en || {}).length === 0;
  });

  const [editMode, setEditMode] = useState(false);
  const [currentUrlLang, setCurrentUrlLang] = useState(() => getUrlLanguage());

  const fetchTexts = (forceLoadingScreen = false) => {
    if (forceLoadingScreen) {
      setTimeout(() => setLoading(true), 0);
    }
    const currentPath = getCurrentPath();
    const activeLang = getUrlLanguage();
    const startTime = Date.now();

    // Consultar dinámicamente solo el idioma activo y la ruta para aligerar la carga de la red
    const langUrl = `${API_BASE_URL}/interface-texts?lang=${activeLang}&path=${encodeURIComponent(currentPath)}`;

    fetchDeduplicated(langUrl)
      .then((res) => (res.ok ? res.json() : {}))
      .then((langData) => {
        const sanitized = Array.isArray(langData) ? {} : (langData || {});

        setAllTexts((prev) => {
          const updated = {
            ...prev,
            [activeLang]: { ...(prev[activeLang] || {}), ...sanitized }
          };
          try {
            localStorage.setItem(`cached_interface_texts_${activeLang}`, JSON.stringify(updated[activeLang]));
          } catch (e) {
            console.warn("No se pudo guardar en localStorage", e);
          }
          return updated;
        });

        const finishLoading = () => setLoading(false);
        if (forceLoadingScreen) {
          const elapsed = Date.now() - startTime;
          const delay = Math.max(0, 500 - elapsed);
          setTimeout(finishLoading, delay);
        } else {
          finishLoading();
        }
      })
      .catch((err) => {
        console.error("Error al cargar textos dinámicos de la interfaz:", err);
        // Do not set loading to false here, keep loading screen if backend is down
      });
  };

  useEffect(() => {
    fetchTexts();

    const handleLocationChange = () => {
      setCurrentUrlLang(getUrlLanguage());
      fetchTexts(true);
    };

    window.addEventListener("popstate", handleLocationChange);
    window.addEventListener("languageChanged", handleLocationChange);
    return () => {
      window.removeEventListener("popstate", handleLocationChange);
      window.removeEventListener("languageChanged", handleLocationChange);
    };
  }, []);

  const texts = useMemo(() => {
    const activeLang = getUrlLanguage();
    return allTexts[activeLang] || allTexts.es || {};
  }, [allTexts, currentUrlLang, window.location.pathname]);

  const updateText = async (key, textValue, forcePath = null, autoTranslate = true) => {
    try {
      const activeLang = getUrlLanguage();
      const currentPath = getCurrentPath();
      const pathToSend = forcePath || currentPath;
      const endpoint = `${API_BASE_URL}/interface-texts?lang=${activeLang}`;

      // Actualizar estado de React optimistamente de inmediato para re-renderizado instantáneo en pantalla
      setAllTexts((prev) => ({
        ...prev,
        [activeLang]: {
          ...(prev[activeLang] || {}),
          [key]: textValue
        }
      }));

      const response = await fetchWithAuth(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept-Language": activeLang
        },
        body: JSON.stringify({
          key,
          text: textValue,
          path: pathToSend,
          auto_translate: autoTranslate
        }),
      });

      if (!response.ok) {
        throw new Error("No se pudo actualizar el texto en la base de datos.");
      }

      const resData = await response.json();
      if (resData && resData.key && resData.text !== undefined) {
        setAllTexts((prev) => {
          const updatedLang = {
            ...(prev[activeLang] || {}),
            [resData.key]: resData.text
          };
          try {
            localStorage.setItem(`cached_interface_texts_${activeLang}`, JSON.stringify(updatedLang));
          } catch (e) {}
          return {
            ...prev,
            [activeLang]: updatedLang
          };
        });
      }

      return true;
    } catch (error) {
      console.error("Error actualizando texto de interfaz:", error);
      throw error;
    }
  };

  const toggleEditMode = () => {
    setEditMode((prev) => !prev);
  };

  return (
    <InterfaceTextContext.Provider value={{ texts, updateText, loading, editMode, toggleEditMode, refreshTexts: fetchTexts }}>
      {children}
    </InterfaceTextContext.Provider>
  );
}

export const useInterfaceText = () => {
  const context = useContext(InterfaceTextContext);
  if (!context) {
    throw new Error("useInterfaceText debe usarse dentro de un InterfaceTextProvider");
  }
  return context;
};
