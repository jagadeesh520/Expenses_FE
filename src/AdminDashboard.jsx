import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      navigate("/admin-login");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminData");
    navigate("/");
  };

  return (
    <div className="container-fluid d-flex flex-column" style={{ minHeight: "100vh", paddingBottom: "20px" }}>
      <div className="container mt-4" style={{ maxWidth: "1200px", flex: "1", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        {/* Header - Centered */}
        <div className="text-center mb-4">
          <h4 className="fw-bold">Admin Dashboard</h4>
        </div>

        {/* Dashboard Modules - Compact Grid - Centered */}
        <div className="row g-3 mb-3 justify-content-center">
          {/* Registrations Approval List Module */}
          <div className="col-12 col-md-6 col-lg-5">
            <div
              className="card shadow-sm dashboard-module"
              style={{
                cursor: "pointer",
                transition: "all 0.2s",
                borderRadius: "8px",
                border: "2px solid #0d6efd",
                borderLeft: "4px solid #0d6efd"
              }}
              onClick={() => navigate("/registrations")}
            >
              <div className="card-body p-3">
                <div className="d-flex align-items-center">
                  <div className="flex-shrink-0">
                    <i className="bi bi-list-check" style={{ fontSize: "32px", color: "#0d6efd" }}></i>
                  </div>
                  <div className="flex-grow-1 ms-3">
                    <h5 className="fw-bold mb-1" style={{ fontSize: "16px" }}>Registrations Approval List</h5>
                    <p className="text-muted mb-0 small">
                      View and manage registration approvals
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <i className="bi bi-chevron-right text-muted"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics Module */}
          <div className="col-12 col-md-6 col-lg-5">
            <div
              className="card shadow-sm dashboard-module"
              style={{
                cursor: "pointer",
                transition: "all 0.2s",
                borderRadius: "8px",
                border: "2px solid #198754",
                borderLeft: "4px solid #198754"
              }}
              onClick={() => navigate("/statistics")}
            >
              <div className="card-body p-3">
                <div className="d-flex align-items-center">
                  <div className="flex-shrink-0">
                    <i className="bi bi-bar-chart-fill" style={{ fontSize: "32px", color: "#198754" }}></i>
                  </div>
                  <div className="flex-grow-1 ms-3">
                    <h5 className="fw-bold mb-1" style={{ fontSize: "16px" }}>Statistics</h5>
                    <p className="text-muted mb-0 small">
                      View registration and payment statistics
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <i className="bi bi-chevron-right text-muted"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Offering List Module */}
          <div className="col-12 col-md-6 col-lg-5">
            <div
              className="card shadow-sm dashboard-module"
              style={{
                cursor: "pointer",
                transition: "all 0.2s",
                borderRadius: "8px",
                border: "2px solid #9333ea",
                borderLeft: "4px solid #9333ea"
              }}
              onClick={() => navigate("/offerings-list")}
            >
              <div className="card-body p-3">
                <div className="d-flex align-items-center">
                  <div className="flex-shrink-0">
                    <i className="bi bi-gift-fill" style={{ fontSize: "32px", color: "#9333ea" }}></i>
                  </div>
                  <div className="flex-grow-1 ms-3">
                    <h5 className="fw-bold mb-1" style={{ fontSize: "16px" }}>Offering List</h5>
                    <p className="text-muted mb-0 small">
                      View all submitted offerings
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

        {/* Additional Navigation Options - Centered */}
        <div className="row g-2 mb-4 justify-content-center">
          <div className="col-12 col-md-auto">
            <div className="d-flex flex-wrap gap-2 justify-content-center">
              <button
                className="btn btn-info btn-sm fw-bold"
                onClick={() => navigate("/payment-requests")}
              >
                <i className="bi bi-check-circle me-1"></i>Approve Payment Requests
              </button>
              <button
                className="btn btn-secondary btn-sm fw-bold"
                onClick={() => navigate("/view-payment-requests")}
              >
                <i className="bi bi-eye me-1"></i>View All Payment Requests
              </button>
              <button
                className="btn btn-primary btn-sm fw-bold"
                onClick={() => navigate("/cashier-payment-requests")}
              >
                <i className="bi bi-upload me-1"></i>Upload Payment
              </button>
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
