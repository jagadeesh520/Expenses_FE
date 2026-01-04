import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_ENDPOINTS, API_BASE_URL } from "./constants";
// #region agent log
fetch('http://127.0.0.1:7245/ingest/9124ad60-cfbd-485f-a462-1b026806f018',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RegistrarLogin.jsx:import-check',message:'Constants imported',data:{hasApiEndpoints:!!API_ENDPOINTS,hasLoginEndpoint:!!API_ENDPOINTS.LOGIN,loginUrl:API_ENDPOINTS.LOGIN,apiBaseUrl:API_BASE_URL},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'A'})}).catch(()=>{});
// #endregion

export default function RegistrarLogin() {
  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7245/ingest/9124ad60-cfbd-485f-a462-1b026806f018',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RegistrarLogin.jsx:component-mount',message:'Component mounted',data:{hasRegistrarToken:!!localStorage.getItem('registrarToken'),hasRegistrarData:!!localStorage.getItem('registrarData'),apiBaseUrl:API_BASE_URL,loginUrl:API_ENDPOINTS.LOGIN},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'A'})}).catch(()=>{});
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
      // #region agent log
      const loginUrl = API_ENDPOINTS.LOGIN;
      const requestBody = JSON.stringify({ username, password });
      const currentOrigin = window.location.origin;
      const isHttps = loginUrl.startsWith('https://');
      const isHttp = loginUrl.startsWith('http://');
      fetch('http://127.0.0.1:7245/ingest/9124ad60-cfbd-485f-a462-1b026806f018',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RegistrarLogin.jsx:fetch-before',message:'About to make fetch request',data:{loginUrl,hasUsername:!!username,hasPassword:!!password,requestMethod:'POST',origin:currentOrigin,isHttps,isHttp,protocolMismatch:currentOrigin.startsWith('http://')&&isHttps},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
      // Test if server is reachable first with a simple OPTIONS request
      // #region agent log
      try {
        fetch('http://127.0.0.1:7245/ingest/9124ad60-cfbd-485f-a462-1b026806f018',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RegistrarLogin.jsx:preflight-before',message:'About to test OPTIONS request',data:{loginUrl,method:'OPTIONS'},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'A'})}).catch(()=>{});
        const preflightTest = await fetch(loginUrl, { method: 'OPTIONS', mode: 'cors' });
        const preflightStatus = preflightTest.status;
        const preflightCorsOrigin = preflightTest.headers.get('Access-Control-Allow-Origin');
        fetch('http://127.0.0.1:7245/ingest/9124ad60-cfbd-485f-a462-1b026806f018',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RegistrarLogin.jsx:preflight-test',message:'CORS preflight test result',data:{preflightStatus,preflightCorsOrigin,hasCorsHeader:!!preflightCorsOrigin,allowsOrigin:preflightCorsOrigin===currentOrigin||preflightCorsOrigin==='*'},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'A'})}).catch(()=>{});
      } catch (preflightErr) {
        fetch('http://127.0.0.1:7245/ingest/9124ad60-cfbd-485f-a462-1b026806f018',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RegistrarLogin.jsx:preflight-error',message:'CORS preflight test failed',data:{preflightError:preflightErr.message,preflightErrorName:preflightErr.name,isConnectionRefused:preflightErr.message.includes('ERR_CONNECTION_REFUSED')||preflightErr.message.includes('Failed to fetch')},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'A'})}).catch(()=>{});
      }
      // #endregion
      
      // Use HTTP + correct port if the backend is running on 5000 without TLS.
      // Switch to https/443 only if you've configured SSL there.
      const res = await fetch(loginUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: requestBody,
        mode: 'cors',
        credentials: 'omit',
      });
      // #region agent log
      const responseStatus = res.status;
      const responseStatusText = res.statusText;
      const corsOrigin = res.headers.get('Access-Control-Allow-Origin');
      const corsMethods = res.headers.get('Access-Control-Allow-Methods');
      const corsHeaders = res.headers.get('Access-Control-Allow-Headers');
      fetch('http://127.0.0.1:7245/ingest/9124ad60-cfbd-485f-a462-1b026806f018',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RegistrarLogin.jsx:fetch-response',message:'Fetch response received',data:{status:responseStatus,statusText:responseStatusText,ok:res.ok,corsOrigin,corsMethods,corsHeaders,hasCorsHeaders:!!corsOrigin},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'B'})}).catch(()=>{});
      // #endregion

      const data = await res.json();
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/9124ad60-cfbd-485f-a462-1b026806f018',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RegistrarLogin.jsx:response-json',message:'Response JSON parsed',data:{hasData:!!data,hasToken:!!data.token,hasUser:!!data.user,userRole:data.user?.role},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'B'})}).catch(()=>{});
      // #endregion

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
      // #region agent log
      const errorMessage = err.message || String(err);
      const errorName = err.name;
      const isCorsError = errorMessage.includes('CORS') || errorMessage.includes('cors') || errorMessage.includes('Access-Control');
      const isNetworkError = errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError') || errorMessage.includes('ERR_');
      const currentOrigin = window.location.origin;
      const isLocalhost = currentOrigin.includes('localhost') || currentOrigin.includes('127.0.0.1');
      const isHttp = currentOrigin.startsWith('http://');
      const apiIsHttps = API_ENDPOINTS.LOGIN.startsWith('https://');
      fetch('http://127.0.0.1:7245/ingest/9124ad60-cfbd-485f-a462-1b026806f018',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RegistrarLogin.jsx:catch-error',message:'Fetch error caught',data:{errorMessage,errorName,isCorsError,isNetworkError,errorType:typeof err,currentOrigin,isLocalhost,isHttp,apiIsHttps,protocolMismatch:isHttp&&apiIsHttps,stack:err.stack?.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
      // Provide more helpful error messages
      if (isNetworkError) {
        if (isHttp && apiIsHttps) {
          setError("Connection error: Mixed content blocked. Please access the app via HTTPS or use HTTP for the API in development.");
        } else {
          setError("Connection error: Unable to reach the server. Please check: 1) Backend server is running, 2) CORS is configured to allow this origin, 3) Network connectivity.");
        }
      } else if (isCorsError) {
        setError("CORS error: Backend needs to allow requests from this origin. Contact administrator.");
      } else {
        setError("Server error: " + errorMessage);
      }
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
