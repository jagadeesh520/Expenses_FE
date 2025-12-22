import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Statistics() {
  const navigate = useNavigate();

  useEffect(() => {
    const registrarToken = localStorage.getItem("registrarToken");
    const adminToken = localStorage.getItem("adminToken");
    if (!registrarToken && !adminToken) {
      if (!adminToken) {
        navigate("/registrar-login");
      } else {
        navigate("/admin-login");
      }
      return;
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("registrarToken");
    localStorage.removeItem("registrarData");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminData");
    navigate("/");
  };

  return (
    <div className="container-fluid d-flex flex-column" style={{ minHeight: "100vh", paddingBottom: "20px" }}>
      <div className="container mt-4" style={{ maxWidth: "1200px", flex: "1", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        {/* Header - Centered */}
        <div className="text-center mb-4">
          <h4 className="fw-bold">Statistics Dashboard</h4>
        </div>

        {/* Dashboard Modules - Compact Grid - Centered */}
        <div className="row g-3 mb-3 justify-content-center">
          {/* District and Place wise People Details Module */}
          <div className="col-12 col-md-6 col-lg-4">
            <div
              className="card shadow-sm dashboard-module"
              style={{
                cursor: "pointer",
                transition: "all 0.2s",
                borderRadius: "8px",
                border: "2px solid #0d6efd",
                borderLeft: "4px solid #0d6efd"
              }}
              onClick={() => navigate("/statistics/district-place-people")}
            >
              <div className="card-body p-3">
                <div className="d-flex align-items-center">
                  <div className="flex-shrink-0">
                    <i className="bi bi-people-fill" style={{ fontSize: "32px", color: "#0d6efd" }}></i>
                  </div>
                  <div className="flex-grow-1 ms-3">
                    <h5 className="fw-bold mb-1" style={{ fontSize: "16px" }}>District & Place wise People Details</h5>
                    <p className="text-muted mb-0 small">
                      View district and place wise registration details
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <i className="bi bi-chevron-right text-muted"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Abstract Module */}
          <div className="col-12 col-md-6 col-lg-4">
            <div
              className="card shadow-sm dashboard-module"
              style={{
                cursor: "pointer",
                transition: "all 0.2s",
                borderRadius: "8px",
                border: "2px solid #198754",
                borderLeft: "4px solid #198754"
              }}
              onClick={() => navigate("/statistics/payment-abstract")}
            >
              <div className="card-body p-3">
                <div className="d-flex align-items-center">
                  <div className="flex-shrink-0">
                    <i className="bi bi-cash-stack" style={{ fontSize: "32px", color: "#198754" }}></i>
                  </div>
                  <div className="flex-grow-1 ms-3">
                    <h5 className="fw-bold mb-1" style={{ fontSize: "16px" }}>Payment Abstract</h5>
                    <p className="text-muted mb-0 small">
                      View payment statistics and collection details
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
          <button className="btn btn-outline-secondary btn-sm me-2" onClick={() => {
            const adminToken = localStorage.getItem("adminToken");
            if (adminToken) {
              navigate("/admin-dashboard");
            } else {
              navigate("/registrar-dashboard");
            }
          }}>
            ← Back to Dashboard
          </button>
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
