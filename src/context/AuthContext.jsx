import { createContext, useState, useContext, useEffect } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("app_user") || localStorage.getItem("iot_sesion_activa");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem("app_user");
      }
    }
  }, []);

  const login = (email, password) => {
    // Fictional login, accepting any inputs for public access simulation
    const userData = { email, name: email.split("@")[0] };
    setUser(userData);
    localStorage.setItem("app_user", JSON.stringify(userData));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("app_user");
    localStorage.removeItem("iot_sesion_activa");
    localStorage.removeItem("iot_token_seguro");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoggedIn: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
