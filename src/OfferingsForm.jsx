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
    // Non-registered user fields
    email: "",
    fullName: "",
    mobile: "",
    district: "",
    iceuEgf: "",
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
    
    // Validate non-registered user fields if not registered
    if (!isRegistered) {
      if (!formData.email.trim()) {
        setError("Email is required");
        return false;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        setError("Please enter a valid email address");
        return false;
      }
      if (!formData.fullName.trim()) {
        setError("Full Name is required");
        return false;
      }
      if (!formData.mobile.trim()) {
        setError("Mobile Number is required");
        return false;
      }
      const mobileRegex = /^[0-9]{10,}$/;
      if (!mobileRegex.test(formData.mobile.trim().replace(/\D/g, ""))) {
        setError("Please enter a valid mobile number (at least 10 digits)");
        return false;
      }
      if (!formData.district) {
        setError("District is required");
        return false;
      }
      if (!formData.iceuEgf) {
        setError("ICEU / EGF is required");
        return false;
      }
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
      
      // Add gift-specific fields
      fd.append("type", "gift");
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
      } else if (!isRegistered) {
        // For non-registered users, include their provided details from form
        fd.append("email", formData.email || "");
        fd.append("fullName", formData.fullName || "");
        fd.append("mobile", formData.mobile || "");
        fd.append("district", formData.district || "");
        fd.append("iceuEgf", formData.iceuEgf || "");
        // Do NOT append spiconId or uniqueId for non-registered users
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
      navigate("/gifts-success", {
        state: {
          region,
          transactionId: formData.transactionId,
          amount: formData.paidAmount,
          isRegistered,
          candidateName: isRegistered 
            ? (candidateData?.name || candidateData?.fullName || "")
            : (formData.fullName || ""),
        },
      });
    } catch (err) {
      console.error("Error submitting gift:", err);
      setError(err.message || "Failed to submit gift. Please try again.");
      setLoading(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (!region) {
    return (
      <div className="container min-vh-100 d-flex align-items-center justify-content-center">
        <div className="card p-5 shadow-lg text-center" style={{ maxWidth: "500px" }}>
          <p className="text-danger mb-3">Region not selected. Please go back and select a region.</p>
          <button className="btn btn-outline-secondary" onClick={() => navigate("/gifts-region")}>
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
            navigate("/gifts-spicon-validation", { state: { region, isRegistered: true } });
          } else {
            navigate("/gifts-registration-check", { state: { region } });
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
        <h2 className="fw-bold mb-2">Gifts Form</h2>
        <p className="text-muted mb-3">
          Region: <strong>{region}</strong>
        </p>
        {isRegistered && candidateData && (
          <div className="alert alert-info d-inline-block">
            <strong>Registered Candidate:</strong> {candidateData.name || candidateData.fullName} 
            {spiconId && <span className="ms-2">({spiconId})</span>}
          </div>
        )}
        {!isRegistered && (
          <div className="alert alert-warning d-inline-block">
            <strong>Non-Registered User:</strong> Please fill in your details below along with payment information.
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
            <h5 className="mb-0 fw-bold">Gift Details</h5>
          </div>
          <div className="card-body">
            <div className="row g-3">
              {/* Non-Registered User Fields - Show when not registered */}
              {!isRegistered && (
                <>
                  <div className="col-12">
                    <h6 className="fw-bold mb-3 text-primary">
                      <i className="bi bi-person-fill me-2"></i>Your Details
                    </h6>
                  </div>
                  
                  {/* Email */}
                  <div className="col-12 col-md-6">
                    <label htmlFor="email" className="form-label">
                      Email <span className="text-danger">*</span>
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="Enter your email"
                    />
                  </div>

                  {/* Full Name */}
                  <div className="col-12 col-md-6">
                    <label htmlFor="fullName" className="form-label">
                      Enter Full Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      required
                      placeholder="Enter your full name"
                    />
                  </div>

                  {/* Mobile Number */}
                  <div className="col-12 col-md-6">
                    <label htmlFor="mobile" className="form-label">
                      Mobile Number <span className="text-danger">*</span>
                    </label>
                    <input
                      type="tel"
                      className="form-control"
                      id="mobile"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleChange}
                      required
                      placeholder="e.g. 98XXXXXXXX"
                    />
                  </div>

                  {/* District */}
                  <div className="col-12 col-md-6">
                    <label htmlFor="district" className="form-label">
                      District <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select"
                      id="district"
                      name="district"
                      value={formData.district}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select</option>
                      {region === "East Rayalaseema" ? (
                        <>
                          <option value="Annamayya">Annamayya</option>
                          <option value="Chittoor">Chittoor</option>
                          <option value="Tirupati">Tirupati</option>
                          <option value="Other">Other</option>
                        </>
                      ) : region === "West Rayalaseema" ? (
                        <>
                          <option value="Anantapur">Anantapur</option>
                          <option value="Sri Sathya Sai">Sri Sathya Sai</option>
                          <option value="YSR Kadapa">YSR Kadapa</option>
                          <option value="Other">Other</option>
                        </>
                      ) : null}
                    </select>
                  </div>

                  {/* ICEU/EGF */}
                  <div className="col-12 col-md-6">
                    <label htmlFor="iceuEgf" className="form-label">
                      Which ICEU / EGF do you belong to? <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select"
                      id="iceuEgf"
                      name="iceuEgf"
                      value={formData.iceuEgf}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Choose</option>
                      {region === "East Rayalaseema" ? (
                        <>
                          <option value="Koduru">Koduru</option>
                          <option value="Rajampeta">Rajampeta</option>
                          <option value="Madanapalle">Madanapalle</option>
                          <option value="Rayachoti">Rayachoti</option>
                          <option value="Kalikiri">Kalikiri</option>
                          <option value="Pileru">Pileru</option>
                          <option value="Chittoor">Chittoor</option>
                          <option value="Punganoor">Punganoor</option>
                          <option value="Palamaneru">Palamaneru</option>
                          <option value="Kuppam">Kuppam</option>
                          <option value="V.Kota">V.Kota</option>
                          <option value="Tirupati">Tirupati</option>
                          <option value="Renigunta">Renigunta</option>
                          <option value="Sattivedu">Sattivedu</option>
                          <option value="Srikalahasthi">Srikalahasthi</option>
                          <option value="Naidupeta">Naidupeta</option>
                          <option value="Sullurpeta">Sullurpeta</option>
                          <option value="Gudur">Gudur</option>
                          <option value="Venkatagiri">Venkatagiri</option>
                          <option value="Pakala">Pakala</option>
                          <option value="Puttoor">Puttoor</option>
                          <option value="IIT-Tirupati">IIT-Tirupati</option>
                          <option value="Other">Other</option>
                        </>
                      ) : region === "West Rayalaseema" ? (
                        <>
                          <option value="Anantapur East Zone">Anantapur East Zone</option>
                          <option value="Anantapur West Zone">Anantapur West Zone</option>
                          <option value="Anantapur JNTU Zone">Anantapur JNTU Zone</option>
                          <option value="Atp West Zone">Atp West Zone</option>
                          <option value="Badvel">Badvel</option>
                          <option value="Bukkarayasamudram">Bukkarayasamudram</option>
                          <option value="Dharmavaram">Dharmavaram</option>
                          <option value="Gooty">Gooty</option>
                          <option value="Guntakal">Guntakal</option>
                          <option value="Hindupur">Hindupur</option>
                          <option value="IIIT Idupulapaya">IIIT Idupulapaya</option>
                          <option value="Jammalamadugu">Jammalamadugu</option>
                          <option value="Kadapa">Kadapa</option>
                          <option value="Kadiri">Kadiri</option>
                          <option value="Kalyandurg">Kalyandurg</option>
                          <option value="Kamalapuram">Kamalapuram</option>
                          <option value="Lepakshi">Lepakshi</option>
                          <option value="Madakasira">Madakasira</option>
                          <option value="Mydukur">Mydukur</option>
                          <option value="Pamidi">Pamidi</option>
                          <option value="Penukonda">Penukonda</option>
                          <option value="Proddatur">Proddatur</option>
                          <option value="Pulivendula">Pulivendula</option>
                          <option value="Puttaparthi">Puttaparthi</option>
                          <option value="Rayadurg">Rayadurg</option>
                          <option value="Rolla">Rolla</option>
                          <option value="Tadpatri">Tadpatri</option>
                          <option value="Uravakonda">Uravakonda</option>
                          <option value="Vempalli">Vempalli</option>
                          <option value="Yerraguntla">Yerraguntla</option>
                          <option value="Yogi Vemana University Campus">Yogi Vemana University Campus</option>
                          <option value="Sri Krishnadevaraya University (SKU)">Sri Krishnadevaraya University (SKU)</option>
                          <option value="Central University (CU)">Central University (CU)</option>
                          <option value="Other">Other</option>
                        </>
                      ) : null}
                    </select>
                  </div>

                  <div className="col-12">
                    <hr className="my-3" />
                    <h6 className="fw-bold mb-3 text-primary">
                      <i className="bi bi-credit-card-fill me-2"></i>Payment Details
                    </h6>
                  </div>
                </>
              )}

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
                  If you would like this gift to be used for a specific purpose, please mention it
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
                    "Submit Gift"
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

