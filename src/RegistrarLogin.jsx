import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_ENDPOINTS } from "./constants";

export default function RegistrarLogin() {
  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7245/ingest/9124ad60-cfbd-485f-a462-1b026806f018',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RegistrarLogin.jsx:component-mount',message:'Component mounted',data:{hasRegistrarToken:!!localStorage.getItem('registrarToken'),hasRegistrarData:!!localStorage.getItem('registrarData')},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'D'})}).catch(()=>{});
  }, []);
  // #endregion
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7245/ingest/9124ad60-cfbd-485f-a462-1b026806f018',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RegistrarLogin.jsx:state-init',message:'State initialized - post-fix',data:{username,password,hasDefaults:username===''&&password==='',isEmpty:!username&&!password},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
  }, []);
  // #endregion

  const handleLogin = async (e) => {
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/9124ad60-cfbd-485f-a462-1b026806f018',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RegistrarLogin.jsx:handleLogin-entry',message:'Form submission triggered - post-fix',data:{username,password,hasValues:!!username&&!!password,isDefaultCreds:false},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    e.preventDefault();
    setError("");

    try {
      // Use HTTP + correct port if the backend is running on 5000 without TLS.
      // Switch to https/443 only if you've configured SSL there.
      const res = await fetch(API_ENDPOINTS.LOGIN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
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
      navigate("/registrar-dashboard");
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
          <label className="fw-semibold mb-1">Username</label>
          <input
            type="text"
            className="form-control mb-3 p-3"
            placeholder="Enter registrar username"
            value={username}
            onChange={(e) => {
              // #region agent log
              fetch('http://127.0.0.1:7245/ingest/9124ad60-cfbd-485f-a462-1b026806f018',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RegistrarLogin.jsx:username-change',message:'Username field changed',data:{newValue:e.target.value,isAutofill:false},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'B'})}).catch(()=>{});
              // #endregion
              setUsername(e.target.value);
            }}
            onFocus={(e) => {
              // #region agent log
              fetch('http://127.0.0.1:7245/ingest/9124ad60-cfbd-485f-a462-1b026806f018',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RegistrarLogin.jsx:username-focus',message:'Username field focused',data:{currentValue:e.target.value},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'B'})}).catch(()=>{});
              // #endregion
            }}
            autoComplete="off"
            style={{ borderRadius: "10px" }}
          />

          <label className="fw-semibold mb-1">Password</label>
          <input
            type="password"
            className="form-control mb-4 p-3"
            placeholder="Enter password"
            value={password}
            onChange={(e) => {
              // #region agent log
              fetch('http://127.0.0.1:7245/ingest/9124ad60-cfbd-485f-a462-1b026806f018',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RegistrarLogin.jsx:password-change',message:'Password field changed',data:{hasValue:!!e.target.value,isAutofill:false},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'B'})}).catch(()=>{});
              // #endregion
              setPassword(e.target.value);
            }}
            onFocus={(e) => {
              // #region agent log
              fetch('http://127.0.0.1:7245/ingest/9124ad60-cfbd-485f-a462-1b026806f018',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RegistrarLogin.jsx:password-focus',message:'Password field focused',data:{hasValue:!!e.target.value},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'B'})}).catch(()=>{});
              // #endregion
            }}
            autoComplete="new-password"
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
