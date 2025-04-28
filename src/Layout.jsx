import React, { useState, useEffect, lazy, Suspense } from "react";
import { Link } from "wasp/client/router";
import { useAuth, logout } from "wasp/client/auth";
import { Outlet } from "react-router-dom";
import {
  Bars3Icon,
  XMarkIcon,
  SunIcon,
  MoonIcon,
} from "@heroicons/react/24/outline";
import { UserCircleIcon } from "@heroicons/react/24/solid";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import "./Main.css";

// Inner layout component that has access to theme context
const InnerLayout = () => {
  const { data: user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme } = useTheme();

  // Import ThemeToggle component
  const ThemeToggle = lazy(() => import("./components/common/ThemeToggle"));

  return (
    <div className="flex flex-col min-h-screen">
      <header
        className="shadow-sm"
        style={{
          backgroundColor: "var(--card-color)",
          borderColor: "var(--border-color)",
        }}
      >
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-indigo-500 rounded-md flex items-center justify-center">
              <span className="text-white font-bold">T</span>
            </div>
            <h1
              className="text-xl font-semibold"
              style={{ color: "var(--text-color)" }}
            >
              Tasky
            </h1>
          </Link>

          {/* Mobile menu button */}
          <button
            className="md:hidden rounded-md p-2 focus:outline-none"
            style={{ color: "var(--text-color)" }}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <XMarkIcon className="h-6 w-6" />
            ) : (
              <Bars3Icon className="h-6 w-6" />
            )}
          </button>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <UserCircleIcon className="h-6 w-6 text-indigo-500" />
                  <span style={{ color: "var(--text-color)" }}>
                    {user.identities.username?.id}
                  </span>
                </div>
                {/* Theme toggle button */}
                <Suspense fallback={<div className="w-5 h-5"></div>}>
                  <ThemeToggle />
                </Suspense>
                <button
                  onClick={logout}
                  className="btn btn-primary text-sm py-1.5"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <>
                {/* Theme toggle button for non-logged in users */}
                <Suspense fallback={<div className="w-5 h-5"></div>}>
                  <ThemeToggle />
                </Suspense>
                <Link to="/login" className="btn btn-primary">
                  Sign in
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div
            className="md:hidden border-t py-2 px-4"
            style={{ borderColor: "var(--border-color)" }}
          >
            {user ? (
              <div className="flex flex-col space-y-3 py-2">
                <div className="flex items-center space-x-2 py-2">
                  <UserCircleIcon className="h-6 w-6 text-indigo-500" />
                  <span style={{ color: "var(--text-color)" }}>
                    {user.identities.username?.id}
                  </span>
                </div>
                {/* Theme toggle button for mobile */}
                <div className="flex items-center py-2">
                  <Suspense fallback={<div className="w-5 h-5"></div>}>
                    <ThemeToggle />
                  </Suspense>
                  <span className="ml-2" style={{ color: "var(--text-color)" }}>
                    {theme === "dark"
                      ? "Switch to Light Mode"
                      : "Switch to Dark Mode"}
                  </span>
                </div>
                <button onClick={logout} className="btn btn-primary text-sm">
                  Sign out
                </button>
              </div>
            ) : (
              <div className="py-2">
                {/* Theme toggle button for mobile non-logged in users */}
                <div className="flex items-center py-2 mb-2">
                  <Suspense fallback={<div className="w-5 h-5"></div>}>
                    <ThemeToggle />
                  </Suspense>
                  <span className="ml-2" style={{ color: "var(--text-color)" }}>
                    {theme === "dark"
                      ? "Switch to Light Mode"
                      : "Switch to Dark Mode"}
                  </span>
                </div>
                <Link to="/login" className="btn btn-primary block text-center">
                  Sign in
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      <main className="flex-grow container mx-auto px-4 py-6">
        <Outlet />
      </main>

      <footer
        className="border-t"
        style={{
          backgroundColor: "var(--card-color)",
          borderColor: "var(--border-color)",
        }}
      >
        <div className="container mx-auto px-4 py-4 text-center">
          <p
            className="text-sm mb-2"
            style={{ color: "var(--text-color)", opacity: 0.7 }}
          >
            Tasky — Powered by Wasp
          </p>
          <a
            href="https://github.com/Creative-Geek/Tasky"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block transition-colors"
            style={{ color: "var(--text-color)", opacity: 0.5 }}
            aria-label="View source code on GitHub"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
          </a>
        </div>
      </footer>
    </div>
  );
};

// Outer layout component that provides theme context
export const Layout = () => {
  return (
    <ThemeProvider>
      <InnerLayout />
    </ThemeProvider>
  );
};
