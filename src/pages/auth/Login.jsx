import React, { useEffect } from "react";
import { Link } from "wasp/client/router";
import { useNavigate } from "react-router-dom";
import { LoginForm, useAuth } from "wasp/client/auth";

export default function Login() {
  const { data: user, isLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect to home page if user is already logged in
  useEffect(() => {
    if (user && !isLoading) {
      navigate("/");
    }
  }, [user, isLoading, navigate]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="w-full h-full">
        <div className="min-w-full min-h-[75vh] flex items-center justify-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2"
            style={{ borderColor: "var(--primary-color)" }}
          ></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <div className="min-w-full min-h-[75vh] flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="card p-8">
            <div className="text-center mb-6">
              <div
                className="inline-flex items-center justify-center h-12 w-12 rounded-full mb-4 bg-indigo-100 dark:bg-primary"
                style={{ opacity: 1 }}
              >
                <div className="h-8 w-8 bg-indigo-500 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold">T</span>
                </div>
              </div>
              <h1
                className="text-2xl font-bold"
                style={{ color: "var(--text-color)" }}
              >
                Welcome back
              </h1>
              <p
                className="mt-1"
                style={{ color: "var(--text-color)", opacity: 0.7 }}
              >
                Sign in to your account
              </p>
            </div>

            <LoginForm
              appearance={{
                colors: {
                  brand: "var(--auth-form-brand)",
                  brandAccent: "var(--auth-form-brand-accent)",
                  submitButtonText: "var(--auth-form-submit-button-text-color)",
                  inputBackground: "var(--card-color)",
                  inputText: "var(--text-color)",
                  inputBorder: "var(--border-color)",
                  inputLabelText: "var(--text-color)",
                  anchorTextColor: "var(--primary-color)",
                  messageText: "var(--text-color)",
                  messageTextDanger: "var(--error-color)",
                },
              }}
            />

            <div
              className="mt-6 text-center"
              style={{ color: "var(--text-color)", opacity: 0.7 }}
            >
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="font-medium"
                style={{ color: "var(--primary-color)" }}
              >
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
