import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_ENDPOINTS } from "./constants";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(API_ENDPOINTS.LOGIN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Login failed");
        setLoading(false);
        return;
      }

      if (data.user.role !== "admin") {
        setError("Access Denied – Admins only");
        setLoading(false);
        return;
      }

      localStorage.setItem("adminToken", data.token);
      localStorage.setItem("adminData", JSON.stringify(data.user));

      navigate("/admin-dashboard");

    } catch (err) {
      setError("Server error, please try again");
    }

    setLoading(false);
  };

  return (
    <div className="container vh-100 d-flex align-items-center justify-content-center">
      <div className="card p-5 shadow-lg" style={{ maxWidth: "400px", width: "100%" }}>

        {/* 🔙 BACK BUTTON */}
        <button
          className="btn btn-outline-secondary mb-3"
          onClick={() => navigate(-1)}   // Go to previous page
        >
          ⬅ Back
        </button>

        <h3 className="text-center mb-4 fw-bold">Admin Login</h3>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-control form-control-lg"
              placeholder="Enter admin email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control form-control-lg"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button className="btn btn-primary btn-lg w-100 mt-3" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
