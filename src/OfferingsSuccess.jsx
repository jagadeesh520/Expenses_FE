import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import logo from "./Assests/logo.PNG";

const OfferingsSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Retrieve data passed from the gift form
  const { region, transactionId, amount, isRegistered, candidateName } =
    location.state || {};

  return (
    <div className="container py-5 text-center">
      <div className="card shadow-lg p-4 mx-auto" style={{ maxWidth: "600px" }}>
        <div className="card-body">
          <img
            src={logo}
            alt="SPICON Logo"
            style={{ width: "100px", marginBottom: "20px" }}
          />

          <h2 className="text-success fw-bold mb-3">
            <i className="bi bi-check-circle-fill me-2"></i>
            Gift Submitted Successfully!
          </h2>

          {isRegistered && candidateName && (
            <p className="lead mb-3">
              Thank you <strong>{candidateName}</strong> for your gift.
            </p>
          )}

          <hr />

          <div className="alert alert-success py-4">
            <div className="d-flex align-items-center justify-content-center mb-3">
              <i
                className="bi bi-check-circle-fill text-success me-2"
                style={{ fontSize: "24px" }}
              ></i>
              <h5 className="mb-0 text-success fw-bold">Gift Received!</h5>
            </div>

            <div className="text-start mt-4">
              <p className="mb-2">
                <strong>Region:</strong> {region || "N/A"}
              </p>
              {transactionId && (
                <p className="mb-2">
                  <strong>Transaction ID:</strong> {transactionId}
                </p>
              )}
              {amount && (
                <p className="mb-2">
                  <strong>Amount:</strong> ₹{parseFloat(amount).toLocaleString()}
                </p>
              )}
              {isRegistered && (
                <p className="mb-0">
                  <strong>Status:</strong>{" "}
                  <span className="badge bg-info">Registered Candidate</span>
                </p>
              )}
            </div>

            <p className="mt-4 mb-0">
              Your gift has been successfully submitted. We appreciate your
              generous contribution.
            </p>
          </div>

          <button
            className="btn btn-primary px-4 mt-3"
            onClick={() => navigate("/")}
          >
            <i className="bi bi-house me-2"></i>Return to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default OfferingsSuccess;

