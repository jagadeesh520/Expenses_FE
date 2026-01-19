import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function TreasurerDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedRegion, setSelectedRegion] = useState("");

  useEffect(() => {
    // Get region from location state or localStorage
    const regionFromState = location.state?.region;
    const regionFromStorage = localStorage.getItem("treasurerSelectedRegion");
    const region = regionFromState || regionFromStorage;
    
    if (!region) {
      // If no region selected, redirect to region selection
      navigate("/treasurer/region-selection");
      return;
    }
    
    setSelectedRegion(region);
  }, [location, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("treasurerToken");
    localStorage.removeItem("treasurerData");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminData");
    navigate("/");
  };

  return (
    <div className="container-fluid d-flex flex-column" style={{ minHeight: "100vh", paddingBottom: "20px" }}>
      <div className="container mt-4" style={{ maxWidth: "1200px", flex: "1", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        {/* Header - Centered */}
        <div className="text-center mb-4">
          <h4 className="fw-bold">Treasurer Dashboard</h4>
          {selectedRegion && (
            <p className="text-primary fw-bold mb-2">Region: {selectedRegion}</p>
          )}
          <p className="text-muted">Choose an action</p>
        </div>

        {/* Dashboard Modules - Compact Grid - Centered */}
        <div className="row g-3 mb-3 justify-content-center">
          {/* Payment Details & Summary Module */}
          <div className="col-12 col-md-6 col-lg-5">
            <div
              className="card shadow-sm dashboard-module"
              style={{
                cursor: "pointer",
                transition: "all 0.2s",
                borderRadius: "8px",
                border: "2px solid #28a745",
                borderLeft: "4px solid #28a745"
              }}
              onClick={() => navigate("/treasurer/summary")}
            >
              <div className="card-body p-3">
                <div className="d-flex align-items-center">
                  <div className="flex-shrink-0">
                    <i className="bi bi-wallet2" style={{ fontSize: "32px", color: "#28a745" }}></i>
                  </div>
                  <div className="flex-grow-1 ms-3">
                    <h5 className="fw-bold mb-1" style={{ fontSize: "16px" }}>Payment Details & Summary</h5>
                    <p className="text-muted mb-0 small">
                      View payment summary and details
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <i className="bi bi-chevron-right text-muted"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Worker Disbursements Module */}
          <div className="col-12 col-md-6 col-lg-5">
            <div
              className="card shadow-sm dashboard-module"
              style={{
                cursor: "pointer",
                transition: "all 0.2s",
                borderRadius: "8px",
                border: "2px solid #007bff",
                borderLeft: "4px solid #007bff"
              }}
              onClick={() => navigate("/treasurer/worker-disbursements", { state: { region: selectedRegion } })}
            >
              <div className="card-body p-3">
                <div className="d-flex align-items-center">
                  <div className="flex-shrink-0">
                    <i className="bi bi-cash-stack" style={{ fontSize: "32px", color: "#007bff" }}></i>
                  </div>
                  <div className="flex-grow-1 ms-3">
                    <h5 className="fw-bold mb-1" style={{ fontSize: "16px" }}>Worker Disbursements</h5>
                    <p className="text-muted mb-0 small">
                      Track money sent to workers
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <i className="bi bi-chevron-right text-muted"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Amount Received From Worker Module */}
          <div className="col-12 col-md-6 col-lg-5">
            <div
              className="card shadow-sm dashboard-module"
              style={{
                cursor: "pointer",
                transition: "all 0.2s",
                borderRadius: "8px",
                border: "2px solid #17a2b8",
                borderLeft: "4px solid #17a2b8"
              }}
              onClick={() => navigate("/treasurer/worker-refunds", { state: { region: selectedRegion } })}
            >
              <div className="card-body p-3">
                <div className="d-flex align-items-center">
                  <div className="flex-shrink-0">
                    <i className="bi bi-arrow-return-left" style={{ fontSize: "32px", color: "#17a2b8" }}></i>
                  </div>
                  <div className="flex-grow-1 ms-3">
                    <h5 className="fw-bold mb-1" style={{ fontSize: "16px" }}>Amount Received From Worker</h5>
                    <p className="text-muted mb-0 small">
                      Record money returned by workers
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <i className="bi bi-chevron-right text-muted"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Logout Button - At Bottom */}
        <div className="text-center mt-auto pt-4">
          <button className="btn btn-danger btn-sm fw-bold px-4" onClick={handleLogout}>
            <i className="bi bi-box-arrow-right me-1"></i>Logout
          </button>
        </div>
      </div>

      {/* Styles */}
      <style>{`
        .dashboard-module:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
        }
        @media(max-width: 768px) {
          .dashboard-module .card-body {
            padding: 0.75rem !important;
          }
          .dashboard-module i {
            font-size: 28px !important;
          }
          .dashboard-module h5 {
            font-size: 14px !important;
          }
          .dashboard-module .small {
            font-size: 11px !important;
          }
        }
      `}</style>
    </div>
  );
}

