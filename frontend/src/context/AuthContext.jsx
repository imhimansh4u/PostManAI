"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { getCurrentUser, logoutUser } from "@/app/lib/authApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in on page load
  useEffect(() => {
    getCurrentUser()
      .then((data) => setUser(data.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const logout = async () => {
    await logoutUser();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth anywhere
export const useAuth = () => useContext(AuthContext);
