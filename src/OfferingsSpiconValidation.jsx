import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { API_ENDPOINTS } from "./constants";
import logo from "./Assets/logo.PNG";

export default function OfferingsSpiconValidation() {
  const navigate = useNavigate();
  const location = useLocation();
  const region = location.state?.region || "";
  const isRegistered = location.state?.isRegistered || false;

  const [spiconId, setSpiconId] = useState("");
  const [loading, setLoading] = useState(false);
  const [candidateData, setCandidateData] = useState(null);
  const [error, setError] = useState("");
  const [validated, setValidated] = useState(false);

  const handleValidate = async () => {
    if (!spiconId.trim()) {
      setError("Please enter a SPICON ID");
      return;
    }

    setLoading(true);
    setError("");
    setCandidateData(null);
    setValidated(false);

    try {
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/9124ad60-cfbd-485f-a462-1b026806f018',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'OfferingsSpiconValidation.jsx:handleValidate-entry',message:'Starting SPICON ID validation',data:{spiconId:spiconId.trim(),selectedRegion:region},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'A'})}).catch(()=>{});
      // #endregion

      const res = await fetch(API_ENDPOINTS.REGISTRATIONS);
      const result = await res.json();

      if (result.success && result.data) {
        // #region agent log
        fetch('http://127.0.0.1:7245/ingest/9124ad60-cfbd-485f-a462-1b026806f018',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'OfferingsSpiconValidation.jsx:handleValidate-fetched',message:'Fetched registrations',data:{totalRegistrations:result.data.length},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'B'})}).catch(()=>{});
        // #endregion

        // First, find all matches for this SPICON ID (across all regions)
        const allMatches = result.data.filter(
          (reg) => reg.uniqueId && reg.uniqueId.toLowerCase() === spiconId.trim().toLowerCase()
        );

        // #region agent log
        fetch('http://127.0.0.1:7245/ingest/9124ad60-cfbd-485f-a462-1b026806f018',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'OfferingsSpiconValidation.jsx:handleValidate-matches',message:'Found SPICON ID matches',data:{matchCount:allMatches.length,matches:allMatches.map(m=>({uniqueId:m.uniqueId,region:m.region,name:m.name||m.fullName}))},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'C'})}).catch(()=>{});
        // #endregion

        // Now find the match in the selected region
        const found = allMatches.find(
          (reg) => reg.region === region
        );

        if (found) {
          // #region agent log
          fetch('http://127.0.0.1:7245/ingest/9124ad60-cfbd-485f-a462-1b026806f018',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'OfferingsSpiconValidation.jsx:handleValidate-success',message:'SPICON ID validated in correct region',data:{uniqueId:found.uniqueId,foundRegion:found.region,selectedRegion:region,name:found.name||found.fullName},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'D'})}).catch(()=>{});
          // #endregion

          setCandidateData(found);
          setValidated(true);
          setError("");
        } else if (allMatches.length > 0) {
          // SPICON ID exists but in a different region
          const otherRegion = allMatches[0].region;
          // #region agent log
          fetch('http://127.0.0.1:7245/ingest/9124ad60-cfbd-485f-a462-1b026806f018',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'OfferingsSpiconValidation.jsx:handleValidate-wrongRegion',message:'SPICON ID found in different region',data:{uniqueId:spiconId.trim(),selectedRegion:region,foundRegion:otherRegion},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'E'})}).catch(()=>{});
          // #endregion

          setError(`This SPICON ID belongs to ${otherRegion}. Please select the correct region or verify your SPICON ID.`);
          setValidated(false);
          setCandidateData(null);
        } else {
          // #region agent log
          fetch('http://127.0.0.1:7245/ingest/9124ad60-cfbd-485f-a462-1b026806f018',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'OfferingsSpiconValidation.jsx:handleValidate-notFound',message:'SPICON ID not found in any region',data:{uniqueId:spiconId.trim()},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'F'})}).catch(()=>{});
          // #endregion

          setError("SPICON ID not found. Please verify and try again.");
          setValidated(false);
          setCandidateData(null);
        }
      } else {
        setError("Failed to fetch registrations. Please try again.");
      }
    } catch (err) {
      console.error("Error validating SPICON ID:", err);
      setError("An error occurred while validating. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (!validated || !candidateData) {
      return;
    }

    navigate("/gifts-form", {
      state: {
        region,
        isRegistered: true,
        candidateData: candidateData,
        spiconId: candidateData.uniqueId,
      },
    });
  };

  if (!region || !isRegistered) {
    return (
      <div className="container min-vh-100 d-flex align-items-center justify-content-center">
        <div className="card p-5 shadow-lg text-center" style={{ maxWidth: "500px" }}>
          <p className="text-danger mb-3">
            Invalid navigation. Please go back and select your registration status.
          </p>
          <button
            className="btn btn-outline-secondary"
            onClick={() => navigate("/gifts-registration-check", { state: { region } })}
          >
            <i className="bi bi-arrow-left me-2"></i>Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="container min-vh-100 d-flex align-items-center justify-content-center"
      style={{ paddingTop: "30px", paddingBottom: "30px" }}
    >
      <div className="card p-5 shadow-lg" style={{ maxWidth: "700px", width: "100%" }}>
        <div className="text-center mb-4">
          <img
            src={logo}
            alt="SPICON Logo"
            style={{ width: "120px", marginBottom: "20px" }}
          />
          <h2 className="fw-bold mb-3">SPICON ID Validation</h2>
          <p className="text-muted mb-4">
            Region: <strong>{region}</strong>
          </p>
        </div>

        <div className="mb-4">
          <label htmlFor="spiconId" className="form-label fw-bold">
            Enter SPICON ID
          </label>
          <div className="input-group">
            <input
              type="text"
              className="form-control form-control-lg"
              id="spiconId"
              placeholder="e.g., SPICON2026-S001"
              value={spiconId}
              onChange={(e) => {
                setSpiconId(e.target.value);
                setError("");
                setValidated(false);
                setCandidateData(null);
              }}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleValidate();
                }
              }}
              disabled={loading}
            />
            <button
              className="btn btn-primary"
              type="button"
              onClick={handleValidate}
              disabled={loading || !spiconId.trim()}
            >
              {loading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  Validating...
                </>
              ) : (
                <>
                  <i className="bi bi-search me-2"></i>Validate
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {error}
          </div>
        )}

        {validated && candidateData && (
          <div className="alert alert-success mb-4" role="alert">
            <h5 className="alert-heading">
              <i className="bi bi-check-circle-fill me-2"></i>
              SPICON ID Validated Successfully!
            </h5>
            <hr />
            <div className="row g-2 text-start">
              <div className="col-12">
                <strong>SPICON ID:</strong> {candidateData.uniqueId}
              </div>
              <div className="col-12">
                <strong>Name:</strong> {candidateData.name || candidateData.fullName || "N/A"}
              </div>
              <div className="col-md-6">
                <strong>Email:</strong> {candidateData.email || "N/A"}
              </div>
              <div className="col-md-6">
                <strong>Mobile:</strong> {candidateData.mobile || "N/A"}
              </div>
              <div className="col-md-6">
                <strong>District:</strong> {candidateData.district || "N/A"}
              </div>
              <div className="col-md-6">
                <strong>Region:</strong> {candidateData.region || "N/A"}
              </div>
              {candidateData.groupType && (
                <div className="col-12">
                  <strong>Group Type:</strong>{" "}
                  <span className="badge bg-info">{candidateData.groupType}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="d-grid gap-2">
          <button
            className="btn btn-primary btn-lg"
            onClick={handleContinue}
            disabled={!validated || !candidateData}
          >
            Continue to Gift Form
          </button>

          <button
            className="btn btn-outline-secondary"
            onClick={() =>
              navigate("/gifts-registration-check", { state: { region } })
            }
          >
            <i className="bi bi-arrow-left me-2"></i>Back
          </button>
        </div>
      </div>
    </div>
  );
}

