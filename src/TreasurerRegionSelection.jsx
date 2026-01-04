import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function TreasurerRegionSelection() {
  const navigate = useNavigate();
  const [selectedRegion, setSelectedRegion] = useState("");

  const handleContinue = () => {
    if (!selectedRegion) {
      alert("Please select a region");
      return;
    }
    // Store region in localStorage for use across treasurer modules
    localStorage.setItem("treasurerSelectedRegion", selectedRegion);
    navigate("/treasurer/dashboard", { state: { region: selectedRegion } });
  };

  return (
    <div className="container-fluid d-flex flex-column" style={{ minHeight: "100vh", paddingBottom: "20px" }}>
      <div className="container mt-4" style={{ maxWidth: "600px", flex: "1", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        {/* Header */}
        <div className="text-center mb-4">
          <h4 className="fw-bold">Treasurer Dashboard</h4>
          <p className="text-muted">Select a region to continue</p>
        </div>

        {/* Region Selection Card */}
        <div className="card shadow-lg">
          <div className="card-body p-4">
            <label htmlFor="regionSelect" className="form-label fw-bold mb-3">
              Select Region
            </label>
            <select
              id="regionSelect"
              className="form-select form-select-lg"
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
            >
              <option value="">-- Select Region --</option>
              <option value="East Rayalaseema">East Rayalaseema</option>
              <option value="West Rayalaseema">West Rayalaseema</option>
            </select>

            <div className="mt-4 text-center">
              <button
                className="btn btn-primary btn-lg px-5"
                onClick={handleContinue}
                disabled={!selectedRegion}
              >
                Continue
              </button>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="text-center mt-4">
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => navigate("/")}
          >
            <i className="bi bi-arrow-left me-1"></i>Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

