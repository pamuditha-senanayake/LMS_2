"use client";

import { useEffect, useCallback } from "react";

export default function ThemeHandler() {
    const applyTheme = useCallback((theme: string, account: string) => {
        const root = document.documentElement;

        // Apply theme (Light/Dark)
        root.setAttribute("data-theme", theme);
        
        // Apply account (Student/Admin) - Move to root for compound selector support
        if (account === "student") {
            root.setAttribute("data-account", "student");
        } else {
            root.setAttribute("data-account", "admin");
        }
    }, []);

    const syncTheme = useCallback(() => {
        const path = window.location.pathname;
        const isAuthPage = path === "/login" || path === "/register";
        
        const savedTheme = isAuthPage ? "dark" : (localStorage.getItem("theme") || "dark");
        const storedUser = localStorage.getItem("user");
        let accountType = "admin";

        if (storedUser) {
            try {
                const user = JSON.parse(storedUser);
                const isStudent = !user.roles?.includes("ROLE_ADMIN");
                accountType = isStudent ? "student" : "admin";
            } catch (e) {
                console.error("ThemeHandler: Failed to parse user", e);
            }
        }

        applyTheme(savedTheme, accountType);
    }, [applyTheme]);

    useEffect(() => {
        // Initial application
        syncTheme();

        // Listen for storage changes from other tabs/manual triggers
        const handleStorage = (e: StorageEvent) => {
            if (e.key === "theme" || e.key === "user") {
                syncTheme();
            }
        };

        // Custom event for same-tab updates (since storage event doesn't fire in the same tab)
        const handleCustomThemeUpdate = () => syncTheme();

        window.addEventListener("storage", handleStorage);
        window.addEventListener("theme-update", handleCustomThemeUpdate);

        return () => {
            window.removeEventListener("storage", handleStorage);
            window.removeEventListener("theme-update", handleCustomThemeUpdate);
        };
    }, [syncTheme]);

    return null; // Logic-only component
}
