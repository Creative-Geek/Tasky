import { Link } from "wasp/client/router";
import { useAuth, logout } from "wasp/client/auth";
import { Outlet } from "react-router-dom";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { UserCircleIcon } from "@heroicons/react/24/solid";
import { useState } from "react";
import "./Main.css";

export const Layout = () => {
  const { data: user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-indigo-500 rounded-md flex items-center justify-center">
              <span className="text-white font-bold">T</span>
            </div>
            <h1 className="text-xl font-semibold text-gray-800">TaskMaster</h1>
          </Link>

          {/* Mobile menu button */}
          <button
            className="md:hidden rounded-md p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none"
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
                  <span className="text-gray-700">
                    {user.identities.username?.id}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="btn btn-primary text-sm py-1.5"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <Link to="/login" className="btn btn-primary">
                Sign in
              </Link>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-2 px-4">
            {user ? (
              <div className="flex flex-col space-y-3 py-2">
                <div className="flex items-center space-x-2 py-2">
                  <UserCircleIcon className="h-6 w-6 text-indigo-500" />
                  <span className="text-gray-700">
                    {user.identities.username?.id}
                  </span>
                </div>
                <button onClick={logout} className="btn btn-primary text-sm">
                  Sign out
                </button>
              </div>
            ) : (
              <div className="py-2">
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

      <footer className="border-t border-gray-200 bg-white">
        <div className="container mx-auto px-4 py-4">
          <p className="text-center text-gray-500 text-sm">
            TaskMaster — Powered by Wasp
          </p>
        </div>
      </footer>
    </div>
  );
};
