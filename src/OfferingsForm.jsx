import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { API_ENDPOINTS } from "./constants";
import logo from "./Assests/logo.PNG";
import EastRayaUPI from "./Assests/eastrayalaseemaupi.png";
import WestGooglePayQR from "./Assests/west_googlepay.png";
import WestPhonePayQR from "./Assests/west_phonepay.png";

export default function OfferingsForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const region = location.state?.region || "";
  const isRegistered = location.state?.isRegistered || false;
  const candidateData = location.state?.candidateData || null;
  const spiconId = location.state?.spiconId || "";

  const [formData, setFormData] = useState({
    transactionId: "",
    paidAmount: "",
    paymentDate: "",
    purpose: "",
  });
  const [screenshot, setScreenshot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleFileChange = (e) => {
    setScreenshot(e.target.files[0]);
    setError("");
  };

  const validateForm = () => {
    if (!formData.transactionId.trim()) {
      setError("Transaction ID is required");
      return false;
    }
    if (!formData.paidAmount || parseFloat(formData.paidAmount) <= 0) {
      setError("Please enter a valid paid amount");
      return false;
    }
    if (!formData.paymentDate) {
      setError("Payment date is required");
      return false;
    }
    const paymentDate = new Date(formData.paymentDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (paymentDate > today) {
      setError("Payment date cannot be in the future");
      return false;
    }
    if (!screenshot) {
      setError("Please upload a payment screenshot");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const fd = new FormData();
      
      // Add offering-specific fields
      fd.append("type", "offering");
      fd.append("region", region);
      fd.append("transactionId", formData.transactionId);
      fd.append("amountPaid", formData.paidAmount);
      fd.append("dateOfPayment", formData.paymentDate);
      if (formData.purpose) {
        fd.append("purpose", formData.purpose);
      }

      // If registered user, include candidate details
      if (isRegistered && candidateData) {
        fd.append("spiconId", spiconId);
        fd.append("fullName", candidateData.name || candidateData.fullName || "");
        fd.append("email", candidateData.email || "");
        fd.append("mobile", candidateData.mobile || "");
        fd.append("district", candidateData.district || "");
        fd.append("uniqueId", candidateData.uniqueId || "");
        // Use candidate's groupType if available, otherwise default to "Volunteers"
        fd.append("groupType", candidateData.groupType || "Volunteers");
      } else {
        // For non-registered users, we still need some basic fields
        fd.append("fullName", "Offering - Non-Registered");
        // Backend requires groupType, so use a default value
        fd.append("groupType", "Volunteers");
      }

      // Add payment screenshot
      if (screenshot) {
        fd.append("paymentScreenshot", screenshot);
      }

      const res = await fetch(API_ENDPOINTS.REGISTER_CUSTOMER, {
        method: "POST",
        body: fd,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Submission failed");
      }

      // Navigate to success page
      navigate("/offerings-success", {
        state: {
          region,
          transactionId: formData.transactionId,
          amount: formData.paidAmount,
          isRegistered,
          candidateName: candidateData?.name || candidateData?.fullName || "",
        },
      });
    } catch (err) {
      console.error("Error submitting offering:", err);
      setError(err.message || "Failed to submit offering. Please try again.");
      setLoading(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
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
    <div className="container py-4">
      <button
        className="btn btn-outline-secondary mb-3"
        onClick={() => {
          if (isRegistered) {
            navigate("/offerings-spicon-validation", { state: { region, isRegistered: true } });
          } else {
            navigate("/offerings-registration-check", { state: { region } });
          }
        }}
      >
        &larr; Back
      </button>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="alert alert-danger text-center" role="alert">
          {error}
        </div>
      )}

      {/* HEADER */}
      <div className="text-center mb-4">
        <img
          src={logo}
          alt="SPICON Logo"
          style={{ width: "120px", marginBottom: "15px" }}
        />
        <h2 className="fw-bold mb-2">Offerings Form</h2>
        <p className="text-muted mb-3">
          Region: <strong>{region}</strong>
        </p>
        {isRegistered && candidateData && (
          <div className="alert alert-info d-inline-block">
            <strong>Registered Candidate:</strong> {candidateData.name || candidateData.fullName} 
            {spiconId && <span className="ms-2">({spiconId})</span>}
          </div>
        )}
      </div>

      {/* ACCOUNT DETAILS & QR CODES */}
      <div className="card mb-4">
        <div className="card-header bg-primary text-white">
          <h5 className="mb-0 fw-bold">Account Details ({region})</h5>
        </div>
        <div className="card-body">
          {region === "East Rayalaseema" ? (
            <div className="p-3" style={{ background: "#f8f9fa", borderRadius: "5px" }}>
              <p className="mb-2">
                <strong>Account Holder Name:</strong> Janga Sumalatha
              </p>
              <p className="mb-2">
                <strong>Account No:</strong> 62112258352
              </p>
              <p className="mb-2">
                <strong>IFSC Code:</strong> SBIN0021040
              </p>
              <p className="mb-2">
                <strong>Branch Name:</strong> SBI-NAIDUPET
              </p>
              <p className="mb-2">
                <strong>Phone Pay Number:</strong> 9885108525
              </p>
              <div className="text-center mt-3">
                <img
                  src={EastRayaUPI}
                  alt="UPI Scanner"
                  style={{ width: "200px", borderRadius: "10px" }}
                />
                <p className="mt-2">Scan this UPI QR to make the payment</p>
              </div>
            </div>
          ) : (
            <div className="p-3" style={{ background: "#f8f9fa", borderRadius: "5px" }}>
              <p className="mb-2">
                <strong>Account Holder Name:</strong> Mr. Jagatap Jagan
              </p>
              <p className="mb-2">
                <strong>Account No:</strong> 44676705721
              </p>
              <p className="mb-2">
                <strong>IFSC Code:</strong> SBIN0012674
              </p>
              <p className="mb-2">
                <strong>UPI ID:</strong> 7396541571-3@ybl
              </p>
              <p className="mb-2">
                <strong>PhonePe / Google Pay Number:</strong>
                <br /> 73965 41571
              </p>
              <div className="row justify-content-center align-items-center mt-3 gx-4">
                <div className="col-6 col-sm-4 col-md-3 text-center">
                  <img
                    src={WestGooglePayQR}
                    alt="Google Pay QR"
                    style={{
                      maxWidth: "150px",
                      width: "100%",
                      height: "auto",
                      objectFit: "contain",
                    }}
                  />
                  <p className="text-center mt-2 fw-bold">Google Pay</p>
                </div>
                <div className="col-6 col-sm-4 col-md-3 text-center">
                  <img
                    src={WestPhonePayQR}
                    alt="PhonePe QR"
                    style={{
                      maxWidth: "150px",
                      width: "100%",
                      height: "auto",
                      objectFit: "contain",
                    }}
                  />
                  <p className="text-center mt-2 fw-bold">PhonePe</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FORM */}
      <form onSubmit={handleSubmit}>
        <div className="card">
          <div className="card-header bg-secondary text-white">
            <h5 className="mb-0 fw-bold">Offering Details</h5>
          </div>
          <div className="card-body">
            <div className="row g-3">
              {/* Transaction ID */}
              <div className="col-12 col-md-6">
                <label htmlFor="transactionId" className="form-label">
                  Transaction ID <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="transactionId"
                  name="transactionId"
                  value={formData.transactionId}
                  onChange={handleChange}
                  required
                  placeholder="Enter transaction ID"
                />
              </div>

              {/* Paid Amount */}
              <div className="col-12 col-md-6">
                <label htmlFor="paidAmount" className="form-label">
                  Paid Amount (₹) <span className="text-danger">*</span>
                </label>
                <input
                  type="number"
                  className="form-control"
                  id="paidAmount"
                  name="paidAmount"
                  value={formData.paidAmount}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  required
                  placeholder="0.00"
                />
              </div>

              {/* Payment Date */}
              <div className="col-12 col-md-6">
                <label htmlFor="paymentDate" className="form-label">
                  Payment Date <span className="text-danger">*</span>
                </label>
                <input
                  type="date"
                  className="form-control"
                  id="paymentDate"
                  name="paymentDate"
                  value={formData.paymentDate}
                  onChange={handleChange}
                  max={new Date().toISOString().split("T")[0]}
                  required
                />
              </div>

              {/* Screenshot Upload */}
              <div className="col-12 col-md-6">
                <label htmlFor="screenshot" className="form-label">
                  Upload Payment Image / Screenshot <span className="text-danger">*</span>
                </label>
                <input
                  type="file"
                  className="form-control"
                  id="screenshot"
                  accept="image/*"
                  onChange={handleFileChange}
                  required
                />
                {screenshot && (
                  <small className="text-success mt-1 d-block">
                    <i className="bi bi-check-circle me-1"></i>
                    Selected: {screenshot.name}
                  </small>
                )}
              </div>

              {/* Purpose (Optional) */}
              <div className="col-12">
                <label htmlFor="purpose" className="form-label">
                  If you would like this offering to be used for a specific purpose, please mention it
                  <span className="text-muted"> (Optional)</span>
                </label>
                <textarea
                  className="form-control"
                  id="purpose"
                  name="purpose"
                  rows="3"
                  value={formData.purpose}
                  onChange={handleChange}
                  placeholder="Enter purpose (optional)"
                ></textarea>
              </div>

              {/* Submit Button */}
              <div className="col-12 text-center mt-4">
                <button
                  type="submit"
                  className="btn btn-primary btn-lg px-5"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Submitting...
                    </>
                  ) : (
                    "Submit Offering"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* FULL SCREEN LOADER */}
      {loading && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(255,255,255,0.8)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <div
            className="spinner-border text-primary"
            role="status"
            style={{ width: "4rem", height: "4rem" }}
          ></div>
        </div>
      )}
    </div>
  );
}

