"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api, { getErrorMessage } from "@/lib/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [business, setBusiness] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data.data.user);
      setBusiness(data.data.business);
      setSubscription(data.data.subscription);
      return data.data;
    } catch (error) {
      setUser(null);
      setBusiness(null);
      setSubscription(null);
      return null;
    }
  }, []);

  useEffect(() => {
    const id = setTimeout(() => {
      if (typeof window !== "undefined" && window.location.pathname.startsWith("/auth/")) {
        setLoading(false);
        return;
      }
      fetchMe().finally(() => setLoading(false));
    }, 0);
    return () => clearTimeout(id);
  }, [fetchMe]);

  const login = async (identifier, password, remember) => {
    const { data } = await api.post("/auth/login", {
      email: identifier.includes("@") ? identifier : undefined,
      phone: identifier.includes("@") ? undefined : identifier,
      password,
      remember,
    });
    const me = await fetchMe();
    return me || data.data;
  };

  const register = async (formData) => {
    const { data } = await api.post("/auth/register", formData);
    await fetchMe();
    return data;
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // ignore
    }
    setUser(null);
    setBusiness(null);
    setSubscription(null);
    window.location.href = "/auth/login";
  };

  const refreshData = async () => {
    await fetchMe();
  };

  const updateUser = (nextUser) => setUser((prev) => ({ ...prev, ...nextUser }));
  const updateBusiness = (nextBusiness) => setBusiness((prev) => ({ ...prev, ...nextBusiness }));
  const updateSubscription = (nextSubscription) => setSubscription(nextSubscription);

  const isAdmin = user?.role === "admin";
  const businessId = user?.businessId || business?._id;

  return (
    <AuthContext.Provider
      value={{
        user,
        business,
        subscription,
        loading,
        isAdmin,
        businessId,
        login,
        register,
        logout,
        fetchMe,
        refreshData,
        updateUser,
        updateBusiness,
        updateSubscription,
        getErrorMessage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};