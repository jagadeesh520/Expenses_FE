import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_ENDPOINTS } from "./constants";

export default function RegistrarLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      // Use HTTP + correct port if the backend is running on 5000 without TLS.
      // Switch to https/443 only if you've configured SSL there.
      const res = await fetch(API_ENDPOINTS.LOGIN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Invalid login");
        return;
      }

      if (data.user.role !== "registrar") {
        setError("Access Denied! Registrar Only");
        return;
      }

      localStorage.setItem("registrarToken", data.token);
      localStorage.setItem("registrarData", JSON.stringify(data.user));

      alert("Login Successful 🎉");
      navigate("/registrations");
    } catch (err) {
      setError("Server error");
    }
  };

  return (
    <div className="container vh-100 d-flex align-items-center justify-content-center">
      <div
        className="card p-4 p-md-5 shadow border-0"
        style={{
          maxWidth: "450px",
          width: "100%",
          borderRadius: "15px",
        }}
      >

        {/* 🔙 BACK BUTTON */}
        <button
          className="btn btn-outline-secondary mb-3"
          onClick={() => navigate(-1)}   // Go to previous page
          style={{ borderRadius: "8px" }}
        >
          ⬅ Back
        </button>

        <h2 className="text-center fw-bold mb-4">Registrar Login</h2>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleLogin}>
          <label className="fw-semibold mb-1">Email</label>
          <input
            type="email"
            className="form-control mb-3 p-3"
            placeholder="Enter registrar email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ borderRadius: "10px" }}
          />

          <label className="fw-semibold mb-1">Password</label>
          <input
            type="password"
            className="form-control mb-4 p-3"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ borderRadius: "10px" }}
          />

          <button
            className="btn btn-primary w-100 p-3 fw-bold"
            style={{ borderRadius: "10px", fontSize: "18px" }}
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
