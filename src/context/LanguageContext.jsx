import { createContext, useState, useContext, useEffect } from "react";

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    // 1. Check localStorage first
    const saved = localStorage.getItem("app_lang");
    if (saved) return saved;

    // 2. Check Google Translate cookie
    const match = document.cookie.match(/googtrans=\/(?:es|auto)\/([^;]+)/);
    if (match && match[1]) {
      return match[1];
    }

    // 3. Default to English ("en") if no saved preference
    return "en";
  });

  const applyGoogleTranslateCookie = (lang) => {
    const cookieDomain = window.location.hostname;
    document.cookie = `googtrans=/es/${lang}; path=/`;
    document.cookie = `googtrans=/es/${lang}; path=/; domain=${cookieDomain}`;
    document.cookie = `googtrans=/es/${lang}; path=/; domain=.${cookieDomain}`;
    
    if (cookieDomain.includes(".")) {
      const parts = cookieDomain.split(".");
      if (parts.length > 2) {
        const rootDomain = parts.slice(-2).join(".");
        document.cookie = `googtrans=/es/${lang}; path=/; domain=.${rootDomain}`;
      }
    }
  };

  useEffect(() => {
    // Ensure localStorage and cookie are synced on mount for first-time visitors or reloads
    const saved = localStorage.getItem("app_lang");
    if (!saved) {
      localStorage.setItem("app_lang", "en");
      applyGoogleTranslateCookie("en");
    } else {
      applyGoogleTranslateCookie(saved);
    }
  }, []);

  const changeLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem("app_lang", lang);
    applyGoogleTranslateCookie(lang);

    // Reload page to let Google Translate translate the page immediately
    window.location.reload();
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
