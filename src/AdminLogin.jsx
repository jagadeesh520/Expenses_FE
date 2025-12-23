import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_ENDPOINTS } from "./constants";

export default function AdminLogin() {
  const navigate = useNavigate();
  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7245/ingest/9124ad60-cfbd-485f-a462-1b026806f018',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AdminLogin.jsx:component-mount',message:'Component mounted',data:{hasAdminToken:!!localStorage.getItem('adminToken'),hasAdminData:!!localStorage.getItem('adminData')},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'D'})}).catch(()=>{});
  }, []);
  // #endregion
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7245/ingest/9124ad60-cfbd-485f-a462-1b026806f018',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AdminLogin.jsx:state-init',message:'State initialized - post-fix',data:{username,password,hasDefaults:username===''&&password==='',isEmpty:!username&&!password},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
  }, []);
  // #endregion

  const handleLogin = async (e) => {
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/9124ad60-cfbd-485f-a462-1b026806f018',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AdminLogin.jsx:handleLogin-entry',message:'Form submission triggered - post-fix',data:{username,password,hasValues:!!username&&!!password,isDefaultCreds:false},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(API_ENDPOINTS.LOGIN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
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
            <label className="form-label">Username</label>
            <input
              type="text"
              className="form-control form-control-lg"
              placeholder="Enter admin username"
              value={username}
              onChange={(e) => {
                // #region agent log
                fetch('http://127.0.0.1:7245/ingest/9124ad60-cfbd-485f-a462-1b026806f018',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AdminLogin.jsx:username-change',message:'Username field changed',data:{newValue:e.target.value,isAutofill:false},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'B'})}).catch(()=>{});
                // #endregion
                setUsername(e.target.value);
              }}
              onFocus={(e) => {
                // #region agent log
                fetch('http://127.0.0.1:7245/ingest/9124ad60-cfbd-485f-a462-1b026806f018',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AdminLogin.jsx:username-focus',message:'Username field focused',data:{currentValue:e.target.value},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'B'})}).catch(()=>{});
                // #endregion
              }}
              autoComplete="off"
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
              onChange={(e) => {
                // #region agent log
                fetch('http://127.0.0.1:7245/ingest/9124ad60-cfbd-485f-a462-1b026806f018',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AdminLogin.jsx:password-change',message:'Password field changed',data:{hasValue:!!e.target.value,isAutofill:false},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'B'})}).catch(()=>{});
                // #endregion
                setPassword(e.target.value);
              }}
              onFocus={(e) => {
                // #region agent log
                fetch('http://127.0.0.1:7245/ingest/9124ad60-cfbd-485f-a462-1b026806f018',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AdminLogin.jsx:password-focus',message:'Password field focused',data:{hasValue:!!e.target.value},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'B'})}).catch(()=>{});
                // #endregion
              }}
              autoComplete="new-password"
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
