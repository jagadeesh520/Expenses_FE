import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "./Assests/logo.PNG";

export default function Home() {
  const [region, setRegion] = useState("");
  const navigate = useNavigate();

  const handleContinue = () => {
    if (!region) return alert("Please select a region");
    navigate(
      region === "West Rayalaseema"
        ? "/west-registration"
        : "/east-registration"
    );
  };

  return (
    <div
      className="container min-vh-100 d-flex align-items-center justify-content-center"
      style={{ paddingTop: "30px", paddingBottom: "30px" }}
    >
      <div className="row w-100" style={{ maxWidth: "1200px" }}>
        {/* REGISTRATION SECTION - First on mobile, right on desktop */}
        <div className="col-md-6 mb-4 order-1 order-md-2">
          <div className="card p-5 shadow-lg text-center">
            <img
              src={logo}
              alt="logo"
              className="mb-4 mx-auto"
              style={{ width: "150px" }}
            />

            <h2 className="fw-bold mb-3">REGISTRATION FOR SPICON 2026</h2>

            <label className="fw-bold text-start w-100">
              Select Your Region
            </label>
            <select
              className="form-select form-select-lg mt-2"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
            >
              <option value="">-- Choose Region --</option>
              <option value="West Rayalaseema">West Rayalaseema</option>
              <option value="East Rayalaseema">East Rayalaseema</option>
            </select>

            <button
              className="btn btn-primary btn-lg w-100 mt-4"
              disabled={!region}
              onClick={handleContinue}
            >
              Continue
            </button>
          </div>
        </div>

        {/* LOGIN PORTAL SECTION - Second on mobile, left on desktop */}
        <div className="col-md-6 mb-4 order-2 order-md-1">
          <div
            className="card p-5 shadow-lg text-center"
            style={{ height: "100%" }}
          >
            <h2 className="fw-bold mb-2" style={{ letterSpacing: "1px" }}>
              LOGIN PORTAL
            </h2>
            <p className="text-secondary mb-4">Select login type</p>

            <div className="row g-3">
              {/* Gifts - First Row */}
              <div className="col-6">
                <div
                  className="login-box"
                  style={{ background: "#f3e8ff", borderColor: "#9333ea" }}
                  onClick={() => navigate("/gifts-region")}
                >
                  <i className="bi bi-gift-fill icon" style={{ color: "#9333ea" }}></i>
                  <h5 className="fw-bold mt-2">Gifts</h5>
                  <span>Submit Your Gifts</span>
                </div>
              </div>

              {/* Pay Pending Amount - First Row */}
              <div className="col-6">
                <div
                  className="login-box"
                  style={{ background: "#e8f5e9", borderColor: "#4caf50" }}
                  onClick={() => navigate("/pending-payment")}
                >
                  <i className="bi bi-credit-card icon" style={{ color: "#4caf50" }}></i>
                  <h5 className="fw-bold mt-2">Pay Pending Amount</h5>
                  <span>Clear Your Dues</span>
                </div>
              </div>

              {/* Admin Login Tile */}
              <div className="col-6">
                <div
                  className="login-box"
                  onClick={() => navigate("/admin-login")}
                >
                  <i className="bi bi-shield-lock-fill icon"></i>
                  <h5 className="fw-bold mt-2">Admin Login</h5>
                  <span>Manage Payments</span>
                </div>
              </div>

              {/* Registrar Login Tile */}
              <div className="col-6">
                <div
                  className="login-box registrar"
                  onClick={() => navigate("/registrar-login")}
                >
                  <i className="bi bi-people-fill icon"></i>
                  <h5 className="fw-bold mt-2">Registrar Login</h5>
                  <span>Approve Registrations</span>
                </div>
              </div>

              {/* Coordinator/LAC Convener - Create Payment Request */}
              <div className="col-6">
                <div
                  className="login-box"
                  style={{ background: "#fff3cd", borderColor: "#ffc107" }}
                  onClick={() => navigate("/create-payment-request")}
                >
                  <i className="bi bi-cash-coin icon" style={{ color: "#ffc107" }}></i>
                  <h5 className="fw-bold mt-2">Create Payment Request</h5>
                  <span>Coordinator / LAC Convener</span>
                </div>
              </div>

              {/* Treasurer */}
              <div className="col-6">
                <div
                  className="login-box"
                  style={{ background: "#fff3e0", borderColor: "#FF3B30" }}
                  onClick={() => navigate("/treasurer/region-selection")}
                >
                  <i className="bi bi-cash-coin icon" style={{ color: "#FF3B30" }}></i>
                  <h5 className="fw-bold mt-2">Treasurer</h5>
                  <span>Manage Payments & Disbursements</span>
                </div>
              </div>

              {/* Payment Validation */}
              <div className="col-6">
                <div
                  className="login-box"
                  style={{ background: "#fff5f5", borderColor: "#dc3545" }}
                  onClick={() => navigate("/payment-validation-region")}
                >
                  <i className="bi bi-shield-check icon" style={{ color: "#dc3545" }}></i>
                  <h5 className="fw-bold mt-2">Payment Validation</h5>
                  <span>Validate PhonePe Transactions</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BEAUTIFUL STYLING */}
      <style>{`
  .login-box {
    background: #f8faff;
    border-radius: 15px;
    padding: 30px;
    border: 2px solid transparent;
    cursor: pointer;
    transition: 0.3s;
    box-shadow: 0 3px 10px rgba(0,0,0,0.07);
    display:flex;
    flex-direction:column;
    justify-content:center;
    align-items:center;
  }
  .login-box:hover {
    transform: scale(1.05);
    border-color: #0d6efd;
    background: #eef6ff;
    box-shadow: 0 8px 22px rgba(0,0,0,0.15);
  }
  .icon {
    font-size: 48px;
    color: #0d6efd;
  }
  .registrar .icon {
    color: #198754;
  }
  .registrar:hover {
    border-color: #198754;
    background: #e8fff3;
  }

  /* 📱 Mobile Friendly */
  @media(max-width: 768px){
    .login-box{
      margin-bottom:10px;
      padding:20px;
    }
    .icon{
      font-size:36px;
    }
    .card{
      padding:20px !important;
    }
    .login-box h5{
      font-size:15px;
      margin-top:10px !important;
    }
    .login-box span{
      font-size:12px;
    }
  }

  @media(max-width: 450px){
    h2 { font-size:22px; }
    .login-box{
      padding:15px;
    }
    .login-box span { 
      font-size:11px; 
    }
    .login-box h5 { 
      font-size:14px; 
    }
    .icon{
      font-size:30px;
    }
    .card{
      padding:15px !important;
    }
  }
  
  /* Mobile layout fix */
  @media(max-width:768px){
    .container{
      padding-top:50px !important;
      padding-bottom:40px !important;
    }
    .col-md-6{
      width:100%;
    }
  }
`}</style>
    </div>
  );
}
