"use client";

import { useEffect, useState } from "react";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get("error")) {
      console.error("Authentication error:", params.get("error"));
    }
  }, []);

  const handleGoogleLogin = () => {
    setLoading(true);

    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`;
  };

  return (
    <main className="login-page">
      <div className="login-card">
        <h1>Login</h1>

        <button
          type="button"
          className="google-button"
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          <span className="google-icon">G</span>
          {loading ? "Connecting..." : "Login with Google"}
        </button>

        <div className="login-divider">
          <span />
          <p>or sign up through email</p>
          <span />
        </div>

        <input
          type="email"
          placeholder="Email ID"
          disabled
          className="login-input"
        />

        <input
          type="password"
          placeholder="Password"
          disabled
          className="login-input"
        />

        <button type="button" disabled className="login-button">
          Login
        </button>
      </div>
    </main>
  );
}
