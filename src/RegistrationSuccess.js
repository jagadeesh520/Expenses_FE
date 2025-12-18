import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import logo from "./Assests/logo.PNG"; // Make sure path is correct

const RegistrationSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Retrieve data passed from the registration form
  const { fullName, region, email } = location.state || {};

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
           
            <p className="mb-2">
              Further communication will be done through the email address you provided:
            </p>
            <p className="fw-bold text-primary">{email}</p>
            <p className="mt-3 mb-0">
              Please check your email inbox for confirmation details.
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