"use client";

import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

const getSystemTheme = () => {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState("system");

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved) {
      const id = setTimeout(() => setTheme(saved), 0);
      return () => clearTimeout(id);
    }
  }, []);

  useEffect(() => {
    const resolveTheme = () => {
      const active = theme === "system" ? getSystemTheme() : theme;
      document.documentElement.classList.toggle("dark", active === "dark");
    };
    resolveTheme();

    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      mq.addEventListener("change", resolveTheme);
      return () => mq.removeEventListener("change", resolveTheme);
    }
  }, [theme]);

  const setThemeMode = (mode) => {
    setTheme(mode);
    localStorage.setItem("theme", mode);
  };

  return (
    <ThemeContext.Provider value={{ theme, setThemeMode, resolvedTheme: theme === "system" ? getSystemTheme() : theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
};