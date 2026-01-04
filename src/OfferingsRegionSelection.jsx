import React from "react";
import { useNavigate } from "react-router-dom";
import logo from "./Assests/logo.PNG";

export default function OfferingsRegionSelection() {
  const navigate = useNavigate();

  const handleRegionSelect = (region) => {
    navigate("/offerings-registration-check", { state: { region } });
  };

  return (
    <div
      className="container min-vh-100 d-flex align-items-center justify-content-center"
      style={{ paddingTop: "30px", paddingBottom: "30px" }}
    >
      <div className="card p-5 shadow-lg" style={{ maxWidth: "500px", width: "100%" }}>
        <div className="text-center mb-4">
          <img
            src={logo}
            alt="SPICON Logo"
            style={{ width: "120px", marginBottom: "20px" }}
          />
          <h2 className="fw-bold mb-3">Offerings</h2>
          <p className="text-muted">Select a region to submit your offering</p>
        </div>

        <div className="d-grid gap-3">
          <button
            className="btn btn-primary btn-lg"
            onClick={() => handleRegionSelect("West Rayalaseema")}
          >
            <i className="bi bi-geo-alt-fill me-2"></i>
            West Rayalaseema
          </button>
          
          <button
            className="btn btn-success btn-lg"
            onClick={() => handleRegionSelect("East Rayalaseema")}
          >
            <i className="bi bi-geo-alt-fill me-2"></i>
            East Rayalaseema
          </button>
          
          <button
            className="btn btn-outline-secondary mt-3"
            onClick={() => navigate("/")}
          >
            <i className="bi bi-arrow-left me-2"></i>
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

