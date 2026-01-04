import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "./Assests/logo.PNG";

export default function OfferingsRegistrationCheck() {
  const navigate = useNavigate();
  const location = useLocation();
  const region = location.state?.region || "";

  const [isRegistered, setIsRegistered] = useState(null);

  const handleContinue = () => {
    if (isRegistered === null) {
      alert("Please select an option");
      return;
    }

    if (isRegistered) {
      navigate("/offerings-spicon-validation", { 
        state: { region, isRegistered: true } 
      });
    } else {
      navigate("/offerings-form", { 
        state: { region, isRegistered: false } 
      });
    }
  };

  if (!region) {
    return (
      <div className="container min-vh-100 d-flex align-items-center justify-content-center">
        <div className="card p-5 shadow-lg text-center" style={{ maxWidth: "500px" }}>
          <p className="text-danger mb-3">Region not selected. Please go back and select a region.</p>
          <button className="btn btn-outline-secondary" onClick={() => navigate("/offerings-region")}>
            <i className="bi bi-arrow-left me-2"></i>Back to Region Selection
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
      <div className="card p-5 shadow-lg" style={{ maxWidth: "600px", width: "100%" }}>
        <div className="text-center mb-4">
          <img
            src={logo}
            alt="SPICON Logo"
            style={{ width: "120px", marginBottom: "20px" }}
          />
          <h2 className="fw-bold mb-3">Offerings</h2>
          <p className="text-muted mb-4">Region: <strong>{region}</strong></p>
        </div>

        <div className="mb-4">
          <h5 className="fw-bold text-center mb-4">Are you a registered candidate?</h5>
          
          <div className="d-grid gap-3">
            <button
              className={`btn btn-lg ${
                isRegistered === true ? "btn-success" : "btn-outline-success"
              }`}
              onClick={() => setIsRegistered(true)}
              style={{ 
                padding: "20px",
                fontSize: "18px",
                fontWeight: "bold"
              }}
            >
              <i className="bi bi-check-circle-fill me-2"></i>
              Yes
            </button>
            
            <button
              className={`btn btn-lg ${
                isRegistered === false ? "btn-danger" : "btn-outline-danger"
              }`}
              onClick={() => setIsRegistered(false)}
              style={{ 
                padding: "20px",
                fontSize: "18px",
                fontWeight: "bold"
              }}
            >
              <i className="bi bi-x-circle-fill me-2"></i>
              No
            </button>
          </div>
        </div>

        <div className="d-grid gap-2">
          <button
            className="btn btn-primary btn-lg"
            onClick={handleContinue}
            disabled={isRegistered === null}
          >
            Continue
          </button>
          
          <button
            className="btn btn-outline-secondary"
            onClick={() => navigate("/offerings-region")}
          >
            <i className="bi bi-arrow-left me-2"></i>
            Back
          </button>
        </div>
      </div>
    </div>
  );
}

