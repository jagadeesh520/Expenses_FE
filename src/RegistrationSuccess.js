import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import logo from "./Assets/logo.PNG"; // Make sure path is correct

const RegistrationSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Retrieve data passed from the registration form
  const { fullName, region, email, message } = location.state || {};

  return (
    <div className="container py-5 text-center">
      <div className="card shadow-lg p-4 mx-auto" style={{ maxWidth: "600px" }}>
        <div className="card-body">
          <img
            src={logo}
            alt="SPICON Logo"
            style={{ width: "100px", marginBottom: "20px" }}
          />
          
          <h2 className="text-success fw-bold mb-3">Registration Successful!</h2>
          <p className="lead">
            Thank you <strong>{fullName}</strong> for registering for SPICON-2026 ({region}).
          </p>
          
          <hr />

          <div className="alert alert-success py-4">
            <div className="d-flex align-items-center justify-content-center mb-3">
              <i className="bi bi-check-circle-fill text-success me-2" style={{ fontSize: "24px" }}></i>
              <h5 className="mb-0 text-success fw-bold">Email Sent Successfully!</h5>
            </div>
            {message && (
              <p className="mb-2 fw-bold text-success">
                {message}
              </p>
            )}
            <p className="mb-2">
              A confirmation email has been sent to:
            </p>
            <p className="fw-bold text-primary">{email}</p>
            <p className="mt-3 mb-0">
              Please check your email inbox (and spam folder) for confirmation details.
            </p>
            <p className="mt-2 mb-0 small text-muted">
              Further communication will be done through this email address.
            </p>
          </div>

          

          <button 
            className="btn btn-primary px-4 mt-3" 
            onClick={() => navigate("/")}
          >
            Return to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegistrationSuccess;